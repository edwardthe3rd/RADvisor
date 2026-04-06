import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { HorizontalSection, EmptyState } from "../components/ui";
import { useExploreSearch } from "../contexts/ExploreSearchContext";
import { useRecentlyViewed } from "../contexts/RecentlyViewedContext";

const CATEGORY_GROUPS = [
  { key: "Camp", icon: "bonfire-outline" as const },
  { key: "Dirt", icon: "bicycle-outline" as const },
  { key: "Rock", icon: "triangle-outline" as const },
  { key: "Snow", icon: "snow-outline" as const },
  { key: "Travel", icon: "car-outline" as const },
  { key: "Water", icon: "water-outline" as const },
];

function equipmentSectionKey(item: { category_group?: string }): string | null {
  const g = (item.category_group || "").trim();
  const keys = CATEGORY_GROUPS.map((c) => c.key);
  return keys.includes(g) ? g : null;
}

export default function EquipmentFeed() {
  const nav = useNavigation<any>();
  const { search } = useExploreSearch();
  const { recentIds, addRecent } = useRecentlyViewed();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["all-listings", search],
    queryFn: async () => {
      const params: any = { page_size: 200 };
      if (search) params.search = search;
      const res = await api.get("/listings/", { params });
      return res.data.results ?? res.data;
    },
  });

  const allItems = data ?? [];

  const recentItems = useMemo(() => {
    if (recentIds.length === 0) return [];
    return recentIds
      .map((id) => allItems.find((item: any) => item.id === id))
      .filter(Boolean);
  }, [recentIds, allItems]);

  const popularItems = useMemo(() => {
    return [...allItems]
      .sort((a: any, b: any) => parseFloat(b.daily_rate) - parseFloat(a.daily_rate))
      .slice(0, 10);
  }, [allItems]);

  const categoryItems = useMemo(() => {
    const result: Record<string, any[]> = {};
    for (const g of CATEGORY_GROUPS) result[g.key] = [];

    for (const item of allItems) {
      const key = equipmentSectionKey(item);
      if (key && result[key]) result[key].push(item);
    }
    return result;
  }, [allItems]);

  const handlePress = (id: number) => {
    addRecent(id);
    nav.navigate("ListingDetail", { id });
  };

  if (isLoading && allItems.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!isLoading && allItems.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="cube-outline"
          title="No equipment found"
          message="Try adjusting your search."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {recentItems.length > 0 && (
        <HorizontalSection
          title="Recently Viewed"
          icon="time-outline"
          items={recentItems}
          onItemPress={handlePress}
        />
      )}

      <HorizontalSection
        title="Popular Equipment"
        icon="trending-up-outline"
        items={popularItems}
        onItemPress={handlePress}
      />

      {CATEGORY_GROUPS.map((group) => (
        <HorizontalSection
          key={group.key}
          title={group.key}
          icon={group.icon}
          items={categoryItems[group.key] || []}
          onItemPress={handlePress}
          emptyHint="No gear in this category yet."
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
