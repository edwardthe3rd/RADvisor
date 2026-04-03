import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { shadow } from "../theme";
import { Button, Avatar, Card } from "../components/ui";
import { StarRating } from "../components/ui/ReviewStars";

const { width: SCREEN_W } = Dimensions.get("window");

export default function ListingDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { id } = route.params;

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const res = await api.get(`/equipment/listings/${id}/`);
      return res.data;
    },
  });

  if (isLoading || !listing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  const images = listing.images || [];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
        >
          {images.map((img: any, i: number) => (
            <Image key={i} source={{ uri: img.image }} style={styles.heroImage} />
          ))}
          {images.length === 0 && (
            <View style={[styles.heroImage, styles.placeholder]}>
              <Ionicons name="image-outline" size={48} color={colors.text.tertiary} />
            </View>
          )}
        </ScrollView>

        <View style={styles.body}>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.metaText}>
              {listing.city}, {listing.state}
            </Text>
          </View>

          {listing.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating rating={listing.avg_rating} count={listing.review_count} />
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.ownerRow}>
            <Avatar
              uri={listing.owner_profile_photo}
              name={listing.owner_display_name || listing.owner_username}
              size="md"
            />
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerLabel}>Listed by</Text>
              <Text style={styles.ownerName}>
                {listing.owner_display_name || listing.owner_username}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          {listing.category_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{listing.category_name}</Text>
            </View>
          )}
          {listing.condition_display && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition</Text>
              <Text style={styles.detailValue}>{listing.condition_display}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, shadow.md]}>
        <View>
          <Text style={styles.price}>
            ${parseFloat(listing.price_per_day).toFixed(0)}{" "}
            <Text style={styles.perDay}>/ day</Text>
          </Text>
        </View>
        <Button
          title="Book Now"
          onPress={() => nav.navigate("BookEquipment", { id: listing.id })}
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  carousel: { height: 300 },
  heroImage: { width: SCREEN_W, height: 300 },
  placeholder: {
    backgroundColor: colors.surface.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text.primary, marginBottom: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
  metaText: { fontSize: 14, color: colors.text.secondary },
  ratingRow: { marginBottom: spacing.lg },
  divider: { height: 1, backgroundColor: colors.surface.borderLight, marginVertical: spacing.lg },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  ownerInfo: { flex: 1 },
  ownerLabel: { fontSize: 12, color: colors.text.tertiary },
  ownerName: { fontSize: 16, fontWeight: "600", color: colors.text.primary },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text.primary, marginBottom: spacing.sm },
  description: { fontSize: 15, color: colors.text.secondary, lineHeight: 22, marginBottom: spacing.lg },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.borderLight,
  },
  detailLabel: { fontSize: 14, color: colors.text.secondary },
  detailValue: { fontSize: 14, fontWeight: "600", color: colors.text.primary },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surface.borderLight,
  },
  price: { fontSize: 20, fontWeight: "800", color: colors.text.primary },
  perDay: { fontSize: 14, fontWeight: "400", color: colors.text.secondary },
});
