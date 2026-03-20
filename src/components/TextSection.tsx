import { Copy, Languages, Check } from "lucide-react";
import { useState } from "react";

interface TextSectionProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  showTranslate?: boolean;
  showPaste?: boolean;
  showGenerate?: boolean;
  generateLabel?: string;
  onTranslate?: () => void;
  onGenerate?: () => void;
  onContentChange?: (val: string) => void;
  editable?: boolean;
  placeholder?: string;
  wordCount?: boolean;
  translating?: boolean;
  generating?: boolean;
  note?: string;
}

const TextSection = ({
  title,
  icon,
  content,
  showTranslate,
  showPaste,
  showGenerate,
  generateLabel,
  onTranslate,
  onGenerate,
  onContentChange,
  editable,
  placeholder,
  wordCount,
  translating,
  generating,
  note,
}: TextSectionProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const words = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = content ? content.length : 0;

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base gold-text flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {wordCount && content && (
          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            {words.toLocaleString()} palavras · {chars.toLocaleString()} chars
          </span>
        )}
      </div>

      {note && <p className="text-xs text-muted-foreground mb-3 italic">{note}</p>}

      {editable ? (
        <textarea
          value={content}
          onChange={(e) => onContentChange?.(e.target.value)}
          placeholder={placeholder}
          rows={6}
          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-y min-h-[120px]"
        />
      ) : (
        <div className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm min-h-[80px] whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {content || <span className="text-muted-foreground">Aguardando dados...</span>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {content && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-surface-hover transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        )}
        {showTranslate && (
          <button
            onClick={onTranslate}
            disabled={translating || !content}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 disabled:opacity-50 transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            {translating ? "Traduzindo..." : "Traduzir"}
          </button>
        )}
        {showPaste && (
          <button
            onClick={async () => {
              const text = await navigator.clipboard.readText();
              onContentChange?.(text);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-surface-hover transition-colors"
          >
            📋 Colar
          </button>
        )}
        {showGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gold-gradient text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {generating ? "Gerando..." : generateLabel || "Gerar"}
          </button>
        )}
      </div>
    </div>
  );
};

export default TextSection;
