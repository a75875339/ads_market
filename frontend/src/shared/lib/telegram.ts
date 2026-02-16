export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

export function expandWebApp() {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.expand();
    webApp.ready();
  }
}

export function showBackButton(callback: () => void) {
  const webApp = getTelegramWebApp();
  if (webApp?.BackButton) {
    webApp.BackButton.show();
    webApp.BackButton.onClick(callback);
  }
}

export function hideBackButton() {
  const webApp = getTelegramWebApp();
  if (webApp?.BackButton) {
    webApp.BackButton.hide();
    webApp.BackButton.offClick(() => {});
  }
}

export function hapticFeedback(type: 'success' | 'error' | 'warning' = 'success') {
  const webApp = getTelegramWebApp();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.notificationOccurred(type);
  }
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
  const webApp = getTelegramWebApp();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.impactOccurred(style);
  }
}

// Type augmentation for window.Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'success' | 'error' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}
