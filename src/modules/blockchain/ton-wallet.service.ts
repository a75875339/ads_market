import {Injectable} from '@nestjs/common'
import {
  deriveSymmetricPath,
  keyPairFromSeed,
  mnemonicToHDSeed,
} from '@ton/crypto'
import {WalletContractV4} from '@ton/ton'
import {PinoLogger} from 'nestjs-pino'
import type {WalletAddress} from '../../libs/common/types/domain.types.js'
import {config} from '../../config/config.js'
import {MAX_UINT31} from './ton.constants.js'

type KeyPair = {
  publicKey: Buffer
  secretKey: Buffer
}

@Injectable()
export class TonWalletService {
  private HDseed: Buffer | null = null

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(TonWalletService.name)
  }

  private async getSeed(): Promise<Buffer> {
    if (!this.HDseed) {
      this.HDseed = await mnemonicToHDSeed(config.ton.mnemonic.split(' '))
    }
    return this.HDseed
  }

  async deriveDealKeyPair(
    campaignId: bigint,
    dealId: bigint,
  ): Promise<KeyPair> {
    const seed = await this.getSeed()

    const campaignIdNum = Number(campaignId)
    const dealIdNum = Number(dealId)
    const dealIdPart1 = dealIdNum % MAX_UINT31
    const dealIdPart2 = Math.floor(dealIdNum / MAX_UINT31)

    if (campaignIdNum > MAX_UINT31 || dealIdPart1 > MAX_UINT31) {
      throw new Error('Campaign ID or deal ID is too large')
    }

    const derivedKey = await deriveSymmetricPath(seed, [
      String(campaignIdNum),
      String(dealIdPart1),
      String(dealIdPart2),
    ])
    return keyPairFromSeed(derivedKey)
  }

  createWalletContract(publicKey: Buffer): WalletContractV4 {
    return WalletContractV4.create({
      publicKey,
      workchain: 0,
    })
  }

  async createDealWallet(
    dealId: bigint,
    campaignId: bigint,
  ): Promise<WalletAddress> {
    const keyPair = await this.deriveDealKeyPair(campaignId, dealId)
    const wallet = this.createWalletContract(keyPair.publicKey)
    const address = wallet.address.toString({
      bounceable: false,
      urlSafe: true,
    }) as WalletAddress

    this.logger.info(
      {dealId: dealId.toString(), address},
      'Created deal wallet',
    )

    return address
  }

  async getDealWalletAddress(
    campaignId: bigint,
    dealId: bigint,
  ): Promise<string> {
    const keyPair = await this.deriveDealKeyPair(campaignId, dealId)
    const wallet = this.createWalletContract(keyPair.publicKey)
    return wallet.address.toString({
      bounceable: false,
      urlSafe: true,
    })
  }
}
