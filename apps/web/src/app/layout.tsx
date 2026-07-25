import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Obrametrik",
  description: "Planificació auditable de reformes",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
