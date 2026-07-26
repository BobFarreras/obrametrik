import { messages } from "@obrametrik/i18n";
import { Link } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthForm } from "../src/auth/auth-form";
import { getDeviceLocale } from "../src/lib/i18n";
import { theme } from "../src/theme";
export default function RegisterScreen() {
  const t = messages[getDeviceLocale()];
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.brand}>Obrametrik<Text style={styles.dot}>·</Text></Text>
      <Text accessibilityRole="header" style={styles.title}>{t.register}</Text>
      <Text style={styles.intro}>{t.registerIntro}</Text>
      <AuthForm mode="register" />
      <Link href="/login" style={styles.link}>{t.login}</Link>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, gap: 12, justifyContent: "center", padding: 24, backgroundColor: theme.colors.canvas },
  brand: { color: theme.colors.ink, fontSize: 20, fontWeight: "800", marginBottom: 34 },
  dot: { color: theme.colors.accent },
  title: { color: theme.colors.ink, fontSize: 42, fontWeight: "700", letterSpacing: -2 },
  intro: { color: theme.colors.muted, fontSize: 17, marginBottom: 14 },
  link: { color: theme.colors.accent, paddingVertical: 18, textAlign: "center" },
});
