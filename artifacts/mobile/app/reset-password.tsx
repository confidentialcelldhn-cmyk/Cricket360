import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, FormInput } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ResetPasswordScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, changePassword, logout } = useAuth();
  const router = useRouter();

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!currentPwd || !newPwd || !confirmPwd) {
      setError("All fields are required.");
      return;
    }
    if (currentPwd !== currentUser?.password) {
      setError("Temporary password is incorrect.");
      return;
    }
    if (newPwd.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    await changePassword(newPwd);
    setLoading(false);
    // auth guard will redirect to role home
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.primary050 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        colors={["#0A1628", "#1A3A6E"]}
        style={[styles.header, { paddingTop: insets.top + 32 }]}
      >
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>
          Welcome, {currentUser?.name}! Please set a secure password to continue.
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{currentUser?.role?.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={[styles.card, { backgroundColor: c.surfaceWhite }]}>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>
            Create your password
          </Text>
          <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>
            This is a one-time setup. You cannot proceed without changing the temporary password.
          </Text>

          <View style={{ gap: 14, marginTop: 20 }}>
            <FormInput
              label="Temporary Password"
              value={currentPwd}
              onChangeText={setCurrentPwd}
              secureTextEntry
              placeholder="Enter temporary password"
              autoCapitalize="none"
              icon="lock"
            />
            <FormInput
              label="New Password"
              value={newPwd}
              onChangeText={setNewPwd}
              secureTextEntry
              placeholder="Minimum 8 characters"
              autoCapitalize="none"
              icon="key"
            />
            <FormInput
              label="Confirm New Password"
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              secureTextEntry
              placeholder="Re-enter new password"
              autoCapitalize="none"
              icon="check-circle"
            />
          </View>

          {error ? (
            <View style={[styles.errorBanner, { borderColor: c.accentRed }]}>
              <Text style={[styles.errorText, { color: c.accentRed }]}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <Button
              onPress={handleSubmit}
              label="Set Password & Continue"
              fullWidth
              loading={loading}
              size="lg"
            />
          </View>

          <Button
            onPress={() => logout()}
            label="Back to Login"
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: "rgba(245,158,11,0.2)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.4)",
  },
  roleText: {
    fontSize: 11,
    color: "#F59E0B",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  errorBanner: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
