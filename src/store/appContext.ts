import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppContextState {
  tenantId: number | null;
  eventId: number | null;
  // setters
  setTenantId: (tenantId: number | null) => void;
  setEventId: (eventId: number | null) => void;
  setFromRoute: (params: { tenantId?: number | string | null; eventId?: number | string | null }) => void;
  // getters
  getContext: () => { tenantId: number | null; eventId: number | null };
  // reset
  reset: () => void;
}

export const useAppContextStore = create<AppContextState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      eventId: null,

      setTenantId: (tenantId) => set({ tenantId: typeof tenantId === 'number' ? tenantId : tenantId === null ? null : Number(tenantId) || null }),
      setEventId: (eventId) => set({ eventId: typeof eventId === 'number' ? eventId : eventId === null ? null : Number(eventId) || null }),

      setFromRoute: ({ tenantId, eventId }) => {
        const next: Partial<AppContextState> = {};
        if (typeof tenantId !== 'undefined') {
          next.tenantId = typeof tenantId === 'number' ? tenantId : tenantId === null ? null : Number(tenantId) || null;
        }
        if (typeof eventId !== 'undefined') {
          next.eventId = typeof eventId === 'number' ? eventId : eventId === null ? null : Number(eventId) || null;
        }
        if (Object.keys(next).length > 0) set(next as Pick<AppContextState, 'tenantId' | 'eventId'>);
      },

      getContext: () => ({ tenantId: get().tenantId, eventId: get().eventId }),

      reset: () => set({ tenantId: null, eventId: null }),
    }),
    {
      name: 'nexpo-app-context',
      partialize: (state) => ({ tenantId: state.tenantId, eventId: state.eventId }),
    }
  )
);

