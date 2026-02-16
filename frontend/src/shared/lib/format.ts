import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { AdFormatType, DealStatus, ChannelStatus, ManagerPermission } from '../types';

dayjs.extend(relativeTime);

export function formatUSD(amount: string | number | null | undefined): string {
  if (amount == null) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '—';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatPercent(value: string | number | null | undefined): string {
  if (value == null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return `${num.toFixed(2)}%`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('MMM D, YYYY');
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('MMM D, YYYY HH:mm');
}

export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).fromNow();
}

export function formatAdType(type: AdFormatType): string {
  const labels: Record<AdFormatType, string> = {
    '1/1': 'Test 1/1h',
    '1/24': '1/24h',
    '2/48': '2/48h',
    '3/72': '3/72h',
    repost: 'Repost',
    no_removal: 'No Removal',
  };
  return labels[type] || type;
}

export function formatDealStatus(status: DealStatus): string {
  const labels: Record<DealStatus, string> = {
    draft: 'Draft',
    draft_application: 'Application',
    negotiation: 'Negotiation',
    scheduled: 'Scheduled',
    posted: 'Posted',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

export function getDealStatusColor(status: DealStatus): string {
  const colors: Record<DealStatus, string> = {
    draft: '#94a3b8',
    draft_application: '#f59e0b',
    negotiation: '#3b82f6',
    scheduled: '#8b5cf6',
    posted: '#22c55e',
    completed: '#16a34a',
    cancelled: '#ef4444',
  };
  return colors[status] || '#94a3b8';
}

export function formatChannelStatus(status: ChannelStatus): string {
  const labels: Record<ChannelStatus, string> = {
    pending: 'Pending',
    active: 'Active',
    suspended: 'Suspended',
    too_small: 'Too Small',
    error: 'Error',
  };
  return labels[status] || status;
}

export function formatPermission(permission: ManagerPermission): string {
  const labels: Record<ManagerPermission, string> = {
    none: 'No Access',
    view: 'View Only',
    manage_deals: 'Manage Deals',
    manage_formats: 'Manage Formats',
    full: 'Full Access',
  };
  return labels[permission] || permission;
}
