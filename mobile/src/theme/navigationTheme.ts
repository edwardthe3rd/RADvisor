import { DefaultTheme } from "@react-navigation/native";
import { colors } from "./colors";

export const navigationTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand.primary,
    background: colors.surface.background,
    card: colors.surface.card,
    text: colors.text.primary,
    border: colors.surface.borderLight,
    notification: colors.brand.tertiary,
  },
};
