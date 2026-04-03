import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.lg) / 2;

interface ListingCardProps {
  id: number;
  title: string;
  brand?: string;
  daily_rate?: string;
  price_per_day?: string;
  city?: string;
  state?: string;
  photos?: { id: number; image: string }[];
  images?: { id: number; image: string }[];
  image_url?: string;
  avg_rating?: number;
  onPress: () => void;
  onWishlist?: () => void;
  wishlisted?: boolean;
  fullWidth?: boolean;
}

export default function ListingCard({
  title,
  brand,
  daily_rate,
  price_per_day,
  photos,
  images,
  image_url,
  avg_rating,
  onPress,
  onWishlist,
  wishlisted = false,
  fullWidth = false,
}: ListingCardProps) {
  const cardW = fullWidth ? SCREEN_WIDTH - spacing.xl * 2 : CARD_WIDTH;
  const imgH = fullWidth ? 200 : 140;
  const allImages = photos || images || [];
  const imageUri = allImages[0]?.image || image_url || "https://via.placeholder.com/300";
  const displayRate = daily_rate || price_per_day || "0";

  const model = brand && title.startsWith(brand) ? title.slice(brand.length).trim() : title;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, { width: cardW }]}
    >
      <View style={[styles.imageWrap, { height: imgH }]}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
        />
        {onWishlist && (
          <TouchableOpacity style={styles.heart} onPress={onWishlist} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={wishlisted ? "heart" : "heart-outline"}
              size={22}
              color={wishlisted ? colors.brand.primary : colors.text.inverse}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          {brand ? (
            <Text style={styles.brandText} numberOfLines={1}>{brand}</Text>
          ) : (
            <Text style={styles.brandText} numberOfLines={1}>{title}</Text>
          )}
          {avg_rating != null && avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.text.primary} />
              <Text style={styles.ratingText}>{avg_rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.model} numberOfLines={1}>{brand ? model : ""}</Text>
        <Text style={styles.price}>
          ${parseFloat(displayRate).toFixed(0)}{" "}
          <Text style={styles.perDay}>/ day</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.xl },
  imageWrap: { borderRadius: radius.lg, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  heart: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 99,
    padding: 4,
  },
  info: { marginTop: spacing.sm },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandText: { fontSize: 14, fontWeight: "700", color: colors.text.primary, flex: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontWeight: "500", color: colors.text.primary },
  model: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", color: colors.text.primary, marginTop: 4 },
  perDay: { fontWeight: "400", color: colors.text.secondary },
});
