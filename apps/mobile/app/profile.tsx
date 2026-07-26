import { messages } from "@obrametrik/i18n";
import { Redirect, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/auth/auth-provider";
import { BottomNavigation } from "../src/components/bottom-navigation";
import { getDeviceLocale } from "../src/lib/i18n";
import { supabase } from "../src/lib/supabase";
import { theme } from "../src/theme";

export default function ProfileScreen() {
  const { loading, user } = useAuth();
  const router = useRouter();
  const t = messages[getDeviceLocale()];
  if (loading) return <View style={styles.center}><Text>{t.sessionLoading}</Text></View>;
  if (!user) return <Redirect href="/login" />;
  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>{t.appName.toUpperCase()}</Text>
      <Text accessibilityRole="header" style={styles.title}>{t.profile}</Text>
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user.email?.slice(0, 1).toUpperCase()}</Text></View>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.secure}>{t.secureData}</Text>
        <Pressable style={styles.logout} onPress={async () => { await supabase.auth.signOut(); router.replace("/login"); }}>
          <Text style={styles.logoutText}>{t.logout}</Text>
        </Pressable>
      </View>
      <BottomNavigation />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { backgroundColor: theme.colors.canvas, flex: 1, padding: 22, paddingTop: 56 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  eyebrow: { color: theme.colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  title: { color: theme.colors.ink, fontSize: 44, fontWeight: "700", letterSpacing: -2, marginTop: 8 },
  card: { alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 28, marginTop: 34, padding: 28 },
  avatar: { alignItems: "center", backgroundColor: theme.colors.accentSoft, borderRadius: 42, height: 84, justifyContent: "center", width: 84 },
  avatarText: { color: theme.colors.accent, fontSize: 30, fontWeight: "800" },
  email: { color: theme.colors.ink, fontSize: 18, fontWeight: "700", marginTop: 18 },
  secure: { color: theme.colors.muted, marginTop: 7 },
  logout: { borderColor: theme.colors.border, borderRadius: 999, borderWidth: 1, marginTop: 30, minHeight: 50, paddingHorizontal: 28, justifyContent: "center" },
  logoutText: { color: theme.colors.ink, fontWeight: "700" },
});
