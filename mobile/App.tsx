import React from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./src/contexts/AuthContext";
import { RecentlyViewedProvider } from "./src/contexts/RecentlyViewedContext";
import RootNavigator from "./src/navigation/RootNavigator";

// Web-only polish: full-height root, smooth fonts, pointer cursors and subtle
// hover feedback so the React Native UI feels like a real website.
if (Platform.OS === "web" && typeof document !== "undefined") {
  const STYLE_ID = "radvisor-web-globals";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html, body, #root { height: 100%; }
      body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      [role="button"], button, a { cursor: pointer; }
      [role="button"]:hover { filter: brightness(0.97); }
      input, textarea { outline: none; }
    `;
    document.head.appendChild(style);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RecentlyViewedProvider>
            <RootNavigator />
          </RecentlyViewedProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
