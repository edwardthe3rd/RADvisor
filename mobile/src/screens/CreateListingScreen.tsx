import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { Button, Input, KeyboardView } from "../components/ui";

export default function CreateListingScreen() {
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    daily_rate: "",
    city: "",
    state: "",
    condition: "good",
  });
  const [images, setImages] = useState<string[]>([]);

  const set = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach((uri, i) => {
        const name = uri.split("/").pop() || `photo_${i}.jpg`;
        fd.append("uploaded_images", {
          uri,
          name,
          type: "image/jpeg",
        } as any);
      });
      return api.post("/listings/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      Alert.alert("Success", "Your listing has been created!", [
        { text: "OK", onPress: () => nav.goBack() },
      ]);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data
        ? Object.values(data).flat().join("\n")
        : "Could not create listing.";
      Alert.alert("Error", msg);
    },
  });

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={styles.content}
    >
      <Input label="Title" value={form.title} onChangeText={set("title")} placeholder="e.g. Rossignol Experience 88 Skis" />
      <Input label="Description" value={form.description} onChangeText={set("description")} placeholder="Describe your gear..." multiline style={{ height: 100, textAlignVertical: "top" }} />
      <Input label="Price per Day ($)" value={form.daily_rate} onChangeText={set("daily_rate")} placeholder="25" keyboardType="decimal-pad" leftIcon="cash-outline" />
      <Input label="City" value={form.city} onChangeText={set("city")} placeholder="Boulder" />
      <Input label="State" value={form.state} onChangeText={set("state")} placeholder="CO" />

      <Text style={styles.label}>PHOTOS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {images.map((uri, i) => (
          <View key={i} style={styles.imageThumb}>
            <Image source={{ uri }} style={styles.thumbImg} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Ionicons name="close-circle" size={22} color={colors.feedback.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
          <Ionicons name="camera-outline" size={28} color={colors.text.tertiary} />
          <Text style={styles.addPhotoText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      <Button
        title="Create Listing"
        onPress={() => createMutation.mutate()}
        loading={createMutation.isPending}
        disabled={!form.title || !form.daily_rate}
        fullWidth
        style={{ marginTop: spacing.xl }}
      />
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  imageScroll: { marginBottom: spacing.lg },
  imageThumb: { width: 80, height: 80, borderRadius: radius.md, marginRight: spacing.sm, overflow: "hidden" },
  thumbImg: { width: 80, height: 80 },
  removeBtn: { position: "absolute", top: 2, right: 2 },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoText: { fontSize: 11, color: colors.text.tertiary, marginTop: 2 },
});
