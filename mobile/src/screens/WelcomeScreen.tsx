import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Button } from "../components/ui";

export default function WelcomeScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.hero}>
        <Text style={styles.logo}>RADvisor</Text>
        <Text style={styles.tagline}>
          Rent adventure gear.{"\n"}Book local guides.{"\n"}Join the community.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button title="Log In" onPress={() => nav.navigate("Login")} fullWidth />
        <Button
          title="Create Account"
          onPress={() => nav.navigate("Signup")}
          variant="outline"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.primary,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: colors.text.inverse,
    letterSpacing: -1,
    marginBottom: spacing.lg,
  },
  tagline: {
    fontSize: 20,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 30,
  },
  actions: {
    gap: spacing.md,
  },
});
