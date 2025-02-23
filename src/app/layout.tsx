import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Source AI Editor",
  description: "An open source AI-powered text editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
