import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";

type StatusType = "pending" | "approved" | "declined" | "active" | "completed" | "canceled";

interface StatusBadgeProps {
  status: StatusType;
  style?: ViewStyle;
}

const statusConfig: Record<StatusType, { bg: string; text: string; label: string }> = {
  pending: { bg: colors.status.pendingBg, text: colors.status.pending, label: "Pending" },
  approved: { bg: colors.status.approvedBg, text: colors.status.approved, label: "Approved" },
  declined: { bg: colors.status.declinedBg, text: colors.status.declined, label: "Declined" },
  active: { bg: colors.status.activeBg, text: colors.status.active, label: "Active" },
  completed: { bg: colors.status.completedBg, text: colors.status.completed, label: "Completed" },
  canceled: { bg: colors.status.canceledBg, text: colors.status.canceled, label: "Canceled" },
};

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: cfg.text }]} />
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

interface TagProps {
  label: string;
  color?: string;
  bg?: string;
  style?: ViewStyle;
}

export function Tag({
  label,
  color: textColor = colors.text.secondary,
  bg = colors.surface.muted,
  style,
}: TagProps) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }, style]}>
      <Text style={[styles.tagText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  tagText: { fontSize: 12, fontWeight: "500" },
});
