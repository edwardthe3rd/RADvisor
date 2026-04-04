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
import { spacing } from "../theme/spacing";
import { shadow } from "../theme";
import { Button, Avatar } from "../components/ui";
import { StarRating } from "../components/ui/ReviewStars";

const { width: SCREEN_W } = Dimensions.get("window");

export default function GuideServiceDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { id } = route.params;

  const { data: service, isLoading } = useQuery({
    queryKey: ["guide-service", id],
    queryFn: async () => {
      const res = await api.get(`/guide-services/${id}/`);
      return res.data;
    },
  });

  if (isLoading || !service) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {service.photos?.[0]?.image && (
          <Image source={{ uri: service.photos[0].image }} style={styles.cover} />
        )}

        <View style={styles.body}>
          <Text style={styles.title}>{service.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.metaText}>{service.city}, {service.state}</Text>
          </View>

          {service.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating rating={service.avg_rating} count={service.review_count ?? 0} />
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.guideRow}>
            <Avatar
              uri={service.guide_photo}
              name={service.guide_name}
              size="lg"
            />
            <View style={styles.guideInfo}>
              <Text style={styles.guideLabel}>Your Guide</Text>
              <Text style={styles.guideName}>{service.guide_name}</Text>
              {service.guide_profile?.headline ? (
                <Text style={styles.guideBio} numberOfLines={2}>{service.guide_profile.headline}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this experience</Text>
          <Text style={styles.description}>{service.description}</Text>

          {!!service.activity_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Activity</Text>
              <Text style={styles.detailValue}>{service.activity_name}</Text>
            </View>
          )}
          {!!service.max_participants && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max group size</Text>
              <Text style={styles.detailValue}>{service.max_participants} people</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, shadow.md]}>
        <View>
          <Text style={styles.price}>
            ${parseFloat(String(service.price_per_person ?? service.price_per_day ?? 0)).toFixed(0)}{" "}
            <Text style={styles.perDay}>/ person</Text>
          </Text>
        </View>
        <Button
          title="Book Guide"
          onPress={() => nav.navigate("BookGuide", { id: service.id })}
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  cover: { width: SCREEN_W, height: 260 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text.primary, marginBottom: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
  metaText: { fontSize: 14, color: colors.text.secondary },
  ratingRow: { marginBottom: spacing.lg },
  divider: { height: 1, backgroundColor: colors.surface.borderLight, marginVertical: spacing.lg },
  guideRow: { flexDirection: "row", gap: spacing.lg },
  guideInfo: { flex: 1 },
  guideLabel: { fontSize: 12, color: colors.text.tertiary },
  guideName: { fontSize: 18, fontWeight: "700", color: colors.text.primary },
  guideBio: { fontSize: 14, color: colors.text.secondary, marginTop: 4, lineHeight: 20 },
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
