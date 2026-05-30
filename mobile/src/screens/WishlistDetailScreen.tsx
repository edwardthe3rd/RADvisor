import React from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { responsiveStyles } from "../theme/responsive";
import { ListingCard, EmptyState } from "../components/ui";

export default function WishlistDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { id } = route.params;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wishlist", id],
    queryFn: async () => {
      const res = await api.get(`/wishlists/${id}/`);
      return res.data;
    },
  });

  const listings = data?.listings ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.list, responsiveStyles.centeredContent]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
      >
        {listings.length === 0 ? (
          !isLoading ? (
            <EmptyState
              icon="heart-outline"
              title="Wishlist is empty"
              message="Browse equipment and save your favorites here."
            />
          ) : null
        ) : (
          <View style={responsiveStyles.grid}>
            {listings.map((item: any) => (
              <ListingCard
                key={item.id}
                {...item}
                onPress={() => nav.navigate("ListingDetail", { id: item.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
});
