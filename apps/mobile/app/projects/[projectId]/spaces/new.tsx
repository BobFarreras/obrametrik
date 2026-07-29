import { messages } from "@obrametrik/i18n";
import { createRoomSchema } from "@obrametrik/validation";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
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
import { useAuth } from "../../../../src/auth/auth-provider";
import { Button, Card, Field } from "../../../../src/components/ui";
import { getDeviceLocale } from "../../../../src/lib/i18n";
import { supabase } from "../../../../src/lib/supabase";
import { theme } from "../../../../src/theme";

type RoomKind = "bathroom" | "bedroom" | "hallway" | "kitchen" | "living_room" | "other";

export default function NewSpaceScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { loading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<RoomKind>("bathroom");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const kinds = useMemo(
    () => [
      { label: t.bathroom, value: "bathroom" as const },
      { label: t.kitchen, value: "kitchen" as const },
      { label: t.bedroom, value: "bedroom" as const },
      { label: t.livingRoom, value: "living_room" as const },
      { label: t.hallway, value: "hallway" as const },
      { label: t.other, value: "other" as const },
    ],
    [t],
  );

  const parsed = createRoomSchema.safeParse({
    heightCm,
    kind,
    lengthCm,
    name,
    projectId,
    widthCm,
  });

  async function submitSpace() {
    if (!user || !parsed.success) {
      setError(t.invalidForm);
      return;
    }
    setError(undefined);
    setSaving(true);
    const { error: createError } = await supabase.from("rooms").insert({
      created_by: user.id,
      height_m: parsed.data.heightCm / 100,
      kind: parsed.data.kind,
      length_m: parsed.data.lengthCm / 100,
      name: parsed.data.name,
      project_id: parsed.data.projectId,
      width_m: parsed.data.widthCm / 100,
    });
    if (createError) {
      setError(t.spaceCreateError);
      setSaving(false);
      return;
    }
    router.replace({
      pathname: "/projects/[projectId]",
      params: { projectId },
    });
  }

  if (loading) return <View style={styles.center}><Text>{t.sessionLoading}</Text></View>;
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
        <View style={styles.cancel}>
          <Button onPress={() => router.back()} variant="danger">{t.cancel}</Button>
        </View>
        <Text style={styles.step}>01 / 02</Text>
        <Text accessibilityRole="header" style={styles.title}>{t.newSpace}</Text>
        <Text style={styles.copy}>{t.dimensionsHelp}</Text>

        <Card style={styles.card}>
          <Field
            label={t.roomName}
            maxLength={120}
            onChangeText={setName}
            placeholder={t.spaceNameExample}
            value={name}
          />
          <Text style={styles.label}>{t.selectSpaceType}</Text>
          <View accessibilityRole="radiogroup" style={styles.kindGrid}>
            {kinds.map((item) => {
              const selected = kind === item.value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={item.value}
                  onPress={() => setKind(item.value)}
                  style={[styles.kind, selected && styles.kindSelected]}
                >
                  <RoomKindGlyph kind={item.value} selected={selected} />
                  <Text style={[styles.kindLabel, selected && styles.kindLabelSelected]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Text style={styles.step}>02 / 02</Text>
        <Text style={styles.sectionTitle}>{t.dimensionsStep}</Text>
        <Card style={styles.card}>
          <View style={styles.planPreview}>
            <View style={styles.planRoom}>
              <Text style={styles.planValue}>
                {lengthCm || "—"} × {widthCm || "—"} cm
              </Text>
            </View>
          </View>
          <Field
            keyboardType="decimal-pad"
            label={t.roomLength}
            onChangeText={setLengthCm}
            placeholder="300"
            unit="cm"
            value={lengthCm}
          />
          <Field
            keyboardType="decimal-pad"
            label={t.roomWidth}
            onChangeText={setWidthCm}
            placeholder="240"
            unit="cm"
            value={widthCm}
          />
          <Field
            keyboardType="decimal-pad"
            label={t.roomHeight}
            onChangeText={setHeightCm}
            placeholder="250"
            unit="cm"
            value={heightCm}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.action}>
            <Button disabled={!parsed.success} loading={saving} onPress={submitSpace}>
              {t.createSpace}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoomKindGlyph({ kind, selected }: { kind: RoomKind; selected: boolean }) {
  const color = selected ? theme.colors.ink : theme.colors.brand;
  const wide = kind === "living_room" || kind === "hallway";
  return (
    <View style={[styles.kindGlyph, { borderColor: color }, wide && styles.kindGlyphWide]}>
      <View style={[styles.kindGlyphDetail, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { paddingHorizontal: 22 },
  cancel: { alignItems: "flex-start", marginBottom: 26 },
  step: { color: theme.colors.brand, fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: 8 },
  title: { color: theme.colors.ink, fontSize: 36, fontWeight: "800", letterSpacing: -1.4, lineHeight: 40, marginTop: 8 },
  copy: { color: theme.colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10 },
  card: { marginBottom: 28, marginTop: 20 },
  label: { color: theme.colors.ink, fontSize: 14, fontWeight: "700", marginBottom: 10, marginTop: 22 },
  kindGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kind: { alignItems: "center", backgroundColor: theme.colors.canvas, borderColor: theme.colors.border, borderRadius: 18, borderWidth: 1, flexBasis: "47%", flexGrow: 1, gap: 9, minHeight: 92, padding: 12 },
  kindSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  kindLabel: { color: theme.colors.brand, fontSize: 13, fontWeight: "700", textAlign: "center" },
  kindLabelSelected: { color: theme.colors.ink, fontWeight: "800" },
  kindGlyph: { borderRadius: 2, borderWidth: 2, height: 24, position: "relative", width: 27 },
  kindGlyphWide: { width: 34 },
  kindGlyphDetail: { bottom: 4, height: 2, left: 4, position: "absolute", width: 10 },
  sectionTitle: { color: theme.colors.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.7, marginTop: 6 },
  planPreview: { backgroundColor: theme.colors.brand, borderRadius: 18, height: 150, padding: 24 },
  planRoom: { alignItems: "center", borderColor: theme.colors.accent, borderWidth: 4, flex: 1, justifyContent: "center" },
  planValue: { color: theme.colors.surface, fontSize: 15, fontWeight: "800" },
  error: { color: theme.colors.danger, marginTop: 16 },
  action: { marginTop: 24 },
});
