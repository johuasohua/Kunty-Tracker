import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ProfileProvider } from "@/lib/profile-context";
import { AppShell } from "@/components/nav/AppShell";
import { ConfigNeeded } from "@/components/nav/ConfigNeeded";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Kunty",
  description: "Josh & Kiki's household finance tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kunty",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configured = isSupabaseConfigured();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {configured ? (
          <AuthProvider>
            <ProfileProvider>
              <AppShell>{children}</AppShell>
            </ProfileProvider>
          </AuthProvider>
        ) : (
          <ConfigNeeded />
        )}
      </body>
    </html>
  );
}
