import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getMyChannels, searchCampaigns } from '../../shared/api';
import {
  PageHeader,
  Card,
  EmptyState,
  LoadingScreen,
} from '../../shared/ui';
import {
  formatUSD,
  formatNumber,
  formatAdType,
} from '../../shared/lib/format';
import type { Channel, Campaign } from '../../shared/types';

export function ChannelApplicationsPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Load channels
  useEffect(() => {
    getMyChannels()
      .then((data) => {
        const activeChannels = data.filter((c) => c.status === 'active');
        setChannels(activeChannels);
        if (activeChannels.length > 0) {
          setSelectedChannelId(activeChannels[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load available campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!selectedChannelId) return;
    setCampaignsLoading(true);
    try {
      const data = await searchCampaigns(selectedChannelId, 50);
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setCampaignsLoading(false);
    }
  }, [selectedChannelId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (loading) return <LoadingScreen />;

  if (channels.length === 0) {
    return (
      <div>
        <PageHeader title="Apply to Campaigns" />
        <EmptyState
          icon="📺"
          title="No active channels"
          description="You need at least one active channel to apply to campaigns"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Apply to Campaigns"
        subtitle="Find campaigns accepting applications"
      />

      {/* Channel selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setSelectedChannelId(ch.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0"
            style={{
              backgroundColor:
                selectedChannelId === ch.id
                  ? 'var(--color-primary)'
                  : 'var(--color-bg-tertiary)',
              color:
                selectedChannelId === ch.id ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {ch.title}
          </button>
        ))}
      </div>

      {/* Campaigns */}
      {campaignsLoading ? (
        <LoadingScreen />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon="📩"
          title="No campaigns available"
          description="No campaigns currently accepting applications matching your channel"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <h3 className="text-sm font-semibold mb-1">{campaign.title}</h3>
              {campaign.description && (
                <p
                  className="text-xs mb-2 line-clamp-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {campaign.description}
                </p>
              )}

              <div
                className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-3"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {campaign.ApplicationFormatType && (
                  <span>Format: {formatAdType(campaign.ApplicationFormatType)}</span>
                )}
                {(campaign.ApplicationMinPriceUSD || campaign.ApplicationMaxPriceUSD) && (
                  <span>
                    Price: {formatUSD(campaign.ApplicationMinPriceUSD)} -{' '}
                    {formatUSD(campaign.ApplicationMaxPriceUSD)}
                  </span>
                )}
                {(campaign.ApplicationMinSubscribers || campaign.ApplicationMaxSubscribers) && (
                  <span>
                    Subs: {formatNumber(campaign.ApplicationMinSubscribers)} -{' '}
                    {formatNumber(campaign.ApplicationMaxSubscribers)}
                  </span>
                )}
              </div>

              <button
                onClick={() =>
                  navigate(
                    `/advertiser/deals/new?channelId=${selectedChannelId}&campaignId=${campaign.id}`,
                  )
                }
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                Apply
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
