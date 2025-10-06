import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

// 👇 fontes (opcional, mas recomendado pro visual PDFCraft)
import { Inter, Playfair_Display } from "next/font/google";
import Header from "@/components/header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

// 👇 corrigir 'metadada' -> metadata
export const metadata = {
  title: "PDFCraft",
  description: "Ferramentas artesanais para seus documentos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 👇 corrigir lang 'pd-BR' -> 'pt-BR' e aplicar variáveis de fontes
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      {/* mantém seu Provider e Toaster */}
      <body className="min-h-screen bg-background text-foreground font-sans">
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
            {children}
          </main>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
