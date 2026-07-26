import { messages } from "@obrametrik/i18n";
import { Link, Redirect } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/auth/auth-provider";
import { BottomNavigation } from "../src/components/bottom-navigation";
import { getDeviceLocale } from "../src/lib/i18n";
import { theme } from "../src/theme";

export default function HomeScreen() {
  const { loading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  if (loading) return <View style={styles.center}><Text>{t.sessionLoading}</Text></View>;
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{t.today.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={styles.title}>{t.goodMorning}</Text>
        <Text style={styles.subtitle}>{t.dashboardIntro}</Text>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.recentProjects}</Text>
          <Link href="/projects" style={styles.mutedLink}>{t.viewAll} →</Link>
        </View>
        <Link href="/projects" style={styles.cardLink}>
          <View style={styles.projectCard}>
            <View style={styles.projectVisual}><Text style={styles.house}>⌂</Text></View>
            <View style={styles.cardBody}>
              <Text style={styles.chip}>{t.draft.toUpperCase()}</Text>
              <Text style={styles.cardTitle}>{t.startFirstProject}</Text>
              <Text style={styles.cardCopy}>{t.emptyProjectsHelp}</Text>
              <View style={styles.arrow}><Text style={styles.arrowText}>→</Text></View>
            </View>
          </View>
        </Link>
        <Text style={[styles.sectionTitle, styles.actionsTitle]}>{t.quickActions}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
          {[
            ["＋", t.addMeasurement],
            ["⌗", t.scanSpace],
            ["€", t.openBudget],
          ].map(([icon, label]) => (
            <Link href="/projects" key={label} style={styles.actionLink}>
              <View style={styles.actionCard}><View style={styles.actionIcon}><Text style={styles.actionIconText}>{icon}</Text></View><Text style={styles.actionText}>{label}</Text><Text style={styles.actionMeta}>{t.projects}</Text></View>
            </Link>
          ))}
        </ScrollView>
      </ScrollView>
      <Link accessibilityLabel={t.newProject} href="/projects" style={styles.fab}>＋</Link>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { padding: 22, paddingBottom: 130, paddingTop: 56 },
  eyebrow: { color: theme.colors.accent, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  title: { color: theme.colors.ink, fontSize: 44, fontWeight: "700", letterSpacing: -2.2, lineHeight: 47, marginTop: 9 },
  subtitle: { color: theme.colors.muted, fontSize: 17, marginTop: 8 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 16, marginTop: 46 },
  sectionTitle: { color: theme.colors.ink, fontSize: 20, fontWeight: "700", letterSpacing: -0.7 },
  mutedLink: { color: theme.colors.muted, fontSize: 14 },
  cardLink: { width: "100%" },
  projectCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, elevation: 4, overflow: "hidden", shadowColor: "#111", shadowOpacity: 0.08, shadowRadius: 18 },
  projectVisual: { alignItems: "center", aspectRatio: 1.75, backgroundColor: "#dcd7ce", justifyContent: "center" },
  house: { color: "#7e7a73", fontSize: 62 },
  cardBody: { padding: 20, position: "relative" },
  chip: { color: theme.colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  cardTitle: { color: theme.colors.ink, fontSize: 22, fontWeight: "700", letterSpacing: -0.7, marginTop: 10 },
  cardCopy: { color: theme.colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7, paddingRight: 48 },
  arrow: { alignItems: "center", backgroundColor: theme.colors.accent, borderRadius: 26, bottom: 18, height: 48, justifyContent: "center", position: "absolute", right: 18, width: 48 },
  arrowText: { color: "#fff", fontSize: 22 },
  actionsTitle: { marginTop: 38 },
  actions: { gap: 12, paddingRight: 22, paddingTop: 16 },
  actionLink: { width: 190 },
  actionCard: { backgroundColor: theme.colors.surface, borderRadius: 24, minHeight: 150, padding: 18 },
  actionIcon: { alignItems: "center", backgroundColor: theme.colors.accentSoft, borderRadius: 22, height: 44, justifyContent: "center", marginBottom: 24, width: 44 },
  actionIconText: { color: theme.colors.accent, fontSize: 19 },
  actionText: { color: theme.colors.ink, fontSize: 16, fontWeight: "700" },
  actionMeta: { color: theme.colors.muted, fontSize: 12, marginTop: 5 },
  fab: { backgroundColor: theme.colors.accent, borderRadius: 30, bottom: 90, color: "#fff", elevation: 10, fontSize: 28, height: 58, lineHeight: 56, position: "absolute", right: 20, textAlign: "center", width: 58 },
});
