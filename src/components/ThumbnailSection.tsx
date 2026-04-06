import { ImageIcon, RefreshCw, Sparkles, Download, Loader2 } from "lucide-react";

interface ThumbnailSectionProps {
  originalThumb: string;
  generatedThumb: string;
  geminiPrompt: string;
  onGenerate: () => void;
  onGenerateFast: () => void;
  onUpload: (base64: string) => void;
  generating: boolean;
  generatingFast: boolean;
}

const ThumbnailSection = ({ 
  originalThumb, 
  generatedThumb, 
  geminiPrompt,
  onGenerate, 
  onGenerateFast, 
  onUpload, 
  generating, 
  generatingFast 
}: ThumbnailSectionProps) => {
  if (!originalThumb) return null;

  const handleDownload = () => {
    if (!generatedThumb) return;
    const link = document.createElement("a");
    link.href = generatedThumb;
    link.download = `thumbnail-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(geminiPrompt);
    // @ts-expect-error toast is a global window property
    window.toast?.success("Prompt copiado!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpload(reader.result as string);
    };
    reader.readAsDataURL(file);
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

        {/* Generated Image Result */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Nova Capa (IA)</p>
          <div className="rounded-lg overflow-hidden border border-border aspect-video bg-secondary flex items-center justify-center relative">
            {(generating || generatingFast) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3 text-center p-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-foreground font-bold animate-pulse">
                  Preparando Prompt Estratégico...
                </p>
              </div>
            )}
            {generatedThumb ? (
              <img src={generatedThumb} alt="Thumbnail gerada" className="w-full h-full object-cover" />
            ) : (
              !generating && !generatingFast && (
                <div className="text-center p-4">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">Thumbnail será exibida aqui após upload</p>
                </div>
              )
            )}
          </div>
          
          <div className="flex flex-col gap-2 mt-3">
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
            
            {generatedThumb && (
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-foreground font-medium text-sm hover:bg-surface-hover transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Capa Final
              </button>
            )}
          </div>
        </div>
      </div>

      {geminiPrompt && (
        <div className="mt-8 pt-6 border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-secondary/30 rounded-xl p-5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold gold-text uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Prompt Mágico do Gemini
              </label>
              <button 
                onClick={handleCopyPrompt}
                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full border border-primary/20 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Copiar Prompt
              </button>
            </div>
            <textarea
              readOnly
              value={geminiPrompt}
              className="w-full bg-background/50 border border-border/50 rounded-lg p-3 text-sm text-foreground font-mono focus:outline-none h-32 resize-none"
            />
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10 flex flex-col items-center gap-3">
              <p className="text-xs text-center text-muted-foreground">
                <span className="text-primary font-bold">PASSO A PASSO:</span> Copie o prompt acima, cole no seu <strong>Gemini</strong> ou <strong>ChatGPT</strong>, gere a imagem e faça o upload abaixo.
              </p>
              <label className="w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold cursor-pointer hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                  <Download className="w-5 h-5 rotate-180" />
                  FAZER UPLOAD DA CAPA GERADA
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThumbnailSection;
