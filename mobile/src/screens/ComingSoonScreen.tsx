import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { EmptyState } from "../components/ui";

/**
 * Placeholder for sections that are intentionally blank in the current phase
 * (the app is focused on the Equipment directory for now).
 */
export default function ComingSoonScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <EmptyState
        icon="construct-outline"
        title="Coming soon"
        message="This section isn't available yet. For now, explore outdoor gear rentals under the Explore tab."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background, justifyContent: "center" },
});
