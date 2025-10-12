// src/lib/split.ts
import api from "@/lib/http";

export type SplitMode = "each" | "range";

export async function uploadAndSplit(
  file: File,
  mode: SplitMode,
  range: string | null,
  onProgress: (p: number) => void
): Promise<{ blob: Blob; filename: string | null }> {
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);
  if (mode === "range" && range) {
    form.append("range", range);
  }

  const res = await api.post("/v1/split/", form, {
    responseType: "blob",
    onUploadProgress: (e) => {
      if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
    validateStatus: (s) => s < 500,
  });

  if (res.status !== 200) {
    // tenta extrair texto de erro do backend
    const maybeText = await (res.data as Blob).text().catch(() => null);
    throw new Error(maybeText || "Falha ao dividir PDF.");
  }

  // tenta pegar nome sugerido pelo backend
  const cd = res.headers["content-disposition"] as string | undefined;
  const match = cd?.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const filename = decodeURIComponent(match?.[1] || match?.[2] || "");

  return { blob: res.data as Blob, filename: filename || null };
}
