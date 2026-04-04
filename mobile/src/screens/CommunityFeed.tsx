import React, { useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { PostCard, EmptyState } from "../components/ui";

export default function CommunityFeed() {
  const nav = useNavigation<any>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await api.get("/community/", { params: { page_size: 100 } });
      return res.data.results ?? res.data;
    },
  });

  const posts = data ?? [];

  const toggleLike = async (id: number) => {
    try {
      await api.post(`/community/${id}/like/`);
      refetch();
    } catch {}
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <PostCard
        {...item}
        author_name={item.author_name || item.author_display_name || item.author_username || "User"}
        author_photo={item.author_photo}
        liked={item.is_liked}
        onPress={() => nav.navigate("CommunityPostDetail", { id: item.id })}
        onLike={() => toggleLike(item.id)}
      />
    ),
    [nav]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="people-outline"
              title="No posts yet"
              message="Be the first to share something with the community!"
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  list: { paddingBottom: spacing.xxl },
});
