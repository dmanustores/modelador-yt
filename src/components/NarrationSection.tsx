import { Mic, ExternalLink } from "lucide-react";

const NarrationSection = () => {
  return (
    <div className="section-card">
      <h2 className="font-display text-base gold-text flex items-center gap-2 mb-3">
        <Mic className="w-5 h-5 text-primary" />
        Gerar Narração Externa
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Siga as instruções abaixo para uma narração profissional:
      </p>
      <div className="bg-secondary rounded-lg p-4 text-sm space-y-3 border border-border">
        <div>
          <span className="text-primary font-semibold">Voz:</span>{" "}
          <span className="text-foreground">Enceladus</span>
        </div>
        <div>
          <span className="text-primary font-semibold">Style instructions:</span>{" "}
          <span className="text-foreground">
            Use um tom narrativo calmo, confiante e inspirador, semelhante a um documentário emocional. 
            Ritmo moderado, pausas suaves entre frases, dicção clara e envolvente.
          </span>
        </div>
      </div>
      <a
        href="https://aistudio.google.com/generate-speech?model=gemini-2.5-flash-preview-tts"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <ExternalLink className="w-4 h-4" />
        Acessar Google AI Studio TTS
      </a>
    </div>
  );
};

export default NarrationSection;
