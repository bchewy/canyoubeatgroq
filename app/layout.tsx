import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import GridDistortion from "@/components/GridDistortion";
import Footer from "@/components/Footer";
import RoadmapToast from "@/components/RoadmapToast";
import ClickSpark from "@/components/ClickSpark";

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
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
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
        <ClickSpark
          sparkColor='#fff'
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </ClickSpark>
        <Footer />
        <RoadmapToast />
      </body>
    </html>
  );
}
