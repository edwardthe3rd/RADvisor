import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { fetchBusiness, type Business } from "../api/businesses";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { responsiveStyles, MAX_CONTENT_WIDTH } from "../theme/responsive";
import { EmptyState } from "../components/ui";

function mapsUrl(b: Business): string {
  if (b.latitude && b.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`;
  }
  const q = encodeURIComponent([b.name, b.address].filter(Boolean).join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function priceLabel(level: number | null): string {
  if (level === null || level === undefined) return "";
  return "$".repeat(Math.max(1, Math.min(4, level + 1)));
}

interface ActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}

function InfoRow({ icon, label, value, onPress }: ActionRowProps) {
  const Wrapper: any = onPress ? Text : View;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.text.secondary} style={styles.infoIcon} />
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Wrapper
          style={[styles.infoValue, onPress ? styles.link : null]}
          onPress={onPress}
          numberOfLines={onPress ? 2 : undefined}
        >
          {value}
        </Wrapper>
      </View>
    </View>
  );
}

export default function BusinessDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const slug: string = route.params?.slug;

  const { data: business, isLoading, isError } = useQuery({
    queryKey: ["business", slug],
    queryFn: () => fetchBusiness(slug),
    enabled: !!slug,
  });

  React.useEffect(() => {
    if (business?.name) nav.setOptions({ title: business.name });
  }, [business?.name, nav]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (isError || !business) {
    return (
      <View style={styles.center}>
        <EmptyState icon="alert-circle-outline" title="Business not found" message="This rental business is no longer available." />
      </View>
    );
  }

  const rating = business.google_rating ? Number(business.google_rating).toFixed(1) : null;
  const location = [business.city, business.state].filter(Boolean).join(", ");
  const price = priceLabel(business.price_level);
  const hours = (business.hours as { weekday?: string[] })?.weekday ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, responsiveStyles.centeredContent]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Ionicons name="storefront" size={48} color={colors.brand.primary} />
      </View>

      <Text style={styles.name}>{business.name}</Text>

      <View style={styles.summaryRow}>
        {rating ? (
          <View style={styles.summaryItem}>
            <Ionicons name="star" size={15} color={colors.brand.tertiary} />
            <Text style={styles.summaryText}>
              {rating}
              {business.google_rating_count > 0 ? ` · ${business.google_rating_count} reviews` : ""}
            </Text>
          </View>
        ) : null}
        {price ? <Text style={styles.summaryText}>{price}</Text> : null}
      </View>

      {business.categories.length > 0 && (
        <View style={styles.chips}>
          {business.categories.map((c) => (
            <View key={c.id} style={styles.chip}>
              <Text style={styles.chipText}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        {business.address ? (
          <InfoRow
            icon="location-outline"
            label={location || "Address"}
            value={business.address}
            onPress={() => Linking.openURL(mapsUrl(business))}
          />
        ) : null}
        {business.phone ? (
          <InfoRow
            icon="call-outline"
            label="Phone"
            value={business.phone}
            onPress={() => Linking.openURL(`tel:${business.phone.replace(/[^0-9+]/g, "")}`)}
          />
        ) : null}
        {business.website ? (
          <InfoRow
            icon="globe-outline"
            label="Website"
            value={business.website.replace(/^https?:\/\//, "")}
            onPress={() => Linking.openURL(business.website)}
          />
        ) : null}
        <InfoRow
          icon="map-outline"
          label="Directions"
          value="Open in Maps"
          onPress={() => Linking.openURL(mapsUrl(business))}
        />
      </View>

      {hours.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hours</Text>
          {hours.map((line, i) => (
            <Text key={i} style={styles.hoursLine}>
              {line}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>
        Info sourced from Google. Contact the business directly to confirm availability and pricing.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: MAX_CONTENT_WIDTH },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.surface.background },
  hero: {
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  name: { fontSize: 24, fontWeight: "800", color: colors.text.primary, marginBottom: spacing.sm },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.md },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  summaryText: { fontSize: 14, fontWeight: "600", color: colors.text.secondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    backgroundColor: colors.surface.muted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text.secondary },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  infoIcon: { marginRight: spacing.md, marginTop: 2 },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.text.tertiary, marginBottom: 2 },
  infoValue: { fontSize: 15, color: colors.text.primary, ...(Platform.OS === "web" ? { wordBreak: "break-word" as any } : null) },
  link: { color: colors.text.link, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text.primary },
  hoursLine: { fontSize: 14, color: colors.text.secondary },
  disclaimer: { fontSize: 12, color: colors.text.tertiary, textAlign: "center", lineHeight: 18 },
});
