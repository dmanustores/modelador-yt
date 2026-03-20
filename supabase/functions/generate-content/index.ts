import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(systemPrompt: string, userPrompt: string, model = "google/gemini-3-flash-preview") {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("PAYMENT_REQUIRED");
    const text = await response.text();
    throw new Error(`AI gateway error ${status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ---------- LANGUAGE HELPERS ----------
const LANG_MAP: Record<string, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
};

// ---------- PROMPTS ----------

function titlePrompt(language: string) {
  const lang = LANG_MAP[language] || language;
  return `Você é um copywriter especialista em YouTube com 10+ anos de experiência, criador de canais religiosos com milhões de views. Crie um título curto (60-90 caracteres) sobre o tema do vídeo.

Regras obrigatórias:
- Gancho emocional imediato: curiosidade, choque, promessa ou pergunta.
- Palavra-chave principal no início para SEO.
- Emojis estratégicos (1-2): ✨🙏🔥 para parar o scroll.
- Tom épico/inspirador, como documentário Netflix + fé.
- Otimizado para cliques: números, "nunca", "secreto", "verdade chocante".
- PSICOLOGIA DO ESPECTADOR: Foque no viés de negatividade ou na lacuna de curiosidade.
- Pense no público com base na linguagem solicitada (${lang}): fé prática, milagres cotidianos.
- Me retorne APENAS o título em ${lang}. Nada mais.`;
}

function descriptionPrompt(language: string) {
  const lang = LANG_MAP[language] || language;
  return `Você é um criador profissional de YouTube (nicho bíblico/religioso) com canais em pleno crescimento. Escreva uma descrição completa (150-250 palavras) baseada no conteúdo fornecido.

REGRAS DE OURO:
- NÃO inclua introduções, saudações, explicações ou comentários.
- Comece OBRIGATORIAMENTE e DIRETAMENTE pelo Gancho épico.

Estrutura exata:
1. Gancho épico (1-2 linhas): Pergunta ou fato chocante + emoji 🌟.
2. Resumo cativante (3-4 linhas): Jornada da história com cliffhanger.
3. Lição prática (2 linhas): Aplicação na vida real, fé hoje 🙏.
4. RETENÇÃO DE INSCRITOS: Inclua um motivo específico para a inscrição.
5. CTA agressivo e múltiplo (3 linhas).

IMPORTANTE: Use quebras de linha duplas entre cada seção. Emojis equilibrados (8-12), palavras de poder.
Responda OBRIGATORIAMENTE em ${lang}.`;
}

function scriptPrompt(language: string, words: number, minutes: number) {
  const lang = LANG_MAP[language] || language;
  return `Como um roteirista 11/10, transforme esta transcrição em um roteiro cinematográfico de alta qualidade.

REGRAS CRÍTICAS:
1. REMOVA TIMESTAMPS.
2. EVITE PLÁGIO: Altere o começo, meio e fim.
3. REMOVA MENÇÕES AO CANAL original.
4. ENRIQUEÇA: Acrescente trechos bíblicos profundos e detalhados.

DURAÇÃO E EXTENSÃO:
META OBRIGATÓRIA: O roteiro DEVE ter aproximadamente ${words} palavras para garantir uma narração de ${minutes} minutos.
Não resuma. Seja VERBOSO e DETALHISTA.

ESTILO: Ritmo documental, tom inspirador e cinematográfico.
RITMO DE LEGENDA: Frases curtas (máx 5 palavras).

ESTRUTURA: Divida em #INICIO#, #MEIO#, #FIM#.
RETENÇÃO: Inclua motivo para inscrição.
DIFERENCIAÇÃO: Sugira um 'Easter Egg' visual ou frase reflexiva.

Responda em ${lang}.`;
}

function imagePromptsPrompt() {
  return `Com base no roteiro fornecido, gere prompts para contextualizar a história em imagens.

Seja rigoroso com todo o texto da narração para garantir que as imagens cubram fielmente toda a progressão da narrativa.
Os prompts devem ser em INGLÊS para uso no Google Whisk.
Mantenha o estilo bíblico e fotorealista documental, iluminação cinematográfica suave e proporções realistas.
Calcule a quantidade de imagens para não ficar repetitivo.
Forneça APENAS os prompts de imagem. Cada prompt separado por duas quebras de linha.
Não inclua o texto "Prompt de Imagem" ou numeração.`;
}

function hashtagsPrompt(language: string) {
  const lang = LANG_MAP[language] || language;
  return `Você é um estrategista de SEO para YouTube. Gere exatamente 7 hashtags altamente relevantes e virais para o nicho bíblico/religioso.

Regras:
1. NÃO use o símbolo # (cerquilha).
2. Separe as hashtags apenas por vírgulas.
3. Gere exatamente 7 termos.
4. Use o idioma ${lang}.`;
}

function fileNamePrompt() {
  return `Gere um nome de arquivo de vídeo com base no título fornecido. Retorne APENAS o nome do arquivo (sem extensão), usando underscores no lugar de espaços. Sem explicações.`;
}

function translatePrompt(language: string) {
  const lang = LANG_MAP[language] || language;
  return `Traduza o texto abaixo fielmente para ${lang}. Mantenha o mesmo tom e formatação. Retorne APENAS a tradução, sem explicações.`;
}

function metadataPrompt() {
  return `Analise o vídeo do YouTube fornecido. Extraia a descrição original completa do vídeo. Retorne APENAS a descrição em texto puro, sem formatação JSON, sem explicações.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, language, duration, title, description, transcript, script, url } = await req.json();

    const durMap: Record<number, { words: number; minutes: number }> = {
      15: { words: 2000, minutes: 15 },
      30: { words: 4000, minutes: 30 },
      45: { words: 6000, minutes: 45 },
    };

    let result = "";

    switch (action) {
      case "extract_description": {
        result = await callAI(
          metadataPrompt(),
          `URL do vídeo: ${url}\nTítulo do vídeo: ${title || ""}`,
          "google/gemini-2.5-flash"
        );
        break;
      }
      case "generate_title": {
        result = await callAI(
          titlePrompt(language),
          `Título Original para referência: ${title}`,
          "google/gemini-3.1-pro-preview"
        );
        break;
      }
      case "translate_title": {
        result = await callAI(translatePrompt(language), title);
        break;
      }
      case "generate_description": {
        result = await callAI(
          descriptionPrompt(language),
          `Conteúdo de referência: ${description || script || title}`
        );
        break;
      }
      case "translate_description": {
        result = await callAI(translatePrompt(language), description);
        break;
      }
      case "generate_script": {
        const dur = durMap[duration] || durMap[30];
        result = await callAI(
          scriptPrompt(language, dur.words, dur.minutes),
          `Transcrição original:\n${transcript}\n\nTítulo: ${title}`
        );
        break;
      }
      case "generate_image_prompts": {
        result = await callAI(imagePromptsPrompt(), `Roteiro:\n${script}`);
        break;
      }
      case "generate_hashtags": {
        result = await callAI(
          hashtagsPrompt(language),
          `Roteiro de referência:\n${script || title}`
        );
        break;
      }
      case "generate_filename": {
        result = await callAI(fileNamePrompt(), `Título do vídeo: ${title}`);
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message === "RATE_LIMIT" ? 429 : message === "PAYMENT_REQUIRED" ? 402 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
