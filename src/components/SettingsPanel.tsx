import { Globe, Clock } from "lucide-react";
import { LANGUAGES, DURATIONS } from "@/lib/project-types";

interface SettingsPanelProps {
  language: string;
  duration: number;
  onLanguageChange: (lang: string) => void;
  onDurationChange: (dur: number) => void;
}

const SettingsPanel = ({ language, duration, onLanguageChange, onDurationChange }: SettingsPanelProps) => {
  return (
    <div className="section-card">
      <h2 className="font-display text-lg gold-text mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" />
        Configurações de Geração
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Idioma de Geração</label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => onLanguageChange(l.code)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  language === l.code
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-surface-hover"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Duração do Roteiro
          </label>
          <div className="space-y-2">
            {DURATIONS.map((d) => (
              <button
                key={d.minutes}
                onClick={() => onDurationChange(d.minutes)}
                className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-all ${
                  duration === d.minutes
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-surface-hover"
                }`}
              >
                <span className="font-semibold">{d.label}</span>
                <span className="text-xs opacity-80">~{d.words.toLocaleString()} palavras (~{d.chars.toLocaleString()} chars)</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
