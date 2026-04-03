import React, { useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { ListingCard, EmptyState } from "../components/ui";

export default function MyEquipmentScreen() {
  const nav = useNavigation<any>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const res = await api.get("/listings/mine/");
      return res.data.results ?? res.data;
    },
  });

  const listings = data ?? [];

  React.useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => nav.navigate("CreateListing")} style={{ marginRight: spacing.md }}>
          <Ionicons name="add-circle-outline" size={26} color={colors.brand.primary} />
        </TouchableOpacity>
      ),
    });
  }, [nav]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ListingCard
        {...item}
        fullWidth
        onPress={() => nav.navigate("EditListing", { id: item.id })}
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
              icon="cube-outline"
              title="No equipment listed"
              message="List your gear and start earning!"
              actionLabel="Create Listing"
              onAction={() => nav.navigate("CreateListing")}
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
