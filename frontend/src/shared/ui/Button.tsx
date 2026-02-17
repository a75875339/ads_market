import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({ text, onClick, disabled, className = '', ...rest }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-10 px-4 rounded-xl text-sm font-semibold
        transition-colors duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98] ${className}`}
      style={{
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
      }}
      {...rest}
    >
      {text}
    </button>
  );
}
