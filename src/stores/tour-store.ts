import { create } from "zustand";

interface TourState {
  isActive: boolean;
  hasSeenTour: boolean;
  startTour: () => void;
  endTour: () => void;
  setHasSeenTour: (seen: boolean) => void;
}

export const useTourStore = create<TourState>((set) => ({
  isActive: false,
  hasSeenTour:
    typeof window !== "undefined"
      ? localStorage.getItem("hasSeenTour") === "true"
      : false,
  startTour: () => set({ isActive: true }),
  endTour: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenTour", "true");
    }
    set({ isActive: false, hasSeenTour: true });
  },
  setHasSeenTour: (seen) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenTour", String(seen));
    }
    set({ hasSeenTour: seen });
  },
}));
