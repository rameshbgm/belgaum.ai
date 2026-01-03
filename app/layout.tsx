import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Belgaum.ai | Enterprise AI Orchestration & EduTech (Coming Soon)",
  description: "Belgaum.ai - Enterprise AI Orchestration, Gen AI, RAG, and Agentic AI Solutions. Coming Soon to transform AI EduTech and Corporate Training.",
  keywords: ["Belgaum AI", "AI EduTech", "Corporate AI Training", "AI Development", "Agentic AI", "RAG Systems", "AI Startup Belgaum"],
  authors: [{ name: "Belgaum.ai" }],
  other: {
    "geo.region": "IN-KA",
    "geo.placename": "Belgaum",
    "geo.position": "15.8497;74.4977",
    "ICBM": "15.8497, 74.4977",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
