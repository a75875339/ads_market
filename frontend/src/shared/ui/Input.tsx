interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  className = '',
}: InputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      className={`w-full rounded-lg px-3 py-2 text-sm outline-none
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        color: 'var(--color-text-primary)',
        border: 'none',
      }}
    />
  );
}
