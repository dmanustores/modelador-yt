import { useState, useCallback } from "react";
import { Type, FileText, ScrollText, ImageIcon, Hash, File } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import SettingsPanel from "@/components/SettingsPanel";
import ThumbnailSection from "@/components/ThumbnailSection";
import TextSection from "@/components/TextSection";
import NarrationSection from "@/components/NarrationSection";
import ExportSection from "@/components/ExportSection";
import { extractVideoId, getThumbnailUrl, type ProjectData, DURATIONS } from "@/lib/project-types";
import { generateContent, generateThumbnail, generateThumbnailFast } from "@/lib/ai-service";
import { toast } from "sonner";

const defaultProject: ProjectData = {
  url: "",
  language: "pt",
  duration: 15,
  originalTitle: "",
  originalDescription: "",
  transcript: "",
  generatedTitle: "",
  generatedDescription: "",
  generatedScript: "",
  imagePrompts: "",
  hashtags: "",
  suggestedFileName: "",
  thumbnailUrl: "",
  generatedThumbnailBase64: "",
  geminiThumbnailPrompt: "",
  generatedAt: "",
};

async function imageUrlToBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Supabase API often prefers just the base64, but we keep the header for the backend to strip if needed
        resolve(result);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to convert image to base64", e);
    return undefined;
  }
}

const Index = () => {
  const [project, setProject] = useState<ProjectData>(defaultProject);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Loading states per action
  const [translatingTitle, setTranslatingTitle] = useState(false);
  const [translatingDesc, setTranslatingDesc] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingImagePrompts, setGeneratingImagePrompts] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [generatingFastThumbnail, setGeneratingFastThumbnail] = useState(false);
  const [generatingCreativeTitle, setGeneratingCreativeTitle] = useState(false);
  const [generatingCreativeDesc, setGeneratingCreativeDesc] = useState(false);

  const update = useCallback((patch: Partial<ProjectData>) => {
    setProject((p) => ({ ...p, ...patch }));
  }, []);

  const handleExtract = async () => {
    const id = extractVideoId(url);
    if (!id) {
      toast.error("URL do YouTube inválida. Verifique e tente novamente.");
      return;
    }
    setLoading(true);
    setVideoId(id);

    const thumbUrl = getThumbnailUrl(id);
    update({ url, thumbnailUrl: thumbUrl });

    // oEmbed for title
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        const originalTitle = data.title || "";
        update({ originalTitle });
        toast.success("Metadados extraídos com sucesso!");

        // Extract full description via AI
        try {
          const desc = await generateContent({
            action: "extract_description",
            url: `https://www.youtube.com/watch?v=${id}`,
            title: originalTitle,
          });
          if (desc) update({ originalDescription: desc });
        } catch {
          // Description extraction is optional, don't show error
        }
      } else {
        toast.error("Não foi possível extrair os metadados do vídeo.");
      }
    } catch {
      toast.error("Erro ao conectar com o YouTube.");
    }

    setLoading(false);
  };

  const handleTranslateTitle = async () => {
    const text = project.generatedTitle || project.originalTitle;
    if (!text) return;
    setTranslatingTitle(true);
    try {
      const result = await generateContent({
        action: "translate_title",
        language: project.language,
        title: text,
      });
      update({ generatedTitle: result });
      toast.success("Título traduzido!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao traduzir título.");
    }
    setTranslatingTitle(false);
  };

  const handleGenerateCreativeTitle = async () => {
    const text = project.generatedTitle || project.originalTitle;
    if (!text) return;
    setGeneratingCreativeTitle(true);
    try {
      const result = await generateContent({
        action: "generate_title",
        language: project.language,
        title: text,
      });
      update({ generatedTitle: result });
      toast.success("Título criativo gerado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar título.");
    }
    setGeneratingCreativeTitle(false);
  };

  const handleTranslateDescription = async () => {
    const text = project.generatedDescription || project.originalDescription;
    if (!text) return;
    setTranslatingDesc(true);
    try {
      const result = await generateContent({
        action: "translate_description",
        language: project.language,
        description: text,
      });
      update({ generatedDescription: result });
      toast.success("Descrição traduzida!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao traduzir descrição.");
    }
    setTranslatingDesc(false);
  };

  const handleGenerateCreativeDescription = async () => {
    setGeneratingCreativeDesc(true);
    try {
      const result = await generateContent({
        action: "generate_description",
        language: project.language,
        description: project.originalDescription,
        script: project.transcript || project.generatedScript,
      });
      update({ generatedDescription: result });
      toast.success("Descrição criativa gerada!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar descrição.");
    }
    setGeneratingCreativeDesc(false);
  };

  const handleGenerateScript = async () => {
    setGeneratingScript(true);
    try {
      const durInfo = DURATIONS.find((d) => d.minutes === project.duration) || DURATIONS[1];
      
      // Generate script
      const script = await generateContent({
        action: "generate_script",
        language: project.language,
        duration: project.duration,
        title: project.generatedTitle || project.originalTitle,
        transcript: project.transcript,
      });
      update({ generatedScript: script });
      toast.success("Roteiro gerado com sucesso!");

      // Auto-generate title, description, hashtags, filename in parallel
      const titleText = project.generatedTitle || project.originalTitle;
      
      const [genTitle, genDesc, genHashtags, genFileName] = await Promise.allSettled([
        generateContent({
          action: "generate_title",
          language: project.language,
          title: titleText,
        }),
        generateContent({
          action: "generate_description",
          language: project.language,
          description: project.originalDescription,
          script,
          title: titleText,
        }),
        generateContent({
          action: "generate_hashtags",
          language: project.language,
          script,
          title: titleText,
        }),
        generateContent({
          action: "generate_filename",
          title: titleText,
        }),
      ]);

      const patch: Partial<ProjectData> = {};
      if (genTitle.status === "fulfilled") patch.generatedTitle = genTitle.value;
      if (genDesc.status === "fulfilled") patch.generatedDescription = genDesc.value;
      if (genHashtags.status === "fulfilled") patch.hashtags = genHashtags.value;
      if (genFileName.status === "fulfilled") patch.suggestedFileName = genFileName.value;
      update(patch);

      if (Object.keys(patch).length > 0) {
        toast.success("Título, descrição, hashtags e nome do arquivo gerados!");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar roteiro.");
    }
    setGeneratingScript(false);
  };

  const handleGenerateImagePrompts = async () => {
    if (!project.generatedScript) {
      toast.error("Gere o roteiro primeiro para criar os prompts de imagem.");
      return;
    }
    setGeneratingImagePrompts(true);
    try {
      const result = await generateContent({
        action: "generate_image_prompts",
        script: project.generatedScript,
      });
      update({ imagePrompts: result });
      toast.success("Prompts de imagem gerados!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar prompts de imagem.");
    }
    setGeneratingImagePrompts(false);
  };

  const handleGenerateThumbnail = async () => {
    setGeneratingThumbnail(true);
    try {
      let originalImageBase64;
      if (project.thumbnailUrl) {
        originalImageBase64 = await imageUrlToBase64(project.thumbnailUrl);
        // Strip the data:image... prefix so the backend gets clean base64
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
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar capa.");
    }
    setGeneratingThumbnail(false);
  };

  const handleGenerateFastThumbnail = async () => {
    setGeneratingFastThumbnail(true);
    try {
      const result = await generateThumbnailFast({
        title: project.generatedTitle || project.originalTitle,
        description: project.generatedDescription || project.originalDescription,
        script: project.generatedScript,
      });
      update({ geminiThumbnailPrompt: result });
      toast.success("Capa rápida gerada com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar capa rápida.");
    }
    setGeneratingFastThumbnail(false);
  };



  const hasData = !!videoId;

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 gold-gradient" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <UrlInput url={url} loading={loading} onUrlChange={setUrl} onSubmit={handleExtract} />

        <SettingsPanel
          language={project.language}
          duration={project.duration}
          onLanguageChange={(l) => update({ language: l })}
          onDurationChange={(d) => update({ duration: d })}
        />

        {hasData && (
          <>
            <ThumbnailSection
              originalThumb={project.thumbnailUrl}
              generatedThumb={project.generatedThumbnailBase64}
              geminiPrompt={project.geminiThumbnailPrompt}
              onGenerate={handleGenerateThumbnail}
              onGenerateFast={handleGenerateFastThumbnail}
              onUpload={(base64) => update({ generatedThumbnailBase64: base64 })}
              generating={generatingThumbnail}
              generatingFast={generatingFastThumbnail}
            />

            <TextSection
              title="Título do Vídeo"
              icon={<Type className="w-5 h-5 text-primary" />}
              content={project.generatedTitle || project.originalTitle}
              showTranslate
              onTranslate={handleTranslateTitle}
              translating={translatingTitle}
              showSecondaryGenerate
              secondaryGenerateLabel="Criar Título Criativo"
              onSecondaryGenerate={handleGenerateCreativeTitle}
              secondaryGenerating={generatingCreativeTitle}
            />

            <TextSection
              title="Descrição Original"
              icon={<FileText className="w-5 h-5 text-primary" />}
              content={project.generatedDescription || project.originalDescription}
              showTranslate
              onTranslate={handleTranslateDescription}
              translating={translatingDesc}
              showSecondaryGenerate
              secondaryGenerateLabel="Criar Desc Criativa"
              onSecondaryGenerate={handleGenerateCreativeDescription}
              secondaryGenerating={generatingCreativeDesc}
              note="A descrição é extraída automaticamente via IA"
            />

            <TextSection
              title="Transcrição do Vídeo (Opcional)"
              icon={<ScrollText className="w-5 h-5 text-primary" />}
              content={project.transcript}
              editable
              showPaste
              onContentChange={(val) => update({ transcript: val })}
              placeholder="Cole aqui a transcrição do vídeo para gerar o roteiro..."
            />

            <TextSection
              title="Roteiro e Narração"
              icon={<FileText className="w-5 h-5 text-primary" />}
              content={project.generatedScript}
              wordCount
              showGenerate
              generateLabel="Gerar Roteiro"
              onGenerate={handleGenerateScript}
              generating={generatingScript}
            />

            <TextSection
              title="Prompts para Gerar Imagens (Inglês)"
              icon={<ImageIcon className="w-5 h-5 text-primary" />}
              content={project.imagePrompts}
              showGenerate
              generateLabel="Gerar Prompts de Imagem"
              onGenerate={handleGenerateImagePrompts}
              generating={generatingImagePrompts}
              note='Acesse o Whisk para gerar imagens (é necessário estar logado)'
            />

            <NarrationSection />

            <TextSection
              title="Nome Sugerido para o Arquivo de Vídeo"
              icon={<File className="w-5 h-5 text-primary" />}
              content={project.suggestedFileName}
              note="O nome será gerado automaticamente junto com o roteiro"
            />

            <TextSection
              title="Hashtags Sugeridas"
              icon={<Hash className="w-5 h-5 text-primary" />}
              content={project.hashtags}
              note="As hashtags serão geradas automaticamente junto com o roteiro"
            />

            <ExportSection
              data={{ ...project, generatedAt: new Date().toLocaleString("pt-BR") }}
              onSave={() => toast.info("Integração com banco de dados será configurada em breve.")}
              saving={false}
            />
          </>
        )}

        <footer className="text-center text-xs text-muted-foreground pt-6 pb-4">
          Modelador YT · Ferramenta para Criadores de Conteúdo Bíblico
        </footer>
      </div>
    </div>
  );
};

export default Index;
