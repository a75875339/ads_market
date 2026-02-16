import {Injectable} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../config/config.js'

// --- Account types ---

export type TonApiAccountInfo = {
  address: string
  balance: string
  status: string
  is_scam: boolean
  is_wallet: boolean
}

// --- Event types (parsed actions) ---

export type TonApiJettonInfo = {
  address: string
  name: string
  symbol: string
  decimals: number
}

export type TonApiAddressInfo = {
  address: string
  is_scam: boolean
  is_wallet: boolean
}

export type TonApiJettonTransfer = {
  sender?: TonApiAddressInfo
  recipient?: TonApiAddressInfo
  senders_wallet?: string
  recipients_wallet?: string
  amount: string
  jetton?: TonApiJettonInfo
  comment?: string
}

export type TonApiAction = {
  type: string
  status: string
  JettonTransfer?: TonApiJettonTransfer
}

export type TonApiEvent = {
  event_id: string
  timestamp: number
  actions: TonApiAction[]
  lt: number
  in_progress: boolean
}

// --- Blockchain transaction types (raw with decoded bodies) ---

export type TonApiBlockchainMessage = {
  msg_type: string
  created_lt: number
  ihr_disabled: boolean
  bounce: boolean
  bounced: boolean
  value: number
  fwd_fee: number
  ihr_fee: number
  source?: TonApiAddressInfo
  destination?: TonApiAddressInfo
  import_fee: number
  created_at: number
  op_code?: string
  hash: string
  raw_body?: string
  decoded_op_name?: string
  decoded_body?: Record<string, unknown>
}

export type TonApiComputePhase = {
  skipped: boolean
  success: boolean
  gas_fees: number
  gas_used: number
  vm_steps: number
  exit_code: number
  exit_code_description?: string
}

export type TonApiActionPhase = {
  success: boolean
  result_code: number
  total_actions: number
  skipped_actions: number
  fwd_fees: number
  total_fees: number
}

export type TonApiBlockchainTransaction = {
  hash: string
  lt: number
  account: TonApiAddressInfo
  success: boolean
  utime: number
  orig_status: string
  end_status: string
  total_fees: number
  end_balance: number
  transaction_type: string
  in_msg?: TonApiBlockchainMessage
  out_msgs: TonApiBlockchainMessage[]
  block: string
  prev_trans_hash: string
  prev_trans_lt: number
  compute_phase?: TonApiComputePhase
  action_phase?: TonApiActionPhase
  aborted: boolean
  destroyed: boolean
}

// --- Webhook types ---

export type TonApiWebhookPayload = {
  account_id: string
  lt: number
  tx_hash: string
}

@Injectable()
export class TonApiService {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(TonApiService.name)
    this.baseUrl = config.ton.tonapi_endpoint
    this.apiKey = config.ton.tonapi_key
  }

  private async request<T>(
    path: string,
    options: {method?: string; body?: unknown} = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      ...(options.body ? {body: JSON.stringify(options.body)} : {}),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(
        `TonAPI ${options.method ?? 'GET'} ${path} failed: ${response.status} ${text}`,
      )
    }

    return response.json() as Promise<T>
  }

  async getAccountInfo(address: string): Promise<TonApiAccountInfo> {
    return this.request<TonApiAccountInfo>(
      `/v2/accounts/${encodeURIComponent(address)}`,
    )
  }

  async getAccountEvents(address: string, limit = 20): Promise<TonApiEvent[]> {
    const data = await this.request<{events: TonApiEvent[]}>(
      `/v2/accounts/${encodeURIComponent(address)}/events?limit=${limit}`,
    )
    return data.events
  }

  async getBlockchainTransaction(
    txHash: string,
  ): Promise<TonApiBlockchainTransaction> {
    return this.request<TonApiBlockchainTransaction>(
      `/v2/blockchain/transactions/${encodeURIComponent(txHash)}`,
    )
  }

  async getAccountJettonBalance(
    address: string,
    jettonAddress: string,
  ): Promise<string> {
    const data = await this.request<{balance: string}>(
      `/v2/accounts/${encodeURIComponent(address)}/jettons/${encodeURIComponent(jettonAddress)}`,
    )
    return data.balance
  }

  // Webhook management (TonConsole API)
  // async createWebhook(endpointUrl: string): Promise<{webhook_id: number}> {
  //   const result = await this.request<{webhook_id: number}>('/v2/webhooks', {
  //     method: 'POST',
  //     body: {url: endpointUrl},
  //   })
  //   this.logger.info(
  //     {webhookId: result.webhook_id, endpoint: endpointUrl},
  //     'TonAPI webhook created',
  //   )
  //   return result
  // }

  // async subscribeToWallet(walletAddress: string): Promise<void> {
  //   if (!this.webhookId) {
  //     this.logger.warn('No webhook ID configured, skipping wallet subscription')
  //     return
  //   }
  //   await this.request(`/v2/webhooks/${this.webhookId}/account-tx/subscribe`, {
  //     method: 'POST',
  //     body: {accounts: [{account_id: walletAddress}]},
  //   })
  //   this.logger.info(
  //     {walletAddress, webhookId: this.webhookId},
  //     'Subscribed wallet to TonAPI webhook',
  //   )
  // }

  // async unsubscribeFromWallet(walletAddress: string): Promise<void> {
  //   if (!this.webhookId) return
  //   await this.request(
  //     `/v2/webhooks/${this.webhookId}/account-tx/unsubscribe`,
  //     {
  //       method: 'POST',
  //       body: {accounts: [{account_id: walletAddress}]},
  //     },
  //   )
  // }

  // verifyWebhookToken(token: string | undefined): boolean {
  //   return token === config.ton.tonapi_webhook_token
  // }
}
