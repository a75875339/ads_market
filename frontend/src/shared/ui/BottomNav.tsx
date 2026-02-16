import { useLocation, useNavigate } from 'react-router';
import cn from 'classnames';
import { useAuthStore } from '../stores';
import { hapticImpact } from '../lib/telegram';
import type { AppRole } from '../types';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  switchRole?: AppRole;
}

const advertiserNavItems: NavItem[] = [
  { path: '/advertiser/campaigns', label: 'Campaigns', icon: '📋' },
  { path: '/advertiser/marketplace', label: 'Marketplace', icon: '🔍' },
  { path: '/channel/list', label: 'My Channels', icon: '📺', switchRole: 'channel_admin' },
];

const channelNavItems: NavItem[] = [
  { path: '/channel/list', label: 'Channels', icon: '📺' },
  { path: '/advertiser/campaigns', label: 'Advertise', icon: '📋', switchRole: 'advertiser' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useAuthStore();

  const items = role === 'advertiser' ? advertiserNavItems : channelNavItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-stretch border-t z-50"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'var(--safe-area-inset-bottom)',
        height: `calc(60px + var(--safe-area-inset-bottom))`,
      }}
    >
      {items.map((item) => {
        const isActive = !item.switchRole && location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path + (item.switchRole ?? '')}
            onClick={() => {
              hapticImpact(item.switchRole ? 'medium' : 'light');
              if (item.switchRole) {
                setRole(item.switchRole);
              }
              navigate(item.path);
            }}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              isActive ? 'opacity-100' : 'opacity-50',
            )}
            style={{
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
