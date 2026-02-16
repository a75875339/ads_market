import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Input } from '@telegram-tools/ui-kit';
import {
  getCampaigns,
  getCampaignDeals,
  archiveCampaign,
  updateCampaign,
} from '../../shared/api';
import {
  PageHeader,
  Card,
  StatusBadge,
  EmptyState,
  LoadingScreen,
  Tabs,
  ApplicationRequirementsForm,
} from '../../shared/ui';
import type { ApplicationRequirementsData } from '../../shared/ui';
import {
  formatDate,
  formatUSD,
  formatNumber,
  formatDealStatus,
  getDealStatusColor,
} from '../../shared/lib/format';
import { hapticFeedback } from '../../shared/lib/telegram';
import type { Campaign, Deal, DealStatus } from '../../shared/types';

export function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | DealStatus>('all');
  const [showAppForm, setShowAppForm] = useState(false);
  const [appReqs, setAppReqs] = useState<ApplicationRequirementsData | null>(null);
  const [submittingApps, setSubmittingApps] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const [campaigns, campaignDeals] = await Promise.all([
        getCampaigns(),
        getCampaignDeals(campaignId),
      ]);
      const found = campaigns.find((c) => c.id === campaignId);
      setCampaign(found || null);
      setDeals(campaignDeals);
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleArchive = async () => {
    if (!campaignId || !campaign) return;
    try {
      const updated = await archiveCampaign(campaignId);
      setCampaign(updated);
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to archive campaign:', err);
      hapticFeedback('error');
    }
  };

  const handleToggleApplications = () => {
    if (!campaignId || !campaign) return;
    if (campaign.acceptApplications) {
      // Pause — just disable
      pauseApplications();
    } else {
      // Open the form
      setShowAppForm(true);
    }
  };

  const pauseApplications = async () => {
    if (!campaignId) return;
    try {
      const updated = await updateCampaign(campaignId, {
        acceptApplications: false,
      });
      setCampaign(updated);
      setShowAppForm(false);
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to pause applications:', err);
      hapticFeedback('error');
    }
  };

  const handleSubmitApplications = async () => {
    if (!campaignId || !appReqs) return;
    setSubmittingApps(true);
    try {
      const body: Parameters<typeof updateCampaign>[1] = {
        acceptApplications: true,
      };
      if (appReqs.formatType) body.ApplicationFormatType = appReqs.formatType;
      if (appReqs.categoryId) body.ApplicationCategoryId = appReqs.categoryId;
      if (appReqs.minPrice) body.ApplicationMinPriceUSD = appReqs.minPrice;
      if (appReqs.maxPrice) body.ApplicationMaxPriceUSD = appReqs.maxPrice;
      if (appReqs.minSubscribers) body.ApplicationMinSubscribers = parseInt(appReqs.minSubscribers);
      if (appReqs.maxSubscribers) body.ApplicationMaxSubscribers = parseInt(appReqs.maxSubscribers);
      if (appReqs.minAvgViews) body.ApplicationMinAvgViews = parseInt(appReqs.minAvgViews);
      if (appReqs.maxAvgViews) body.ApplicationMaxAvgViews = parseInt(appReqs.maxAvgViews);

      const updated = await updateCampaign(campaignId, body);
      setCampaign(updated);
      setShowAppForm(false);
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to enable applications:', err);
      hapticFeedback('error');
    } finally {
      setSubmittingApps(false);
    }
  };

  const openEditForm = () => {
    if (!campaign) return;
    setEditTitle(campaign.title);
    setEditDescription(campaign.description ?? '');
    setEditNotes(campaign.notes ?? '');
    setShowEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (!campaignId || !editTitle.trim()) return;
    setSubmittingEdit(true);
    try {
      const updated = await updateCampaign(campaignId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setCampaign(updated);
      setShowEditForm(false);
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to update campaign:', err);
      hapticFeedback('error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const dealStatusTabs: { key: 'all' | DealStatus; label: string; statuses: DealStatus[] }[] = [
    { key: 'all', label: 'All', statuses: [] },
    { key: 'draft', label: 'Draft', statuses: ['draft'] },
    { key: 'draft_application', label: 'Applied', statuses: ['draft_application'] },
    { key: 'negotiation', label: 'In Work', statuses: ['negotiation'] },
    { key: 'scheduled', label: 'Scheduled', statuses: ['scheduled'] },
    { key: 'posted', label: 'Posted', statuses: ['posted'] },
    { key: 'completed', label: 'Completed', statuses: ['completed'] },
    { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
  ];

  const tabsWithCounts = useMemo(
    () =>
      dealStatusTabs.map((tab) => ({
        key: tab.key,
        label: tab.label,
        count: tab.key === 'all' ? deals.length : deals.filter((d) => tab.statuses.includes(d.status)).length,
      })),
    [deals],
  );

  const filteredDeals = useMemo(
    () => {
      if (activeTab === 'all') return deals;
      const tab = dealStatusTabs.find((t) => t.key === activeTab);
      if (!tab) return deals;
      return deals.filter((d) => tab.statuses.includes(d.status));
    },
    [deals, activeTab],
  );

  if (loading) return <LoadingScreen />;
  if (!campaign) return <EmptyState icon="404" title="Campaign not found" />;

  return (
    <div>
      <PageHeader
        title={campaign.title}
        action={
          <StatusBadge
            label={campaign.status === 'active' ? 'Active' : 'Archived'}
            color={campaign.status === 'active' ? '#22c55e' : '#94a3b8'}
          />
        }
      />

      {campaign.description && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          {campaign.description}
        </p>
      )}

      {/* Campaign Info */}
      <Card className="mb-4">
        <div className="flex flex-col gap-2 text-sm">
          <InfoRow label="Created" value={formatDate(campaign.createdAt)} />
          {(campaign.ApplicationMinSubscribers || campaign.ApplicationMaxSubscribers) && (
            <InfoRow
              label="Subscribers"
              value={`${formatNumber(campaign.ApplicationMinSubscribers)} - ${formatNumber(campaign.ApplicationMaxSubscribers)}`}
            />
          )}
          {campaign.acceptApplications && (
            <InfoRow
              label="Applications"
              value="Accepting"
              valueColor="var(--color-primary)"
            />
          )}
          {campaign.notes && <InfoRow label="Notes" value={campaign.notes} />}
        </div>
      </Card>

      {/* Edit Campaign Form */}
      {showEditForm && (
        <Card className="mb-4">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
              Edit Campaign
            </p>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Title *
              </label>
              <Input
                value={editTitle}
                onChange={(v) => setEditTitle(v)}
                placeholder="Campaign title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Campaign description (optional)"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '60px',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Internal notes (optional)"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '60px',
                }}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Button
                  text={submittingEdit ? 'Saving...' : 'Save'}
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim() || submittingEdit}
                />
              </div>
              <div className="flex-1">
                <Button
                  text="Cancel"
                  onClick={() => setShowEditForm(false)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      {campaign.status === 'active' && (
        <>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Button
                text={campaign.acceptApplications ? 'Pause Applications' : 'Accept Applications'}
                onClick={handleToggleApplications}
              />
            </div>
            <div className="flex-1">
              <Button text="Edit" onClick={openEditForm} />
            </div>
            <div className="flex-1">
              <Button text="Archive" onClick={handleArchive} />
            </div>
          </div>

          {showAppForm && !campaign.acceptApplications && (
            <Card className="mb-4">
              <div className="flex flex-col gap-4">
                <ApplicationRequirementsForm
                  value={{
                    formatType: campaign.ApplicationFormatType ?? '',
                    categoryId: campaign.ApplicationCategoryId ?? '',
                    minPrice: campaign.ApplicationMinPriceUSD ?? '',
                    maxPrice: campaign.ApplicationMaxPriceUSD ?? '',
                    minSubscribers: campaign.ApplicationMinSubscribers?.toString() ?? '',
                    maxSubscribers: campaign.ApplicationMaxSubscribers?.toString() ?? '',
                    minAvgViews: campaign.ApplicationMinAvgViews?.toString() ?? '',
                    maxAvgViews: campaign.ApplicationMaxAvgViews?.toString() ?? '',
                  }}
                  onChange={setAppReqs}
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Button
                      text={submittingApps ? 'Saving...' : 'Enable Applications'}
                      onClick={handleSubmitApplications}
                      disabled={submittingApps}
                    />
                  </div>
                  <div className="flex-1">
                    <Button
                      text="Cancel"
                      onClick={() => setShowAppForm(false)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Deals */}
      <div className="mt-4">

        {deals.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No deals yet"
            description="Search the marketplace to find channels for this campaign"
            action={
              <Button
                text="Go to Marketplace"
                onClick={() => navigate('/advertiser/marketplace')}
              />
            }
          />
        ) : (
          <>
            <div className="mb-3">
              <Tabs tabs={tabsWithCounts} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {filteredDeals.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No deals in this status"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    onClick={() => navigate(`/advertiser/deals/${deal.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Deal #{deal.id}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {deal.adPriceUSD ? formatUSD(deal.adPriceUSD) : 'Price TBD'} ·{' '}
                          {formatDate(deal.createdAt)}
                        </p>
                      </div>
                      <StatusBadge
                        label={formatDealStatus(deal.status)}
                        color={getDealStatusColor(deal.status)}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="font-medium" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}
