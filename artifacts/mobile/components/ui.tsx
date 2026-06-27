import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outdoor";

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  size?: "sm" | "md" | "lg";
}

export function Button({
  onPress,
  label,
  variant = "primary",
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  size = "md",
}: ButtonProps) {
  const c = useColors();

  const bgMap: Record<ButtonVariant, string> = {
    primary: c.primary500,
    secondary: "transparent",
    ghost: "transparent",
    danger: c.accentRed,
    outdoor: c.outdoorPresent,
  };

  const textMap: Record<ButtonVariant, string> = {
    primary: "#fff",
    secondary: c.primary500,
    ghost: c.primary500,
    danger: "#fff",
    outdoor: "#000",
  };

  const borderMap: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: c.primary500,
    ghost: undefined,
    danger: undefined,
    outdoor: undefined,
  };

  const heights: Record<string, number> = { sm: 40, md: 48, lg: 56 };
  const fontSizes: Record<string, number> = { sm: 14, md: 16, lg: 18 };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bgMap[variant],
          borderWidth: borderMap[variant] ? 1.5 : 0,
          borderColor: borderMap[variant],
          borderRadius: c.radius,
          height: heights[size],
          paddingHorizontal: 20,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          flexDirection: "row" as const,
          gap: 8,
          opacity: pressed ? 0.8 : disabled || loading ? 0.4 : 1,
          width: fullWidth ? "100%" : undefined,
          minWidth: 80,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textMap[variant]} size="small" />
      ) : (
        <>
          {icon && (
            <Feather name={icon} size={fontSizes[size] + 2} color={textMap[variant]} />
          )}
          <Text
            style={{
              color: textMap[variant],
              fontSize: fontSizes[size],
              fontWeight: "600",
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
  accentColor?: string;
}

export function Card({ children, style, onPress, accentColor }: CardProps) {
  const c = useColors();
  const containerStyle = {
    backgroundColor: c.surfaceCard,
    borderRadius: c.radius + 4,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    padding: 16,
    ...(accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : {}),
    ...style,
  };

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [containerStyle, pressed && { opacity: 0.85 }]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

type BadgeStatus =
  | "Paid" | "Pending" | "Unpaid" | "Rejected"
  | "Present" | "Absent" | "Late" | "Unmarked"
  | "Active" | "Inactive" | "Review"
  | "Practice" | "Match" | "Tournament";

interface BadgeProps {
  status: BadgeStatus | string;
  size?: "sm" | "md";
}

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Paid: { bg: "rgba(16,185,129,0.12)", text: "#059669", border: "rgba(16,185,129,0.3)" },
  Present: { bg: "rgba(16,185,129,0.12)", text: "#059669", border: "rgba(16,185,129,0.3)" },
  Active: { bg: "rgba(16,185,129,0.12)", text: "#059669", border: "rgba(16,185,129,0.3)" },
  Approved: { bg: "rgba(16,185,129,0.12)", text: "#059669", border: "rgba(16,185,129,0.3)" },
  Practice: { bg: "rgba(37,99,235,0.1)", text: "#1E4DA1", border: "rgba(37,99,235,0.2)" },
  Pending: { bg: "rgba(217,119,6,0.12)", text: "#B45309", border: "rgba(217,119,6,0.3)" },
  Late: { bg: "rgba(217,119,6,0.12)", text: "#B45309", border: "rgba(217,119,6,0.3)" },
  Review: { bg: "rgba(217,119,6,0.12)", text: "#B45309", border: "rgba(217,119,6,0.3)" },
  Absent: { bg: "rgba(239,68,68,0.12)", text: "#DC2626", border: "rgba(239,68,68,0.3)" },
  Rejected: { bg: "rgba(239,68,68,0.12)", text: "#DC2626", border: "rgba(239,68,68,0.3)" },
  Unpaid: { bg: "rgba(239,68,68,0.12)", text: "#DC2626", border: "rgba(239,68,68,0.3)" },
  Inactive: { bg: "rgba(148,163,184,0.15)", text: "#64748B", border: "rgba(148,163,184,0.3)" },
  Unmarked: { bg: "rgba(148,163,184,0.15)", text: "#64748B", border: "rgba(148,163,184,0.3)" },
  Match: { bg: "rgba(124,58,237,0.12)", text: "#6D28D9", border: "rgba(124,58,237,0.3)" },
  Tournament: { bg: "rgba(124,58,237,0.12)", text: "#6D28D9", border: "rgba(124,58,237,0.3)" },
};

export function StatusBadge({ status, size = "sm" }: BadgeProps) {
  const colors = BADGE_COLORS[status] ?? BADGE_COLORS.Unmarked;
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 999,
        paddingHorizontal: size === "sm" ? 8 : 12,
        paddingVertical: size === "sm" ? 2 : 4,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: size === "sm" ? 11 : 13,
          fontWeight: "600",
          fontFamily: "Inter_600SemiBold",
          letterSpacing: 0.3,
        }}
      >
        {status}
      </Text>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  size?: number;
  uri?: string;
}

export function Avatar({ name, size = 40, uri }: AvatarProps) {
  const c = useColors();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.primary700,
        borderWidth: 2,
        borderColor: c.primary100,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{
            color: "#fff",
            fontSize: size * 0.36,
            fontWeight: "700",
            fontFamily: "Inter_700Bold",
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

// ─── Form Input ───────────────────────────────────────────────────────────────

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "number-pad" | "phone-pad" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
  multiline?: boolean;
  editable?: boolean;
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "sentences",
  icon,
  error,
  multiline = false,
  editable = true,
}: FormInputProps) {
  const c = useColors();
  const [focused, setFocused] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View style={{ marginBottom: 4 }}>
      <Text
        style={{
          fontSize: 12,
          color: focused ? c.primary600 : c.textSecondary,
          fontWeight: "500",
          fontFamily: "Inter_500Medium",
          marginBottom: 4,
          letterSpacing: 0.3,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          backgroundColor: focused ? "#fff" : c.primary100,
          borderRadius: c.radius,
          borderWidth: 1.5,
          borderColor: error ? c.accentRed : focused ? c.primary500 : "transparent",
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          minHeight: multiline ? 100 : 52,
        }}
      >
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={focused ? c.primary600 : c.textDisabled}
            style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }}
          />
        )}
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            color: editable ? c.textPrimary : c.textSecondary,
            fontFamily: "Inter_400Regular",
            height: multiline ? undefined : 52,
            textAlignVertical: multiline ? "top" : "center",
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textDisabled}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          editable={editable}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword((p) => !p)}>
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={18}
              color={c.textDisabled}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text
          style={{
            color: c.accentRed,
            fontSize: 12,
            marginTop: 4,
            fontFamily: "Inter_400Regular",
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ value, onChange, size = 32, readonly = false }: StarRatingProps) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
          hitSlop={8}
        >
          <Feather
            name={star <= value ? "star" : "star"}
            size={size}
            color={star <= value ? "#F59E0B" : "#D1D5DB"}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  accentColor: string;
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
}

export function StatCard({ label, value, subtext, accentColor, icon, onPress }: StatCardProps) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: c.surfaceCard,
        borderRadius: c.radius + 4,
        borderWidth: 1,
        borderColor: c.borderSubtle,
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
        padding: 14,
        opacity: pressed ? 0.85 : 1,
        minWidth: 130,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text
          style={{
            fontSize: 11,
            color: c.textSecondary,
            fontWeight: "500",
            fontFamily: "Inter_500Medium",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Feather name={icon} size={16} color={accentColor} />
      </View>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: c.textPrimary,
          fontFamily: "Inter_700Bold",
          lineHeight: 32,
        }}
      >
        {value}
      </Text>
      {subtext && (
        <Text
          style={{
            fontSize: 11,
            color: c.textSecondary,
            fontFamily: "Inter_400Regular",
            marginTop: 2,
          }}
        >
          {subtext}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: c.textPrimary,
          fontFamily: "Inter_700Bold",
        }}
      >
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text
            style={{
              fontSize: 13,
              color: c.primary500,
              fontFamily: "Inter_500Medium",
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const c = useColors();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 40 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: c.primary100,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Feather name={icon} size={28} color={c.primary400} />
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: c.textPrimary,
          fontFamily: "Inter_600SemiBold",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 13,
            color: c.textSecondary,
            fontFamily: "Inter_400Regular",
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={{ marginTop: 16 }}>
          <Button onPress={onAction} label={actionLabel} size="sm" />
        </View>
      )}
    </View>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

export function LoadingSpinner({ color }: { color?: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={color ?? c.primary500} />
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider() {
  const c = useColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: c.borderSubtle,
        marginVertical: 12,
      }}
    />
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────

interface NotificationItemProps {
  title: string;
  message: string;
  time: string;
  unread: boolean;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
}

export function NotificationItem({ title, message, time, unread, icon = "bell", onPress }: NotificationItemProps) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 14,
        backgroundColor: unread ? c.primary050 : c.surfaceCard,
        borderRadius: c.radius,
        borderWidth: 1,
        borderColor: unread ? c.borderStrong : c.borderSubtle,
        opacity: pressed ? 0.8 : 1,
        marginBottom: 8,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: c.primary100,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={16} color={c.primary600} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: unread ? "700" : "600",
              color: c.textPrimary,
              fontFamily: unread ? "Inter_700Bold" : "Inter_600SemiBold",
              flex: 1,
            }}
          >
            {title}
          </Text>
          {unread && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: c.primary500,
                marginLeft: 8,
              }}
            />
          )}
        </View>
        <Text
          style={{
            fontSize: 12,
            color: c.textSecondary,
            fontFamily: "Inter_400Regular",
            marginTop: 2,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: c.textDisabled,
            fontFamily: "Inter_400Regular",
            marginTop: 4,
          }}
        >
          {time}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({});
