import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import Avatar from "./Avatar";

interface PostCardProps {
  id: number;
  title: string;
  body: string;
  author_name: string;
  author_photo?: string | null;
  image?: string | null;
  comment_count?: number;
  like_count?: number;
  liked?: boolean;
  created_at: string;
  onPress: () => void;
  onLike?: () => void;
}

export default function PostCard({
  title,
  body,
  author_name,
  author_photo,
  image,
  comment_count = 0,
  like_count = 0,
  liked = false,
  created_at,
  onPress,
  onLike,
}: PostCardProps) {
  const timeAgo = getTimeAgo(created_at);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={author_photo} name={author_name} size="sm" />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{author_name}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body} numberOfLines={3}>{body}</Text>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={20}
            color={liked ? colors.brand.primary : colors.text.secondary}
          />
          <Text style={styles.actionText}>{like_count}</Text>
        </TouchableOpacity>
        <View style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.actionText}>{comment_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.borderLight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  headerText: { marginLeft: spacing.sm },
  authorName: { fontSize: 14, fontWeight: "600", color: colors.text.primary },
  time: { fontSize: 12, color: colors.text.tertiary },
  title: { fontSize: 16, fontWeight: "700", color: colors.text.primary, marginBottom: 4 },
  body: { fontSize: 14, color: colors.text.secondary, lineHeight: 20, marginBottom: spacing.md },
  image: { width: "100%", height: 200, borderRadius: radius.md, marginBottom: spacing.md },
  actions: { flexDirection: "row", gap: spacing.xl },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { fontSize: 13, color: colors.text.secondary },
});
