import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { Button, Input, Toggle } from '@telegram-tools/ui-kit';
import {
  getChannelAdFormats,
  createAdFormat,
  updateAdFormat,
} from '../../shared/api';
import { PageHeader, Card, EmptyState, LoadingScreen } from '../../shared/ui';
import { formatUSD, formatAdType } from '../../shared/lib/format';
import { hapticFeedback } from '../../shared/lib/telegram';
import type { AdFormat, AdFormatType } from '../../shared/types';

const FORMAT_OPTIONS: { value: AdFormatType; label: string; description: string }[] = [
  { value: '1/1', label: '1/1h', description: 'Post stays 1 hour at top' },
  { value: '1/24', label: '1/24h', description: 'Post stays 24 hours at top' },
  { value: '2/48', label: '2/48h', description: 'Post stays 48 hours at top' },
  { value: '3/72', label: '3/72h', description: 'Post stays 72 hours at top' },
  { value: 'repost', label: 'Repost', description: 'Repost from advertiser channel' },
  { value: 'no_removal', label: 'No Removal', description: 'Post stays permanently' },
];

export function AdFormatsPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const [formats, setFormats] = useState<AdFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFormatType, setNewFormatType] = useState<AdFormatType | ''>('');
  const [newPrice, setNewPrice] = useState('');
  const [editingFormat, setEditingFormat] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFormats = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      const data = await getChannelAdFormats(channelId);
      setFormats(data);
    } catch (err) {
      console.error('Failed to fetch formats:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    fetchFormats();
  }, [fetchFormats]);

  const handleCreate = async () => {
    if (!channelId || !newFormatType || !newPrice) return;
    setSubmitting(true);
    try {
      await createAdFormat(channelId, {
        formatType: newFormatType,
        priceUSD: newPrice,
      });
      hapticFeedback('success');
      setShowCreate(false);
      setNewFormatType('');
      setNewPrice('');
      fetchFormats();
    } catch (err) {
      console.error('Failed to create format:', err);
      hapticFeedback('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (format: AdFormat) => {
    if (!channelId) return;
    try {
      await updateAdFormat(channelId, format.id, { isActive: !format.isActive });
      hapticFeedback('success');
      fetchFormats();
    } catch (err) {
      console.error('Failed to toggle format:', err);
      hapticFeedback('error');
    }
  };

  const handleUpdatePrice = async (formatId: string) => {
    if (!channelId || !editPrice) return;
    try {
      await updateAdFormat(channelId, formatId, { priceUSD: editPrice });
      hapticFeedback('success');
      setEditingFormat(null);
      setEditPrice('');
      fetchFormats();
    } catch (err) {
      console.error('Failed to update price:', err);
      hapticFeedback('error');
    }
  };

  // Find which format types are already used
  const usedFormatTypes = new Set(formats.map((f) => f.formatType));
  const availableFormats = FORMAT_OPTIONS.filter((f) => !usedFormatTypes.has(f.value));

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <PageHeader
        title="Ad Formats"
        subtitle="Configure pricing for ad placements"
        action={
          availableFormats.length > 0 ? (
            <Button text="+ Add" onClick={() => setShowCreate(true)} />
          ) : undefined
        }
      />

      {/* Create new format */}
      {showCreate && (
        <Card className="mb-4">
          <p className="text-sm font-semibold mb-3">New Ad Format</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Format Type
              </label>
              <div className="flex flex-col gap-2">
                {availableFormats.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setNewFormatType(opt.value)}
                    className="flex items-center justify-between p-3 rounded-lg text-left transition-all"
                    style={{
                      backgroundColor:
                        newFormatType === opt.value
                          ? 'var(--color-primary)'
                          : 'var(--color-bg-tertiary)',
                      color:
                        newFormatType === opt.value ? '#fff' : 'var(--color-text-primary)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs opacity-70">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Price (USD)
              </label>
              <Input
                value={newPrice}
                onChange={(value) => setNewPrice(value)}
                placeholder="0.00"
                type="number"
              />
            </div>

            <div className="flex gap-2">
              <Button text="Cancel" onClick={() => setShowCreate(false)} />
              <Button
                text={submitting ? 'Creating...' : 'Create'}
                onClick={handleCreate}
                disabled={!newFormatType || !newPrice || submitting}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Existing formats */}
      {formats.length === 0 ? (
        <EmptyState
          icon="💰"
          title="No ad formats"
          description="Add ad formats with pricing to start receiving deals"
          action={
            <Button text="Add Format" onClick={() => setShowCreate(true)} />
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {formats.map((format) => (
            <Card key={format.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">
                    {formatAdType(format.formatType)}
                  </p>
                  <p className="text-lg font-bold">{formatUSD(format.priceUSD)}</p>
                </div>
                <Toggle
                  isEnabled={format.isActive}
                  onChange={() => handleToggleActive(format)}
                />
              </div>

              {format.CPM && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  CPM: {formatUSD(format.CPM)}
                </p>
              )}

              {editingFormat === format.id ? (
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <Input
                      value={editPrice}
                      onChange={(value) => setEditPrice(value)}
                      placeholder={format.priceUSD}
                      type="number"
                    />
                  </div>
                  <Button
                    text="Save"
                    onClick={() => handleUpdatePrice(format.id)}
                  />
                  <Button
                    text="Cancel"
                    onClick={() => setEditingFormat(null)}
                  />
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEditingFormat(format.id);
                      setEditPrice(format.priceUSD);
                    }}
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Edit Price
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
