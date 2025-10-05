import api from "./http";

export async function uploadAndMerge(
  files: File[],
  onProgress: (p: number) => void
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await api.post("/v1/merged-pdfs", formData, {
    responseType: "blob",
    onUploadProgress: (event) => {
      if (event.total) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    },
    // Permite tratar status de erro manualmente
    validateStatus: (status) => status < 500,
  });

  if (response.status !== 200) {
    // Extrai a mensagem de erro do backend (se houver)
    throw new Error(await response.data.text?.());
  }

  // A resposta é um Blob (o PDF unificado)
  return response.data as Blob;
}
