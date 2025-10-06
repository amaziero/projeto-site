"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation"; // 👈 para recomeçar via rota (opcional)
import { validatePDFFiles } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadAndMerge } from "@/lib/upload";
import { downloadBlob } from "@/lib/download";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function UploadDropzone() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMerging, setIsMerging] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null); // 👈 novo estado
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    const v = validatePDFFiles(next);
    if (!v.ok) {
      setFiles([]);
      setError(v.message);
      return;
    }
    setError(null);
    setFiles(next);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onBrowse = useCallback(() => inputRef.current?.click(), []);

  const resetAll = useCallback(() => {
    setFiles([]);
    setError(null);
    setProgress(0);
    setIsMerging(false);
    setResultBlob(null);
  }, []);

  const onSubmitClick = useCallback(async () => {
    setError(null);
    setProgress(0);
    setIsMerging(false);
    setResultBlob(null);

    const tId = toast.loading("Enviando arquivos...");

    try {
      const setProgressWrapped = (p: number) => {
        setProgress(p);
        if (p >= 100) {
          setIsMerging(true);
          toast.message("Processando PDFs no servidor...");
        }
      };

      const blob = await uploadAndMerge(files, setProgressWrapped);

      // ❌ não baixa automaticamente
      // downloadBlob(blob);

      // ✅ mostra “tela de sucesso” e deixa o usuário baixar
      setResultBlob(blob);
      setIsMerging(false);
      toast.success("PDF unido com sucesso!", { id: tId });
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
          ? e
          : "Falha no envio.";
      setError(message);
      setIsMerging(false);
      toast.error(message, { id: tId });
    }
  }, [files]);

  const isBusy =
    files.length > 0 && ((progress > 0 && progress < 100) || isMerging);

  return (
    <Card className="w-full max-w-2xl" aria-busy={isBusy}>
      <CardContent className="p-6 space-y-4">
        {/* se já temos resultado, mostra a “tela de sucesso” */}
        {resultBlob ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-600/30 bg-green-50 p-4 text-green-800">
              <CheckCircle2 className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-semibold">Tudo certo!</p>
                <p className="text-sm">
                  Seus PDFs foram unidos com sucesso. Clique em{" "}
                  <b>Baixar PDF</b> para salvar o arquivo.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => downloadBlob(resultBlob, "pdf_unificado.pdf")}
                className="bg-green-600 hover:bg-green-700"
              >
                Baixar PDF
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  // opção A: só limpar estados
                  resetAll();
                  // opção B (alternativa): forçar “recomeçar” pela rota
                  // router.replace("/upload");
                }}
              >
                Recomeçar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50"
              onClick={onBrowse}
              role="button"
              aria-label="Selecione ou solte arquivos PDF"
            >
              <p className="font-medium">Arraste e solte seus PDFs aqui</p>
              <p className="text-sm text-muted-foreground">
                ou clique para selecionar
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFiles(e.target.files)
                }
              />
            </div>

            {files.length > 0 && (
              <div className="text-sm space-y-2">
                <div className="font-medium">Arquivos:</div>
                <ul className="list-disc pl-6 space-y-1">
                  {files.map((f) => (
                    <li key={f.name}>
                      {f.name} — {(f.size / (1024 * 1024)).toFixed(2)} MB
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {progress > 0 && (
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="text-xs text-muted-foreground">{progress}%</div>
              </div>
            )}

            {isMerging && (
              <div
                className="w-full h-2 rounded bg-muted overflow-hidden"
                aria-live="polite"
              >
                <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] bg-primary" />
              </div>
            )}
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

            {(isMerging || (progress > 0 && progress < 100)) && (
              <div
                role="status"
                aria-live="polite"
                className="text-sm text-muted-foreground flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {isMerging
                  ? "Processando PDFs no servidor..."
                  : "Enviando arquivos..."}
              </div>
            )}

            {error && (
              <Alert variant="destructive" role="status" aria-live="polite">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={resetAll} disabled={isBusy}>
                Limpar
              </Button>
              <Button
                onClick={onSubmitClick}
                disabled={files.length === 0 || isBusy}
              >
                {isBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isMerging ? "Processando..." : "Enviando..."}
                  </span>
                ) : (
                  "Enviar"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
