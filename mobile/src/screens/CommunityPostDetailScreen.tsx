import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { Avatar } from "../components/ui";

export default function CommunityPostDetailScreen() {
  const route = useRoute<any>();
  const qc = useQueryClient();
  const { id } = route.params;
  const [comment, setComment] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const res = await api.get(`/community/posts/${id}/`);
      return res.data;
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["post-comments", id],
    queryFn: async () => {
      const res = await api.get(`/community/posts/${id}/comments/`);
      return res.data.results ?? res.data;
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      await api.post(`/community/posts/${id}/comments/`, { body: comment });
    },
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["post-comments", id] });
      qc.invalidateQueries({ queryKey: ["post", id] });
    },
  });

  if (isLoading || !post) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(item: any) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.postSection}>
            <View style={styles.authorRow}>
              <Avatar uri={post.author_photo} name={post.author_display_name || post.author_username} size="md" />
              <View>
                <Text style={styles.authorName}>{post.author_display_name || post.author_username}</Text>
                <Text style={styles.time}>{new Date(post.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.body}>{post.body}</Text>
            {post.image && <Image source={{ uri: post.image }} style={styles.image} />}
            <View style={styles.divider} />
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <View style={styles.commentRow}>
            <Avatar uri={item.author_photo} name={item.author_display_name || item.author_username} size="sm" />
            <View style={styles.commentBody}>
              <Text style={styles.commentAuthor}>{item.author_display_name || item.author_username}</Text>
              <Text style={styles.commentText}>{item.body}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment..."
          placeholderTextColor={colors.text.tertiary}
          multiline
        />
        <TouchableOpacity
          onPress={() => comment.trim() && addComment.mutate()}
          disabled={!comment.trim() || addComment.isPending}
        >
          <Ionicons
            name="send"
            size={24}
            color={comment.trim() ? colors.brand.primary : colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingBottom: 80 },
  postSection: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  authorRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  authorName: { fontSize: 16, fontWeight: "700", color: colors.text.primary },
  time: { fontSize: 12, color: colors.text.tertiary },
  title: { fontSize: 22, fontWeight: "800", color: colors.text.primary, marginBottom: spacing.sm },
  body: { fontSize: 15, color: colors.text.secondary, lineHeight: 22, marginBottom: spacing.lg },
  image: { width: "100%", height: 220, borderRadius: radius.md, marginBottom: spacing.lg },
  divider: { height: 1, backgroundColor: colors.surface.borderLight, marginVertical: spacing.lg },
  commentsTitle: { fontSize: 16, fontWeight: "700", color: colors.text.primary, marginBottom: spacing.md },
  commentRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: colors.text.primary },
  commentText: { fontSize: 14, color: colors.text.secondary, lineHeight: 20, marginTop: 2 },
  inputBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: colors.surface.borderLight,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    maxHeight: 80,
    paddingVertical: spacing.sm,
  },
});
