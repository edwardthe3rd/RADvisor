import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { Button, Input, Avatar, KeyboardView } from "../components/ui";

export default function EditProfileScreen() {
  const nav = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const profile = user?.profile;

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    city: "",
    state: "",
  });
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        city: profile.city || "",
        state: profile.state || "",
      });
      setPhoto(profile.profile_photo || null);
    }
  }, [profile]);

  const set = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo && !photo.startsWith("http")) {
        const name = photo.split("/").pop() || "profile.jpg";
        fd.append("profile_photo", { uri: photo, name, type: "image/jpeg" } as any);
      }
      return api.patch("/auth/profile/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: async () => {
      await refreshUser();
      Alert.alert("Updated", "Your profile has been updated.", [
        { text: "OK", onPress: () => nav.goBack() },
      ]);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data ? Object.values(data).flat().join("\n") : "Could not update profile.";
      Alert.alert("Error", msg);
    },
  });

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={styles.content}
    >
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={pickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <Avatar name={form.display_name || user?.username} size="xl" />
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color={colors.text.inverse} />
          </View>
        </TouchableOpacity>
      </View>

      <Input label="Display Name" value={form.display_name} onChangeText={set("display_name")} placeholder="Your display name" />
      <Input label="Bio" value={form.bio} onChangeText={set("bio")} placeholder="Tell us about yourself..." multiline style={{ height: 100, textAlignVertical: "top" }} />
      <Input label="City" value={form.city} onChangeText={set("city")} placeholder="City" />
      <Input label="State" value={form.state} onChangeText={set("state")} placeholder="State" />

      <Button
        title="Save Profile"
        onPress={() => updateMutation.mutate()}
        loading={updateMutation.isPending}
        fullWidth
        style={{ marginTop: spacing.lg }}
      />
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  photoSection: { alignItems: "center", marginBottom: spacing.xxl },
  photo: { width: 96, height: 96, borderRadius: 48 },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.brand.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface.background,
  },
});
