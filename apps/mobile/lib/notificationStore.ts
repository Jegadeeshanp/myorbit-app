import { create } from 'zustand';

interface NotificationState {
  pendingTaskId: string | null;
  setPendingTaskId: (id: string) => void;
  clearPendingTaskId: () => void;
}

export const useNotificationStore = create<NotificationState>(set => ({
  pendingTaskId: null,
  setPendingTaskId: id => set({ pendingTaskId: id }),
  clearPendingTaskId: () => set({ pendingTaskId: null }),
}));
