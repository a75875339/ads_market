import { useEffect, type ReactNode } from 'react';

interface SheetProps {
  sheets: Record<string, () => ReactNode>;
  activeSheet: string;
  opened: boolean;
  onClose: () => void;
}

export function Sheet({ sheets, activeSheet, opened, onClose }: SheetProps) {
  useEffect(() => {
    if (opened) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [opened]);

  const renderContent = sheets[activeSheet];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 transition-all duration-200"
        style={{
          top: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: opened ? 1 : 0,
          pointerEvents: opened ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl overflow-y-auto transition-transform duration-200"
        style={{
          maxHeight: '90vh',
          backgroundColor: 'var(--color-bg-primary, #fff)',
          transform: opened ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div
            className="rounded-full"
            style={{
              width: 36,
              height: 4,
              backgroundColor: 'var(--color-bg-tertiary, #e2e8f0)',
            }}
          />
        </div>
        {renderContent?.()}
      </div>
    </>
  );
}
