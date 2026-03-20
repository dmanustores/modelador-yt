import { ImageIcon, RefreshCw, Sparkles, Download, Loader2 } from "lucide-react";

interface ThumbnailSectionProps {
  originalThumb: string;
  generatedThumb: string;
  onGenerate: () => void;
  onRemodel: () => void;
  generating: boolean;
}

const ThumbnailSection = ({ originalThumb, generatedThumb, onGenerate, onRemodel, generating }: ThumbnailSectionProps) => {
  if (!originalThumb) return null;

  const handleDownload = () => {
    if (!generatedThumb) return;

    const link = document.createElement("a");

    if (generatedThumb.startsWith("data:")) {
      link.href = generatedThumb;
    } else {
      link.href = generatedThumb;
    }

    link.download = `thumbnail-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="section-card">
      <h2 className="font-display text-lg gold-text mb-4 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-primary" />
        Capas do Vídeo
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Capa Original</p>
          <div className="rounded-lg overflow-hidden border border-border aspect-video bg-secondary">
            <img
              src={originalThumb}
              alt="Thumbnail original"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = originalThumb.replace("maxresdefault", "hqdefault");
              }}
            />
          </div>
        </div>

        {/* Generated */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Nova Capa (IA)</p>
          <div className="rounded-lg overflow-hidden border border-border aspect-video bg-secondary flex items-center justify-center relative">
            {generating && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Gerando capa cinematográfica...</p>
              </div>
            )}
            {generatedThumb ? (
              <img src={generatedThumb} alt="Thumbnail gerada por IA" className="w-full h-full object-cover" />
            ) : (
              !generating && <p className="text-muted-foreground text-sm">Aguardando geração...</p>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onGenerate}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generating ? "Gerando..." : "Gerar Capa"}
            </button>
            <button
              onClick={onRemodel}
              disabled={generating || !generatedThumb}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-surface-hover disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Remodelar
            </button>
            <button
              onClick={handleDownload}
              disabled={!generatedThumb}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-surface-hover disabled:opacity-50 transition-colors"
              title="Baixar capa"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailSection;
