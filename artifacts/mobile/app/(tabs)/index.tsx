import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function RootIndex() {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.primary900 }}>
      <ActivityIndicator size="large" color={c.accentGold} />
    </View>
  );
}
