import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { Avatar, Button } from "../components/ui";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={danger ? colors.feedback.danger : colors.text.primary} />
      <Text style={[styles.menuLabel, danger && { color: colors.feedback.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const profile = user?.profile;
  const displayName = profile?.display_name || user?.username || "User";

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Avatar uri={profile?.profile_photo} name={displayName} size="xl" />
        <Text style={styles.name}>{displayName}</Text>
        {profile?.city && profile?.state && (
          <Text style={styles.location}>{profile.city}, {profile.state}</Text>
        )}
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        <Button
          title="Edit Profile"
          onPress={() => nav.navigate("EditProfile")}
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.md }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hosting</Text>
        <MenuItem
          icon="cube-outline"
          label="My Equipment"
          onPress={() => nav.navigate("MyEquipment")}
        />
        <MenuItem
          icon="add-circle-outline"
          label="List New Equipment"
          onPress={() => nav.navigate("CreateListing")}
        />
        <MenuItem
          icon="compass-outline"
          label="Become a Guide"
          onPress={() => nav.navigate("BecomeGuide")}
        />
        <MenuItem
          icon="map-outline"
          label="Create Guide Service"
          onPress={() => nav.navigate("CreateGuideService")}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <MenuItem
          icon="settings-outline"
          label="Settings"
          onPress={() => {}}
        />
        <MenuItem
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => {}}
        />
        <MenuItem
          icon="log-out-outline"
          label="Log Out"
          onPress={logout}
          danger
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  content: { paddingBottom: spacing.xxxl },
  header: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.borderLight,
  },
  name: { fontSize: 24, fontWeight: "800", color: colors.text.primary, marginTop: spacing.lg },
  location: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  bio: { fontSize: 14, color: colors.text.secondary, textAlign: "center", marginTop: spacing.sm, lineHeight: 20 },
  section: { paddingTop: spacing.xl },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.borderLight,
    gap: spacing.md,
  },
  menuLabel: { flex: 1, fontSize: 16, color: colors.text.primary },
});
