import { Search, Loader2 } from "lucide-react";

interface UrlInputProps {
  url: string;
  loading: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
}

const UrlInput = ({ url, loading, onUrlChange, onSubmit }: UrlInputProps) => {
  return (
    <div className="section-card text-center">
      <h1 className="font-display text-2xl md:text-3xl gold-text mb-2">
        Modelador YT
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        Ferramenta de automação para criadores de conteúdo bíblico do YouTube
      </p>
      <div className="flex gap-2 max-w-2xl mx-auto">
        <input
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        />
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-6 py-3 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Extrair
        </button>
      </div>
    </div>
  );
};

export default UrlInput;
