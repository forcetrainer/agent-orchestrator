import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { validateEnv } from "@/lib/utils/env";
import { FileViewerProvider } from "@/components/file-viewer/FileViewerContext";

// Validate environment variables on server startup only
if (typeof window === 'undefined') {
  validateEnv();
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agent Orchestrator",
  description: "BMAD agent validation and deployment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FileViewerProvider>{children}</FileViewerProvider>
      </body>
    </html>
  );
}
