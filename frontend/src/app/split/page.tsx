import Link from "next/link";
import SplitTool from "@/components/split";

export default function SplitPage() {
  return (
    <main className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-4">
      <div className="space-y-4 w-full flex flex-col items-center">
        <h1 className="text-2xl font-semibold">Dividir PDF</h1>
        <p className="text-sm text-muted-foreground text-center">
          Envie um PDF e escolha dividir cada página individualmente ou um
          intervalo específico de páginas.
        </p>

        <SplitTool />

        {/* 👇 mesmo botão da página de upload */}
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
        >
          ← Voltar para Home
        </Link>
      </div>
    </main>
  );
}
