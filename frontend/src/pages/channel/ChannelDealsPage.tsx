import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getChannelDeals } from '../../shared/api';
import {
  PageHeader,
  Card,
  StatusBadge,
  EmptyState,
  LoadingScreen,
} from '../../shared/ui';
import {
  formatUSD,
  formatDate,
  formatDealStatus,
  getDealStatusColor,
} from '../../shared/lib/format';
import type { Deal, DealStatus } from '../../shared/types';

const STATUS_FILTERS: { value: DealStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'draft_application', label: 'Applications' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'posted', label: 'Posted' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ChannelDealsPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');

  const fetchDeals = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await getChannelDeals(channelId, status);
      setDeals(data);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId, statusFilter]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <PageHeader title="Channel Deals" subtitle="Manage incoming deals" />
        <button
          onClick={() => navigate('/channel/applications')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          🔍 Search Ads
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setStatusFilter(sf.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0"
            style={{
              backgroundColor:
                statusFilter === sf.value ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
              color: statusFilter === sf.value ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingScreen />
      ) : deals.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No deals"
          description={
            statusFilter === 'all'
              ? 'No deals for this channel yet'
              : `No ${statusFilter} deals`
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              onClick={() => navigate(`/channel/deals/${deal.id}`)}
            >
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Deal #{deal.id}</p>
                    <StatusBadge
                      label={formatDealStatus(deal.status)}
                      color={getDealStatusColor(deal.status)}
                    />
                  </div>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {deal.adPriceUSD ? formatUSD(deal.adPriceUSD) : 'Price TBD'} ·{' '}
                    {formatDate(deal.createdAt)}
                  </p>
                </div>
                <span
                  className="text-sm"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  &rsaquo;
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
