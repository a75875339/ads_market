// Jetton transfer opcode (0xf8a7ea5)
export const JETTON_TRANSFER_OP = 0xf8a7ea5

// USDT has 6 decimal places on TON
export const USDT_DECIMALS = 6
export const USDT_NANO_MULTIPLIER = 10 ** USDT_DECIMALS

// Max 31-bit unsigned integer for HD path derivation splitting
export const MAX_UINT31 = 2147483647

// Gas amounts in nanotons
export const JETTON_TRANSFER_GAS_NANOTON = 50_000_000n // 0.05 TON

// TonConnect transaction validity period (seconds)
export const TONCONNECT_TX_VALIDITY_SEC = 600
