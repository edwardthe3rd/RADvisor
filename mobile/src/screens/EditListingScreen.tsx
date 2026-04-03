import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { Button, Input, KeyboardView } from "../components/ui";

export default function EditListingScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const { id } = route.params;

  const [form, setForm] = useState({
    title: "",
    description: "",
    price_per_day: "",
    city: "",
    state: "",
    condition: "good",
  });
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const res = await api.get(`/equipment/listings/${id}/`);
      return res.data;
    },
  });

  useEffect(() => {
    if (listing) {
      setForm({
        title: listing.title || "",
        description: listing.description || "",
        price_per_day: String(listing.price_per_day || ""),
        city: listing.city || "",
        state: listing.state || "",
        condition: listing.condition || "good",
      });
      setExistingImages(listing.images || []);
    }
  }, [listing]);

  const set = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      setNewImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      newImages.forEach((uri, i) => {
        const name = uri.split("/").pop() || `photo_${i}.jpg`;
        fd.append("uploaded_images", { uri, name, type: "image/jpeg" } as any);
      });
      return api.patch(`/equipment/listings/${id}/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      qc.invalidateQueries({ queryKey: ["listing", id] });
      Alert.alert("Updated", "Your listing has been updated.", [
        { text: "OK", onPress: () => nav.goBack() },
      ]);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data ? Object.values(data).flat().join("\n") : "Could not update listing.";
      Alert.alert("Error", msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/equipment/listings/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      nav.goBack();
    },
  });

  const handleDelete = () => {
    Alert.alert("Delete Listing", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={styles.content}
    >
      <Input label="Title" value={form.title} onChangeText={set("title")} placeholder="Listing title" />
      <Input label="Description" value={form.description} onChangeText={set("description")} placeholder="Description" multiline style={{ height: 100, textAlignVertical: "top" }} />
      <Input label="Price per Day ($)" value={form.price_per_day} onChangeText={set("price_per_day")} placeholder="25" keyboardType="decimal-pad" leftIcon="cash-outline" />
      <Input label="City" value={form.city} onChangeText={set("city")} placeholder="City" />
      <Input label="State" value={form.state} onChangeText={set("state")} placeholder="State" />

      <Text style={styles.label}>PHOTOS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {existingImages.map((img: any, i: number) => (
          <View key={`ex-${i}`} style={styles.imageThumb}>
            <Image source={{ uri: img.image }} style={styles.thumbImg} />
          </View>
        ))}
        {newImages.map((uri, i) => (
          <View key={`new-${i}`} style={styles.imageThumb}>
            <Image source={{ uri }} style={styles.thumbImg} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Ionicons name="close-circle" size={22} color={colors.feedback.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
          <Ionicons name="camera-outline" size={28} color={colors.text.tertiary} />
        </TouchableOpacity>
      </ScrollView>

      <Button
        title="Save Changes"
        onPress={() => updateMutation.mutate()}
        loading={updateMutation.isPending}
        fullWidth
        style={{ marginTop: spacing.xl }}
      />
      <Button
        title="Delete Listing"
        onPress={handleDelete}
        variant="danger"
        fullWidth
        style={{ marginTop: spacing.md }}
      />
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
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
});
