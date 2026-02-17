import { useState, useEffect } from 'react';
import { Input } from './Input';
import { getCategories } from '../api';
import type { Category, AdFormatType } from '../types';

const FORMAT_OPTIONS: { value: AdFormatType; label: string }[] = [
  { value: '1/1', label: 'Test 1/1h' },
  { value: '1/24', label: '1/24h' },
  { value: '2/48', label: '2/48h' },
  { value: '3/72', label: '3/72h' },
  { value: 'repost', label: 'Repost' },
  { value: 'no_removal', label: 'No Removal' },
];

export type ApplicationRequirementsData = {
  formatType: AdFormatType | '';
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  minSubscribers: string;
  maxSubscribers: string;
  minAvgViews: string;
  maxAvgViews: string;
};

const EMPTY_DATA: ApplicationRequirementsData = {
  formatType: '',
  categoryId: '',
  minPrice: '',
  maxPrice: '',
  minSubscribers: '',
  maxSubscribers: '',
  minAvgViews: '',
  maxAvgViews: '',
};

type ApplicationRequirementsFormProps = {
  value?: Partial<ApplicationRequirementsData>;
  onChange: (data: ApplicationRequirementsData) => void;
};

export function ApplicationRequirementsForm({
  value,
  onChange,
}: ApplicationRequirementsFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<ApplicationRequirementsData>({
    ...EMPTY_DATA,
    ...value,
  });

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const update = (patch: Partial<ApplicationRequirementsData>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange(next);
  };

  return (
    <>
      <div
        className="h-px"
        style={{ backgroundColor: 'var(--color-border)' }}
      />
      <p
        className="text-xs font-semibold uppercase"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Application Requirements
      </p>

      <div>
        <label
          className="block text-xs font-medium mb-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Ad Format
        </label>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                update({
                  formatType: data.formatType === opt.value ? '' : opt.value,
                })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor:
                  data.formatType === opt.value
                    ? 'var(--color-primary)'
                    : 'var(--color-bg-tertiary)',
                color:
                  data.formatType === opt.value
                    ? '#fff'
                    : 'var(--color-text-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          className="block text-xs font-medium mb-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                update({
                  categoryId: data.categoryId === cat.id ? '' : cat.id,
                })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor:
                  data.categoryId === cat.id
                    ? 'var(--color-primary)'
                    : 'var(--color-bg-tertiary)',
                color:
                  data.categoryId === cat.id
                    ? '#fff'
                    : 'var(--color-text-secondary)',
              }}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Min Price (USD)
          </label>
          <Input
            value={data.minPrice}
            onChange={(v) => update({ minPrice: v })}
            placeholder="0.00"
            type="number"
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Max Price (USD)
          </label>
          <Input
            value={data.maxPrice}
            onChange={(v) => update({ maxPrice: v })}
            placeholder="0.00"
            type="number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Min Subscribers
          </label>
          <Input
            value={data.minSubscribers}
            onChange={(v) => update({ minSubscribers: v })}
            placeholder="0"
            type="number"
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Max Subscribers
          </label>
          <Input
            value={data.maxSubscribers}
            onChange={(v) => update({ maxSubscribers: v })}
            placeholder="0"
            type="number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Min Avg Views
          </label>
          <Input
            value={data.minAvgViews}
            onChange={(v) => update({ minAvgViews: v })}
            placeholder="0"
            type="number"
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Max Avg Views
          </label>
          <Input
            value={data.maxAvgViews}
            onChange={(v) => update({ maxAvgViews: v })}
            placeholder="0"
            type="number"
          />
        </div>
      </div>
    </>
  );
}
