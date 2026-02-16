import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@telegram-tools/ui-kit';
import { getCampaigns } from '../../shared/api';
import { PageHeader, EmptyState, Card, StatusBadge, LoadingScreen } from '../../shared/ui';
import { formatDate, formatUSD, formatAdType } from '../../shared/lib/format';
import type { Campaign, CampaignStatus } from '../../shared/types';

export function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CampaignStatus>('active');

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCampaigns(filter);
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Manage your advertising campaigns"
        action={
          <Button text="+ New" onClick={() => navigate('/advertiser/campaigns/new')} />
        }
      />

      <div
        className="flex rounded-lg p-1"
        style={{ backgroundColor: 'var(--color-bg-tertiary)', marginTop: 24, marginBottom: 24 }}
      >
        {(['active', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all"
            style={{
              backgroundColor:
                filter === status ? 'var(--color-bg-primary)' : 'transparent',
              color: filter === status ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: filter === status ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingScreen />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No campaigns yet"
          description="Create your first advertising campaign to start reaching channels"
          action={
            <Button
              text="Create Campaign"
              onClick={() => navigate('/advertiser/campaigns/new')}
            />
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  onClick,
}: {
  campaign: Campaign;
  onClick: () => void;
}) {
  return (
    <Card onClick={onClick} className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-2">{campaign.title}</h3>

          {campaign.description && (
            <p
              className="text-xs mb-3 line-clamp-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {campaign.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {campaign.acceptApplications && (
              <span style={{ color: 'var(--color-primary)' }}>Accepting applications</span>
            )}
            {campaign.ApplicationFormatType && (
              <span>Format: {formatAdType(campaign.ApplicationFormatType)}</span>
            )}
            {(campaign.ApplicationMinPriceUSD || campaign.ApplicationMaxPriceUSD) && (
              <span>
                Price: {formatUSD(campaign.ApplicationMinPriceUSD)} -{' '}
                {formatUSD(campaign.ApplicationMaxPriceUSD)}
              </span>
            )}
            <span>Created {formatDate(campaign.createdAt)}</span>
          </div>
        </div>

        <StatusBadge
          label={campaign.status === 'active' ? 'Active' : 'Archived'}
          color={campaign.status === 'active' ? '#22c55e' : '#94a3b8'}
        />
      </div>
    </Card>
  );
}
