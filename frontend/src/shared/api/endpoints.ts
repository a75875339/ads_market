import { api, setAccessToken } from './instance';
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  Deal,
  CreateDealRequest,
  UpdateDealParamsRequest,
  ConfirmDealRequest,
  CancelDealRequest,
  Channel,
  AdFormat,
  CreateAdFormatRequest,
  UpdateAdFormatRequest,
  UpdateWalletRequest,
  UpdateVisibilityRequest,
  UpdateCategoryRequest,
  Category,
  ChannelManager,
  UpdateManagerPermissionsRequest,
  ChannelSearchParams,
  ChannelSearchResponse,
  DealStatus,
  CampaignStatus,
  TonConnectTransaction,
} from '../types';

// ===== Auth =====

export const authTma = async (telegramRawData: string): Promise<void> => {
  const { data } = await api.post<{ accessToken: string }>('/auth/tma', { telegramRawData });
  setAccessToken(data.accessToken);
};

// ===== Categories =====

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/categories');
  return data;
};

// ===== Campaigns =====

export const getCampaigns = async (status?: CampaignStatus): Promise<Campaign[]> => {
  const params = status ? { status } : {};
  const { data } = await api.get('/campaigns', { params });
  return data;
};

export const createCampaign = async (body: CreateCampaignRequest): Promise<Campaign> => {
  const { data } = await api.post('/campaigns', body);
  return data;
};

export const updateCampaign = async (
  campaignId: string,
  body: UpdateCampaignRequest,
): Promise<Campaign> => {
  const { data } = await api.post(`/campaigns/${campaignId}`, body);
  return data;
};

export const archiveCampaign = async (campaignId: string): Promise<Campaign> => {
  const { data } = await api.post(`/campaigns/${campaignId}/archive`);
  return data;
};

// ===== Deals =====

export const searchChannels = async (
  params: ChannelSearchParams,
): Promise<ChannelSearchResponse> => {
  const { data } = await api.post('/campaigns/search/channels', params);
  return data;
};

export const searchCampaigns = async (
  channelId: string,
  limit?: number,
  offset?: number,
): Promise<Campaign[]> => {
  const { data } = await api.get(`/channels/${channelId}/search/campaigns`, {
    params: { limit, offset },
  });
  return data;
};

export const createDeal = async (body: CreateDealRequest): Promise<Deal> => {
  const { data } = await api.post('/deals', body);
  return data;
};

export const getCampaignDeals = async (
  campaignId: string,
  status?: DealStatus,
  limit?: number,
  offset?: number,
): Promise<Deal[]> => {
  const { data } = await api.get(`/deals/campaign/${campaignId}`, {
    params: { status, limit, offset },
  });
  return data;
};

export const getChannelDeals = async (
  channelId: string,
  status?: DealStatus,
  limit?: number,
  offset?: number,
): Promise<Deal[]> => {
  const { data } = await api.get(`/deals/channel/${channelId}`, {
    params: { status, limit, offset },
  });
  return data;
};

export const getDeal = async (dealId: string): Promise<Deal> => {
  const { data } = await api.get(`/deals/${dealId}`);
  return data;
};

export const updateDealParams = async (
  dealId: string,
  body: UpdateDealParamsRequest,
): Promise<Deal> => {
  const { data } = await api.post(`/deals/${dealId}/params`, body);
  return data;
};

export const confirmDeal = async (dealId: string, body: ConfirmDealRequest): Promise<Deal> => {
  const { data } = await api.post(`/deals/${dealId}/confirm`, body);
  return data;
};

export const cancelDeal = async (dealId: string, body: CancelDealRequest): Promise<Deal> => {
  const { data } = await api.post(`/deals/${dealId}/cancel`, body);
  return data;
};

// ===== TON Payments =====

export const getTopupTransaction = async (
  dealId: string,
  walletAddress: string,
): Promise<TonConnectTransaction> => {
  const { data } = await api.get(`/ton/deals/${dealId}/topup-transaction`, {
    params: { walletAddress },
  });
  return data;
};

// ===== Channels =====

export const getChannelAdFormats = async (channelId: string): Promise<AdFormat[]> => {
  const { data } = await api.get(`/channels/${channelId}/ad-formats`);
  return data;
};

export const createAdFormat = async (
  channelId: string,
  body: CreateAdFormatRequest,
): Promise<AdFormat> => {
  const { data } = await api.post(`/channels/${channelId}/ad-formats`, body);
  return data;
};

export const updateAdFormat = async (
  channelId: string,
  formatId: string,
  body: UpdateAdFormatRequest,
): Promise<AdFormat> => {
  const { data } = await api.post(`/channels/${channelId}/ad-formats/${formatId}`, body);
  return data;
};


export const updateChannelWallet = async (
  channelId: string,
  body: UpdateWalletRequest,
): Promise<{ walletAddress: string }> => {
  const { data } = await api.post(`/channels/${channelId}/wallet`, body);
  return data;
};

export const updateChannelCategory = async (
  channelId: string,
  body: UpdateCategoryRequest,
): Promise<{ categoryId: string | null }> => {
  const { data } = await api.post(`/channels/${channelId}/category`, body);
  return data;
};

export const updateChannelVisibility = async (
  channelId: string,
  body: UpdateVisibilityRequest,
): Promise<{ isVisible: boolean }> => {
  const { data } = await api.post(`/channels/${channelId}/visibility`, body);
  return data;
};

// ===== Channel Managers =====

export const getChannelManagers = async (channelId: string): Promise<ChannelManager[]> => {
  const { data } = await api.get(`/channels/${channelId}/managers`);
  return data;
};

export const updateManagerPermissions = async (
  channelId: string,
  userId: string,
  body: UpdateManagerPermissionsRequest,
): Promise<{ ok: boolean }> => {
  const { data } = await api.post(`/channels/${channelId}/managers/${userId}`, body);
  return data;
};

// ===== Channels list (for channel admin) =====

export const getMyChannels = async (): Promise<Channel[]> => {
  const { data } = await api.get('/channels');
  return data;
};

// ===== Single entity getters =====

export const getCampaign = async (campaignId: string): Promise<Campaign> => {
  const { data } = await api.get(`/campaigns/${campaignId}`);
  return data;
};

export const getChannel = async (channelId: string): Promise<Channel> => {
  const { data } = await api.get(`/channels/${channelId}`);
  return data;
};
