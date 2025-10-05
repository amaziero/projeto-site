import Link from "next/link";
import UploadDropzone from "@/components/upload-dropzone";

export default function UploadPage() {
  return (
    <main className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-4">
      <div className="space-y-4 w-full flex flex-col items-center">
        <h1 className="text-2xl font-semibold">Unir PDFs</h1>
        <p className="text-sm text-muted-foreground text-center">
          Selecione múltiplos PDFs (até 500 MB no total). Depois faremos o envio
          e o download do arquivo unificado.
        </p>

        <UploadDropzone />

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
