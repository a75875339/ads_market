import { create } from 'zustand';

type ToastType = 'error' | 'success' | 'warning';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastStore = {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
};

let nextId = 0;
const TOAST_DURATION_MS = 3000;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'error') => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, TOAST_DURATION_MS);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const showToast = (message: string, type: ToastType = 'error') => {
  useToastStore.getState().addToast(message, type);
};
