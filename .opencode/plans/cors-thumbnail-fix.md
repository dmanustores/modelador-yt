# Plano de Correções - CORS Thumbnail + Botão Gerar Capa Rápida

## Problema 1: CORS no fetch de thumbnail para base64
**Arquivo:** `src/pages/Index.tsx:34`
**Problema:** `fetch(url)` para `img.youtube.com` é bloqueado por CORS no navegador, fazendo a conversão para base64 falhar silenciosamente.

## Problema 2: Botão "Gerar Capa Rápida" ausente na UI
**Arquivo:** `src/components/ThumbnailSection.tsx`
**Problema:** As props `onGenerateFast` e `generatingFast` são recebidas mas nunca há um botão para acioná-las.

---

## Alteração 1: `src/lib/ai-service.ts` — Linha 42-47

Adicionar `thumbnailUrl` na interface `ThumbnailParams`:

```ts
interface ThumbnailParams {
  title?: string;
  description?: string;
  script?: string;
  originalImageBase64?: string;
  thumbnailUrl?: string;  // ← ADICIONAR ESTA LINHA
}
```

**Local exato:** Linha 46, após `originalImageBase64?: string;`

---

## Alteração 2: `src/pages/Index.tsx` — Remover função e simplificar handler

### 2a. REMOVER completamente a função `imageUrlToBase64` (linhas 32-49)

Deletar todo este bloco:
```ts
async function imageUrlToBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to convert image to base64", e);
    return undefined;
  }
}
```

### 2b. SUBSTITUIR `handleGenerateThumbnail` (linhas 265-288)

**ANTES:**
```ts
const handleGenerateThumbnail = async () => {
  setGeneratingThumbnail(true);
  try {
    let originalImageBase64;
    if (project.thumbnailUrl) {
      originalImageBase64 = await imageUrlToBase64(project.thumbnailUrl);
      if (originalImageBase64 && originalImageBase64.includes(",")) {
        originalImageBase64 = originalImageBase64.split(",")[1];
      }
    }

    const result = await generateThumbnail({
      title: project.generatedTitle || project.originalTitle,
      description: project.generatedDescription || project.originalDescription,
      script: project.generatedScript,
      originalImageBase64,
    });
    update({ geminiThumbnailPrompt: result });
    toast.success("Capa cinematográfica gerada com sucesso!");
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : "Erro ao gerar capa.");
  }
  setGeneratingThumbnail(false);
};
```

**DEPOIS:**
```ts
const handleGenerateThumbnail = async () => {
  setGeneratingThumbnail(true);
  try {
    const result = await generateThumbnail({
      title: project.generatedTitle || project.originalTitle,
      description: project.generatedDescription || project.originalDescription,
      script: project.generatedScript,
      thumbnailUrl: project.thumbnailUrl,
    });
    update({ geminiThumbnailPrompt: result });
    toast.success("Capa cinematográfica gerada com sucesso!");
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : "Erro ao gerar capa.");
  }
  setGeneratingThumbnail(false);
};
```

---

## Alteração 3: `supabase/functions/generate-content/index.ts`

### 3a. ADICIONAR função helper `urlToBase64` após os `corsHeaders`

Inserir após a linha 8 (após o fechamento do objeto `corsHeaders`):

```ts
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
    return b64;
  } catch (e) {
    console.error("Failed to fetch image:", e);
    return null;
  }
}
```

### 3b. MODIFICAR o case `generate_thumbnail` (linhas 384-399)

**ANTES:**
```ts
case "generate_thumbnail": {
  let prompt = "";
  
  if (originalImageBase64) {
    console.log("Extracting visual features from original base64 image via Gemini Vision...");
    const visualDescription = await callGeminiVision(originalImageBase64, language || "pt");
    prompt = imageToImagePrompt(language || "pt", visualDescription);
  } else {
    prompt = thumbnailPrompt(title || "Biblical Documentary", description || script || "");
  }
  
  return new Response(JSON.stringify({ result: prompt }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

**DEPOIS:**
```ts
case "generate_thumbnail": {
  let prompt = "";
  
  if (originalImageBase64) {
    console.log("Extracting visual features from original base64 image via Gemini Vision...");
    const visualDescription = await callGeminiVision(originalImageBase64, language || "pt");
    prompt = imageToImagePrompt(language || "pt", visualDescription);
  } else if (url) {
    const base64 = await urlToBase64(url);
    if (base64) {
      console.log("Extracting visual features from thumbnail URL via Gemini Vision...");
      const visualDescription = await callGeminiVision(base64, language || "pt");
      prompt = imageToImagePrompt(language || "pt", visualDescription);
    } else {
      prompt = thumbnailPrompt(title || "Biblical Documentary", description || script || "");
    }
  } else {
    prompt = thumbnailPrompt(title || "Biblical Documentary", description || script || "");
  }
  
  return new Response(JSON.stringify({ result: prompt }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

---

## Alteração 4: `src/components/ThumbnailSection.tsx` — Adicionar botão "Gerar Capa Rápida"

### Local: Linhas 99-109 (dentro do `<div className="flex gap-2">`)

**ANTES:**
```tsx
<div className="flex gap-2">
  <button
    onClick={onGenerate}
    disabled={generating || generatingFast}
    className="flex-1 flex items-center justify-center gap-2 px-2 py-3 rounded-lg gold-gradient text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
  >
    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
    {generating ? "Processando..." : "Gerar Prompt Premium"}
  </button>
</div>
```

**DEPOIS:**
```tsx
<div className="flex gap-2">
  <button
    onClick={onGenerate}
    disabled={generating || generatingFast}
    className="flex-1 flex items-center justify-center gap-2 px-2 py-3 rounded-lg gold-gradient text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
  >
    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
    {generating ? "Processando..." : "Gerar Prompt Premium"}
  </button>
  <button
    onClick={onGenerateFast}
    disabled={generating || generatingFast}
    className="flex-1 flex items-center justify-center gap-2 px-2 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
  >
    {generatingFast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
    {generatingFast ? "Processando..." : "Gerar Capa Rápida"}
  </button>
</div>
```

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/lib/ai-service.ts` | Adição | Adicionar `thumbnailUrl` na interface |
| `src/pages/Index.tsx` | Remoção + Modificação | Remover `imageUrlToBase64`, simplificar `handleGenerateThumbnail` |
| `supabase/functions/generate-content/index.ts` | Adição + Modificação | Adicionar `urlToBase64`, expandir case `generate_thumbnail` |
| `src/components/ThumbnailSection.tsx` | Adição | Adicionar botão "Gerar Capa Rápida" |

## Benefícios da Abordagem
- Zero chamadas extras de rede (uma única chamada ao backend)
- Sem dependência de proxy externo que pode cair
- Sem risco de CORS ou timeout no navegador
- Código mais limpo e simples
- Botão "Gerar Capa Rápida" agora visível e funcional
