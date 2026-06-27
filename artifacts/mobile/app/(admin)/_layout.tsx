import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeAdminTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="students">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Students</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="coaches">
        <Icon sf={{ default: "person.badge.plus", selected: "person.badge.plus" }} />
        <Label>Coaches</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="batches">
        <Icon sf={{ default: "square.stack.3d.up", selected: "square.stack.3d.up.fill" }} />
        <Label>Batches</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicAdminTabs() {
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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Students",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.2" tintColor={color} size={22} /> : <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="coaches"
        options={{
          title: "Coaches",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.badge.plus" tintColor={color} size={22} /> : <Feather name="user-check" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="batches"
        options={{
          title: "Batches",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="square.stack.3d.up" tintColor={color} size={22} /> : <Feather name="layers" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="gearshape" tintColor={color} size={22} /> : <Feather name="settings" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function AdminLayout() {
  if (isLiquidGlassAvailable()) return <NativeAdminTabs />;
  return <ClassicAdminTabs />;
}
