import { messages } from "@obrametrik/i18n";
import { surfaceWorkScopeSchema } from "@obrametrik/validation";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../../../src/auth/auth-provider";
import { Button, Card, Field } from "../../../../../src/components/ui";
import { getDeviceLocale } from "../../../../../src/lib/i18n";
import { supabase } from "../../../../../src/lib/supabase";
import { theme } from "../../../../../src/theme";

type ExistingFinish = "paint" | "tile" | "plaster" | "drywall" | "concrete" | "wood" | "unknown" | "other";
type Condition = "good" | "minor_damage" | "damaged" | "damp" | "unknown";
type Exposure = "dry" | "occasional" | "wet";
type Work = "paint" | "tile" | "plaster" | "wallpaper" | "repair" | "waterproof" | "replace" | "leave_as_is" | "other";
type Scope = {
  condition: Condition;
  desired_works: Work[];
  existing_finish: ExistingFinish;
  id: string;
  notes: string | null;
  remove_existing: boolean;
  water_exposure: Exposure;
};

export default function SurfaceScopeScreen() {
  const { projectId, surfaceId } = useLocalSearchParams<{ projectId: string; surfaceId: string }>();
  const { loading: authLoading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const [scopeId, setScopeId] = useState<string>();
  const [surfaceName, setSurfaceName] = useState("");
  const [existingFinish, setExistingFinish] = useState<ExistingFinish>("unknown");
  const [condition, setCondition] = useState<Condition>("unknown");
  const [exposure, setExposure] = useState<Exposure>("dry");
  const [removeExisting, setRemoveExisting] = useState(false);
  const [works, setWorks] = useState<Work[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const finishOptions = useMemo(() => [
    ["paint", t.finishPaint], ["tile", t.finishTile], ["plaster", t.finishPlaster],
    ["drywall", t.finishDrywall], ["concrete", t.finishConcrete], ["wood", t.finishWood],
    ["unknown", t.unknownAnswer], ["other", t.other],
  ] as [ExistingFinish, string][], [t]);
  const conditionOptions = useMemo(() => [
    ["good", t.conditionGood], ["minor_damage", t.conditionMinorDamage],
    ["damaged", t.conditionDamaged], ["damp", t.conditionDamp], ["unknown", t.unknownAnswer],
  ] as [Condition, string][], [t]);
  const exposureOptions = useMemo(() => [
    ["dry", t.exposureDry], ["occasional", t.exposureOccasional], ["wet", t.exposureWet],
  ] as [Exposure, string][], [t]);
  const workOptions = useMemo(() => [
    ["paint", t.workPaint], ["tile", t.workTile], ["plaster", t.workPlaster],
    ["wallpaper", t.workWallpaper], ["repair", t.workRepair],
    ["waterproof", t.workWaterproof], ["replace", t.workReplace],
    ["leave_as_is", t.workLeaveAsIs], ["other", t.other],
  ] as [Work, string][], [t]);

  const loadScope = useCallback(async () => {
    if (!surfaceId) return;
    const [{ data: surface, error: surfaceError }, { data: scope, error: scopeError }] =
      await Promise.all([
        supabase.from("surfaces").select("name").eq("id", surfaceId).maybeSingle(),
        supabase
          .from("surface_work_scopes")
          .select("id,existing_finish,condition,water_exposure,remove_existing,desired_works,notes")
          .eq("surface_id", surfaceId)
          .maybeSingle(),
      ]);
    if (surfaceError || scopeError || !surface) setError(t.genericError);
    else {
      setSurfaceName(surface.name);
      if (scope) {
        const value = scope as Scope;
        setScopeId(value.id);
        setExistingFinish(value.existing_finish);
        setCondition(value.condition);
        setExposure(value.water_exposure);
        setRemoveExisting(value.remove_existing);
        setWorks(value.desired_works);
        setNotes(value.notes ?? "");
      }
    }
    setLoading(false);
  }, [surfaceId, t.genericError]);

  useEffect(() => {
    if (user) void loadScope();
  }, [loadScope, user]);

  const parsed = surfaceWorkScopeSchema.safeParse({
    condition,
    desiredWorks: works,
    existingFinish,
    notes: notes || undefined,
    removeExisting,
    surfaceId,
    waterExposure: exposure,
  });

  function toggleWork(work: Work) {
    setWorks((current) => {
      if (work === "leave_as_is") return current.includes(work) ? [] : [work];
      const withoutLeave = current.filter((item) => item !== "leave_as_is");
      return withoutLeave.includes(work)
        ? withoutLeave.filter((item) => item !== work)
        : [...withoutLeave, work];
    });
  }

  async function saveScope() {
    if (!user || !parsed.success) {
      setError(t.invalidForm);
      return;
    }
    setSaving(true);
    setError(undefined);
    const payload = {
      condition: parsed.data.condition,
      desired_works: parsed.data.desiredWorks,
      existing_finish: parsed.data.existingFinish,
      notes: parsed.data.notes,
      remove_existing: parsed.data.removeExisting,
      surface_id: parsed.data.surfaceId,
      water_exposure: parsed.data.waterExposure,
    };
    const result = scopeId
      ? await supabase.from("surface_work_scopes").update(payload).eq("id", scopeId)
      : await supabase.from("surface_work_scopes").insert({ ...payload, created_by: user.id });
    if (result.error) {
      setError(t.workScopeSaveError);
      setSaving(false);
      return;
    }
    router.replace({ pathname: "/projects/[projectId]", params: { projectId } });
  }

  if (authLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!user) return <Redirect href="/login" />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
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
        <Text style={styles.eyebrow}>{surfaceName.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={styles.title}>{t.defineWork}</Text>
        {loading ? <View style={styles.center}><ActivityIndicator color={theme.colors.brand} /></View> : (
          <>
            <QuestionCard
              options={finishOptions}
              onSelect={setExistingFinish}
              selected={[existingFinish]}
              title={t.currentFinishQuestion}
            />
            <QuestionCard
              options={conditionOptions}
              onSelect={setCondition}
              selected={[condition]}
              title={t.surfaceConditionQuestion}
            />
            <QuestionCard
              options={exposureOptions}
              onSelect={setExposure}
              selected={[exposure]}
              title={t.waterExposureQuestion}
            />
            <QuestionCard
              helper={t.selectAllThatApply}
              multiple
              options={workOptions}
              onSelect={toggleWork}
              selected={works}
              title={t.desiredWorkQuestion}
            />
            <QuestionCard
              options={[["false", t.noKeep], ["true", t.yesRemove]]}
              onSelect={(value) => setRemoveExisting(value === "true")}
              selected={[String(removeExisting)]}
              title={t.removeExistingQuestion}
            />
            <Card style={styles.question}>
              <Field
                label={t.additionalNotes}
                maxLength={1000}
                multiline
                onChangeText={setNotes}
                value={notes}
              />
            </Card>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Button disabled={!parsed.success} loading={saving} onPress={saveScope}>
              {t.saveWorkScope}
            </Button>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function QuestionCard<T extends string>({
  helper,
  multiple,
  onSelect,
  options,
  selected,
  title,
}: {
  helper?: string;
  multiple?: boolean;
  onSelect: (value: T) => void;
  options: [T, string][];
  selected: string[];
  title: string;
}) {
  return (
    <Card style={styles.question}>
      <Text style={styles.questionTitle}>{title}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <View style={styles.options}>
        {options.map(([value, label]) => {
          const active = selected.includes(value);
          return (
            <Pressable
              accessibilityRole={multiple ? "checkbox" : "radio"}
              accessibilityState={multiple ? { checked: active } : { selected: active }}
              key={value}
              onPress={() => onSelect(value)}
              style={[styles.option, active && styles.optionActive]}
            >
              <View style={[styles.indicator, active && styles.indicatorActive]}>
                {active ? <Text style={styles.check}>✓</Text> : null}
              </View>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  content: { gap: 16, paddingHorizontal: 22 },
  center: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 220 },
  back: { alignItems: "flex-start", marginBottom: 10 },
  eyebrow: { color: theme.colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: theme.colors.ink, fontSize: 36, fontWeight: "800", letterSpacing: -1.4, marginBottom: 6, marginTop: 5 },
  question: { elevation: 1, padding: 20 },
  questionTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: "800", lineHeight: 24 },
  helper: { color: theme.colors.muted, fontSize: 13, marginTop: 5 },
  options: { gap: 9, marginTop: 16 },
  option: { alignItems: "center", borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 50, paddingHorizontal: 13, paddingVertical: 8 },
  optionActive: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  indicator: { alignItems: "center", borderColor: theme.colors.concrete, borderRadius: 8, borderWidth: 2, height: 24, justifyContent: "center", width: 24 },
  indicatorActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  check: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  optionLabel: { color: theme.colors.ink, flex: 1, fontSize: 14, fontWeight: "600" },
  optionLabelActive: { fontWeight: "800" },
  error: { backgroundColor: "#FFF0EC", borderRadius: 16, color: theme.colors.danger, padding: 14 },
});
