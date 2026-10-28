import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GainForge — Turn opportunities into revenue",
  description: "An AI growth workspace that helps businesses discover opportunities, take action, and track what converts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
