"use client";
import { useCallback, useRef, useState } from "react";
import { validatePDFFiles } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadAndMerge } from "@/lib/upload";
import { downloadBlob } from "@/lib/donwload";
import { toast } from "sonner";

// type Props = {
//   onSubmit?: (files: File[], setProgress: (p: number) => void) => Promise<void>;
// };

// export default function UploadDropzone({ onSubmit }: Props) {
export default function UploadDropzone() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Processa arquivos ao soltá-los ou ao selecioná-los
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

  // arrastar e soltar
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // disparar clique no input escondido ao clicar no dropzone
  const onBrowse = useCallback(() => inputRef.current?.click(), []);

  // envio simulando progresso (será substituído pelo backend)
  const onSubmitClick = useCallback(async () => {
    setError(null);
    setProgress(0);
    toast("Enviando arquivos...");

    try {
      const blob = await uploadAndMerge(files, setProgress);
      toast.success("Upload concluído!");

      downloadBlob(blob); // inicia o download do PDF unificado
      setFiles([]);
      setProgress(0);
    } catch (e: any) {
      setError(e?.message ?? "Falha no envio.");
      toast.error("Falha no envio.");
    }
  }, [files]);

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6 space-y-4">
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
            onChange={(e) => handleFiles(e.target.files)}
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

        {error && (
          <Alert variant="destructive" role="status" aria-live="polite">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setFiles([]);
              setError(null);
              setProgress(0);
            }}
          >
            Limpar
          </Button>
          <Button onClick={onSubmitClick} disabled={files.length === 0}>
            Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
