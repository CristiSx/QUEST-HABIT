import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pixelTitle = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel-title",
  subsets: ["latin"],
});

const pixelBody = VT323({
  weight: "400",
  variable: "--font-pixel-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quest Realm - 8-Bit Habit Tracker",
  description: "Gamified Pixel RPG Habit Tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${pixelTitle.variable} ${pixelBody.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}