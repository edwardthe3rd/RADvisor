import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

function normalizeBase(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Host running Metro (same machine as Django in local dev). */
function devHostFromExpo(): string | null {
  const raw =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (!raw) return null;
  const host = String(raw).split(":")[0]?.trim();
  if (!host) return null;
  return host;
}

/**
 * In dev, `EXPO_PUBLIC_API_BASE_URL=auto` (or unset) uses the same LAN host as Metro → Django on :8000.
 * Set an explicit URL to override.
 */
export function resolveApiBase(): string {
  const rawEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";
  const wantsAuto = !rawEnv || rawEnv.toLowerCase() === "auto";

  if (__DEV__ && wantsAuto) {
    const host = devHostFromExpo();
    if (host) return normalizeBase(`http://${host}:8000/api/v1`);
  }

  if (rawEnv && rawEnv.toLowerCase() !== "auto") {
    return normalizeBase(rawEnv);
  }

  return normalizeBase("http://localhost:8000/api/v1");
}

const API_BASE = resolveApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await AsyncStorage.getItem("refresh_token");
        if (refresh) {
          const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh });
          await AsyncStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        }
      } catch {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
