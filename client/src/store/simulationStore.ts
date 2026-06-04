import { create } from 'zustand';
import type { SimulationState, Display, Ad } from '../types';
import { addMilliseconds } from 'date-fns';

export const useSimulationStore = create<SimulationState>((set) => ({
    currentTime: new Date(new Date().setHours(7, 30, 0, 0)), // Start at 07:30
    isPlaying: true,
    playbackSpeed: 3,
    displays: [],
    activeAd: null,

    setFiles: (displays: Display[]) => set({ displays }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setSpeed: (speed: number) => set({ playbackSpeed: speed }),
    updateTime: (ms: number) => set((state) => ({
        currentTime: addMilliseconds(state.currentTime, ms)
    })),
    setActiveAd: (ad: Ad | null) => set({ activeAd: ad }),
    setTime: (date: Date) => set({ currentTime: date }),
}));
