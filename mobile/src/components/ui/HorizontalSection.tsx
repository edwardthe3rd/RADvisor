import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.4;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 1.05;

interface Item {
  id: number;
  title: string;
  brand?: string;
  daily_rate?: string;
  image_url?: string;
  photos?: { id: number; image: string }[];
}

interface HorizontalSectionProps {
  title: string;
  items: Item[];
  onItemPress: (id: number) => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

function HorizontalCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const imageUri =
    (item.photos && item.photos[0]?.image) ||
    item.image_url ||
    "https://via.placeholder.com/300";

  const model =
    item.brand && item.title.startsWith(item.brand)
      ? item.title.slice(item.brand.length).trim()
      : item.title;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={cardStyles.card}>
      <View style={cardStyles.imageWrap}>
        <Image source={{ uri: imageUri }} style={cardStyles.image} />
      </View>
      <View style={cardStyles.info}>
        {item.brand ? (
          <>
            <Text style={cardStyles.brand} numberOfLines={1}>{item.brand}</Text>
            <Text style={cardStyles.model} numberOfLines={1}>{model}</Text>
          </>
        ) : (
          <Text style={cardStyles.brand} numberOfLines={2}>{item.title}</Text>
        )}
        {item.daily_rate && (
          <Text style={cardStyles.price}>
            ${parseFloat(item.daily_rate).toFixed(0)}{" "}
            <Text style={cardStyles.perDay}>/ day</Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: { width: CARD_WIDTH, marginRight: spacing.md },
  imageWrap: {
    width: CARD_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface.muted,
  },
  image: { width: "100%", height: "100%" },
  info: { marginTop: spacing.sm },
  brand: { fontSize: 13, fontWeight: "700", color: colors.text.primary },
  model: { fontSize: 12, color: colors.text.secondary, marginTop: 1 },
  price: { fontSize: 13, fontWeight: "600", color: colors.text.primary, marginTop: 4 },
  perDay: { fontWeight: "400", color: colors.text.secondary },
});

export default function HorizontalSection({
  title,
  items,
  onItemPress,
  icon,
}: HorizontalSectionProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        {icon && (
          <Ionicons name={icon} size={20} color={colors.text.primary} style={{ marginRight: 6 }} />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <HorizontalCard item={item} onPress={() => onItemPress(item.id)} />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
});
