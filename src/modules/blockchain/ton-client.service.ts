import {Injectable} from '@nestjs/common'
import {Address, beginCell, Cell, internal, toNano} from '@ton/core'
import {JettonMaster, TonClient} from '@ton/ton'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../config/config.js'
import {
  JETTON_TRANSFER_GAS_NANOTON,
  JETTON_TRANSFER_OP,
  TONCONNECT_TX_VALIDITY_SEC,
  USDT_NANO_MULTIPLIER,
} from './ton.constants.js'
import {TonWalletService} from './ton-wallet.service.js'

type TonConnectMessage = {
  address: string
  amount: string
  payload?: string
}

export type TonConnectTransaction = {
  validUntil: number
  messages: TonConnectMessage[]
}

function buildJettonTransferBody(
  jettonAmount: bigint,
  destination: Address,
  responseDestination: Address,
  forwardTonAmount = 100000n,
  queryId = 0n,
): Cell {
  return beginCell()
    .storeUint(JETTON_TRANSFER_OP, 32)
    .storeUint(queryId, 64)
    .storeCoins(jettonAmount)
    .storeAddress(destination)
    .storeAddress(responseDestination)
    .storeBit(false)
    .storeCoins(forwardTonAmount)
    .storeBit(false)
    .endCell()
}

@Injectable()
export class TonClientService {
  private readonly client: TonClient
  private readonly masterContract = JettonMaster.create(
    Address.parse(config.ton.usdt_master_address),
  )

  constructor(
    private readonly logger: PinoLogger,
    private readonly tonWalletService: TonWalletService,
  ) {
    this.logger.setContext(TonClientService.name)
    this.client = new TonClient({
      endpoint: config.ton.endpoint,
      apiKey: config.ton.api_key || undefined,
    })
  }

  async getJettonWalletAddress(ownerAddress: Address): Promise<Address> {
    const master = this.client.open(this.masterContract)
    return master.getWalletAddress(ownerAddress)
  }

  async generateTopupTransaction(
    dealId: bigint,
    campaignId: bigint,
    userWalletAddress: string,
    usdtAmount: string,
  ): Promise<TonConnectTransaction> {
    // fixme: creating from wallet address
    const keyPair = await this.tonWalletService.deriveDealKeyPair(
      campaignId,
      dealId,
    )
    const wallet = this.tonWalletService.createWalletContract(keyPair.publicKey)
    const dealWalletAddress = wallet.address

    const usdtAmountNano = BigInt(
      Math.round(Number.parseFloat(usdtAmount) * USDT_NANO_MULTIPLIER),
    )

    const userAddress = Address.parse(userWalletAddress)
    const userJettonWallet = await this.getJettonWalletAddress(userAddress)

    const transferBody = buildJettonTransferBody(
      usdtAmountNano,
      dealWalletAddress,
      userAddress,
      // toNano(config.ton.min_ton_amount)
    )

    const payload = transferBody.toBoc().toString('base64')

    const validUntil =
      Math.floor(Date.now() / 1000) + TONCONNECT_TX_VALIDITY_SEC

    return {
      validUntil,
      messages: [
        {
          address: dealWalletAddress.toString({
            bounceable: false,
            urlSafe: true,
          }),
          amount: toNano(config.ton.min_ton_amount).toString(),
        },
        {
          address: userJettonWallet.toString({
            bounceable: true,
            urlSafe: true,
          }),
          amount: JETTON_TRANSFER_GAS_NANOTON.toString(),
          payload,
        },
      ],
    }
  }

  async sendUsdt(
    campaignId: bigint,
    dealId: bigint,
    destinationAddress: Address,
    usdtAmountNano: bigint,
    queryId?: bigint,
  ): Promise<void> {
    const keyPair = await this.tonWalletService.deriveDealKeyPair(
      campaignId,
      dealId,
    )
    const wallet = this.tonWalletService.createWalletContract(keyPair.publicKey)
    const walletContract = this.client.open(wallet)

    // Wallet is deployed automatically on first sendTransfer (stateInit included by provider)
    const isDeployed = await this.client.isContractDeployed(wallet.address)
    let seqno = 0
    if (isDeployed) {
      seqno = await walletContract.getSeqno()
    } else {
      this.logger.info(
        {address: wallet.address.toString()},
        'Wallet will be deployed with first transfer',
      )
    }

    const dealJettonWallet = await this.getJettonWalletAddress(wallet.address)

    const transferBody = buildJettonTransferBody(
      usdtAmountNano,
      destinationAddress,
      wallet.address,
      100000n,
      queryId ?? 0n,
    )

    await walletContract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: dealJettonWallet,
          value: JETTON_TRANSFER_GAS_NANOTON,
          body: transferBody,
        }),
      ],
    })

    this.logger.info(
      {
        dealId: dealId.toString(),
        destination: destinationAddress.toString(),
        usdtAmount: usdtAmountNano.toString(),
      },
      'USDT transfer sent',
    )
  }

  async isWalletDeployed(address: Address): Promise<boolean> {
    return this.client.isContractDeployed(address)
  }

  async getBalance(address: Address): Promise<bigint> {
    return this.client.getBalance(address)
  }
}
