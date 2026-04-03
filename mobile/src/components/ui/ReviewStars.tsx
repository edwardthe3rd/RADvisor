import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}

export function StarRating({ rating, size = 14, showValue = true, count }: StarRatingProps) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <View style={styles.row}>
      {Array.from({ length: full }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={size} color={colors.brand.tertiary} />
      ))}
      {half && <Ionicons name="star-half" size={size} color={colors.brand.tertiary} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Ionicons key={`e${i}`} name="star-outline" size={size} color={colors.text.tertiary} />
      ))}
      {showValue && (
        <Text style={[styles.value, { fontSize: size - 1 }]}>{rating.toFixed(1)}</Text>
      )}
      {count != null && (
        <Text style={[styles.count, { fontSize: size - 2 }]}>({count})</Text>
      )}
    </View>
  );
}

interface StarInputProps {
  value: number;
  onChange: (val: number) => void;
  size?: number;
}

export function StarInput({ value, onChange, size = 32 }: StarInputProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={size}
            color={n <= value ? colors.brand.tertiary : colors.text.tertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  value: { fontWeight: "600", color: colors.text.primary, marginLeft: spacing.xs },
  count: { color: colors.text.secondary },
});
