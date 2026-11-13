import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jira My Time Pro",
  description: "Fast issues and timesheets on top of Jira Cloud",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
