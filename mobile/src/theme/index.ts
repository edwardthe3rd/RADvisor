import { ViewStyle } from "react-native";
import { colors } from "./colors";
import { spacing, radius } from "./spacing";
import { typography } from "./typography";

export const shadow: Record<string, ViewStyle> = {
  sm: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
};

export const theme = { colors, spacing, radius, typography, shadow };
export type Theme = typeof theme;
export { colors, spacing, radius, typography };
