import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { Button, Input, KeyboardView } from "../components/ui";

export default function BecomeGuideScreen() {
  const nav = useNavigation<any>();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    experience_summary: "",
    certifications: "",
    specialties: "",
  });

  const set = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const applyMutation = useMutation({
    mutationFn: async () => {
      const specs = form.specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const certs = form.certifications
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return api.post("/guides/", {
        headline: form.experience_summary.slice(0, 200),
        specialties: specs,
        certifications: certs,
        languages: [],
        experience_years: 0,
      });
      return api.post("/guides/", form);
    },
    onSuccess: async () => {
      await refreshUser();
      Alert.alert(
        "Application Submitted",
        "We'll review your application and get back to you soon!",
        [{ text: "OK", onPress: () => nav.goBack() }]
      );
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data
        ? Object.values(data).flat().join("\n")
        : "Could not submit application.";
      Alert.alert("Error", msg);
    },
  });

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={styles.content}
    >
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="compass" size={40} color={colors.brand.primary} />
        </View>
        <Text style={styles.heroTitle}>Share Your Expertise</Text>
        <Text style={styles.heroSubtitle}>
          Become a RADvisor guide and help others experience amazing outdoor adventures.
        </Text>
      </View>

      <View style={styles.benefitsRow}>
        {[
          { icon: "cash-outline" as const, text: "Earn money" },
          { icon: "calendar-outline" as const, text: "Set your schedule" },
          { icon: "people-outline" as const, text: "Meet adventurers" },
        ].map((b, i) => (
          <View key={i} style={styles.benefit}>
            <Ionicons name={b.icon} size={24} color={colors.brand.secondary} />
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      <Input
        label="Experience Summary"
        value={form.experience_summary}
        onChangeText={set("experience_summary")}
        placeholder="Tell us about your outdoor guiding experience..."
        multiline
        style={{ height: 120, textAlignVertical: "top" }}
      />
      <Input
        label="Certifications"
        value={form.certifications}
        onChangeText={set("certifications")}
        placeholder="e.g. Wilderness First Responder, AMGA Rock Guide"
        multiline
        style={{ height: 80, textAlignVertical: "top" }}
      />
      <Input
        label="Specialties"
        value={form.specialties}
        onChangeText={set("specialties")}
        placeholder="e.g. Rock Climbing, Backcountry Skiing, Fly Fishing"
      />

      <Button
        title="Submit Application"
        onPress={() => applyMutation.mutate()}
        loading={applyMutation.isPending}
        disabled={!form.experience_summary}
        fullWidth
        style={{ marginTop: spacing.xl }}
      />
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  heroSection: { alignItems: "center", marginBottom: spacing.xxl },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: colors.text.primary, marginBottom: spacing.sm },
  heroSubtitle: { fontSize: 15, color: colors.text.secondary, textAlign: "center", lineHeight: 22 },
  benefitsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xxl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface.muted,
    borderRadius: radius.lg,
  },
  benefit: { alignItems: "center", gap: spacing.xs },
  benefitText: { fontSize: 12, fontWeight: "600", color: colors.text.secondary },
});
