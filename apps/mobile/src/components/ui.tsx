import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import { theme } from "../theme";

export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  children,
  disabled,
  loading,
  onPress,
  variant = "primary",
}: PropsWithChildren<{
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.ink} />
      ) : (
        <Text style={[styles.buttonLabel, variant === "danger" && styles.dangerLabel]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  error,
  label,
  unit,
  ...inputProps
}: TextInputProps & { error?: string; label: string; unit?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputFrame, error && styles.inputError]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={theme.colors.concrete}
          style={styles.input}
          {...inputProps}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function EmptyState({
  action,
  description,
  title,
  visual,
}: {
  action?: ReactNode;
  description: string;
  title: string;
  visual?: ReactNode;
}) {
  return (
    <Card style={styles.empty}>
      {visual ? <View style={styles.visual}>{visual}</View> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    elevation: 3,
    padding: theme.spacing.xl,
    shadowColor: theme.colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  button: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: theme.spacing.xl,
  },
  primary: { backgroundColor: theme.colors.accent },
  secondary: { backgroundColor: theme.colors.brand },
  danger: { backgroundColor: "#FFF0EC" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
  buttonLabel: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  dangerLabel: { color: theme.colors.danger },
  field: { gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  label: { color: theme.colors.ink, fontSize: 14, fontWeight: "700" },
  inputFrame: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
  },
  inputError: { borderColor: theme.colors.danger, borderWidth: 2 },
  input: { color: theme.colors.ink, flex: 1, fontSize: 16, minHeight: 50 },
  unit: { color: theme.colors.muted, fontWeight: "700" },
  error: { color: theme.colors.danger, fontSize: 13 },
  empty: { alignItems: "center", minHeight: 260, justifyContent: "center" },
  visual: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    width: 72,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 20, fontWeight: "800" },
  emptyDescription: {
    color: theme.colors.muted,
    lineHeight: 21,
    marginTop: theme.spacing.sm,
    maxWidth: 300,
    textAlign: "center",
  },
});
