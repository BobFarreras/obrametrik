import { Link } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View>
        <Text accessibilityRole="header" style={styles.title}>
          Obrametrik
        </Text>
        <Text style={styles.copy}>Planifica la teva reforma amb dades auditables.</Text>
        <Link href="/login" style={styles.link}>
          Inicia sessió
        </Link>
        <Link href="/projects" style={styles.link}>
          Projectes
        </Link>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f7f5ef" },
  title: { fontSize: 48, fontWeight: "700", color: "#17211b" },
  copy: { fontSize: 18, marginVertical: 20 },
  link: { fontSize: 18, color: "#d85c2f", paddingVertical: 10 },
});
