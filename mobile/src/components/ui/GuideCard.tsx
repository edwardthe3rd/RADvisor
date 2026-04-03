import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { shadow } from "../../theme";
import Avatar from "./Avatar";

interface GuideCardProps {
  id: number;
  title: string;
  description: string;
  price_per_day: string;
  city: string;
  state: string;
  cover_image?: string | null;
  guide_name: string;
  guide_photo?: string | null;
  avg_rating?: number;
  review_count?: number;
  onPress: () => void;
}

export default function GuideCard({
  title,
  description,
  price_per_day,
  city,
  state,
  cover_image,
  guide_name,
  guide_photo,
  avg_rating,
  review_count = 0,
  onPress,
}: GuideCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, shadow.sm]}>
      {cover_image && (
        <Image source={{ uri: cover_image }} style={styles.cover} />
      )}
      <View style={styles.body}>
        <View style={styles.guideRow}>
          <Avatar uri={guide_photo} name={guide_name} size="sm" />
          <Text style={styles.guideName}>{guide_name}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{description}</Text>
        <View style={styles.footer}>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={13} color={colors.text.secondary} />
            {" "}{city}, {state}
          </Text>
          <View style={styles.ratingRow}>
            {avg_rating != null && avg_rating > 0 && (
              <>
                <Ionicons name="star" size={13} color={colors.brand.tertiary} />
                <Text style={styles.ratingText}>
                  {avg_rating.toFixed(1)} ({review_count})
                </Text>
              </>
            )}
          </View>
        </View>
        <Text style={styles.price}>
          ${parseFloat(price_per_day).toFixed(0)}{" "}
          <Text style={styles.perDay}>/ day</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  cover: { width: "100%", height: 160 },
  body: { padding: spacing.lg },
  guideRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  guideName: { fontSize: 13, fontWeight: "600", color: colors.text.secondary },
  title: { fontSize: 17, fontWeight: "700", color: colors.text.primary, marginBottom: 4 },
  desc: { fontSize: 14, color: colors.text.secondary, lineHeight: 20, marginBottom: spacing.md },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  location: { fontSize: 13, color: colors.text.secondary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontWeight: "500", color: colors.text.primary },
  price: { fontSize: 16, fontWeight: "700", color: colors.text.primary },
  perDay: { fontWeight: "400", color: colors.text.secondary, fontSize: 14 },
});
