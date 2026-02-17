import type { ReactNode } from 'react';

const typeStyles: Record<string, string> = {
  largeTitle: 'text-[34px] leading-[41px] font-bold',
  title1: 'text-[28px] leading-[34px] font-bold',
  title2: 'text-[24px] leading-[30px] font-bold',
  title3: 'text-[22px] leading-[28px] font-semibold',
  title4: 'text-[20px] leading-[24px] font-semibold',
  body: 'text-[17px] leading-[22px]',
  callout: 'text-[16px] leading-[22px]',
  subheadline1: 'text-[15px] leading-[20px]',
  subheadline2: 'text-[14px] leading-[18px]',
  footnote: 'text-[13px] leading-[18px]',
  caption1: 'text-[12px] leading-[16px]',
  caption2: 'text-[11px] leading-[13px]',
};

interface TextProps {
  type?: string;
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  children: ReactNode;
  className?: string;
}

export function Text({ type = 'body', weight, color, children, className = '' }: TextProps) {
  const typeClass = typeStyles[type] ?? typeStyles.body;
  const weightClass = weight ? `font-${weight}` : '';

  const colorMap: Record<string, string> = {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    tertiary: 'var(--color-text-tertiary)',
    accent: 'var(--color-primary)',
  };

  return (
    <span
      className={`block ${typeClass} ${weightClass} ${className}`}
      style={color ? { color: colorMap[color] } : undefined}
    >
      {children}
    </span>
  );
}
