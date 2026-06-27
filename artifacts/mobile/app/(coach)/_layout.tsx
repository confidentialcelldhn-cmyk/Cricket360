import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeCoachTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="attendance">
        <Icon sf={{ default: "checkmark.circle", selected: "checkmark.circle.fill" }} />
        <Label>Attend</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="performance">
        <Icon sf={{ default: "star", selected: "star.fill" }} />
        <Label>Perf</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fees">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Fees</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="roster">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Students</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicCoachTabs() {
  const c = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary600,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : c.surfaceWhite,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: c.borderSubtle,
          elevation: 0,
          height: isWeb ? 84 : 64,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surfaceWhite }]} />
          ) : null,
        tabBarLabelStyle: { fontSize: 11, fontFamily: "Inter_500Medium" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="attendance" options={{ title: "Attend", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="checkmark.circle" tintColor={color} size={22} /> : <Feather name="check-square" size={22} color={color} /> }} />
      <Tabs.Screen name="performance" options={{ title: "Perf", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="star" tintColor={color} size={22} /> : <Feather name="star" size={22} color={color} /> }} />
      <Tabs.Screen name="fees" options={{ title: "Fees", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="creditcard" tintColor={color} size={22} /> : <Feather name="credit-card" size={22} color={color} /> }} />
      <Tabs.Screen name="roster" options={{ title: "Students", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.2" tintColor={color} size={22} /> : <Feather name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.circle" tintColor={color} size={22} /> : <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function CoachLayout() {
  if (isLiquidGlassAvailable()) return <NativeCoachTabs />;
  return <ClassicCoachTabs />;
}
