import React, { useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { GuideCard, EmptyState } from "../components/ui";
import { useExploreSearch } from "../contexts/ExploreSearchContext";

export default function GuidingFeed() {
  const nav = useNavigation<any>();
  const { search } = useExploreSearch();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["guides", search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get("/guide-services/", { params });
      return res.data.results ?? res.data;
    },
  });

  const services = data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <GuideCard
        {...item}
        guide_name={item.guide_display_name || "Guide"}
        guide_photo={item.guide_photo}
        onPress={() => nav.navigate("GuideServiceDetail", { id: item.id })}
      />
    ),
    [nav]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="compass-outline"
              title="No guide services found"
              message="Try adjusting your search or check back later."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
});
