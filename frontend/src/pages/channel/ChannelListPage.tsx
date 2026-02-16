import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getMyChannels } from '../../shared/api';
import {
  PageHeader,
  Card,
  ChannelAvatar,
  StatusBadge,
  EmptyState,
  LoadingScreen,
} from '../../shared/ui';
import {
  formatNumber,
  formatPercent,
  formatChannelStatus,
} from '../../shared/lib/format';
import type { Channel } from '../../shared/types';

export function ChannelListPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyChannels()
      .then(setChannels)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <PageHeader
        title="My Channels"
        subtitle="Manage your Telegram channels"
      />

      {channels.length === 0 ? (
        <EmptyState
          icon="📺"
          title="No channels yet"
          description="Add the bot as admin to your Telegram channel to get started"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {channels.map((channel) => (
            <Card
              key={channel.id}
              onClick={() => navigate(`/channel/${channel.id}`)}
            >
              <div className="flex gap-3">
                <ChannelAvatar
                  title={channel.title}
                  avatarUrl={channel.avatarUrl}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold truncate">{channel.title}</h3>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: channel.isVisible ? '#22c55e20' : '#ef444420',
                        color: channel.isVisible ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {channel.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  {channel.username && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      @{channel.username}
                    </p>
                  )}

                  {channel.stats && (
                    <div
                      className="flex gap-3 mt-1.5 text-xs"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      <span>{formatNumber(channel.stats.subscribers)} subs</span>
                      <span>{formatNumber(channel.stats.avgViews)} views</span>
                      <span>ER {formatPercent(channel.stats.erPercent)}</span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-1.5">
                    <StatusBadge
                      label={formatChannelStatus(channel.status)}
                      color={
                        channel.status === 'active'
                          ? '#22c55e'
                          : channel.status === 'pending'
                            ? '#f59e0b'
                            : '#ef4444'
                      }
                    />
                    {channel.botIsAdmin && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: '#3b82f620',
                          color: '#3b82f6',
                        }}
                      >
                        Bot Admin
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-lg self-center"
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
