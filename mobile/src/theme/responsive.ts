import { StyleSheet, useWindowDimensions } from "react-native";
import { spacing } from "./spacing";

export const breakpoints = {
  tablet: 768,
  desktop: 1024,
} as const;

/** Centered content never grows wider than this on large screens. */
export const MAX_CONTENT_WIDTH = 1200;

/** Comfortable max width for single-column forms (auth, create flows). */
export const FORM_MAX_WIDTH = 480;

export type DeviceClass = "phone" | "tablet" | "desktop";

export function getDeviceClass(width: number): DeviceClass {
  if (width >= breakpoints.desktop) return "desktop";
  if (width >= breakpoints.tablet) return "tablet";
  return "phone";
}

function columnsFor(device: DeviceClass): number {
  if (device === "desktop") return 4;
  if (device === "tablet") return 3;
  return 2;
}

export interface ResponsiveInfo {
  width: number;
  height: number;
  device: DeviceClass;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Viewport width clamped to MAX_CONTENT_WIDTH for centered layouts. */
  contentWidth: number;
  /** Suggested column count for card grids. */
  gridColumns: number;
}

/**
 * Live, resize-aware layout info. Drives responsive web layout (and adapts to
 * tablet/foldable sizes on native) instead of a width captured once at module load.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const device = getDeviceClass(width);
  return {
    width,
    height,
    device,
    isPhone: device === "phone",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
    contentWidth: Math.min(width, MAX_CONTENT_WIDTH),
    gridColumns: columnsFor(device),
  };
}

/** Width of one card in a horizontal padded, gapped grid. */
export function gridCardWidth(
  contentWidth: number,
  columns: number,
  horizontalPadding: number = spacing.xl,
  gap: number = spacing.lg,
): number {
  const usable = contentWidth - horizontalPadding * 2 - gap * (columns - 1);
  return Math.floor(usable / columns);
}

export const responsiveStyles = StyleSheet.create({
  /** Center a scroll/list column and cap its width on large screens. */
  centeredContent: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  /** Row that wraps cards into a responsive grid. */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  /** Center a single-column form and cap its width on large screens. */
  formColumn: {
    width: "100%",
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: "center",
  },
});
