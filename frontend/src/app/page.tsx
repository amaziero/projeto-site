import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-4">
      <div className="space-y-6 w-full max-w-md flex flex-col items-center text-center">
        <h1 className="text-3xl font-semibold">
          Bem-vindo ao iLovePDF Mini 😎
        </h1>
        {/* <p className="text-sm text-muted-foreground">
          Transforme seus PDFs com praticidade. Comece enviando seus arquivos
          para unir, dividir ou converter — tudo online e rápido.
        </p> */}
        <p className="text-sm text-muted-foreground">
          Transforme seus PDFs com praticidade. Comece enviando seus arquivos
          para unir tudo em apenas 1.
        </p>

        <Link
          href="/upload"
          className="mt-4 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white shadow hover:bg-primary/90 transition"
        >
          Ir para Upload
        </Link>

        {/* <p className="text-xs text-muted-foreground">
          Projeto criado para estudo — Next.js + Tailwind + FastAPI 🚀
        </p> */}
      </div>
    </main>
  );
}
