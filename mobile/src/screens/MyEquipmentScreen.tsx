import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { responsiveStyles } from "../theme/responsive";
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.list, responsiveStyles.centeredContent]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
      >
        {listings.length === 0 ? (
          !isLoading ? (
            <EmptyState
              icon="cube-outline"
              title="No equipment listed"
              message="List your gear and start earning!"
              actionLabel="Create Listing"
              onAction={() => nav.navigate("CreateListing")}
            />
          ) : null
        ) : (
          <View style={responsiveStyles.grid}>
            {listings.map((item: any) => (
              <ListingCard
                key={item.id}
                {...item}
                onPress={() => nav.navigate("EditListing", { id: item.id })}
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
