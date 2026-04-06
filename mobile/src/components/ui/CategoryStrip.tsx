import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CATEGORY_COUNT = 6;
const CARD_SIZE =
  (SCREEN_WIDTH - spacing.lg * 2 - spacing.md * (CATEGORY_COUNT - 1)) / CATEGORY_COUNT;

interface Category {
  key: string;
  label: string;
  image: string;
}

const CATEGORIES: Category[] = [
  {
    key: "Camp",
    label: "Camp",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=300&h=300&fit=crop",
  },
  {
    key: "Dirt",
    label: "Dirt",
    image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=300&h=300&fit=crop",
  },
  {
    key: "Rock",
    label: "Rock",
    image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=300&h=300&fit=crop",
  },
  {
    key: "Snow",
    label: "Snow",
    image: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=300&h=300&fit=crop",
  },
  {
    key: "Travel",
    label: "Travel",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&h=300&fit=crop",
  },
  {
    key: "Water",
    label: "Water",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=300&fit=crop",
  },
];

interface CategoryStripProps {
  selected: string | null;
  onSelect: (key: string | null) => void;
}

export default function CategoryStrip({ selected, onSelect }: CategoryStripProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {CATEGORIES.map((cat) => {
          const active = selected === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              activeOpacity={0.8}
              onPress={() => onSelect(active ? null : cat.key)}
              style={styles.item}
            >
              <View style={[styles.imageWrap, active && styles.imageWrapActive]}>
                <Image source={{ uri: cat.image }} style={styles.image} />
                {!active && <View style={styles.overlay} />}
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingBottom: spacing.sm },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  item: {
    alignItems: "center",
    width: CARD_SIZE,
  },
  imageWrap: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  imageWrapActive: {
    borderColor: colors.brand.primary,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: colors.text.secondary,
    textAlign: "center",
  },
  labelActive: {
    color: colors.brand.primary,
  },
});
