import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Keyboard,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { shadow } from "../../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type SearchTab = "Equipment" | "Guiding";

interface Suggestion {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  value: string;
}

const EQUIPMENT_SUGGESTIONS: Suggestion[] = [
  { icon: "location-outline", label: "Nearby", subtitle: "Equipment near you", value: "nearby" },
  { icon: "bonfire-outline", label: "Camping Gear", subtitle: "Tents, sleeping bags & more", value: "camping" },
  { icon: "snow-outline", label: "Winter Sports", subtitle: "Skis, boards & snowshoes", value: "ski" },
  { icon: "water-outline", label: "Water Sports", subtitle: "Kayaks, paddleboards & more", value: "kayak" },
  { icon: "bicycle-outline", label: "Bikes & Cycling", subtitle: "Mountain, road & gravel", value: "bike" },
];

const GUIDING_SUGGESTIONS: Suggestion[] = [
  { icon: "compass-outline", label: "All Experiences", subtitle: "Browse guided adventures", value: "" },
  { icon: "walk-outline", label: "Hiking & Backpacking", subtitle: "Guided hikes & treks", value: "hike" },
  { icon: "snow-outline", label: "Ski & Snowboard", subtitle: "Backcountry & resort guides", value: "ski" },
  { icon: "water-outline", label: "Water Adventures", subtitle: "Surf lessons, kayak tours", value: "surf" },
  { icon: "fitness-outline", label: "Climbing", subtitle: "Rock & ice climbing guides", value: "climb" },
];

interface SearchDropdownProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (query: string, tab: SearchTab) => void;
  placeholder?: string;
}

export default function SearchDropdown({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Start your adventure",
}: SearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("Equipment");
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setOpen(false);
  };

  const handleSuggestion = (suggestion: Suggestion) => {
    onChangeText(suggestion.value);
    onSubmit(suggestion.value, activeTab);
    handleClose();
  };

  const handleSearchSubmit = () => {
    onSubmit(value, activeTab);
    handleClose();
  };

  const suggestions = activeTab === "Equipment" ? EQUIPMENT_SUGGESTIONS : GUIDING_SUGGESTIONS;

  return (
    <>
      <TouchableOpacity activeOpacity={0.9} onPress={handleOpen}>
        <View style={[styles.pill, shadow.sm]}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <Text style={styles.pillText} numberOfLines={1}>
            {value || placeholder}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.modal, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={[styles.inputWrap, shadow.sm]}>
              <Ionicons name="search" size={18} color={colors.text.tertiary} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={activeTab === "Equipment" ? "Search equipment..." : "Search guides..."}
                placeholderTextColor={colors.text.tertiary}
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
                autoCorrect={false}
              />
              {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(["Equipment", "Guiding"] as SearchTab[]).map((tab) => {
              const active = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Ionicons
                    name={tab === "Equipment" ? "cube-outline" : "compass-outline"}
                    size={18}
                    color={active ? colors.brand.primary : colors.text.tertiary}
                  />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Suggestions */}
          <View style={styles.suggestions}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={`${s.label}-${i}`}
                style={styles.suggestionRow}
                onPress={() => handleSuggestion(s)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionIcon}>
                  <Ionicons name={s.icon} size={20} color={colors.brand.primary} />
                </View>
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionLabel}>{s.label}</Text>
                  {s.subtitle && (
                    <Text style={styles.suggestionSubtitle}>{s.subtitle}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    height: 48,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    gap: spacing.sm,
  },
  pillText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.tertiary,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surface.muted,
  },
  tabActive: {
    backgroundColor: colors.brand.primaryLight,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.tertiary,
  },
  tabLabelActive: {
    color: colors.brand.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.borderLight,
    marginTop: spacing.lg,
  },
  suggestions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 1,
  },
});
