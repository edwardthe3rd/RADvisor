import { TextStyle } from "react-native";
import { colors } from "./colors";

export const typography: Record<string, TextStyle> = {
  hero: { fontSize: 30, fontWeight: "800", color: colors.text.primary, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: "700", color: colors.text.primary, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: "600", color: colors.text.primary },
  h3: { fontSize: 18, fontWeight: "600", color: colors.text.primary },
  body: { fontSize: 16, fontWeight: "400", color: colors.text.primary, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: "400", color: colors.text.secondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500", color: colors.text.tertiary },
  label: { fontSize: 12, fontWeight: "600", color: colors.text.secondary, letterSpacing: 0.5, textTransform: "uppercase" },
  price: { fontSize: 18, fontWeight: "700", color: colors.text.primary },
  priceSmall: { fontSize: 15, fontWeight: "600", color: colors.text.primary },
};
