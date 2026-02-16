import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { getChannelManagers, updateManagerPermissions } from '../../shared/api';
import { PageHeader, Card, ChannelAvatar, LoadingScreen, EmptyState } from '../../shared/ui';
import { formatPermission } from '../../shared/lib/format';
import { hapticFeedback } from '../../shared/lib/telegram';
import type { ChannelManager, ManagerPermission } from '../../shared/types';

const PERMISSION_OPTIONS: { value: ManagerPermission; label: string; description: string }[] = [
  { value: 'none', label: 'No Access', description: 'Cannot access channel' },
  { value: 'view', label: 'View Only', description: 'Can view deals and formats' },
  { value: 'manage_deals', label: 'Manage Deals', description: 'Can create and manage deals' },
  {
    value: 'manage_formats',
    label: 'Manage Formats',
    description: 'Can create and edit ad formats',
  },
  { value: 'full', label: 'Full Access', description: 'All permissions including managers' },
];

export function ChannelManagersPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const [managers, setManagers] = useState<ChannelManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingManager, setEditingManager] = useState<string | null>(null);

  const fetchManagers = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      const data = await getChannelManagers(channelId);
      setManagers(data);
    } catch (err) {
      console.error('Failed to fetch managers:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const handleUpdatePermission = async (
    userId: string,
    permissions: ManagerPermission,
  ) => {
    if (!channelId) return;
    try {
      await updateManagerPermissions(channelId, userId, { permissions });
      hapticFeedback('success');
      setEditingManager(null);
      fetchManagers();
    } catch (err) {
      console.error('Failed to update permissions:', err);
      hapticFeedback('error');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <PageHeader title="Team" subtitle="Manage channel team permissions" />

      {managers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No team members"
          description="Team members will appear here when added"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {managers.map((manager) => (
            <Card key={manager.id}>
              <div className="flex items-center gap-3">
                <ChannelAvatar
                  title={
                    manager.user.firstName
                      || manager.user.username
                      || manager.user.telegramId
                      || 'Unknown'
                  }
                  avatarUrl={manager.user.avatarUrl}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {manager.user.firstName
                      ? `${manager.user.firstName} ${manager.user.lastName || ''}`.trim()
                      : manager.user.username
                        ? `@${manager.user.username}`
                        : manager.user.telegramId || 'Unknown'}
                  </p>
                  {manager.user.firstName && manager.user.username && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      @{manager.user.username}
                    </p>
                  )}
                  {!manager.user.firstName && !manager.user.username && manager.user.telegramId && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Telegram ID
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    setEditingManager(
                      editingManager === manager.user.id ? null : manager.user.id,
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {formatPermission(manager.permissions)}
                </button>
              </div>

              {editingManager === manager.user.id && (
                <div
                  className="mt-3 pt-3 flex flex-col gap-1.5"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  {PERMISSION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        handleUpdatePermission(manager.user.id, opt.value)
                      }
                      className="flex items-center justify-between p-2.5 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor:
                          manager.permissions === opt.value
                            ? 'var(--color-primary)'
                            : 'var(--color-bg-tertiary)',
                        color:
                          manager.permissions === opt.value
                            ? '#fff'
                            : 'var(--color-text-primary)',
                      }}
                    >
                      <div>
                        <p className="text-xs font-medium">{opt.label}</p>
                        <p className="text-[10px] opacity-70">{opt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
