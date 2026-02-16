export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  } catch {
    return ''
  }
}

export function formatCents(price: number): string {
  return `${(price * 100).toFixed(2)}¢`
}

export function formatVolumeLiquidity(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) {
    return '$0'
  }

  if (num >= 1_000_000_000) {
    const billions = num / 1_000_000_000
    return billions % 1 === 0 ? `$${billions}B` : `$${billions.toFixed(2)}B`
  }
  if (num >= 1_000_000) {
    const millions = num / 1_000_000
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(2)}M`
  }
  if (num >= 1_000) {
    const thousands = num / 1_000
    return thousands % 1 === 0 ? `$${thousands}K` : `$${thousands.toFixed(2)}K`
  }
  return `$${num.toFixed(0)}`
}

export function formatUsd(value: number, includeDollarSign = true): string {
  return `${includeDollarSign ? '$' : ''}${value.toFixed(2)}`
}

export function formatPercent(value: number): string {
  return `${value}%`
}

export function formatTimeRemaining(endDate: string): string | null {
  try {
    const now = new Date()
    const end = new Date(endDate)
    const msRemaining = end.getTime() - now.getTime()

    if (msRemaining <= 0) {
      return null
    }

    const hoursRemaining = msRemaining / (1000 * 60 * 60)

    if (hoursRemaining >= 24) {
      return null
    }

    if (hoursRemaining >= 1) {
      const hours = Math.floor(hoursRemaining)
      return `<b>${hours}h</b> left`
    }

    const minutesRemaining = Math.floor(msRemaining / (1000 * 60))
    return `<b>${minutesRemaining}m</b> left`
  } catch {
    return null
  }
}
