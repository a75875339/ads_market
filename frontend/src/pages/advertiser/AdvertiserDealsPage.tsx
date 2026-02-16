import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@telegram-tools/ui-kit';
import { getCampaigns, getCampaignDeals } from '../../shared/api';
import {
  PageHeader,
  Card,
  StatusBadge,
  EmptyState,
  LoadingScreen,
} from '../../shared/ui';
import {
  formatDate,
  formatUSD,
  formatDealStatus,
  getDealStatusColor,
} from '../../shared/lib/format';
import type { Deal, DealStatus } from '../../shared/types';

const STATUS_FILTERS: { value: DealStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'posted', label: 'Posted' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdvertiserDealsPage() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const campaigns = await getCampaigns();
      const allDeals: Deal[] = [];
      const status = statusFilter === 'all' ? undefined : statusFilter;

      await Promise.all(
        campaigns.map(async (campaign) => {
          const campaignDeals = await getCampaignDeals(campaign.id, status);
          allDeals.push(
            ...campaignDeals.map((d) => ({ ...d, campaign })),
          );
        }),
      );

      allDeals.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setDeals(allDeals);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return (
    <div>
      <PageHeader
        title="My Deals"
        subtitle="All deals across your campaigns"
        action={
          <Button text="+ New" onClick={() => navigate('/advertiser/deals/new')} />
        }
      />

      {/* Status filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setStatusFilter(sf.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0"
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
          description="Create deals by searching for channels in the marketplace"
          action={
            <Button
              text="Go to Marketplace"
              onClick={() => navigate('/advertiser/marketplace')}
            />
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              onClick={() => navigate(`/advertiser/deals/${deal.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Deal #{deal.id}</p>
                    <StatusBadge
                      label={formatDealStatus(deal.status)}
                      color={getDealStatusColor(deal.status)}
                    />
                  </div>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {deal.campaign?.title || `Campaign #${deal.campaignId}`} ·{' '}
                    {deal.adPriceUSD ? formatUSD(deal.adPriceUSD) : 'Price TBD'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {formatDate(deal.createdAt)}
                  </p>
                </div>
                <span
                  className="text-lg"
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
