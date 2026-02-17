const sizeMap = {
  s: 16,
  m: 24,
  l: 32,
};

interface SpinnerProps {
  size?: 's' | 'm' | 'l';
  color?: string;
}

export function Spinner({ size = 'm', color }: SpinnerProps) {
  const px = sizeMap[size];

  return (
    <span
      className="inline-block rounded-full animate-spin"
      style={{
        width: px,
        height: px,
        border: `2px solid ${color ?? 'var(--color-primary, #3b82f6)'}`,
        borderBottomColor: 'transparent',
      }}
    />
  );
}
