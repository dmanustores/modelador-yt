import { ImageIcon, RefreshCw, Sparkles } from "lucide-react";

interface ThumbnailSectionProps {
  originalThumb: string;
  generatedThumb: string;
  onGenerate: () => void;
  onRemodel: () => void;
  generating: boolean;
}

const ThumbnailSection = ({ originalThumb, generatedThumb, onGenerate, onRemodel, generating }: ThumbnailSectionProps) => {
  if (!originalThumb) return null;

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
          <div className="rounded-lg overflow-hidden border border-border aspect-video bg-secondary flex items-center justify-center">
            {generatedThumb ? (
              <img src={generatedThumb} alt="Thumbnail gerada" className="w-full h-full object-cover" />
            ) : (
              <p className="text-muted-foreground text-sm">Aguardando geração...</p>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onGenerate}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Capa
            </button>
            <button
              onClick={onRemodel}
              disabled={generating || !generatedThumb}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-surface-hover disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Remodelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailSection;
