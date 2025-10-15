// app/extract-images/page.tsx
import Link from "next/link";
import ExtractImagesDropzone from "@/components/extract-images-dropzone";

export default function ExtractImagesPage() {
  return (
    <main className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-4">
      <div className="space-y-4 w-full max-w-xl flex flex-col items-center">
        <ExtractImagesDropzone />
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
