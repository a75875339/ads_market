import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import {
  getMyChannels,
  getCategories,
  updateChannelWallet,
  updateChannelVisibility,
  updateChannelCategory,
} from '../../shared/api';
import { Button, Input, Toggle, PageHeader, Card, LoadingScreen, EmptyState } from '../../shared/ui';
import { hapticFeedback } from '../../shared/lib/telegram';
import type { Channel, Category } from '../../shared/types';

export function ChannelSettingsPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletSaving, setWalletSaving] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);

  useEffect(() => {
    if (!channelId) return;
    Promise.all([getMyChannels(), getCategories()])
      .then(([channels, cats]) => {
        const found = channels.find((c) => c.id === channelId);
        setChannel(found || null);
        if (found?.rewardWalletAddress) {
          setWalletAddress(found.rewardWalletAddress);
        }
        setSelectedCategoryId(found?.categoryId ?? null);
        setCategories(cats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [channelId]);

  const handleSaveWallet = async () => {
    if (!channelId || !walletAddress.trim()) return;
    setWalletSaving(true);
    try {
      await updateChannelWallet(channelId, { walletAddress: walletAddress.trim() });
      setChannel((prev) =>
        prev ? { ...prev, rewardWalletAddress: walletAddress.trim() } : null,
      );
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to update wallet:', err);
      hapticFeedback('error');
    } finally {
      setWalletSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!channelId || !channel) return;
    setVisibilitySaving(true);
    try {
      const { isVisible } = await updateChannelVisibility(channelId, {
        isVisible: !channel.isVisible,
      });
      setChannel((prev) => (prev ? { ...prev, isVisible } : null));
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to update visibility:', err);
      hapticFeedback('error');
    } finally {
      setVisibilitySaving(false);
    }
  };

  const handleCategoryChange = async (catId: string | null) => {
    if (!channelId) return;
    const newCategoryId = selectedCategoryId === catId ? null : catId;
    setSelectedCategoryId(newCategoryId);
    setCategorySaving(true);
    try {
      await updateChannelCategory(channelId, {
        categoryId: newCategoryId ? Number(newCategoryId) : null,
      });
      setChannel((prev) => (prev ? { ...prev, categoryId: newCategoryId } : null));
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to update category:', err);
      setSelectedCategoryId(channel?.categoryId ?? null);
      hapticFeedback('error');
    } finally {
      setCategorySaving(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!channel) return <EmptyState icon="404" title="Channel not found" />;

  const canBeVisible =
    channel.status === 'active' && channel.rewardWalletAddress;

  return (
    <div>
      <PageHeader title="Settings" subtitle={channel.title} />

      {/* Wallet Address */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Reward Wallet</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          TON wallet address where you will receive payments for ad placements.
        </p>
        <div className="flex flex-col gap-2">
          <Input
            value={walletAddress}
            onChange={(value) => setWalletAddress(value)}
            placeholder="UQBx..."
          />
          <Button
            className="w-auto! flex-none!"
            text={walletSaving ? 'Saving...' : 'Save Wallet'}
            onClick={handleSaveWallet}
            disabled={!walletAddress.trim() || walletSaving}
          />
        </div>
      </Card>

      {/* Visibility */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <h3 className="text-sm font-semibold">Marketplace Visibility</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {channel.isVisible
                ? 'Your channel is visible in the marketplace'
                : 'Make your channel discoverable by advertisers'}
            </p>
            {!canBeVisible && !channel.isVisible && (
              <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                Requires: active status, wallet address, and at least 1 active ad format
              </p>
            )}
          </div>
          <Toggle
            isEnabled={channel.isVisible}
            onChange={handleToggleVisibility}
            disabled={visibilitySaving || (!canBeVisible && !channel.isVisible)}
          />
        </div>
      </Card>

      {/* Category */}
      {categories.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Channel Category</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Select a category so advertisers can find your channel more easily.
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                disabled={categorySaving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor:
                    selectedCategoryId === cat.id
                      ? 'var(--color-primary)'
                      : 'var(--color-bg-tertiary)',
                  color:
                    selectedCategoryId === cat.id
                      ? '#fff'
                      : 'var(--color-text-secondary)',
                  opacity: categorySaving ? 0.6 : 1,
                }}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Channel Info */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Channel Info</h3>
        <div className="flex flex-col gap-2 text-sm">
          <InfoRow label="Status" value={channel.status} />
          <InfoRow label="Type" value={channel.channelType} />
          <InfoRow label="Language" value={channel.language} />
          <InfoRow
            label="Bot Admin"
            value={channel.botIsAdmin ? 'Yes' : 'No'}
          />
          {channel.username && (
            <InfoRow label="Username" value={`@${channel.username}`} />
          )}
        </div>
      </Card>

    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
