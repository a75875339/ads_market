import { create } from 'zustand';
import type { Channel } from '../types';

interface ChannelState {
  channels: Channel[];
  selectedChannel: Channel | null;
  isLoading: boolean;
  setChannels: (channels: Channel[]) => void;
  selectChannel: (channel: Channel | null) => void;
  setLoading: (loading: boolean) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  selectedChannel: null,
  isLoading: false,
  setChannels: (channels) => set({ channels }),
  selectChannel: (selectedChannel) => set({ selectedChannel }),
  setLoading: (isLoading) => set({ isLoading }),
  updateChannel: (id, updates) =>
    set((state) => ({
      channels: state.channels.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch)),
      selectedChannel:
        state.selectedChannel?.id === id
          ? { ...state.selectedChannel, ...updates }
          : state.selectedChannel,
    })),
}));
