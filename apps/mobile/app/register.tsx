import { messages } from "@obrametrik/i18n";
import { Link } from "expo-router";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { AuthForm } from "../src/auth/auth-form";
import { getDeviceLocale } from "../src/lib/i18n";
export default function RegisterScreen() {
  const t = messages[getDeviceLocale()];
  return (
    <SafeAreaView style={styles.root}>
      <Text accessibilityRole="header" style={styles.title}>{t.register}</Text>
      <Text style={styles.intro}>{t.registerIntro}</Text>
      <AuthForm mode="register" />
      <Link href="/login" style={styles.link}>{t.login}</Link>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, gap: 12, padding: 24, backgroundColor: "#f7f5ef" },
  title: { fontSize: 36, fontWeight: "700" },
  intro: { fontSize: 17, marginBottom: 12 },
  link: { color: "#d85c2f", paddingVertical: 16, textAlign: "center" },
});
