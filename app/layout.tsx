import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { validateEnv } from "@/lib/utils/env";
import { FileViewerProvider } from "@/components/file-viewer/FileViewerContext";
import { DndWrapper } from "@/components/DndWrapper";
import { AppInitializer } from "@/components/AppInitializer";

// Validate environment variables on server startup only
if (typeof window === 'undefined') {
  validateEnv();
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flint - Agent Orchestration",
  description: "Flint: The spark that ignites agent orchestration. BMAD agent validation and deployment platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppInitializer>
          <DndWrapper>
            <FileViewerProvider>{children}</FileViewerProvider>
          </DndWrapper>
        </AppInitializer>
      </body>
    </html>
  );
}
