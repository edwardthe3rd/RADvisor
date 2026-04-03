import React, { createContext, useContext, useState } from "react";

interface ExploreSearchState {
  search: string;
  setSearch: (text: string) => void;
}

const ExploreSearchContext = createContext<ExploreSearchState>({
  search: "",
  setSearch: () => {},
});

export function ExploreSearchProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  return (
    <ExploreSearchContext.Provider value={{ search, setSearch }}>
      {children}
    </ExploreSearchContext.Provider>
  );
}

export const useExploreSearch = () => useContext(ExploreSearchContext);
