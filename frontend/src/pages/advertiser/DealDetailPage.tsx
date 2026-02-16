import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import dayjs from 'dayjs';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import {
  getDeal,
  confirmDeal,
  cancelDeal,
  updateDealParams,
  getChannelAdFormats,
  getTopupTransaction,
} from '../../shared/api';
import {
  PageHeader,
  Card,
  StatusBadge,
  LoadingScreen,
  EmptyState,
} from '../../shared/ui';
import {
  formatUSD,
  formatDateTime,
  formatDealStatus,
  getDealStatusColor,
  formatAdType,
} from '../../shared/lib/format';
import { hapticFeedback } from '../../shared/lib/telegram';
import { useAuthStore, showToast } from '../../shared/stores';
import type { Deal, AdFormat, DealConfirmation } from '../../shared/types';

export function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const { role } = useAuthStore();
  const isAdvertiser = role === 'advertiser';

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode for ad parameters
  const [editingParams, setEditingParams] = useState(false);
  const [newScheduleAt, setNewScheduleAt] = useState('');
  const [newFormatId, setNewFormatId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [channelFormats, setChannelFormats] = useState<AdFormat[]>([]);

  // TON Connect
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();
  const [paymentPending, setPaymentPending] = useState(false);

  // Cancel form
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Timer
  const [timerText, setTimerText] = useState('');

  const fetchDeal = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const data = await getDeal(dealId);
      setDeal(data);
    } catch (err) {
      console.error('Failed to fetch deal:', err);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  // Timer for auto-cancel in payment block
  useEffect(() => {
    if (!deal || !deal.isPaid || deal.status !== 'negotiation') {
      setTimerText('');
      return;
    }

    const bothParamsConfirmed =
      deal.adParamsConfirmed?.advertiser && deal.adParamsConfirmed?.channel;

    let targetDate: string | null = null;
    if (bothParamsConfirmed && deal.adScheduleAt) {
      targetDate = deal.adScheduleAt;
    } else if (deal.depositReceivedAt) {
      targetDate = dayjs(deal.depositReceivedAt).add(24, 'hour').toISOString();
    }

    if (!targetDate) {
      setTimerText('');
      return;
    }

    const update = () => {
      const diff = dayjs(targetDate).diff(dayjs());
      if (diff <= 0) {
        setTimerText('Expired — auto-cancel pending');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimerText(`${hours}h ${minutes}m ${seconds}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deal]);

  const handleConfirm = async (
    eventType: 'draft_confirmed' | 'creative_confirmed' | 'ad_parameters_confirmed',
  ) => {
    if (!dealId) return;
    try {
      await confirmDeal(dealId, { eventType });
      await fetchDeal();
      hapticFeedback('success');
    } catch (err) {
      console.error('Confirm failed:', err);
      hapticFeedback('error');
    }
  };

  const handleCancel = async () => {
    if (!dealId) return;
    try {
      await cancelDeal(dealId, {
        reason: cancelReason || undefined,
      });
      await fetchDeal();
      setShowCancelForm(false);
      hapticFeedback('success');
    } catch (err) {
      console.error('Cancel failed:', err);
      hapticFeedback('error');
    }
  };

  const handleStartEdit = async () => {
    if (!deal) return;
    setNewScheduleAt(
      deal.adScheduleAt ? dayjs(deal.adScheduleAt).format('YYYY-MM-DDTHH:mm') : '',
    );
    setNewFormatId(deal.adFormatId || '');
    setNewPrice(deal.adPriceUSD || '');
    try {
      const formats = await getChannelAdFormats(deal.channelId);
      setChannelFormats(formats.filter((f) => f.isActive));
    } catch {
      setChannelFormats([]);
    }
    setEditingParams(true);
  };

  const handleSaveParams = async () => {
    if (!dealId || !deal) return;
    try {
      const params: Record<string, string> = {};
      if (newFormatId && newFormatId !== deal.adFormatId) params.adFormatId = newFormatId;
      if (!isAdvertiser && newPrice && newPrice !== deal.adPriceUSD) params.adPriceUSD = newPrice;
      if (newScheduleAt) params.adScheduleAt = new Date(newScheduleAt).toISOString();
      await updateDealParams(dealId, params);
      await fetchDeal();
      setEditingParams(false);
      hapticFeedback('success');
    } catch (err) {
      console.error('Update failed:', err);
      hapticFeedback('error');
    }
  };

  const sendPayment = useCallback(
    async (walletAddress: string) => {
      if (!dealId) return;
      try {
        setPaymentPending(true);
        const transaction = await getTopupTransaction(dealId, walletAddress);
        await tonConnectUI.sendTransaction(transaction);
        showToast('Transaction sent successfully!', 'success');
        hapticFeedback('success');
        await fetchDeal();
      } catch (err) {
        console.error('Payment failed:', err);
        showToast('Payment failed. Please try again.');
        hapticFeedback('error');
      } finally {
        setPaymentPending(false);
      }
    },
    [dealId, tonConnectUI, fetchDeal],
  );

  // Auto-trigger payment after wallet connects if payment was pending
  useEffect(() => {
    if (tonWallet && paymentPending) {
      sendPayment(tonWallet.account.address);
    }
  }, [tonWallet, paymentPending, sendPayment]);

  const handlePay = async () => {
    if (!tonWallet) {
      setPaymentPending(true);
      tonConnectUI.openModal();
      return;
    }
    await sendPayment(tonWallet.account.address);
  };

  if (loading) return <LoadingScreen />;
  if (!deal) return <EmptyState icon="404" title="Deal not found" />;

  const canCancel = isAdvertiser
    ? !deal.isPaid && !['completed', 'cancelled'].includes(deal.status)
    : ['draft', 'draft_application', 'negotiation', 'scheduled'].includes(deal.status);

  return (
    <div>
      <PageHeader
        title={`Deal #${deal.id}`}
        action={
          <StatusBadge
            label={formatDealStatus(deal.status)}
            color={getDealStatusColor(deal.status)}
          />
        }
      />

      {/* Block 1: Main Info */}
      <Card className="mb-3">
        <SectionHeader icon="📋" title="Main Info" />
        <div className="flex flex-col gap-2 text-sm mt-2">
          <InfoRow label="Status" value={formatDealStatus(deal.status)} />
          <InfoRow
            label="Campaign"
            value={deal.campaign?.title || (deal.campaignId ? '—' : 'Not linked')}
          />
          <InfoRow label="Channel" value={deal.channel?.title || '—'} />

          {(deal.status === 'draft' || deal.status === 'draft_application') &&
            deal.draftDealMessage && (
              <div className="mt-1">
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Draft Message
                </p>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">
                  {deal.draftDealMessage}
                </p>
              </div>
            )}
        </div>
        <ConfirmationRow label="Draft" confirmation={deal.draftConfirmed} />
        {isAdvertiser &&
          !deal.draftConfirmed?.advertiser &&
          ['draft', 'draft_application'].includes(deal.status) && (
            <ActionButton
              label="Confirm Draft"
              color="#22c55e"
              onClick={() => handleConfirm('draft_confirmed')}
            />
          )}
        {!isAdvertiser &&
          !deal.draftConfirmed?.channel &&
          ['draft', 'draft_application'].includes(deal.status) && (
            <ActionButton
              label="Confirm Draft"
              color="#22c55e"
              onClick={() => handleConfirm('draft_confirmed')}
            />
          )}
      </Card>

      {/* Block 2: Ad Parameters */}
      <Card className="mb-3">
        <SectionHeader icon="⚙️" title="Ad Parameters" />
        {editingParams ? (
          <div className="flex flex-col gap-3 mt-2">
            {channelFormats.length > 0 && (
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Format
                </label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  value={newFormatId}
                  onChange={(e) => setNewFormatId(e.target.value)}
                >
                  {channelFormats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {formatAdType(f.formatType)} — {formatUSD(f.priceUSD)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label
                className="block text-xs mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Price (USD)
              </label>
              {isAdvertiser ? (
                <div
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {deal.adPriceUSD ? formatUSD(deal.adPriceUSD) : 'TBD'}
                  <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    (set by channel)
                  </span>
                </div>
              ) : (
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              )}
            </div>
            <div>
              <label
                className="block text-xs mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Publish Date & Time
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                value={newScheduleAt}
                onChange={(e) => setNewScheduleAt(e.target.value)}
                type="datetime-local"
              />
            </div>
            <div className="flex gap-2">
              <ActionButton label="Save" color="#3b82f6" onClick={handleSaveParams} />
              <ActionButton
                label="Cancel"
                color="#94a3b8"
                onClick={() => setEditingParams(false)}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm mt-2">
            <InfoRow
              label="Format"
              value={deal.adFormat ? formatAdType(deal.adFormat.formatType) : 'Not set'}
            />
            <InfoRow
              label="Price"
              value={deal.adPriceUSD ? formatUSD(deal.adPriceUSD) : 'TBD'}
            />
            <InfoRow
              label="Publish Date"
              value={deal.adScheduleAt ? formatDateTime(deal.adScheduleAt) : 'Not set'}
            />
            {deal.status === 'negotiation' && (
              <button
                onClick={handleStartEdit}
                className="mt-1 text-xs font-medium self-start"
                style={{ color: 'var(--color-primary)' }}
              >
                ✏️ Edit Parameters
              </button>
            )}
          </div>
        )}
        <ConfirmationRow label="Parameters" confirmation={deal.adParamsConfirmed} />
        {isAdvertiser &&
          !deal.adParamsConfirmed?.advertiser && (
            <ActionButton
              label="Confirm Parameters"
              color="#22c55e"
              onClick={() => handleConfirm('ad_parameters_confirmed')}
            />
          )}
        {!isAdvertiser &&
          !deal.adParamsConfirmed?.channel && (
            <ActionButton
              label="Confirm Parameters"
              color="#22c55e"
              onClick={() => handleConfirm('ad_parameters_confirmed')}
            />
          )}
      </Card>

      {/* Block 3: Payment */}
      <Card className="mb-3">
        <SectionHeader icon="💰" title="Payment" />
        <div className="flex flex-col gap-2 text-sm mt-2">
          <InfoRow
            label="Amount"
            value={deal.adPriceUSD ? formatUSD(deal.adPriceUSD) : 'TBD'}
          />
          <InfoRow label="Status" value={deal.isPaid ? 'Paid' : 'Not Paid'} />
        </div>
        {!deal.isPaid &&
          isAdvertiser &&
          !['completed', 'cancelled'].includes(deal.status) && (
            <ActionButton
              label={paymentPending ? 'Processing...' : 'Pay Now'}
              color="#8b5cf6"
              onClick={handlePay}
            />
          )}
        {deal.isPaid && deal.status === 'negotiation' && timerText && (
          <div
            className="mt-3 p-2.5 rounded-lg text-xs"
            style={{ backgroundColor: '#ef444415', color: '#ef4444' }}
          >
            <p className="font-medium">⏱ Auto-cancel timer</p>
            <p className="mt-0.5">
              {deal.adParamsConfirmed?.advertiser && deal.adParamsConfirmed?.channel
                ? 'Time until scheduled publication:'
                : 'Deal will auto-cancel if parameters are not confirmed:'}
            </p>
            <p className="font-semibold text-sm mt-1">{timerText}</p>
          </div>
        )}
      </Card>

      {/* Block 4: Content / Creative */}
      <Card className="mb-3">
        <SectionHeader icon="🎨" title="Content" />
        <div className="flex flex-col gap-2 text-sm mt-2">
          <InfoRow
            label="Creative"
            value={deal.creativeData ? 'Added' : 'Not added'}
          />
        </div>
        <ConfirmationRow label="Creative" confirmation={deal.creativeConfirmed} />
        {isAdvertiser &&
          !deal.creativeConfirmed?.advertiser &&
          deal.status === 'negotiation' &&
          deal.creativeData && (
            <ActionButton
              label="Confirm Creative"
              color="#22c55e"
              onClick={() => handleConfirm('creative_confirmed')}
            />
          )}
        {!isAdvertiser &&
          !deal.creativeConfirmed?.channel &&
          deal.status === 'negotiation' &&
          deal.creativeData && (
            <ActionButton
              label="Confirm Creative"
              color="#22c55e"
              onClick={() => handleConfirm('creative_confirmed')}
            />
          )}
      </Card>

      {/* Block 5: Cancel */}
      {canCancel && (
        <Card>
          {showCancelForm ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">Cancel Deal</p>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
              />
              <div className="flex gap-2">
                <ActionButton label="Confirm Cancel" color="#ef4444" onClick={handleCancel} />
                <ActionButton
                  label="Back"
                  color="#94a3b8"
                  onClick={() => setShowCancelForm(false)}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelForm(true)}
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
            >
              Cancel Deal
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

// ---- Helper components ----

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{icon}</span>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="font-medium text-right max-w-[60%] break-all">{value}</span>
    </div>
  );
}

function ConfirmationRow({
  label,
  confirmation,
}: {
  label: string;
  confirmation?: DealConfirmation;
}) {
  if (!confirmation) return null;
  return (
    <div
      className="flex items-center gap-3 mt-2 pt-2 text-xs"
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}:</span>
      <span style={{ color: confirmation.advertiser ? '#22c55e' : '#94a3b8' }}>
        {confirmation.advertiser ? '✓' : '○'} Advertiser
      </span>
      <span style={{ color: confirmation.channel ? '#22c55e' : '#94a3b8' }}>
        {confirmation.channel ? '✓' : '○'} Channel
      </span>
    </div>
  );
}

function ActionButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{ backgroundColor: color, color: '#fff' }}
    >
      {label}
    </button>
  );
}
