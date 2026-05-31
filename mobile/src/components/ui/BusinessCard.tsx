import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import type { Business } from "../../api/businesses";

interface BusinessCardProps {
  business: Business;
  onPress: (slug: string) => void;
  /** Optional fixed width for grid/rail layouts. */
  width?: number;
}

function priceLabel(level: number | null): string {
  if (level === null || level === undefined) return "";
  return "$".repeat(Math.max(1, Math.min(4, level + 1)));
}

export default function BusinessCard({ business, onPress, width }: BusinessCardProps) {
  const rating = business.google_rating ? Number(business.google_rating).toFixed(1) : null;
  const location = [business.city, business.state].filter(Boolean).join(", ");
  const groups = business.category_groups.slice(0, 3);
  const price = priceLabel(business.price_level);

  return (
    <Pressable
      style={[styles.card, width ? { width } : null]}
      onPress={() => onPress(business.slug)}
      accessibilityRole="button"
      accessibilityLabel={`View ${business.name}`}
    >
      <View style={styles.banner}>
        <Ionicons name="storefront-outline" size={28} color={colors.brand.primary} />
        {groups.length > 0 && (
          <View style={styles.bannerChips}>
            {groups.map((g) => (
              <View key={g} style={styles.bannerChip}>
                <Text style={styles.bannerChipText}>{g}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {business.name}
        </Text>

        <View style={styles.metaRow}>
          {rating ? (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={13} color={colors.brand.tertiary} />
              <Text style={styles.metaText}>
                {rating}
                {business.google_rating_count > 0 ? ` (${business.google_rating_count})` : ""}
              </Text>
            </View>
          ) : (
            <Text style={styles.metaMuted}>New</Text>
          )}
          {price ? <Text style={styles.metaText}>{price}</Text> : null}
        </View>

        {location ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.text.tertiary} />
            <Text style={styles.metaMuted} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    overflow: "hidden",
  },
  banner: {
    height: 96,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  bannerChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm, justifyContent: "center" },
  bannerChip: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bannerChipText: { fontSize: 11, fontWeight: "600", color: colors.brand.primaryDark },
  body: { padding: spacing.md, gap: spacing.xs },
  name: { fontSize: 15, fontWeight: "700", color: colors.text.primary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  metaItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { fontSize: 13, fontWeight: "600", color: colors.text.secondary },
  metaMuted: { fontSize: 13, color: colors.text.tertiary, flexShrink: 1 },
});
