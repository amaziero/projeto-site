import axios from "axios";

// usa a variável de ambiente para o domínio da API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export default api;
