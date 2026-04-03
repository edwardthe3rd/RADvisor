import React from "react";
import { View, Image, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

type Size = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: Size;
  style?: ViewStyle;
}

const sizeMap: Record<Size, number> = { sm: 32, md: 44, lg: 64, xl: 96 };
const fontMap: Record<Size, number> = { sm: 13, md: 16, lg: 24, xl: 36 };

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ uri, name, size = "md", style }: AvatarProps) {
  const dim = sizeMap[size];
  const fs = fontMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: dim, height: dim, borderRadius: dim / 2 }, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: dim, height: dim, borderRadius: dim / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: fs }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: colors.brand.primary,
    fontWeight: "700",
  },
});
