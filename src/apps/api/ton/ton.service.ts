import {Injectable, NotFoundException} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {DealRepository} from '../../../db/repositories/deal.repository.js'
import {TonApiService} from '../../../modules/blockchain/ton-api.service.js'
import {TonClientService} from '../../../modules/blockchain/ton-client.service.js'
import {TonPaymentProcessorService} from '../../../modules/blockchain/ton-payment-processor.service.js'
import {TonWalletService} from '../../../modules/blockchain/ton-wallet.service.js'

@Injectable()
export class TonService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly tonClientService: TonClientService,
    private readonly tonWalletService: TonWalletService,
    readonly _tonApiService: TonApiService,
    readonly _tonPaymentProcessor: TonPaymentProcessorService,
    private readonly dealRepository: DealRepository,
  ) {
    this.logger.setContext(TonService.name)
  }

  async getTopupTransaction(dealId: bigint, userWalletAddress: string) {
    const deal = await this.dealRepository.findById(dealId)
    if (!deal || !deal.campaignId || !deal.adPriceUSD) {
      throw new NotFoundException('Deal not found or missing required data')
    }

    // Create wallet if not exists
    if (!deal.dealWallet) {
      const walletAddress = await this.tonWalletService.createDealWallet(
        dealId,
        deal.campaignId,
      )
      // Subscribe wallet to TonAPI webhook
      // const {error} = await tryCatch(
      //   this.tonApiService.subscribeToWallet(walletAddress),
      // )
      // if (error) {
      //   this.logger.warn(
      //     {err: error, walletAddress},
      //     'Failed to subscribe wallet to webhook',
      //   )
      //   throw new InternalServerErrorException(
      //     'Failed to subscribe wallet to webhook',
      //   )
      // }
      await this.dealRepository.update(dealId, {dealWallet: walletAddress})
    }

    return this.tonClientService.generateTopupTransaction(
      dealId,
      deal.campaignId,
      userWalletAddress,
      deal.adPriceUSD,
    )
  }

  // async handleWebhook(payload: TonApiWebhookBody): Promise<void> {
  //   const rawAddress = payload.account_id

  //   // Normalize address for DB lookup
  //   let walletAddress: string
  //   try {
  //     const parsed = Address.parseRaw(rawAddress)
  //     walletAddress = parsed.toString({
  //       bounceable: false,
  //       urlSafe: true,
  //     })
  //   } catch {
  //     this.logger.error({rawAddress}, 'Failed to parse address')
  //     walletAddress = rawAddress
  //   }

  //   const deal = await this.dealRepository.findByWalletAddress(walletAddress)
  //   if (!deal) {
  //     this.logger.debug({walletAddress}, 'Webhook received for unknown wallet')
  //     return
  //   }

  //   if (!deal.dealWallet || !deal.adPriceUSD) return

  //   const {error} = await tryCatch(
  //     this.tonPaymentProcessor.processWebhookTransaction(
  //       {
  //         id: deal.id,
  //         dealWallet: deal.dealWallet,
  //         adPriceUSD: deal.adPriceUSD,
  //       },
  //       payload.tx_hash,
  //       payload.lt,
  //     ),
  //   )
  //   if (error) {
  //     this.logger.error(
  //       {err: error, dealId: String(deal.id), txHash: payload.tx_hash},
  //       'Failed to process webhook transaction',
  //     )
  //   }
  // }
}
