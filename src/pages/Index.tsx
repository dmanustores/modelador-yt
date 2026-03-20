import { useState, useCallback } from "react";
import { Type, FileText, ScrollText, ImageIcon, Hash, File } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import SettingsPanel from "@/components/SettingsPanel";
import ThumbnailSection from "@/components/ThumbnailSection";
import TextSection from "@/components/TextSection";
import NarrationSection from "@/components/NarrationSection";
import ExportSection from "@/components/ExportSection";
import { extractVideoId, getThumbnailUrl, type ProjectData } from "@/lib/project-types";
import { toast } from "sonner";

const defaultProject: ProjectData = {
  url: "",
  language: "pt",
  duration: 30,
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
  generatedAt: "",
};

const Index = () => {
  const [project, setProject] = useState<ProjectData>(defaultProject);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

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
        update({ originalTitle: data.title || "" });
        toast.success("Metadados extraídos com sucesso!");
      } else {
        toast.error("Não foi possível extrair os metadados do vídeo.");
      }
    } catch {
      toast.error("Erro ao conectar com o YouTube.");
    }

    setLoading(false);
  };

  const hasData = !!videoId;

  return (
    <div className="min-h-screen bg-background">
      {/* Top accent line */}
      <div className="h-1 gold-gradient" />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* URL Input */}
        <UrlInput url={url} loading={loading} onUrlChange={setUrl} onSubmit={handleExtract} />

        {/* Settings */}
        <SettingsPanel
          language={project.language}
          duration={project.duration}
          onLanguageChange={(l) => update({ language: l })}
          onDurationChange={(d) => update({ duration: d })}
        />

        {hasData && (
          <>
            {/* 2. Thumbnails */}
            <ThumbnailSection
              originalThumb={project.thumbnailUrl}
              generatedThumb=""
              onGenerate={() => toast.info("Integração com Gemini necessária para gerar capas.")}
              onRemodel={() => toast.info("Integração com Gemini necessária para remodelar.")}
              generating={false}
            />

            {/* 3. Title */}
            <TextSection
              title="Título do Vídeo"
              icon={<Type className="w-5 h-5 text-primary" />}
              content={project.generatedTitle || project.originalTitle}
              showTranslate
              onTranslate={() => toast.info("Integração com IA necessária para traduzir.")}
            />

            {/* 4. Description */}
            <TextSection
              title="Descrição Original"
              icon={<FileText className="w-5 h-5 text-primary" />}
              content={project.generatedDescription || project.originalDescription}
              showTranslate
              onTranslate={() => toast.info("Integração com IA necessária para traduzir.")}
              note="A descrição completa será extraída via API do Gemini"
            />

            {/* 5. Transcript */}
            <TextSection
              title="Transcrição do Vídeo (Opcional)"
              icon={<ScrollText className="w-5 h-5 text-primary" />}
              content={project.transcript}
              editable
              showPaste
              onContentChange={(val) => update({ transcript: val })}
              placeholder="Cole aqui a transcrição do vídeo para gerar o roteiro..."
            />

            {/* 6. Script */}
            <TextSection
              title="Roteiro e Narração"
              icon={<FileText className="w-5 h-5 text-primary" />}
              content={project.generatedScript}
              wordCount
              showGenerate
              generateLabel="Gerar Roteiro"
              onGenerate={() => toast.info("Integração com Gemini necessária para gerar roteiro.")}
            />

            {/* 7. Image Prompts */}
            <TextSection
              title="Prompts para Gerar Imagens (Inglês)"
              icon={<ImageIcon className="w-5 h-5 text-primary" />}
              content={project.imagePrompts}
              showGenerate
              generateLabel="Gerar Prompts de Imagem"
              onGenerate={() => toast.info("Integração com Gemini necessária.")}
              note='Acesse o Whisk para gerar imagens (é necessário estar logado)'
            />

            {/* 8. Narration */}
            <NarrationSection />

            {/* 9. File Name */}
            <TextSection
              title="Nome Sugerido para o Arquivo de Vídeo"
              icon={<File className="w-5 h-5 text-primary" />}
              content={project.suggestedFileName}
              note="O nome será gerado automaticamente junto com o roteiro"
            />

            {/* 10. Hashtags */}
            <TextSection
              title="Hashtags Sugeridas"
              icon={<Hash className="w-5 h-5 text-primary" />}
              content={project.hashtags}
              note="As hashtags serão geradas automaticamente junto com o roteiro"
            />

            {/* 11-12. Export */}
            <ExportSection
              data={{ ...project, generatedAt: new Date().toLocaleString("pt-BR") }}
              onSave={() => toast.info("Integração com Supabase necessária para salvar.")}
              saving={false}
            />
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-6 pb-4">
          YouTube Content Studio · Ferramenta para Criadores de Conteúdo Bíblico
        </footer>
      </div>
    </div>
  );
};

export default Index;
