import type { Metadata } from "next";
import { Instrument_Serif, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudioMVP — A product studio for founders who are serious.",
  description:
    "StudioMVP designs and builds investor-ready apps and platforms — from the first sketch to thousands of real users.",
  icons: {
    icon: [{ url: "/logo.jpg" }],
    apple: [{ url: "/logo.jpg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrument.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}
