import React from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { responsiveStyles, useResponsive, gridCardWidth } from "../theme/responsive";
import { GuideCard, EmptyState } from "../components/ui";
import { useExploreSearch } from "../contexts/ExploreSearchContext";

/** Guide cards are content-rich, so use fewer columns than gear cards. */
function guideColumns(device: "phone" | "tablet" | "desktop"): number {
  if (device === "desktop") return 3;
  if (device === "tablet") return 2;
  return 1;
}

export default function GuidingFeed() {
  const nav = useNavigation<any>();
  const { search } = useExploreSearch();
  const { contentWidth, device } = useResponsive();
  const columns = guideColumns(device);
  const cardWidth = gridCardWidth(contentWidth, columns, spacing.lg);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["guide-services", search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get("/guide-services/", { params: { ...params, page_size: 100 } });
      return res.data.results ?? res.data;
    },
  });

  const services = data ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.list, responsiveStyles.centeredContent]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
      >
        {services.length === 0 ? (
          !isLoading ? (
            <EmptyState
              icon="compass-outline"
              title="No guide services found"
              message="Try adjusting your search or check back later."
            />
          ) : null
        ) : (
          <View style={responsiveStyles.grid}>
            {services.map((item: any) => {
              const cover = item.photos?.[0]?.image as string | undefined;
              return (
                <View key={item.id} style={{ width: cardWidth }}>
                  <GuideCard
                    {...item}
                    guide_name={item.guide_name || "Guide"}
                    guide_photo={item.guide_photo}
                    price_per_day={String(item.price_per_person ?? item.price_per_day ?? 0)}
                    cover_image={cover}
                    onPress={() => nav.navigate("GuideServiceDetail", { id: item.id })}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
});
