import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

export const metadada = { title: "Unir PDFs", description: "Upload and Merge" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pd-BR">
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
