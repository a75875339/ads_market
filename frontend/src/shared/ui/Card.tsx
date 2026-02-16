import cn from 'classnames';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: boolean;
}

export function Card({ children, className, onClick, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl',
        padding && 'p-4',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className,
      )}
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
