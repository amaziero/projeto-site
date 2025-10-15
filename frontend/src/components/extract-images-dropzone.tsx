"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { uploadAndExtractImages } from "@/lib/extract-images";
import { downloadBlob } from "@/lib/download";
import { Images, Loader2, X } from "lucide-react";

type SelFile = File & { __id?: string };

function fmtMB(n: number) {
  return (n / (1024 * 1024)).toFixed(2);
}

export default function ExtractImagesDropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<SelFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string | null;
  } | null>(null);

  const totalMB = useMemo(
    () => fmtMB(files.reduce((acc, f) => acc + f.size, 0)),
    [files]
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (!incoming.length) return;

      // mantém só PDFs e evita duplicados pelo (name+size+lastModified)
      const valid = incoming.filter((f) => f.type === "application/pdf");
      const mapKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
      const existingKeys = new Set(files.map(mapKey));

      const deduped = valid.filter((f) => !existingKeys.has(mapKey(f)));
      if (deduped.length !== incoming.length) {
        setError("Alguns arquivos foram ignorados (não-PDF ou duplicados).");
      } else {
        setError(null);
      }

      setFiles((prev) => [
        ...prev,
        ...deduped.map((f) => Object.assign(f, { __id: crypto.randomUUID() })),
      ]);
    },
    [files]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files ?? []));
      // não limpa aqui pra permitir selecionar mais sem perder os anteriores
      if (inputRef.current) inputRef.current.value = ""; // mas evita re-envio do mesmo arquivo
    },
    [addFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files ?? []);
      addFiles(dropped);
    },
    [addFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const removeOne = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.__id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setFiles([]);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const onSubmit = useCallback(async () => {
    if (files.length === 0) {
      setError("Selecione ou arraste pelo menos um PDF.");
      return;
    }

    setError(null);
    setProgress(0);
    setIsProcessing(false);
    setResult(null);

    const tId = toast.loading("Enviando PDFs...");
    try {
      const out = await uploadAndExtractImages(files, (p) => {
        setProgress(p);
        if (p >= 100) setIsProcessing(true);
      });
      setResult(out);
      setIsProcessing(false);
      toast.success("Imagens extraídas com sucesso!", { id: tId });
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao extrair imagens.";
      setError(msg);
      setIsProcessing(false);
      toast.error(msg, { id: tId });
    }
  }, [files]);

  const isBusy = (progress > 0 && progress < 100) || isProcessing;

  return (
    <div className="w-full flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 space-y-5">
          <header className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-[var(--secondary)]/60">
              <Images className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-medium">Extrair imagens</h1>
              <p className="text-sm text-muted-foreground">
                Arraste vários PDFs aqui ou clique para selecionar. O resultado
                é um <b>.zip</b> contendo <b>N .zip</b> (um por PDF).
              </p>
            </div>
          </header>

          {/* Dropzone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
            }
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={[
              "mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition",
              dragOver
                ? "border-primary/70 bg-primary/5"
                : "border-muted-foreground/30 hover:bg-muted/40",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="application/pdf"
              onChange={onInputChange}
              className="hidden"
            />
            <p className="text-sm">
              <span className="font-medium">Solte os PDFs</span> ou{" "}
              <span className="underline">clique para selecionar</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Apenas arquivos .pdf
            </p>
          </div>

          {/* Lista de arquivos */}
          {files.length > 0 && (
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>
                  Selecionados: <b>{files.length}</b>
                </span>
                <span>
                  Total: <b>{totalMB} MB</b>
                </span>
              </div>
              <ul className="max-h-40 overflow-auto space-y-1">
                {files.map((f) => (
                  <li
                    key={f.__id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {fmtMB(f.size)} MB
                      </span>
                      <button
                        type="button"
                        aria-label={`Remover ${f.name}`}
                        onClick={() => removeOne(f.__id!)}
                        className="rounded p-1 hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Progresso */}
          {progress > 0 && (
            <div className="space-y-1">
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground">{progress}%</div>
            </div>
          )}
          {isProcessing && (
            <>
              <div
                className="w-full h-2 rounded bg-muted overflow-hidden"
                aria-live="polite"
              >
                <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] bg-primary" />
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando no servidor...
              </div>
              <style jsx>{`
                @keyframes indeterminate {
                  0% {
                    transform: translateX(-100%);
                  }
                  50% {
                    transform: translateX(50%);
                  }
                  100% {
                    transform: translateX(200%);
                  }
                }
              `}</style>
            </>
          )}

          {/* Erro */}
          {error && (
            <Alert variant="destructive" role="status" aria-live="polite">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Ações */}
          {result ? (
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    result.filename || "imagens_extraidas.zip"
                  )
                }
                className="bg-green-600 hover:bg-green-700"
              >
                Baixar ZIP
              </Button>
              <Button variant="secondary" onClick={resetAll}>
                Recomeçar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={resetAll} disabled={isBusy}>
                Limpar
              </Button>
              <Button
                onClick={onSubmit}
                disabled={files.length === 0 || isBusy}
              >
                {isBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isProcessing ? "Processando..." : "Enviando..."}
                  </span>
                ) : (
                  "Extrair imagens"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
