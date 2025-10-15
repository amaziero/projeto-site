// lib/extract-images.ts
/**
 * Envia N PDFs para a rota do backend e retorna um ZIP com vários ZIPs (um por PDF).
 * Usa XHR para ter progresso de upload.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://projeto-site-21e2.onrender.com"; // troque se quiser

function getFilenameFromCD(cd: string | null): string | undefined {
  if (!cd) return;
  const m = cd.match(
    /filename\*=(?:UTF-8'')?([^;]+)|filename=(?:"([^"]+)"|([^;]+))/i
  );
  const raw = m?.[1] ?? m?.[2] ?? m?.[3];
  if (!raw) return;
  const cleaned = raw.trim().replace(/^UTF-8''/i, "");
  try {
    return decodeURIComponent(cleaned);
  } catch {
    return cleaned;
  }
}

function ensureZipName(
  name: string | undefined,
  fallback = "imagens_extraidas.zip"
) {
  if (!name || !name.trim()) return fallback;
  return /\.zip$/i.test(name) ? name : name + ".zip";
}

export async function uploadAndExtractImages(
  files: File[],
  onProgress?: (p: number) => void
): Promise<{ blob: Blob; filename: string | null }> {
  if (files.length === 0) throw new Error("Selecione pelo menos um PDF.");

  const form = new FormData();
  // o backend espera List[UploadFile] com field "files"
  for (const f of files) form.append("files", f);

  const url = `${API_BASE}/v1/images/extract`; // <- ajuste para a tua rota real

  const xhr = new XMLHttpRequest();
  const promise = new Promise<{ blob: Blob; filename: string | null }>(
    (resolve, reject) => {
      xhr.open("POST", url, true);
      xhr.responseType = "blob";

      // upload progress total (todos os PDFs somados)
      xhr.upload.onprogress = (e) => {
        if (!onProgress) return;
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 100);
          onProgress(Math.min(p, 99));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const cd = xhr.getResponseHeader("content-disposition");
          let filename = getFilenameFromCD(cd);
          filename = ensureZipName(
            filename || undefined,
            "imagens_extraidas.zip"
          );
          onProgress?.(100);
          resolve({ blob: xhr.response as Blob, filename });
        } else {
          // tenta ler JSON de erro
          const ct = xhr.getResponseHeader("content-type") || "";
          if (ct.includes("application/json")) {
            const fr = new FileReader();
            fr.onload = () => {
              try {
                const json = JSON.parse(String(fr.result || "{}"));
                reject(
                  new Error(
                    json.detail || json.message || `Falha (${xhr.status})`
                  )
                );
              } catch {
                reject(new Error(`Falha (${xhr.status})`));
              }
            };
            fr.readAsText(xhr.response);
          } else {
            reject(new Error(`Falha (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Erro de rede ao enviar arquivos."));
      xhr.onabort = () => reject(new Error("Envio abortado."));
      xhr.send(form);
    }
  );

  return promise;
}
