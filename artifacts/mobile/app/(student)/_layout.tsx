import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeStudentTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="student-home">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schedule">
        <Icon sf={{ default: "calendar", selected: "calendar" }} />
        <Label>Schedule</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="student-performance">
        <Icon sf={{ default: "chart.radar", selected: "chart.radar" }} />
        <Label>Progress</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="payment">
        <Icon sf={{ default: "indianrupeesign.circle", selected: "indianrupeesign.circle.fill" }} />
        <Label>Pay</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="student-profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicStudentTabs() {
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
      <Tabs.Screen name="student-home" options={{ title: "Home", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="calendar" tintColor={color} size={22} /> : <Feather name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="student-performance" options={{ title: "Progress", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="chart.bar" tintColor={color} size={22} /> : <Feather name="activity" size={22} color={color} /> }} />
      <Tabs.Screen name="payment" options={{ title: "Pay", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="creditcard" tintColor={color} size={22} /> : <Feather name="dollar-sign" size={22} color={color} /> }} />
      <Tabs.Screen name="student-profile" options={{ title: "Profile", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.circle" tintColor={color} size={22} /> : <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function StudentLayout() {
  if (isLiquidGlassAvailable()) return <NativeStudentTabs />;
  return <ClassicStudentTabs />;
}
