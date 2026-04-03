import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Button, Input, KeyboardView } from "../components/ui";

export default function LoginScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert("Login Failed", err?.response?.data?.detail || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}
    >
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to your RADvisor account</Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon="mail-outline"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry={!showPw}
        leftIcon="lock-closed-outline"
        rightIcon={showPw ? "eye-off-outline" : "eye-outline"}
        onRightIconPress={() => setShowPw(!showPw)}
      />

      <Button title="Log In" onPress={handleLogin} loading={loading} fullWidth />

      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Text style={styles.link} onPress={() => nav.navigate("Signup")}>
          Sign up
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
