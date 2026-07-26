import { messages } from "@obrametrik/i18n";
import { createMeasurementSchema } from "@obrametrik/validation";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../../../../src/auth/auth-provider";
import { Button, Card, Field } from "../../../../../../src/components/ui";
import { getDeviceLocale } from "../../../../../../src/lib/i18n";
import { supabase } from "../../../../../../src/lib/supabase";
import { theme } from "../../../../../../src/theme";

type Surface = {
  gross_area_m2: number;
  height_m: number;
  id: string;
  name: string;
  width_m: number;
};

export default function NewOpeningScreen() {
  const { projectId, surfaceId } = useLocalSearchParams<{
    projectId: string;
    surfaceId: string;
  }>();
  const { loading: authLoading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const [surface, setSurface] = useState<Surface>();
  const [currentDeductions, setCurrentDeductions] = useState(0);
  const [label, setLabel] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const loadSurface = useCallback(async () => {
    if (!surfaceId) return;
    const [{ data: surfaceData, error: surfaceError }, { data: adjustments, error: adjustmentError }] =
      await Promise.all([
        supabase
          .from("surfaces")
          .select("id,name,width_m,height_m,gross_area_m2")
          .eq("id", surfaceId)
          .maybeSingle(),
        supabase
          .from("measurements")
          .select("operation,area_m2")
          .eq("surface_id", surfaceId),
      ]);
    if (surfaceError || adjustmentError || !surfaceData) setError(t.genericError);
    else {
      setSurface(surfaceData as Surface);
      setCurrentDeductions(
        (adjustments ?? []).reduce(
          (total, item) =>
            total + (item.operation === "subtract" ? Number(item.area_m2) : -Number(item.area_m2)),
          0,
        ),
      );
    }
    setLoading(false);
  }, [surfaceId, t.genericError]);

  useEffect(() => {
    if (user) void loadSurface();
  }, [loadSurface, user]);

  const parsed = createMeasurementSchema.safeParse({
    heightM: Number(heightCm) / 100,
    label,
    operation: "subtract",
    surfaceId,
    widthM: Number(widthCm) / 100,
  });
  const openingArea = parsed.success ? parsed.data.widthM * parsed.data.heightM : 0;
  const availableArea = Number(surface?.gross_area_m2 ?? 0) - currentDeductions;
  const exceedsSurface = openingArea > availableArea;

  async function submitOpening() {
    if (!user || !parsed.success || exceedsSurface) {
      setError(exceedsSurface ? t.netAreaError : t.invalidForm);
      return;
    }
    setError(undefined);
    setSaving(true);
    const { error: createError } = await supabase.from("measurements").insert({
      created_by: user.id,
      height_m: parsed.data.heightM,
      label: parsed.data.label,
      operation: parsed.data.operation,
      surface_id: parsed.data.surfaceId,
      width_m: parsed.data.widthM,
    });
    if (createError) {
      setError(t.openingCreateError);
      setSaving(false);
      return;
    }
    router.replace({
      pathname: "/projects/[projectId]",
      params: { projectId },
    });
  }

  if (authLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!user) return <Redirect href="/login" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 20, paddingTop: Math.max(insets.top, 18) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.back}>
          <Button onPress={() => router.back()} variant="danger">{t.backToProject}</Button>
        </View>
        <Text style={styles.eyebrow}>{t.openings.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={styles.title}>{t.newOpening}</Text>
        <Text style={styles.copy}>{t.openingHelp}</Text>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={theme.colors.brand} /></View>
        ) : !surface ? (
          <Text accessibilityRole="alert" style={styles.error}>{error ?? t.genericError}</Text>
        ) : (
          <>
            <Card style={styles.surfaceSummary}>
              <View style={styles.wallPreview}>
                <View
                  style={[
                    styles.openingPreview,
                    {
                      height: Math.min(90, Math.max(18, Number(heightCm || 40) / 3)),
                      width: Math.min(100, Math.max(18, Number(widthCm || 40) / 3)),
                    },
                  ]}
                />
              </View>
              <Text style={styles.surfaceName}>{surface.name}</Text>
              <Text style={styles.surfaceMeta}>
                {Number(surface.width_m) * 100} × {Number(surface.height_m) * 100} cm · {t.netArea}:{" "}
                {availableArea.toFixed(2)} m²
              </Text>
            </Card>

            <Card style={styles.form}>
              <Field
                label={t.openingName}
                maxLength={120}
                onChangeText={setLabel}
                placeholder={t.newOpening}
                value={label}
              />
              <Field
                keyboardType="decimal-pad"
                label={t.openingWidth}
                onChangeText={setWidthCm}
                placeholder="80"
                unit="cm"
                value={widthCm}
              />
              <Field
                keyboardType="decimal-pad"
                label={t.openingHeight}
                onChangeText={setHeightCm}
                placeholder="210"
                unit="cm"
                value={heightCm}
              />
              {parsed.success ? (
                <View style={[styles.calculation, exceedsSurface && styles.calculationError]}>
                  <Text style={styles.calculationLabel}>{t.deductions}</Text>
                  <Text style={styles.calculationValue}>− {openingArea.toFixed(2)} m²</Text>
                </View>
              ) : null}
              {exceedsSurface ? <Text accessibilityRole="alert" style={styles.error}>{t.netAreaError}</Text> : null}
              {error && !exceedsSurface ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <View style={styles.action}>
                <Button
                  disabled={!parsed.success || exceedsSurface}
                  loading={saving}
                  onPress={submitOpening}
                >
                  {t.createOpening}
                </Button>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  content: { paddingHorizontal: 22 },
  center: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 220 },
  back: { alignItems: "flex-start", marginBottom: 26 },
  eyebrow: { color: theme.colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: theme.colors.ink, fontSize: 36, fontWeight: "800", letterSpacing: -1.4, marginTop: 8 },
  copy: { color: theme.colors.muted, fontSize: 16, lineHeight: 23, marginTop: 9 },
  surfaceSummary: { marginTop: 24 },
  wallPreview: { alignItems: "center", backgroundColor: theme.colors.brand, borderRadius: 16, height: 150, justifyContent: "flex-end", overflow: "hidden" },
  openingPreview: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent, borderWidth: 3 },
  surfaceName: { color: theme.colors.ink, fontSize: 18, fontWeight: "800", marginTop: 16 },
  surfaceMeta: { color: theme.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  form: { marginTop: 18 },
  calculation: { alignItems: "center", backgroundColor: theme.colors.accentSoft, borderRadius: 16, flexDirection: "row", justifyContent: "space-between", marginTop: 20, padding: 14 },
  calculationError: { backgroundColor: "#FFF0EC" },
  calculationLabel: { color: theme.colors.muted, fontSize: 13 },
  calculationValue: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  error: { color: theme.colors.danger, lineHeight: 19, marginTop: 14 },
  action: { marginTop: 24 },
});
