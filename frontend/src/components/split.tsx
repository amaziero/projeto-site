// components/split.tsx
"use client";
import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { uploadAndSplit, SplitMode } from "@/lib/split";
import { downloadBlob } from "@/lib/download";
import { Loader2, Scissors } from "lucide-react";

export default function SplitTool() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SplitMode>("each");

  // intervalo em dois campos
  const [startPage, setStartPage] = useState<number | "">("");
  const [endPage, setEndPage] = useState<number | "">("");

  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMerging, setIsMerging] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string | null;
  } | null>(null);

  const onPick = useCallback((f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== "application/pdf") {
      setError("Selecione um arquivo PDF.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPick(e.target.files?.[0] || null);
    },
    [onPick]
  );

  const parsePositiveIntOrEmpty = (v: string): number | "" => {
    const n = Number(v);
    if (!v) return "";
    if (Number.isInteger(n) && n >= 1) return n;
    return "";
  };

  const isRangeValid = (): boolean => {
    if (mode !== "range") return true;
    if (startPage === "" || endPage === "") return false;
    return (startPage as number) <= (endPage as number);
  };

  const resetAll = useCallback(() => {
    setFile(null);
    setMode("each");
    setStartPage("");
    setEndPage("");
    setError(null);
    setProgress(0);
    setIsMerging(false);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const onSubmit = useCallback(async () => {
    if (!file) {
      setError("Selecione um PDF primeiro.");
      return;
    }
    if (mode === "range" && !isRangeValid()) {
      setError("Informe páginas válidas (início e fim) com início ≤ fim.");
      return;
    }

    setError(null);
    setProgress(0);
    setIsMerging(false);
    setResult(null);

    const tId = toast.loading("Enviando arquivo...");

    try {
      const wrapped = (p: number) => {
        setProgress(p);
        if (p >= 100) {
          setIsMerging(true);
          toast.message("Processando no servidor...");
        }
      };

      const rangeStr =
        mode === "range" && startPage !== "" && endPage !== ""
          ? `${startPage}-${endPage}`
          : null;

      const out = await uploadAndSplit(file, mode, rangeStr, wrapped);
      setResult(out);
      setIsMerging(false);
      toast.success("Tudo certo! Seu arquivo está pronto.", { id: tId });
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
          ? e
          : "Falha ao dividir PDF.";
      setError(message);
      setIsMerging(false);
      toast.error(message, { id: tId });
    }
  }, [file, mode, startPage, endPage]);

  const isBusy = (!!file && progress > 0 && progress < 100) || isMerging;

  return (
    <div className="w-full flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 space-y-5">
          <header className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-[var(--secondary)]/60">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-medium">Dividir PDF</h1>
              <p className="text-sm text-muted-foreground">
                Separe todas as páginas ou um intervalo específico.
              </p>
            </div>
          </header>

          {/* arquivo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Arquivo PDF</label>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border file:px-4 file:py-2 file:bg-[var(--secondary)]/60 file:border-[var(--secondary)] hover:file:bg-[var(--secondary)]/80"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} — {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>

          {/* modo + intervalo */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Modo</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as SplitMode)}
                className="block w-full rounded-md border px-3 py-2 bg-background"
              >
                <option value="each">Cada página (gera .zip)</option>
                <option value="range">Intervalo (ex.: 3 a 7)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Escolha <b>each</b> para separar tudo, ou <b>range</b> para um
                intervalo.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Intervalo (se “range”)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder="Início"
                  value={startPage}
                  onChange={(e) =>
                    setStartPage(parsePositiveIntOrEmpty(e.target.value))
                  }
                  disabled={mode !== "range"}
                  className="block w-full rounded-md border px-3 py-2 bg-background disabled:opacity-50"
                />
                <span className="text-muted-foreground">até</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder="Fim"
                  value={endPage}
                  onChange={(e) =>
                    setEndPage(parsePositiveIntOrEmpty(e.target.value))
                  }
                  disabled={mode !== "range"}
                  className="block w-full rounded-md border px-3 py-2 bg-background disabled:opacity-50"
                />
              </div>
              {mode === "range" &&
                !(
                  startPage !== "" &&
                  endPage !== "" &&
                  (startPage as number) <= (endPage as number)
                ) &&
                (startPage !== "" || endPage !== "") && (
                  <p className="text-xs text-red-600">
                    Informe números positivos e garanta início ≤ fim.
                  </p>
                )}
            </div>
          </div>

          {/* progresso */}
          {progress > 0 && (
            <div className="space-y-1">
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground">{progress}%</div>
            </div>
          )}
          {isMerging && (
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

          {/* erro */}
          {error && (
            <Alert variant="destructive" role="status" aria-live="polite">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ações ou sucesso */}
          {result ? (
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    result.filename ||
                      (mode === "each" ? "paginas.zip" : "pdf_dividido.pdf")
                  )
                }
                className="bg-green-600 hover:bg-green-700"
              >
                Baixar resultado
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
                disabled={
                  !file || isBusy || (mode === "range" && !isRangeValid())
                }
              >
                {isBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isMerging ? "Processando..." : "Enviando..."}
                  </span>
                ) : (
                  "Dividir"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
