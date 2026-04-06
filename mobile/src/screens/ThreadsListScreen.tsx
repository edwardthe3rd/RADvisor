import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { Avatar, EmptyState } from "../components/ui";

export default function ThreadsListScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const res = await api.get("/threads/");
      return res.data.results ?? res.data;
    },
  });

  const threads = data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={threads}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={styles.thread}
            onPress={() => nav.navigate("ThreadDetail", { id: item.id, title: item.other_user_name || "Chat" })}
            activeOpacity={0.7}
          >
            <Avatar
              uri={item.other_user_photo}
              name={item.other_user_name}
              size="md"
            />
            <View style={styles.threadInfo}>
              <View style={styles.threadTop}>
                <Text style={styles.threadName} numberOfLines={1}>
                  {item.other_user_name || "User"}
                </Text>
                {item.last_message_at && (
                  <Text style={styles.threadTime}>
                    {new Date(item.last_message_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {item.last_message && (
                <Text style={styles.threadPreview} numberOfLines={1}>
                  {item.last_message}
                </Text>
              )}
            </View>
            {item.unread_count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages"
              message="When you book gear or a guide, your conversations will appear here."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  list: { paddingBottom: spacing.xxl },
  thread: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.borderLight,
  },
  threadInfo: { flex: 1, marginLeft: spacing.md },
  threadTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  threadName: { fontSize: 15, fontWeight: "600", color: colors.text.primary, flex: 1 },
  threadTime: { fontSize: 12, color: colors.text.tertiary },
  threadPreview: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  badge: {
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.text.inverse },
});
