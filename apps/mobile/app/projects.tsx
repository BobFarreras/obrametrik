import { messages } from "@obrametrik/i18n";
import { Redirect, useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text } from "react-native";
import { useAuth } from "../src/auth/auth-provider";
import { getDeviceLocale } from "../src/lib/i18n";
import { supabase } from "../src/lib/supabase";
export default function ProjectsScreen() {
  const { loading, user } = useAuth();
  const router = useRouter();
  const t = messages[getDeviceLocale()];
  if (loading) return <SafeAreaView><Text>{t.sessionLoading}</Text></SafeAreaView>;
  if (!user) return <Redirect href="/login" />;
  return (
    <SafeAreaView style={styles.root}>
      <Text accessibilityRole="header" style={styles.title}>{t.projects}</Text>
      <Text>{user.email}</Text>
      <Text>{t.emptyProjects}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        }}
      >
        <Text style={styles.link}>{t.logout}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, gap: 16, padding: 24, backgroundColor: "#f7f5ef" },
  title: { fontSize: 36, fontWeight: "700" },
  link: { color: "#d85c2f", paddingVertical: 12 },
});
