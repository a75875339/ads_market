interface ToggleProps {
  isEnabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ isEnabled, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEnabled}
      disabled={disabled}
      onClick={() => onChange(!isEnabled)}
      className="relative shrink-0 cursor-pointer rounded-full transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        width: 51,
        height: 31,
        backgroundColor: isEnabled ? 'var(--color-success, #22c55e)' : 'var(--color-bg-tertiary, #e2e8f0)',
      }}
    >
      <span
        className="block rounded-full bg-white transition-transform duration-200"
        style={{
          width: 27,
          height: 27,
          margin: 2,
          transform: isEnabled ? 'translateX(20px)' : 'translateX(0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}
