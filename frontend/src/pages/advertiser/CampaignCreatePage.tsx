import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Input, Toggle } from '@telegram-tools/ui-kit';
import { createCampaign } from '../../shared/api';
import { PageHeader, ApplicationRequirementsForm } from '../../shared/ui';
import { hapticFeedback } from '../../shared/lib/telegram';
import type { CreateCampaignRequest } from '../../shared/types';
import type { ApplicationRequirementsData } from '../../shared/ui';

export function CampaignCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptApplications, setAcceptApplications] = useState(false);
  const [appReqs, setAppReqs] = useState<ApplicationRequirementsData | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const body: CreateCampaignRequest = {
        title: title.trim(),
      };
      if (description.trim()) body.description = description.trim();
      if (acceptApplications && appReqs) {
        body.acceptApplications = true;
        if (appReqs.formatType) body.ApplicationFormatType = appReqs.formatType;
        if (appReqs.categoryId) body.ApplicationCategoryId = appReqs.categoryId;
        if (appReqs.minPrice) body.ApplicationMinPriceUSD = appReqs.minPrice;
        if (appReqs.maxPrice) body.ApplicationMaxPriceUSD = appReqs.maxPrice;
        if (appReqs.minSubscribers) body.ApplicationMinSubscribers = parseInt(appReqs.minSubscribers);
        if (appReqs.maxSubscribers) body.ApplicationMaxSubscribers = parseInt(appReqs.maxSubscribers);
        if (appReqs.minAvgViews) body.ApplicationMinAvgViews = parseInt(appReqs.minAvgViews);
        if (appReqs.maxAvgViews) body.ApplicationMaxAvgViews = parseInt(appReqs.maxAvgViews);
      }
      if (notes.trim()) body.notes = notes.trim();

      const campaign = await createCampaign(body);
      hapticFeedback('success');
      navigate(`/advertiser/campaigns/${campaign.id}`, { replace: true });
    } catch (err) {
      console.error('Failed to create campaign:', err);
      hapticFeedback('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="New Campaign" subtitle="Set up your advertising campaign" />

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Campaign Title *
          </label>
          <Input
            value={title}
            onChange={(value) => setTitle(value)}
            placeholder="Enter campaign title"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Campaign description (optional)"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium">Accept Applications</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Allow channels to apply to this campaign
            </p>
          </div>
          <Toggle isEnabled={acceptApplications} onChange={setAcceptApplications} />
        </div>

        {acceptApplications && (
          <ApplicationRequirementsForm onChange={setAppReqs} />
        )}

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Notes
          </label>
          <Input
            value={notes}
            onChange={(value) => setNotes(value)}
            placeholder="Internal notes (optional)"
          />
        </div>

        <div className="mt-2">
          <Button
            text={submitting ? 'Creating...' : 'Create Campaign'}
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
          />
        </div>
      </div>
    </div>
  );
}
