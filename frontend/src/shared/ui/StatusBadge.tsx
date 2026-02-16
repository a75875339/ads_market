import cn from 'classnames';

interface StatusBadgeProps {
  label: string;
  color: string;
  className?: string;
}

export function StatusBadge({ label, color, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'items-center padding-16 px-2 py-0.5 rounded-full text-xs font-medium',
        className,
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {label}
    </span>
  );
}
