import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../src/auth/auth-provider";
const queryClient = new QueryClient();
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ contentStyle: { backgroundColor: "#f2f4f5" }, headerBackTitle: "Obrametrik", headerShown: false }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
