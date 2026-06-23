import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { fetchBusinesses, type Business } from "../api/businesses";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { responsiveStyles, useResponsive, gridCardWidth } from "../theme/responsive";
import { BusinessCard, EmptyState } from "../components/ui";
import { useExploreSearch } from "../contexts/ExploreSearchContext";

// High-level discovery groups, in display order (mirrors instructions/01_data_model.md categories).
const GROUP_ORDER = ["Snow", "Water", "Bike", "Climb", "Camp", "Vehicles", "E-Transport", "Air/Other"];

export default function EquipmentFeed() {
  const nav = useNavigation<any>();
  const { search } = useExploreSearch();
  const { contentWidth, gridColumns } = useResponsive();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["businesses", search],
    queryFn: () => fetchBusinesses(search ? { search } : {}),
  });

  const businesses: Business[] = data ?? [];

  const grouped = useMemo(() => {
    const map: Record<string, Business[]> = {};
    for (const b of businesses) {
      const groups = b.category_groups.length > 0 ? b.category_groups : ["Air/Other"];
      for (const g of groups) {
        (map[g] ||= []).push(b);
      }
    }
    return map;
  }, [businesses]);

  const orderedGroups = useMemo(() => {
    const present = Object.keys(grouped);
    const known = GROUP_ORDER.filter((g) => present.includes(g));
    const extra = present.filter((g) => !GROUP_ORDER.includes(g)).sort();
    return [...known, ...extra];
  }, [grouped]);

  const cardWidth = gridCardWidth(contentWidth, gridColumns);

  const handlePress = (slug: string) => nav.navigate("BusinessDetail", { slug });

  if (isLoading && businesses.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!isLoading && businesses.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="storefront-outline"
          title={search ? "No matches" : "No rental businesses yet"}
          message={
            search
              ? "Try a different search term."
              : "No rental businesses have been added to the directory yet."
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, responsiveStyles.centeredContent]}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.brand.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {search ? (
        <Text style={styles.resultCount}>
          {businesses.length} {businesses.length === 1 ? "result" : "results"} for “{search}”
        </Text>
      ) : null}

      {orderedGroups.map((group) => (
        <View key={group} style={styles.section}>
          <Text style={styles.sectionTitle}>{group}</Text>
          <View style={[responsiveStyles.grid, styles.grid]}>
            {grouped[group].map((b) => (
              <BusinessCard key={`${group}-${b.id}`} business={b} onPress={handlePress} width={cardWidth} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultCount: { fontSize: 14, color: colors.text.secondary, marginBottom: spacing.md },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: colors.text.primary, marginBottom: spacing.md },
  grid: {},
});
