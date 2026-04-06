import { supabase } from "@/integrations/supabase/client";

interface GenerateParams {
  action: string;
  language?: string;
  duration?: number;
  title?: string;
  description?: string;
  transcript?: string;
  script?: string;
  url?: string;
}

export async function generateContent(params: GenerateParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: params,
  });

  if (error) {
    if (error.message?.includes("429") || (error as { status?: number })?.status === 429) {
      throw new Error("Limite de requisições excedido. Aguarde um momento e tente novamente.");
    }
    if (error.message?.includes("402") || (error as { status?: number })?.status === 402) {
      throw new Error("Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.");
    }
    throw new Error(error.message || "Erro ao gerar conteúdo");
  }

  if (data?.error) {
    if (data.error === "RATE_LIMIT") {
      throw new Error("Limite de requisições excedido. Aguarde um momento e tente novamente.");
    }
    if (data.error === "PAYMENT_REQUIRED") {
      throw new Error("Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.");
    }
    throw new Error(data.error);
  }

  return data?.result || "";
}

interface ThumbnailParams {
  title?: string;
  description?: string;
  script?: string;
  originalImageBase64?: string;
  thumbnailUrl?: string;
}

export async function generateThumbnail(params: ThumbnailParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: { action: "generate_thumbnail", url: params.thumbnailUrl, originalImageBase64: params.originalImageBase64, title: params.title, description: params.description, script: params.script },
  });

  if (error) {
    let errorDetails = "";
    if (error.context) {
      try {
        errorDetails = await error.context.text();
      } catch {
        errorDetails = "Unable to read context";
      }
    }
    
    if (error.message?.includes("429") || (error as { status?: number })?.status === 429) {
      throw new Error("Limite de requisições excedido. Aguarde um momento e tente novamente.");
    }
    if (error.message?.includes("402") || (error as { status?: number })?.status === 402) {
      throw new Error("Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.");
    }
    throw new Error(`[ERRO]: ${error.message} | Details: ${errorDetails}`);
  }

  if (data?.error) {
    if (data.error === "RATE_LIMIT") {
      throw new Error("Limite de requisições excedido. Aguarde um momento e tente novamente.");
    }
    if (data.error === "PAYMENT_REQUIRED") {
      throw new Error("Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.");
    }
    throw new Error(data.error);
  }

  const result = data?.result;
  if (!result) throw new Error("Nenhuma imagem foi gerada pela IA.");
  return result;
}

export async function generateThumbnailFast(params: ThumbnailParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: { action: "generate_thumbnail_fast", url: params.thumbnailUrl, title: params.title, description: params.description, script: params.script },
  });

  if (error) {
    if (error.message?.includes("429") || (error as { status?: number })?.status === 429) {
      throw new Error("Limite de requisições excedido. Aguarde um momento e tente novamente.");
    }
    throw new Error(error.message || "Erro ao gerar thumbnail rápida");
  }

  if (data?.error) {
    if (data.error === "RATE_LIMIT") {
      throw new Error("Limite de requisições excedido. Aguarde um momento e tente novamente.");
    }
    throw new Error(data.error);
  }

  const result = data?.result;
  if (!result) throw new Error("Nenhuma imagem rápida foi gerada pela IA.");
  return result;
}
