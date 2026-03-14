import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoreInventory – Inventory Management",
  description: "Real-time inventory management for warehouse and stock operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
