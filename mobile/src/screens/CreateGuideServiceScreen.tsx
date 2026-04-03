import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Button, Input, KeyboardView } from "../components/ui";

export default function CreateGuideServiceScreen() {
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price_per_person: "",
    city: "",
    state: "",
    activity_type: "",
    max_participants: "",
  });

  const set = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (form.max_participants) payload.max_participants = parseInt(form.max_participants);
      return api.post("/guide-services/", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guides"] });
      Alert.alert("Success", "Your guide service has been created!", [
        { text: "OK", onPress: () => nav.goBack() },
      ]);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data
        ? Object.values(data).flat().join("\n")
        : "Could not create service.";
      Alert.alert("Error", msg);
    },
  });

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={styles.content}
    >
      <Input label="Service Title" value={form.title} onChangeText={set("title")} placeholder="e.g. Backcountry Ski Touring" />
      <Input label="Description" value={form.description} onChangeText={set("description")} placeholder="Describe your guiding service..." multiline style={{ height: 120, textAlignVertical: "top" }} />
      <Input label="Activity Type" value={form.activity_type} onChangeText={set("activity_type")} placeholder="e.g. Skiing, Hiking, Climbing" />
      <Input label="Price per Person ($)" value={form.price_per_person} onChangeText={set("price_per_person")} placeholder="150" keyboardType="decimal-pad" leftIcon="cash-outline" />
      <Input label="Max Group Size" value={form.max_participants} onChangeText={set("max_participants")} placeholder="6" keyboardType="number-pad" leftIcon="people-outline" />
      <Input label="City" value={form.city} onChangeText={set("city")} placeholder="Boulder" />
      <Input label="State" value={form.state} onChangeText={set("state")} placeholder="CO" />

      <Button
        title="Create Service"
        onPress={() => createMutation.mutate()}
        loading={createMutation.isPending}
        disabled={!form.title || !form.price_per_person}
        fullWidth
        style={{ marginTop: spacing.lg }}
      />
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
});
