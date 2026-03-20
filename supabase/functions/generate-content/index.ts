// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(systemPrompt: string, userPrompt: string, model = "google/gemini-3-flash-preview") {
  // @ts-ignore
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

async function callAIImage(prompt: string) {
  // @ts-ignore
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      modalities: ["text", "image"],
      messages: [
        {
          role: "user",
          content: prompt,
        },
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

  // Extract base64 image from the response
  // The response may contain content parts with image data
  const content = data.choices?.[0]?.message?.content;

  // If content is an array of parts (multimodal response)
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) {
        return part.image_url.url;
      }
    }
  }

  // Check for images array in the response (Vercel AI SDK style)
  if (data.choices?.[0]?.message?.images) {
    const img = data.choices[0].message.images[0];
    if (img?.url) return img.url;
    if (img?.b64_json) return `data:image/png;base64,${img.b64_json}`;
  }

  // Check inline_data in content parts
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.inline_data?.data) {
        const mime = part.inline_data.mime_type || "image/png";
        return `data:${mime};base64,${part.inline_data.data}`;
      }
    }
  }

  // If content is a string that looks like base64 data URI
  if (typeof content === "string" && content.startsWith("data:image")) {
    return content;
  }

  throw new Error("No image data found in the AI response");
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

function titlePrompt(language: string, originalTitle?: string) {
  const lang = LANG_MAP[language] || language;
  return `Você é um copywriter especialista em YouTube com 10+ anos de experiência, criador de canais religiosos com milhões de views. Crie um título curto (60-90 caracteres) sobre o tema do vídeo.
Regras obrigatórias:
- Gancho emocional imediato: curiosidade, choque, promessa ou pergunta (ex: "O Segredo que...").
- Palavra-chave principal no início para SEO: [ex: Gideone, Fede, Bibbia].
- Emojis estratégicos (1-2): ✨🙏🔥 para parar o scroll.
- Tom épico/inspirador, como documentário Netflix + fé.
- Otimizado para cliques: números, "nunca", "secreto", "verdade chocante".
- PSICOLOGIA DO ESPECTADOR: Foque no viés de negatividade ou na lacuna de curiosidade (Ex: 'O erro que te impede de prosperar' em vez de 'Como prosperar').
- Pense no público com base na linguagem solicitada (${lang}): fé prática, milagres cotidianos.

Título Original para referência: ${originalTitle || "Sem título original"}

Me retorne APENAS o título em ${lang}, sem aspas ou explicações.`;
}

function descriptionPrompt(language: string, originalDescription?: string, script?: string) {
  const lang = LANG_MAP[language] || language;
  
  const modeInstrucoes = originalDescription
    ? `══════════════════════════════════════
MODO A — quando uma descrição existente for fornecida pelo link do youtube
══════════════════════════════════════\n\nTexto de referência: ${originalDescription}

Tarefas obrigatórias:
- [CRÍTICO] Remova COMPLETAMENTE e de forma ABSOLUTA qualquer menção a nomes de canais (ex: "Bem-vindos ao canal", "Bibbia Parlata", etc), links externos, redes sociais ou chamadas para acessar outros perfis. Se houver o nome do canal fonte na tradução, VOCÊ FALHOU.
- Reescreva início, meio e fim com palavras diferentes para eliminar plágio, mantendo a ideia central
- Distribua emoticons relevantes ao tema ao longo de todo o texto — sem exageros, 1 a 2 por parágrafo
- Traduza o resultado final para ${lang}`
    : `══════════════════════════════════════
MODO B — quando NÃO houver descrição (apenas roteiro/narração disponível)
══════════════════════════════════════\n\nBase de criação: ${script || "Sem conteúdo base"}

Tarefas obrigatórias:
- Crie uma descrição original, envolvente e de alto impacto com base no conteúdo fornecido
- Tom: inspirador, documental, com autoridade espiritual
- [CRÍTICO] NUNCA crie ou adicione nomes de canais ou links fictícios.
- Distribua emoticons relevantes ao tema ao longo de todo o texto — sem exageros, 1 a 2 por parágrafo
- Escreva diretamente em ${lang}`;

  return `Você é um especialista em SEO para YouTube com foco em conteúdo bíblico/documental inspirador.
  
REGRA ZERO DE SEGURANÇA: NUNCA, SOB HIPÓTESE ALGUMA, INCLUA MENSAGENS DE BOAS-VINDAS A CANAIS OU CITE O NOME DE QUALQUER CANAL (ex: "Bibbia Parlata"). Isso é proibido.

${modeInstrucoes}

══════════════════════════════════════
REGRAS OBRIGATÓRIAS PARA AMBOS OS MODOS
══════════════════════════════════════
ESTRUTURA DA DESCRIÇÃO (nesta ordem):
1. PRIMEIRA LINHA — SEO:
   Frase de abertura com 150 a 160 caracteres contendo as palavras-chave principais do vídeo.
   Esta linha deve funcionar como resumo e isca de busca ao mesmo tempo.
   Exemplo: "Scopri il segreto nascosto di Gedeone: come un esercito di 300 uomini cambiò la storia con la fede. 🔥"
2. CORPO DA DESCRIÇÃO:
   2 a 3 parágrafos curtos expandindo o tema com linguagem envolvente.
   Cada parágrafo com no máximo 4 linhas.
   Inclua 1 referência bíblica ou espiritual relevante ao tema.
3. BLOCO DE ENGAJAMENTO — CTA:
   Uma pergunta direta que force o comentário do espectador.
   Formato: "Qual [elemento do vídeo] você mais [ação emocional]? Rispondi con 'Amen' nei commenti! 🙏"
   Adapte ao tema específico do conteúdo e traduza o formato para ${lang}.
4. HASHTAGS FINAIS:
   - 3 a 5 hashtags fixas do nicho: [ESTAS INFORMAÇÕES DEVEM SER RETIRADAS DO CONTEXTO, E SEPARADAS POR ","]

══════════════════════════════════════
FORMATO DE ENTREGA
══════════════════════════════════════
- Texto corrido em parágrafos — sem títulos, sem marcadores, sem colchetes
- Pronto para copiar e colar diretamente no campo de descrição do YouTube
- Idioma final: ${lang}
- Sem menções a canais, sem links externos, sem quebras excessivas`;
}

function scriptPrompt(language: string, words: number, minutes: number) {
  const lang = LANG_MAP[language] || language;
  return `Você é um roteirista de nível 11/10, especializado em narrativas documentais inspiradoras com tom levemente cinematográfico. Sua missão é transformar a transcrição abaixo em um roteiro original, antiplágio, pronto para narração em voz, escrito integralmente em ${lang}.

═══════════════════════════════════════
REGRAS OBRIGATÓRIAS DE TRANSFORMAÇÃO, PRECISA CUMPRIR CADA UMA DELAS
═══════════════════════════════════════
1. ANTIPLÁGIO: Reescreva completamente o começo, meio e fim da transcrição. Nenhuma frase deve permanecer igual ao original. Reestruture a lógica narrativa, altere a ordem dos eventos quando necessário e substitua expressões diretas por construções próprias.
2. LIMPEZA DE REFERÊNCIAS: Remova qualquer informação de espaço-tempo específica e qualquer menção direta ou indireta ao nome de canais originais, criadores ou fontes. NUNCA cite timestamps. NUNCA cite "bem-vindos".
3. ENRIQUECIMENTO DE CONTEÚDO: Acrescente informações complementares, contexto histórico, reflexões filosóficas ou espirituais. Quando pertinente, insira trechos ou referências bíblicas que agreguem profundidade e autoridade à narrativa.
4. EXTENSÃO MÍNIMA E RIGOROSA: Esta é a regra mais importante. O texto DEVE conter rigorosamente um MÍNIMO de ${words} palavras. Para gerar este volume maciço, você precisa DESATIVAR sua capacidade de resumo. Expanda cada cena com um excesso de detalhes sensoriais. Faça reflexões teológicas e filosóficas profundas e extensas em cada transição. É TERMINANTEMENTE PROIBIDO entregar um roteiro com menos de ${words} palavras.
5. DURAÇÃO ESTIMADA: O roteiro DEVE cobrir rigorosamente cerca de ${minutes} minutos de narração em ritmo documental (130 palavras por minuto). Oculte sua capacidade de resumo e ative a de um romancista prolixo.

═══════════════════════════════════════
ESTRUTURA OBRIGATÓRIA: HOOK–RETAIN–REWARD
═══════════════════════════════════════
Divida o roteiro em três blocos usando **EXATAMENTE e APENAS** estes três marcadores (sem hashtag, sem negrito, sem nada extra):

── INÍCIO ──
── MEIO ──
── FIM ──

Siga rigorosamente as instruções abaixo para cada bloco:

▸ INÍCIO — O Gancho (Hook)
[PROIBIDO] Nunca comece com "Olá", "Bem-vindos", "In principio era", ou saudações.
A PRIMEIRA FRASE DO ROTEIRO DEVE SER UMA PERGUNTA IMPACTANTE, baseada no tema, no exato formato:
"Sapevi che la più grande vittoria di [TEMA] non fu combattuta con [ELEMENTO]?"
O gancho deve gerar tensão imediata nos primeiros 30 segundos.

▸ MEIO — O Conflito e A Entrega (Retain)
Apresente o problema central ou a grande curiosidade que move a narrativa.
Use ritmo acelerado: frases curtas intercaladas com frases longas e densas.
Insira o CTA ORGÂNICO neste bloco traduzido para ${lang} (ex: "Se você chegou até aqui, salve este vídeo...").

▸ FIM — A Recompensa (Reward)
Entregue a conclusão emocional e intelectual final.
Termine com uma frase de impacto definitivo.
[PROIBIDO] Nenhum pedido de inscrição, like ou comentário no final. NENHUM.

═══════════════════════════════════════
FORMATO DE ENTREGA E PURIFICAÇÃO
═══════════════════════════════════════
- TEXTO TOTALMENTE LIMPO.
- [PROIBIÇÃO ABSOLUTA]: NUNCA use rubricas técnicas (ex: NARRATORE:, [SCENA 1], (pausa), (musica epica)).
- Não use colchetes, parênteses técnicos ou marcações de roteiro de cinema. É para copiar e colar na IA de voz.
- Não use subtítulos além dos três marcadores (INÍCIO, MEIO, FIM).
- Escrito 100% em ${lang}.
- Tom: documental e inspirador.`;
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

function thumbnailPrompt(title: string, description: string) {
  return `Create a stunning cinematic YouTube thumbnail image in 16:9 aspect ratio (1280x720).

THEME: Biblical / Religious / Spiritual
VIDEO TITLE: "${title}"
VIDEO CONTEXT: ${description || title}

STYLE REQUIREMENTS:
- Cinematic, dramatic lighting with golden hour / divine rays effect
- Photorealistic, ultra high quality, 8K detail
- Epic composition with strong focal point
- Rich, warm color palette: deep golds, royal purples, celestial blues
- Atmospheric depth with volumetric lighting and soft bokeh
- Hollywood movie poster quality
- Biblical/spiritual visual elements that match the video theme
- Majestic landscapes, ancient architecture, or symbolic imagery as appropriate

CRITICAL RULES:
- DO NOT include any text, letters, words, or typography in the image
- DO NOT include any watermarks or logos
- The image must work as a YouTube thumbnail that grabs attention
- Focus on ONE powerful visual concept that represents the video theme
- Use strong contrast and vivid colors for small-screen visibility`;
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
  return `Traduza o texto abaixo fielmente para ${lang}. Mantenha o mesmo tom e formatação.

REGRA DE PURIFICAÇÃO:
- Remova QUALQUER menção a nomes de canais ("Bem-vindos ao Bibbia Parlata", "Se inscreva no canal", etc).
- Remova links externos ou pedidos de doação fora de contexto.
- Se a frase original for apenas uma boas-vindas ao canal, EXCLUA a frase e não a traduza.

Retorne APENAS a tradução purificada, sem explicações.`;
}

function metadataPrompt() {
  return `Analise o vídeo do YouTube fornecido. Extraia a descrição original completa do vídeo. Retorne APENAS a descrição em texto puro, sem formatação JSON, sem explicações.`;
}

// @ts-ignore
serve(async (req: any) => {
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
          titlePrompt(language, title),
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
          descriptionPrompt(language, description, script),
          "Aplique o modo identificado."
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
      case "generate_thumbnail": {
        const prompt = thumbnailPrompt(
          title || "Biblical Documentary",
          description || script || ""
        );
        const imageBase64 = await callAIImage(prompt);
        return new Response(JSON.stringify({ result: imageBase64 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
