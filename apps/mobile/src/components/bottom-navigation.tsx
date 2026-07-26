import { messages } from "@obrametrik/i18n";
import { Link, usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { getDeviceLocale } from "../lib/i18n";
import { theme } from "../theme";

export function BottomNavigation() {
  const t = messages[getDeviceLocale()];
  const pathname = usePathname();
  const items = [
    { href: "/" as const, icon: "⌂", label: t.home },
    { href: "/projects" as const, icon: "▱", label: t.projects },
    { href: "/profile" as const, icon: "○", label: t.profile },
  ];
  return (
    <View accessibilityRole="tablist" style={styles.root}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link accessibilityRole="tab" href={item.href} key={item.label} style={styles.link}>
            <View style={[styles.item, active && styles.active]}>
              <Text style={[styles.icon, active && styles.activeText]}>{item.icon}</Text>
              <Text style={[styles.label, active && styles.activeText]}>{item.label}</Text>
            </View>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    bottom: 12,
    elevation: 12,
    flexDirection: "row",
    left: 12,
    padding: 7,
    position: "absolute",
    right: 12,
    shadowColor: "#111",
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  link: { flex: 1 },
  item: { alignItems: "center", borderRadius: 18, gap: 2, minHeight: 52, justifyContent: "center" },
  active: { backgroundColor: theme.colors.accentSoft },
  icon: { color: theme.colors.muted, fontSize: 21 },
  label: { color: theme.colors.muted, fontSize: 11 },
  activeText: { color: theme.colors.accent, fontWeight: "700" },
});
