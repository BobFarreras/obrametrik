import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "Obrametrik",
  slug: "obrametrik",
  scheme: "obrametrik",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  ios: { bundleIdentifier: "com.digitaistudios.obrametrik", supportsTablet: true },
  android: { package: "com.digitaistudios.obrametrik" },
  plugins: ["expo-router", "expo-secure-store", "expo-localization", "expo-sqlite"],
  experiments: { typedRoutes: true },
  extra: { apiUrl: process.env.EXPO_PUBLIC_API_URL },
};
export default config;
