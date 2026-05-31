import { Platform } from "react-native";
import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./RootNavigator";

/**
 * Deep-linking / URL config so the web build has real, shareable URLs with a
 * working browser back button and refresh-safe routes. The same config powers
 * `radvisor://` deep links on native later.
 */
const prefixes: string[] = [
  "radvisor://",
  "https://app.radvisor.com",
  ...(Platform.OS === "web" && typeof window !== "undefined"
    ? [window.location.origin]
    : []),
];

/** Parse a URL `:id` segment into the numeric id our screens expect. */
const idParam = {
  parse: { id: (value: string) => Number(value) },
  stringify: { id: (value: number) => String(value) },
};

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes,
  config: {
    screens: {
      Main: {
        screens: {
          Explore: "explore",
          Wishlists: "wishlists",
          Upcoming: "trips",
          Messages: "messages",
          Profile: "profile",
        },
      },
      Auth: {
        screens: {
          Welcome: "welcome",
          Login: "login",
          Signup: "signup",
        },
      },
      BusinessDetail: { path: "business/:slug" },
      ListingDetail: { path: "listing/:id", ...idParam },
      GuideServiceDetail: { path: "guide/:id", ...idParam },
      CommunityPostDetail: { path: "post/:id", ...idParam },
      BookEquipment: { path: "book-equipment/:id", ...idParam },
      BookGuide: { path: "book-guide/:id", ...idParam },
      WishlistDetail: { path: "wishlist/:id", ...idParam },
      MyEquipment: "my-equipment",
      CreateListing: "listings/new",
      EditListing: { path: "edit-listing/:id", ...idParam },
      CreateGuideService: "guide-services/new",
      ThreadDetail: { path: "messages/:id", ...idParam },
      EditProfile: "profile/edit",
      BecomeGuide: "become-guide",
    },
  },
};
