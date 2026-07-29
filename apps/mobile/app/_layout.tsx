import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../src/auth/auth-provider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { theme } from "../src/theme";
const queryClient = new QueryClient();
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={{ contentStyle: { backgroundColor: theme.colors.canvas }, headerBackTitle: "Obrametrik", headerShown: false }} />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
