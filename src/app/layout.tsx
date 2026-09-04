import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { getMemorialSettings } from "@/lib/memorial";
import "./globals.css";

export const metadata: Metadata = {
  title: "In loving memory of Cecilia Onerhime",
  description:
    "A gathering place for the life, love, and legacy of Cecilia Onerhime.",
};

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getMemorialSettings();
  const themeStyle = {
    "--background": settings.colors.background,
    "--foreground": settings.colors.foreground,
    "--paper": settings.colors.paper,
    "--sage": settings.colors.sage,
    "--marigold": settings.colors.accent,
    "--line": settings.colors.line,
    "--rose": settings.colors.rose,
    "--peach": settings.colors.peach,
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body
        data-template={settings.templateId}
        style={themeStyle}
        className="min-h-full flex flex-col"
      >
        {children}
      </body>
    </html>
  );
}
