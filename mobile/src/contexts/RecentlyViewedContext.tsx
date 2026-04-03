import React, { createContext, useContext, useState, useCallback } from "react";

interface RecentlyViewedState {
  recentIds: number[];
  addRecent: (id: number) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedState>({
  recentIds: [],
  addRecent: () => {},
});

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [recentIds, setRecentIds] = useState<number[]>([]);

  const addRecent = useCallback((id: number) => {
    setRecentIds((prev) => {
      const filtered = prev.filter((i) => i !== id);
      return [id, ...filtered].slice(0, 20);
    });
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recentIds, addRecent }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);
