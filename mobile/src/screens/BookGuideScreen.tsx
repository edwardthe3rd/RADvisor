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

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupSize, setGroupSize] = useState("1");
  const [message, setMessage] = useState("");

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
        date: startDate,
        participants: parseInt(groupSize) || 1,
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

  const dayCount = (() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  })();

  const total = dayCount * parseFloat(service.price_per_day);

  return (
    <KeyboardView
      style={{ backgroundColor: colors.surface.background }}
      contentStyle={styles.content}
    >
      <Card elevated style={styles.summaryCard}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.guideName}>with {service.guide_display_name}</Text>
        <Text style={styles.priceText}>
          ${parseFloat(service.price_per_day).toFixed(0)} / day
        </Text>
      </Card>

      <Input
        label="Start Date"
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
        leftIcon="calendar-outline"
      />
      <Input
        label="End Date"
        value={endDate}
        onChangeText={setEndDate}
        placeholder="YYYY-MM-DD"
        leftIcon="calendar-outline"
      />
      <Input
        label="Group Size"
        value={groupSize}
        onChangeText={setGroupSize}
        placeholder="1"
        keyboardType="number-pad"
        leftIcon="people-outline"
      />
      <Input
        label="Message to Guide (optional)"
        value={message}
        onChangeText={setMessage}
        placeholder="Any special requests?"
        multiline
        style={{ height: 80, textAlignVertical: "top" }}
      />

      {dayCount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            ${parseFloat(service.price_per_day).toFixed(0)} x {dayCount} day{dayCount > 1 ? "s" : ""}
          </Text>
          <Text style={styles.totalValue}>${total.toFixed(0)}</Text>
        </View>
      )}

      <Button
        title="Request Booking"
        onPress={() => bookMutation.mutate()}
        loading={bookMutation.isPending}
        disabled={!startDate || !endDate}
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
