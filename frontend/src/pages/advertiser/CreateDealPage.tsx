import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button, Input } from '@telegram-tools/ui-kit';
import {
  createDeal,
  getCampaigns,
  searchChannels,
  getChannelAdFormats,
} from '../../shared/api';
import {
  PageHeader,
  Card,
  ChannelAvatar,
  LoadingScreen,
} from '../../shared/ui';
import { formatUSD, formatAdType, formatNumber } from '../../shared/lib/format';
import { hapticFeedback } from '../../shared/lib/telegram';
import type {
  Campaign,
  Channel,
  AdFormat,
} from '../../shared/types';

export function CreateDealPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedChannelId = searchParams.get('channelId');
  const preselectedCampaignId = searchParams.get('campaignId');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(preselectedCampaignId || '');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [formats, setFormats] = useState<AdFormat[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [price, setPrice] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [channelSearch, setChannelSearch] = useState('');

  // Load campaigns
  useEffect(() => {
    getCampaigns('active')
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load channel if preselected
  useEffect(() => {
    if (preselectedChannelId) {
      searchChannels({ limit: 1 }).then((data) => {
        const found = (data.channels ?? []).find((c) => c.id === preselectedChannelId);
        if (found) {
          setSelectedChannel(found);
          setFormats(found.adFormats?.filter((f) => f.isActive) ?? []);
        }
      });
    }
  }, [preselectedChannelId]);

  // Search channels
  useEffect(() => {
    if (!channelSearch.trim() && !preselectedChannelId) return;
    const timer = setTimeout(() => {
      searchChannels({ text: channelSearch, limit: 10 }).then((data) =>
        setChannels(data.channels ?? []),
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [channelSearch, preselectedChannelId]);

  // Load formats when channel selected
  useEffect(() => {
    if (selectedChannel) {
      getChannelAdFormats(selectedChannel.id).then((f) => {
        setFormats(f.filter((fmt) => fmt.isActive));
      });
    }
  }, [selectedChannel]);

  // Auto-set price when format selected
  useEffect(() => {
    const fmt = formats.find((f) => f.id === selectedFormatId);
    if (fmt) {
      setPrice(fmt.priceUSD);
    }
  }, [selectedFormatId, formats]);

  const handleSubmit = async () => {
    if (!selectedChannel || !selectedFormatId || !price) return;
    setSubmitting(true);
    try {
      const deal = await createDeal({
        channelId: selectedChannel.id,
        campaignId: selectedCampaignId || undefined,
        adFormatId: selectedFormatId,
        adPriceUSD: price,
        adScheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
        draftDealMessage: message || undefined,
      });
      hapticFeedback('success');
      navigate(`/advertiser/deals/${deal.id}`, { replace: true });
    } catch (err) {
      console.error('Failed to create deal:', err);
      hapticFeedback('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <PageHeader title="Create Deal" subtitle="Set up a new advertising deal" />

      <div className="flex flex-col gap-4">
        {/* Campaign selection */}
        {campaigns.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Campaign (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCampaignId('')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: !selectedCampaignId
                    ? 'var(--color-primary)'
                    : 'var(--color-bg-tertiary)',
                  color: !selectedCampaignId ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                None
              </button>
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor:
                      selectedCampaignId === c.id
                        ? 'var(--color-primary)'
                        : 'var(--color-bg-tertiary)',
                    color:
                      selectedCampaignId === c.id ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Channel selection */}
        {!selectedChannel ? (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Select Channel *
            </label>
            <Input
              value={channelSearch}
              onChange={(value) => setChannelSearch(value)}
              placeholder="Search for a channel..."
            />
            {channels.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch)}
                    className="flex items-center gap-2 p-2 rounded-lg text-left transition-colors"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    <ChannelAvatar title={ch.title} avatarUrl={ch.avatarUrl} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{ch.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNumber(ch.stats?.subscribers ?? 0)} subscribers
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChannelAvatar
                  title={selectedChannel.title}
                  avatarUrl={selectedChannel.avatarUrl}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium">{selectedChannel.title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatNumber(selectedChannel.stats?.subscribers ?? 0)} subscribers
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedChannel(null);
                  setFormats([]);
                  setSelectedFormatId('');
                }}
                className="text-xs"
                style={{ color: 'var(--color-primary)' }}
              >
                Change
              </button>
            </div>
          </Card>
        )}

        {/* Format selection */}
        {selectedChannel && formats.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Ad Format *
            </label>
            <div className="flex flex-col gap-2">
              {formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormatId(fmt.id)}
                  className="flex items-center justify-between p-3 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor:
                      selectedFormatId === fmt.id
                        ? 'var(--color-primary)'
                        : 'var(--color-bg-tertiary)',
                    color:
                      selectedFormatId === fmt.id ? '#fff' : 'var(--color-text-primary)',
                  }}
                >
                  <span className="text-sm font-medium">{formatAdType(fmt.formatType)}</span>
                  <span className="text-sm">{formatUSD(fmt.priceUSD)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Price (USD) *
          </label>
          <Input
            value={price}
            onChange={(value) => setPrice(value)}
            placeholder="0.00"
            type="number"
          />
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Schedule Date (optional)
          </label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            type="datetime-local"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Draft Message (optional)
          </label>
          <Input
            value={message}
            onChange={(value) => setMessage(value)}
            placeholder="Ad text or instructions..."
          />
        </div>

        <Button
          text={submitting ? 'Creating...' : 'Create Deal'}
          onClick={handleSubmit}
          disabled={!selectedChannel || !selectedFormatId || !price || submitting}
        />
      </div>
    </div>
  );
}
