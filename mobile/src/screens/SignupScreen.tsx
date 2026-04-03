import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Button, Input, KeyboardView } from "../components/ui";

export default function SignupScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSignup = async () => {
    if (!form.username || !form.email || !form.password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (form.password !== form.password2) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signup(form);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data
        ? Object.values(data).flat().join("\n")
        : "Could not create account.";
      Alert.alert("Signup Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}
    >
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join the RADvisor community</Text>

      <Input label="Username" value={form.username} onChangeText={set("username")} placeholder="Choose a username" leftIcon="person-outline" autoCapitalize="none" />
      <Input label="Email" value={form.email} onChangeText={set("email")} placeholder="you@example.com" keyboardType="email-address" leftIcon="mail-outline" autoCapitalize="none" />
      <Input label="Password" value={form.password} onChangeText={set("password")} placeholder="Min 8 characters" secureTextEntry leftIcon="lock-closed-outline" />
      <Input label="Confirm Password" value={form.password2} onChangeText={set("password2")} placeholder="Repeat password" secureTextEntry leftIcon="lock-closed-outline" />

      <Button title="Create Account" onPress={handleSignup} loading={loading} fullWidth />

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => nav.navigate("Login")}>
          Log in
        </Text>
      </Text>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: 28, fontWeight: "800", color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.text.secondary, marginBottom: spacing.xxl },
  footerText: { fontSize: 14, color: colors.text.secondary, textAlign: "center", marginTop: spacing.xl },
  link: { color: colors.brand.primary, fontWeight: "600" },
});
