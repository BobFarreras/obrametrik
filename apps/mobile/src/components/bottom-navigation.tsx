import { messages } from "@obrametrik/i18n";
import { Link, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDeviceLocale } from "../lib/i18n";
import { theme } from "../theme";

export function BottomNavigation() {
  const t = messages[getDeviceLocale()];
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const items = [
    { href: "/" as const, icon: "home" as const, label: t.home },
    { href: "/projects" as const, icon: "projects" as const, label: t.projects },
    { href: "/profile" as const, icon: "profile" as const, label: t.profile },
  ];
  return (
    <View accessibilityRole="tablist" style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((item, index) => {
        const active = pathname === item.href;
        if (index === 2) {
          return (
            <Link accessibilityLabel={t.newProject} href="/projects/new" key="primary-action" asChild>
              <Pressable style={styles.action}>
                <Text style={styles.actionIcon}>＋</Text>
              </Pressable>
            </Link>
          );
        }
        return (
          <Link accessibilityRole="tab" href={item.href} key={item.label} style={styles.link}>
            <View style={[styles.item, active && styles.active]}>
              <NavIcon active={active} name={item.icon} />
              <Text style={[styles.label, active && styles.activeText]}>{item.label}</Text>
              {active ? <View style={styles.activeDot} /> : null}
            </View>
          </Link>
        );
      })}
    </View>
  );
}

function NavIcon({
  active,
  name,
}: {
  active: boolean;
  name: "home" | "profile" | "projects";
}) {
  const color = active ? theme.colors.brand : theme.colors.concrete;
  if (name === "home") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.homeRoof, { borderColor: color }]} />
        <View style={[styles.homeBody, { borderColor: color }]} />
      </View>
    );
  }
  if (name === "projects") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.projectBack, { borderColor: color }]} />
        <View style={[styles.projectFront, { borderColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.iconCanvas}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileBody, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "flex-end",
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 16,
    flexDirection: "row",
    left: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    position: "absolute",
    right: 0,
    shadowColor: "#111",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  link: { flex: 1 },
  item: { alignItems: "center", gap: 3, minHeight: 54, justifyContent: "center" },
  active: {},
  label: { color: theme.colors.concrete, fontSize: 11, fontWeight: "700" },
  activeText: { color: theme.colors.brand },
  activeDot: { backgroundColor: theme.colors.accent, borderRadius: 3, height: 5, width: 5 },
  action: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    borderRadius: 31,
    elevation: 8,
    height: 62,
    justifyContent: "center",
    marginHorizontal: 4,
    marginTop: -24,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    width: 62,
  },
  actionIcon: { color: theme.colors.ink, fontSize: 30, fontWeight: "500" },
  iconCanvas: { height: 21, position: "relative", width: 23 },
  homeRoof: {
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 14,
    left: 5,
    position: "absolute",
    top: 1,
    transform: [{ rotate: "45deg" }],
    width: 14,
  },
  homeBody: {
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    bottom: 0,
    height: 12,
    left: 4,
    position: "absolute",
    width: 16,
  },
  projectBack: {
    borderRadius: 3,
    borderWidth: 2,
    height: 14,
    left: 1,
    position: "absolute",
    top: 1,
    width: 16,
  },
  projectFront: {
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    borderWidth: 2,
    bottom: 0,
    height: 14,
    position: "absolute",
    right: 0,
    width: 16,
  },
  profileHead: {
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    left: 7,
    position: "absolute",
    top: 0,
    width: 10,
  },
  profileBody: {
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 2,
    bottom: 0,
    height: 9,
    left: 3,
    position: "absolute",
    width: 18,
  },
});
