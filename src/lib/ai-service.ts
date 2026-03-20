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
    if (error.message?.includes("429") || (error as any)?.status === 429) {
      throw new Error("Limite de requisições excedido. Aguarde um momento e tente novamente.");
    }
    if (error.message?.includes("402") || (error as any)?.status === 402) {
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
