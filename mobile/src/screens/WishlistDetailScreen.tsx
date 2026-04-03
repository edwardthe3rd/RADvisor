import React, { useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { ListingCard, EmptyState } from "../components/ui";

export default function WishlistDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { id } = route.params;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wishlist", id],
    queryFn: async () => {
      const res = await api.get(`/equipment/wishlists/${id}/`);
      return res.data;
    },
  });

  const listings = data?.listings ?? [];

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ListingCard
        {...item}
        onPress={() => nav.navigate("ListingDetail", { id: item.id })}
        fullWidth
      />
    ),
    [nav]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="heart-outline"
              title="Wishlist is empty"
              message="Browse equipment and save your favorites here."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
});
