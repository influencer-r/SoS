import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Haven House - Card-to-Crypto Payment Portal",
  description: "Secure Web3 settlement system for Haven House",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#0b0f19", color: "#f3f4f6" }}>
        {children}
      </body>
    </html>
  );
}
