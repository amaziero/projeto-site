// Add this type definition at the top of the file or in a separate types file
interface ValidationResult {
  ok: boolean;
  message: string;
}

export function validatePDFFiles(files: File[]): ValidationResult {
  const MAX = 500 * (1024 * 1024);
  let total = 0;

  for (const f of files) {
    const isPDF =
      f.type === "application/pdf" ||
      f.name.toLocaleLowerCase().endsWith(".pdf");

    if (!isPDF)
      return {
        ok: false,
        message: `Tipo do arquvo invalido, só pode ser pdf e o tipo enviado é: ${f.name}`,
      };

    total += f.size;
  }

  if (total > MAX)
    return {
      ok: false,
      message: `O tamanho dos exceis não pode ultrapassar ${MAX} e vc enviou ${total}`,
    };

  return { ok: true, message: `Arquivos recebidos com sucesso.` };
}
