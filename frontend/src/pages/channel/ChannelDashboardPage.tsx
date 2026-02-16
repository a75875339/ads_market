import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  getMyChannels,
  getChannelAdFormats,
  getChannelDeals,
} from '../../shared/api';
import {
  Card,
  ChannelAvatar,
  StatusBadge,
  LoadingScreen,
  EmptyState,
} from '../../shared/ui';
import {
  formatNumber,
  formatPercent,
  formatChannelStatus,
  formatUSD,
  formatAdType,
} from '../../shared/lib/format';
import type { Channel, AdFormat, Deal } from '../../shared/types';

export function ChannelDashboardPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [formats, setFormats] = useState<AdFormat[]>([]);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;
    Promise.all([
      getMyChannels(),
      getChannelAdFormats(channelId),
      getChannelDeals(channelId, undefined, 5),
    ])
      .then(([channels, fmts, deals]) => {
        const found = channels.find((c) => c.id === channelId);
        setChannel(found || null);
        setFormats(fmts);
        setRecentDeals(deals);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [channelId]);

  if (loading) return <LoadingScreen />;
  if (!channel) return <EmptyState icon="404" title="Channel not found" />;

  const activeFormats = formats.filter((f) => f.isActive);
  const activeDeals = recentDeals.filter(
    (d) => !['completed', 'cancelled'].includes(d.status),
  );

  return (
    <div>
      {/* Channel Header */}
      <div className="flex items-center gap-3 mb-4">
        <ChannelAvatar title={channel.title} avatarUrl={channel.avatarUrl} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">{channel.title}</h2>
            <StatusBadge
              label={formatChannelStatus(channel.status)}
              color={channel.status === 'active' ? '#22c55e' : '#f59e0b'}
            />
          </div>
          {channel.username && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              @{channel.username}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      {channel.stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCard label="Subscribers" value={formatNumber(channel.stats.subscribers)} />
          <StatCard label="Avg Views" value={formatNumber(channel.stats.avgViews)} />
          <StatCard label="ER" value={formatPercent(channel.stats.erPercent)} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <ActionCard
          icon="💰"
          label="Ad Formats"
          count={activeFormats.length}
          onClick={() => navigate(`/channel/${channelId}/formats`)}
        />
        <ActionCard
          icon="🤝"
          label="Deals"
          count={activeDeals.length}
          onClick={() => navigate(`/channel/${channelId}/deals`)}
        />
        <ActionCard
          icon="⚙️"
          label="Settings"
          onClick={() => navigate(`/channel/${channelId}/settings`)}
        />
        <ActionCard
          icon="👥"
          label="Managers"
          onClick={() => navigate(`/channel/${channelId}/managers`)}
        />
      </div>

      {/* Active Formats */}
      {activeFormats.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Active Formats</h3>
            <button
              onClick={() => navigate(`/channel/${channelId}/formats`)}
              className="text-xs"
              style={{ color: 'var(--color-primary)' }}
            >
              View All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFormats.map((fmt) => (
              <span
                key={fmt.id}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {formatAdType(fmt.formatType)} · {formatUSD(fmt.priceUSD)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Deals */}
      {recentDeals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Recent Deals</h3>
            <button
              onClick={() => navigate(`/channel/${channelId}/deals`)}
              className="text-xs"
              style={{ color: 'var(--color-primary)' }}
            >
              View All
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentDeals.slice(0, 3).map((deal) => (
              <Card
                key={deal.id}
                padding={false}
                onClick={() => navigate(`/channel/deals/${deal.id}`)}
              >
                <div className="flex items-center justify-between p-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">
                      Deal #{deal.id}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {deal.adPriceUSD ? formatUSD(deal.adPriceUSD) : 'Price TBD'}
                    </p>
                  </div>
                  <StatusBadge
                    label={deal.status}
                    color={
                      deal.status === 'completed'
                        ? '#22c55e'
                        : deal.status === 'cancelled'
                          ? '#ef4444'
                          : '#3b82f6'
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <p className="text-base font-bold mt-0.5">{value}</p>
    </Card>
  );
}

function ActionCard({
  icon,
  label,
  count,
  onClick,
}: {
  icon: string;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <Card onClick={onClick}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {count !== undefined && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {count} active
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
