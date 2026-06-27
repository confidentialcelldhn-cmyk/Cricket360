import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, FormInput } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { UserRole } from "@/types";

type RoleTab = { role: UserRole; label: string };

const ROLE_TABS: RoleTab[] = [
  { role: "admin", label: "Admin" },
  { role: "coach", label: "Coach" },
  { role: "student", label: "Student / Parent" },
];

export default function LoginScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>("coach");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginId.trim() || !password.trim()) {
      setError("Please enter your mobile number and password.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await login(loginId.trim(), password, activeRole);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed.");
    }
    // navigation handled by _layout.tsx auth guard
  };

  const handleTabSwitch = (role: UserRole) => {
    setActiveRole(role);
    setLoginId("");
    setPassword("");
    setError("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: c.primary050 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Hero Panel */}
        <LinearGradient
          colors={["#0A1628", "#1A3A6E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 32 }]}
        >
          {/* Cricket icon */}
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <Feather name="activity" size={28} color={c.accentGold} />
            </View>
          </View>
          <Text style={styles.brandName}>Cricket360</Text>
          <Text style={styles.tagline}>Divisional Sports Association, Dhanbad</Text>
        </LinearGradient>

        {/* Content Panel */}
        <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          {/* Role Tab Switcher */}
          <View style={[styles.tabContainer, { backgroundColor: c.primary100 }]}>
            {ROLE_TABS.map((tab) => (
              <Pressable
                key={tab.role}
                style={[
                  styles.tab,
                  activeRole === tab.role && {
                    backgroundColor: c.primary600,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
                onPress={() => handleTabSwitch(tab.role)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeRole === tab.role ? "#fff" : c.textSecondary },
                    activeRole === tab.role && { fontFamily: "Inter_600SemiBold" },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Login Card */}
          <View style={[styles.card, { backgroundColor: c.surfaceWhite }]}>
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>
              Sign in as{" "}
              <Text style={{ color: c.primary600, fontFamily: "Inter_600SemiBold" }}>
                {ROLE_TABS.find((t) => t.role === activeRole)?.label}
              </Text>
            </Text>

            <View style={{ gap: 14, marginTop: 20 }}>
              <FormInput
                label="Mobile Number"
                value={loginId}
                onChangeText={setLoginId}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                autoCapitalize="none"
                icon="phone"
              />
              <FormInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry
                autoCapitalize="none"
                icon="lock"
              />
            </View>

            {error ? (
              <View style={[styles.errorBanner, { borderColor: c.accentRed }]}>
                <Feather name="alert-circle" size={16} color={c.accentRed} />
                <Text style={[styles.errorText, { color: c.accentRed }]}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 24 }}>
              <Button
                onPress={handleLogin}
                label="Sign In"
                fullWidth
                loading={loading}
                size="lg"
              />
            </View>

            <Pressable style={{ alignItems: "center", marginTop: 16 }}>
              <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" }}>
                Forgot password?{" "}
                <Text style={{ color: c.primary500 }}>Contact your Admin</Text>
              </Text>
            </Pressable>
          </View>

          {/* Demo hint */}
          <View style={styles.demoHint}>
            <Text style={[styles.demoText, { color: c.textDisabled }]}>
              Admin: 9999999999 / Admin@123
            </Text>
            <Text style={[styles.demoText, { color: c.textDisabled }]}>
              Coach: 9876543210 / Coach@123
            </Text>
            <Text style={[styles.demoText, { color: c.textDisabled }]}>
              Student: 9811111111 / Student@123
            </Text>
          </View>

          <Text style={[styles.footer, { color: c.textDisabled }]}>v1.0 · Cricket360</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 220,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iconRow: { marginBottom: 10 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245,158,11,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(245,158,11,0.3)",
  },
  brandName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  demoHint: { marginTop: 16, alignItems: "center", gap: 2 },
  demoText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 20,
  },
});
