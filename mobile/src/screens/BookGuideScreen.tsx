import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Button, Input, Card, KeyboardView } from "../components/ui";

export default function BookGuideScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { id } = route.params;

  const [tripDate, setTripDate] = useState("");
  const [groupSize, setGroupSize] = useState("1");

  const { data: service, isLoading } = useQuery({
    queryKey: ["guide-service", id],
    queryFn: async () => {
      const res = await api.get(`/guide-services/${id}/`);
      return res.data;
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      return api.post("/guide-bookings/", {
        service: id,
        date: tripDate,
        participants: parseInt(groupSize, 10) || 1,
      });
    },
    onSuccess: () => {
      Alert.alert("Booking Requested", "The guide will review your request.", [
        { text: "OK", onPress: () => nav.goBack() },
      ]);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data
        ? Object.values(data).flat().join("\n")
        : "Could not submit booking.";
      Alert.alert("Error", msg);
    },
  });

  if (isLoading || !service) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  const participants = parseInt(groupSize, 10) || 1;
  const price = parseFloat(String(service.price_per_person ?? service.price_per_day ?? 0));
  const estimatedTotal = participants * price;

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={styles.content}
    >
      <Card elevated style={styles.summaryCard}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.guideName}>with {service.guide_name}</Text>
        <Text style={styles.priceText}>
          ${price.toFixed(0)} / person
        </Text>
      </Card>

      <Input
        label="Trip date"
        value={tripDate}
        onChangeText={setTripDate}
        placeholder="YYYY-MM-DD"
        leftIcon="calendar-outline"
      />
      <Input
        label="Group size"
        value={groupSize}
        onChangeText={setGroupSize}
        placeholder="1"
        keyboardType="number-pad"
        leftIcon="people-outline"
      />

      {tripDate ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            ${price.toFixed(0)} × {participants} {participants === 1 ? "person" : "people"} (estimate)
          </Text>
          <Text style={styles.totalValue}>${estimatedTotal.toFixed(0)}</Text>
        </View>
      ) : null}

      <Button
        title="Request Booking"
        onPress={() => bookMutation.mutate()}
        loading={bookMutation.isPending}
        disabled={!tripDate}
        fullWidth
      />
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: spacing.xl },
  summaryCard: { marginBottom: spacing.xl },
  serviceTitle: { fontSize: 18, fontWeight: "700", color: colors.text.primary, marginBottom: 2 },
  guideName: { fontSize: 14, color: colors.text.secondary, marginBottom: 4 },
  priceText: { fontSize: 15, color: colors.text.secondary },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surface.borderLight,
    marginBottom: spacing.lg,
  },
  totalLabel: { fontSize: 16, color: colors.text.secondary },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.text.primary },
});
