import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { shadow } from "../theme";
import { EmptyState } from "../components/ui";

export default function WishlistsScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wishlists"],
    queryFn: async () => {
      const res = await api.get("/wishlists/");
      return res.data.results ?? res.data;
    },
  });

  const wishlists = data ?? [];

  const createWishlist = useMutation({
    mutationFn: async (name: string) => {
      return api.post("/wishlists/", { name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlists"] }),
  });

  const handleCreate = () => {
    Alert.prompt?.(
      "New Wishlist",
      "Enter a name for your wishlist:",
      (name: string) => {
        if (name.trim()) createWishlist.mutate(name.trim());
      }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlists</Text>
        <TouchableOpacity onPress={handleCreate}>
          <Ionicons name="add-circle-outline" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={wishlists}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={[styles.card, shadow.sm]}
            onPress={() => nav.navigate("WishlistDetail", { id: item.id, name: item.name })}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="heart" size={24} color={colors.brand.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardCount}>
                {item.listing_count ?? item.listings?.length ?? 0} saved
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="heart-outline"
              title="No wishlists yet"
              message="Save your favorite gear to wishlists for easy access."
              actionLabel="Create Wishlist"
              onAction={handleCreate}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text.primary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "600", color: colors.text.primary },
  cardCount: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
});
