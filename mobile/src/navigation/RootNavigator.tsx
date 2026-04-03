import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { ExploreSearchProvider, useExploreSearch } from "../contexts/ExploreSearchContext";
import { navigationTheme } from "../theme/navigationTheme";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { SearchDropdown } from "../components/ui";

import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import EquipmentFeed from "../screens/EquipmentFeed";
import GuidingFeed from "../screens/GuidingFeed";
import CommunityFeed from "../screens/CommunityFeed";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import GuideServiceDetailScreen from "../screens/GuideServiceDetailScreen";
import CommunityPostDetailScreen from "../screens/CommunityPostDetailScreen";
import BookEquipmentScreen from "../screens/BookEquipmentScreen";
import BookGuideScreen from "../screens/BookGuideScreen";
import WishlistsScreen from "../screens/WishlistsScreen";
import WishlistDetailScreen from "../screens/WishlistDetailScreen";
import MyEquipmentScreen from "../screens/MyEquipmentScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import EditListingScreen from "../screens/EditListingScreen";
import CreateGuideServiceScreen from "../screens/CreateGuideServiceScreen";
import ThreadsListScreen from "../screens/ThreadsListScreen";
import ThreadDetailScreen from "../screens/ThreadDetailScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import MyTripsScreen from "../screens/MyTripsScreen";
import BecomeGuideScreen from "../screens/BecomeGuideScreen";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ListingDetail: { id: number };
  GuideServiceDetail: { id: number };
  CommunityPostDetail: { id: number };
  BookEquipment: { id: number };
  BookGuide: { id: number };
  WishlistDetail: { id: number; name: string };
  MyEquipment: undefined;
  CreateListing: undefined;
  EditListing: { id: number };
  CreateGuideService: undefined;
  ThreadDetail: { id: number; title: string };
  EditProfile: undefined;
  BecomeGuide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

function ExploreContent() {
  const insets = useSafeAreaInsets();
  const { search, setSearch } = useExploreSearch();
  const topTabRef = React.useRef<any>(null);

  const handleSearchSubmit = (query: string, tab: "Equipment" | "Guiding") => {
    setSearch(query);
  };

  return (
    <View style={exploreStyles.container}>
      <View style={[exploreStyles.searchWrap, { paddingTop: insets.top + spacing.sm }]}>
        <SearchDropdown
          value={search}
          onChangeText={setSearch}
          onSubmit={handleSearchSubmit}
          placeholder="Start your adventure"
        />
      </View>
      <TopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarIndicatorStyle: { backgroundColor: colors.brand.primary, height: 3 },
          tabBarLabelStyle: { fontWeight: "600", fontSize: 13, textTransform: "none" },
          tabBarStyle: { elevation: 0, shadowOpacity: 0 },
        }}
      >
        <TopTab.Screen name="Equipment" component={EquipmentFeed} />
        <TopTab.Screen name="Guiding" component={GuidingFeed} />
        <TopTab.Screen name="Community" component={CommunityFeed} />
      </TopTab.Navigator>
    </View>
  );
}

function ExploreTabs() {
  return (
    <ExploreSearchProvider>
      <ExploreContent />
    </ExploreSearchProvider>
  );
}

const exploreStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.surface.background },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Explore: "search",
            Wishlists: "heart-outline",
            Upcoming: "calendar-outline",
            Messages: "chatbubbles-outline",
            Profile: "person-outline",
          };
          return <Ionicons name={icons[route.name] || "ellipse"} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      })}
    >
      <Tab.Screen name="Explore" component={ExploreTabs} />
      <Tab.Screen name="Wishlists" component={WishlistsScreen} />
      <Tab.Screen name="Upcoming" component={MyTripsScreen} />
      <Tab.Screen name="Messages" component={ThreadsListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthScreens() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerBackButtonDisplayMode: "minimal", headerTintColor: colors.text.primary }}>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthScreens} options={{ headerShown: false }} />
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "" }} />
        <Stack.Screen name="GuideServiceDetail" component={GuideServiceDetailScreen} options={{ title: "" }} />
        <Stack.Screen name="CommunityPostDetail" component={CommunityPostDetailScreen} options={{ title: "Post" }} />
        <Stack.Screen name="BookEquipment" component={BookEquipmentScreen} options={{ title: "Book Equipment" }} />
        <Stack.Screen name="BookGuide" component={BookGuideScreen} options={{ title: "Book Guide" }} />
        <Stack.Screen name="WishlistDetail" component={WishlistDetailScreen} options={({ route }) => ({ title: (route.params as any)?.name || "Wishlist" })} />
        <Stack.Screen name="MyEquipment" component={MyEquipmentScreen} options={{ title: "My Equipment" }} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: "New Listing" }} />
        <Stack.Screen name="EditListing" component={EditListingScreen} options={{ title: "Edit Listing" }} />
        <Stack.Screen name="CreateGuideService" component={CreateGuideServiceScreen} options={{ title: "New Guide Service" }} />
        <Stack.Screen name="ThreadDetail" component={ThreadDetailScreen} options={({ route }) => ({ title: (route.params as any)?.title || "Conversation" })} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
        <Stack.Screen name="BecomeGuide" component={BecomeGuideScreen} options={{ title: "Become a Guide" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
