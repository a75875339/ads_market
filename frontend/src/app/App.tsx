import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from '@telegram-tools/ui-kit';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useAuthStore } from '../shared/stores';
import { authTma, setTelegramRawData, setLoginComplete } from '../shared/api';
import { getTelegramInitData, expandWebApp } from '../shared/lib/telegram';
import { Layout } from './Layout';

// Advertiser pages
import { CampaignsPage } from '../pages/advertiser/CampaignsPage';
import { CampaignDetailPage } from '../pages/advertiser/CampaignDetailPage';
import { CampaignCreatePage } from '../pages/advertiser/CampaignCreatePage';
import { MarketplacePage } from '../pages/advertiser/MarketplacePage';
import { AdvertiserDealsPage } from '../pages/advertiser/AdvertiserDealsPage';
import { DealDetailPage } from '../pages/advertiser/DealDetailPage';
import { CreateDealPage } from '../pages/advertiser/CreateDealPage';

// Channel admin pages
import { ChannelListPage } from '../pages/channel/ChannelListPage';
import { ChannelDashboardPage } from '../pages/channel/ChannelDashboardPage';
import { AdFormatsPage } from '../pages/channel/AdFormatsPage';
import { ChannelDealsPage } from '../pages/channel/ChannelDealsPage';
import { ChannelSettingsPage } from '../pages/channel/ChannelSettingsPage';
import { ChannelManagersPage } from '../pages/channel/ChannelManagersPage';
import { ChannelApplicationsPage } from '../pages/channel/ChannelApplicationsPage';

import { LoadingScreen, ToastContainer } from '../shared/ui';

function AuthErrorPage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-6 text-center">
      <div className="text-6xl mb-4">Oops!</div>
      <h1 className="text-xl font-semibold mb-2">Authorization Failed</h1>
      <p className="text-secondary text-sm max-w-xs">
        {message}
      </p>
      <p className="text-secondary text-xs mt-4">
        Please open this app from Telegram.
      </p>
    </div>
  );
}

export function App() {
  const { isLoading, isAuthenticated, setUser, setLoading, setAuthenticated, setAuthError, authError, role } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        expandWebApp();
        const initData = getTelegramInitData();

        if (initData) {
          setTelegramRawData(initData);
          await authTma(initData);
          setLoginComplete(true);

          const webApp = window.Telegram?.WebApp;
          if (webApp?.initDataUnsafe?.user) {
            const tgUser = webApp.initDataUnsafe.user;
            setUser({
              id: String(tgUser.id),
              telegramId: String(tgUser.id),
              firstName: tgUser.first_name,
              lastName: tgUser.last_name || null,
              username: tgUser.username || null,
              avatarUrl: tgUser.photo_url || null,
              language: tgUser.language_code || 'en',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          setAuthenticated(true);
        } else {
          setAuthError('Telegram data is not available. This app can only be used inside Telegram.');
        }
      } catch (err) {
        console.error('Auth failed:', err);
        setAuthError('Could not authorize your account. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [setUser, setLoading, setAuthenticated, setAuthError]);

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center h-screen">
          <LoadingScreen />
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <AuthErrorPage message={authError || 'Unable to authorize user.'} />
      </ThemeProvider>
    );
  }

  const manifestUrl = `https://acdbb6eb0cb9front4.ngrok.app/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
    <ThemeProvider>
      <ToastContainer />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Advertiser routes */}
            <Route path="/advertiser/campaigns" element={<CampaignsPage />} />
            <Route path="/advertiser/campaigns/new" element={<CampaignCreatePage />} />
            <Route path="/advertiser/campaigns/:campaignId" element={<CampaignDetailPage />} />
            <Route path="/advertiser/marketplace" element={<MarketplacePage />} />
            <Route path="/advertiser/deals" element={<AdvertiserDealsPage />} />
            <Route path="/advertiser/deals/new" element={<CreateDealPage />} />
            <Route path="/advertiser/deals/:dealId" element={<DealDetailPage />} />

            {/* Channel admin routes */}
            <Route path="/channel/list" element={<ChannelListPage />} />
            <Route path="/channel/:channelId" element={<ChannelDashboardPage />} />
            <Route path="/channel/:channelId/formats" element={<AdFormatsPage />} />
            <Route path="/channel/:channelId/deals" element={<ChannelDealsPage />} />
            <Route path="/channel/:channelId/settings" element={<ChannelSettingsPage />} />
            <Route path="/channel/:channelId/managers" element={<ChannelManagersPage />} />
            <Route path="/channel/deals" element={<ChannelDealsPage />} />
            <Route path="/channel/deals/:dealId" element={<DealDetailPage />} />
            <Route path="/channel/applications" element={<ChannelApplicationsPage />} />

            {/* Default redirect */}
            <Route
              path="*"
              element={
                <Navigate
                  to={role === 'advertiser' ? '/advertiser/campaigns' : '/channel/list'}
                  replace
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </TonConnectUIProvider>
  );
}
