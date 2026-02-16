import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button, Input, Sheet } from '@telegram-tools/ui-kit';
import {
  searchChannels,
  getCategories,
  getCampaigns,
  createDeal,
} from '../../shared/api';
import {
  PageHeader,
  Card,
  ChannelAvatar,
  EmptyState,
  LoadingScreen,
} from '../../shared/ui';
import {
  formatUSD,
  formatNumber,
  formatPercent,
  formatAdType,
} from '../../shared/lib/format';
import { hapticFeedback } from '../../shared/lib/telegram';
import type {
  Channel,
  ChannelSearchParams,
  Category,
  AdFormatType,
  Campaign,
  AdFormat,
} from '../../shared/types';

const FORMAT_OPTIONS: { value: AdFormatType; label: string }[] = [
  { value: '1/1', label: '1/1h' },
  { value: '1/24', label: '1/24h' },
  { value: '2/48', label: '2/48h' },
  { value: '3/72', label: '3/72h' },
  { value: 'repost', label: 'Repost' },
  { value: 'no_removal', label: 'No Removal' },
];

export function MarketplacePage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Buy Ad modal
  const [buyChannel, setBuyChannel] = useState<Channel | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  // Search params
  const [searchText, setSearchText] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<AdFormatType | ''>('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minCPM, setMinCPM] = useState('');
  const [maxCPM, setMaxCPM] = useState('');
  const [minSubscribers, setMinSubscribers] = useState('');
  const [maxSubscribers, setMaxSubscribers] = useState('');
  const [minAvgViews, setMinAvgViews] = useState('');
  const [maxAvgViews, setMaxAvgViews] = useState('');
  const [minER, setMinER] = useState('');
  const [maxER, setMaxER] = useState('');

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: ChannelSearchParams = {
        limit: 50,
        offset: 0,
      };
      if (searchText.trim()) params.text = searchText.trim();
      if (selectedFormat) params.formatType = selectedFormat;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (minPrice || maxPrice) {
        params.price = {};
        if (minPrice) params.price.min = minPrice;
        if (maxPrice) params.price.max = maxPrice;
      }
      if (minCPM || maxCPM) {
        params.CPM = {};
        if (minCPM) params.CPM.min = minCPM;
        if (maxCPM) params.CPM.max = maxCPM;
      }
      if (minSubscribers || maxSubscribers) {
        params.subscribers = {};
        if (minSubscribers) params.subscribers.min = Number(minSubscribers);
        if (maxSubscribers) params.subscribers.max = Number(maxSubscribers);
      }
      if (minAvgViews || maxAvgViews) {
        params.avgViews = {};
        if (minAvgViews) params.avgViews.min = Number(minAvgViews);
        if (maxAvgViews) params.avgViews.max = Number(maxAvgViews);
      }
      if (minER || maxER) {
        params.erPercent = {};
        if (minER) params.erPercent.min = minER;
        if (maxER) params.erPercent.max = maxER;
      }

      const data = await searchChannels(params);
      setChannels(data.channels ?? []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedFormat, selectedCategory, minPrice, maxPrice, minCPM, maxCPM, minSubscribers, maxSubscribers, minAvgViews, maxAvgViews, minER, maxER]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <div>
      <PageHeader
        title="Marketplace"
        subtitle="Find channels for your ads"
      />

      {/* Search bar */}
      <div className="mb-3">
        <Input
          value={searchText}
          onChange={(value) => setSearchText(value)}
          placeholder="Search channels..."
        />
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="text-xs font-medium mb-3 px-2 py-1 rounded"
        style={{ color: 'var(--color-primary)' }}
      >
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {showFilters && (
        <Card className="mb-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Format
              </label>
              <div className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setSelectedFormat(selectedFormat === opt.value ? '' : opt.value)
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor:
                        selectedFormat === opt.value
                          ? 'var(--color-primary)'
                          : 'var(--color-bg-tertiary)',
                      color:
                        selectedFormat === opt.value ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor:
                        selectedCategory === cat.id
                          ? 'var(--color-primary)'
                          : 'var(--color-bg-tertiary)',
                      color:
                        selectedCategory === cat.id ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Price (USD)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={minPrice}
                  onChange={(value) => setMinPrice(value)}
                  placeholder="Min"
                  type="number"
                />
                <Input
                  value={maxPrice}
                  onChange={(value) => setMaxPrice(value)}
                  placeholder="Max"
                  type="number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                CPM (USD)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={minCPM}
                  onChange={(value) => setMinCPM(value)}
                  placeholder="Min"
                  type="number"
                />
                <Input
                  value={maxCPM}
                  onChange={(value) => setMaxCPM(value)}
                  placeholder="Max"
                  type="number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Subscribers
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={minSubscribers}
                  onChange={(value) => setMinSubscribers(value)}
                  placeholder="Min"
                  type="number"
                />
                <Input
                  value={maxSubscribers}
                  onChange={(value) => setMaxSubscribers(value)}
                  placeholder="Max"
                  type="number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Avg Views
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={minAvgViews}
                  onChange={(value) => setMinAvgViews(value)}
                  placeholder="Min"
                  type="number"
                />
                <Input
                  value={maxAvgViews}
                  onChange={(value) => setMaxAvgViews(value)}
                  placeholder="Max"
                  type="number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                ER (%)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={minER}
                  onChange={(value) => setMinER(value)}
                  placeholder="Min"
                  type="number"
                />
                <Input
                  value={maxER}
                  onChange={(value) => setMaxER(value)}
                  placeholder="Max"
                  type="number"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <LoadingScreen />
      ) : channels.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No channels found"
          description="Try adjusting your search filters"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onBuyAd={() => {
                setBuyChannel(channel);
                setBuyModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Sheet
        sheets={{
          buyAd: () => (
            <BuyAdForm
              channel={buyChannel}
              onClose={() => setBuyModalOpen(false)}
              onCreated={(dealId) => {
                setBuyModalOpen(false);
                navigate(`/advertiser/deals/${dealId}`);
              }}
            />
          ),
        }}
        activeSheet="buyAd"
        opened={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
      />
    </div>
  );
}

function ChannelCard({
  channel,
  onBuyAd,
}: {
  channel: Channel;
  onBuyAd: () => void;
}) {
  return (
    <Card>
      <div className="flex gap-3">
        <ChannelAvatar
          title={channel.title}
          avatarUrl={channel.avatarUrl}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{channel.title}</h3>
          {channel.username && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              @{channel.username}
            </p>
          )}

          {channel.stats && (
            <div
              className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <span>{formatNumber(channel.stats.subscribers)} subs</span>
              <span>{formatNumber(channel.stats.avgViews)} avg views</span>
              <span>ER {formatPercent(channel.stats.erPercent)}</span>
            </div>
          )}

          {channel.adFormats && channel.adFormats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {channel.adFormats.map((fmt) => (
                <span
                  key={fmt.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {formatAdType(fmt.formatType)} · {formatUSD(fmt.priceUSD)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button className="w-auto! flex-none!" text="Buy Ad" onClick={onBuyAd} />
      </div>
    </Card>
  );
}

function BuyAdForm({
  channel,
  onClose,
  onCreated,
}: {
  channel: Channel | null;
  onClose: () => void;
  onCreated: (dealId: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const activeFormats = (channel?.adFormats ?? []).filter((f) => f.isActive);

  useEffect(() => {
    getCampaigns('active')
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoadingCampaigns(false));
  }, []);

  // Reset form when channel changes
  useEffect(() => {
    setSelectedFormat(null);
    setScheduleAt('');
    setMessage('');
    setSelectedCampaignId('');
  }, [channel]);

  const handleSubmit = async () => {
    if (!channel || !selectedFormat || !selectedCampaignId) return;
    setSubmitting(true);
    try {
      const deal = await createDeal({
        channelId: channel.id,
        campaignId: selectedCampaignId,
        adFormatId: selectedFormat.id,
        adPriceUSD: selectedFormat.priceUSD,
        adScheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
        draftDealMessage: message || undefined,
      });
      hapticFeedback('success');
      onCreated(deal.id);
    } catch (err) {
      console.error('Failed to create deal:', err);
      hapticFeedback('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!channel) return null;

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Buy Ad</h2>
        <button
          onClick={onClose}
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Cancel
        </button>
      </div>

      {/* Channel info (read-only) */}
      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        <ChannelAvatar title={channel.title} avatarUrl={channel.avatarUrl} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{channel.title}</p>
          {channel.username && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              @{channel.username}
            </p>
          )}
        </div>
      </div>

      {/* Campaign selection */}
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Campaign *
        </label>
        {loadingCampaigns ? (
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            No active campaigns. Create a campaign first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCampaignId(c.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: selectedCampaignId === c.id ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                  color: selectedCampaignId === c.id ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Format selection (price is shown, not editable) */}
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Ad Format *
        </label>
        {activeFormats.length > 0 ? (
          <div className="flex flex-col gap-2">
            {activeFormats.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt)}
                className="flex items-center justify-between p-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: selectedFormat?.id === fmt.id ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                  color: selectedFormat?.id === fmt.id ? '#fff' : 'var(--color-text-primary)',
                }}
              >
                <span className="text-sm font-medium">{formatAdType(fmt.formatType)}</span>
                <span className="text-sm">{formatUSD(fmt.priceUSD)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            No active ad formats available
          </p>
        )}
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
          Message (optional)
        </label>
        <Input
          value={message}
          onChange={(value) => setMessage(value)}
          placeholder="Ad text or instructions..."
        />
      </div>

      {/* Submit */}
      <Button
        text={submitting ? 'Creating...' : 'Buy Ad'}
        onClick={handleSubmit}
        disabled={!selectedCampaignId || !selectedFormat || submitting}
      />
    </div>
  );
}
