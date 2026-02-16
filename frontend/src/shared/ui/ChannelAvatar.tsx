import cn from 'classnames';

interface ChannelAvatarProps {
  title: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export function ChannelAvatar({ title, avatarUrl, size = 'md', className }: ChannelAvatarProps) {
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={title}
        className={cn('rounded-full object-cover flex-shrink-0', sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizeMap[size],
        className,
      )}
      style={{
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
      }}
    >
      {initials}
    </div>
  );
}
