import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { shadow } from "../theme";
import { Card, EmptyState } from "../components/ui";
import { StatusBadge } from "../components/ui/Badge";

type TabType = "equipment" | "guiding";

export default function MyTripsScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabType>("equipment");

  const { data: equipBookings, isLoading: eLoading, refetch: eRefetch } = useQuery({
    queryKey: ["my-equipment-bookings"],
    queryFn: async () => {
      const res = await api.get("/bookings/");
      return res.data.results ?? res.data;
    },
  });

  const { data: guideBookings, isLoading: gLoading, refetch: gRefetch } = useQuery({
    queryKey: ["my-guide-bookings"],
    queryFn: async () => {
      const res = await api.get("/guide-bookings/");
      return res.data.results ?? res.data;
    },
  });

  const bookings = tab === "equipment" ? (equipBookings ?? []) : (guideBookings ?? []);
  const isLoading = tab === "equipment" ? eLoading : gLoading;
  const refetch = tab === "equipment" ? eRefetch : gRefetch;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>My Trips</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "equipment" && styles.tabActive]}
          onPress={() => setTab("equipment")}
        >
          <Text style={[styles.tabText, tab === "equipment" && styles.tabTextActive]}>
            Equipment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "guiding" && styles.tabActive]}
          onPress={() => setTab("guiding")}
        >
          <Text style={[styles.tabText, tab === "guiding" && styles.tabTextActive]}>
            Guide Trips
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={({ item }: { item: any }) => (
          <Card elevated style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingTitle} numberOfLines={1}>
                {item.listing_title || item.service_title || "Booking"}
              </Text>
              <StatusBadge status={item.status || "pending"} />
            </View>
            <View style={styles.bookingDates}>
              <Text style={styles.dateText}>
                {item.start_date} → {item.end_date}
              </Text>
            </View>
            {item.total_price && (
              <Text style={styles.bookingTotal}>
                Total: ${parseFloat(item.total_price).toFixed(0)}
              </Text>
            )}
          </Card>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="calendar-outline"
              title="No trips yet"
              message="Your equipment rentals and guide bookings will appear here."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface.muted,
  },
  tabActive: { backgroundColor: colors.text.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.text.secondary },
  tabTextActive: { color: colors.text.inverse },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  bookingCard: { marginBottom: spacing.md },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  bookingTitle: { fontSize: 16, fontWeight: "700", color: colors.text.primary, flex: 1, marginRight: spacing.sm },
  bookingDates: { marginBottom: spacing.xs },
  dateText: { fontSize: 14, color: colors.text.secondary },
  bookingTotal: { fontSize: 15, fontWeight: "600", color: colors.text.primary, marginTop: spacing.xs },
});
