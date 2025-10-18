import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GridDistortion from "@/components/GridDistortion";
import Footer from "@/components/Footer";
import RoadmapToast from "@/components/RoadmapToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Can you beat groq?",
  description: "Race the bot. Win on milliseconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: -1
        }}>
          <GridDistortion
            imageSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' style='stop-color:%23CC4520;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23AA3010;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23402010;stop-opacity:1' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1920' height='1080' fill='url(%23g)' /%3E%3C/svg%3E"
            grid={25}
            mouse={0.25}
            strength={0.4}
            relaxation={0.85}
          />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
        <Footer />
        <RoadmapToast />
      </body>
    </html>
  );
}
