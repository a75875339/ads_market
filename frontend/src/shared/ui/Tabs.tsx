type Tab<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

type TabsProps<T extends string> = {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
};

export function Tabs<T extends string>({ tabs, activeTab, onTabChange }: TabsProps<T>) {
  return (
    <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-1.5 whitespace-nowrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`inline-flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border cursor-pointer transition-all duration-150 active:scale-[0.96] ${
                isActive
                  ? 'bg-(--color-primary) text-white border-(--color-primary)'
                  : 'bg-(--color-bg-primary) text-(--color-text-secondary) border-(--color-border)'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full text-[11px] font-semibold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-black/8 text-(--color-text-secondary)'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
