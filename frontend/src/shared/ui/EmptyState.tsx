import { Text } from '@telegram-tools/ui-kit';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 text-center"
      style={{ minHeight: 'calc(100dvh - 200px)' }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <Text type="title3">{title}</Text>
      {description && (
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
