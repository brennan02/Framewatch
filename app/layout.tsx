import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DemoStateProvider } from "./src/components/demo-state-provider";
import { TopHeader } from "./src/components/top-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FrameWatch MVP",
  description:
    "FrameWatch MVP for Tuckertown Buildings: material usage, waste, and salvage tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <TopHeader />
        <DemoStateProvider>{children}</DemoStateProvider>
      </body>
    </html>
  );
}
