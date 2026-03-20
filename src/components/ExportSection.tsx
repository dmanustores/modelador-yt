import { Download, Save, Loader2 } from "lucide-react";
import type { ProjectData } from "@/lib/project-types";
import { LANGUAGES, DURATIONS } from "@/lib/project-types";

interface ExportSectionProps {
  data: ProjectData;
  onSave: () => void;
  saving: boolean;
}

const ExportSection = ({ data, onSave, saving }: ExportSectionProps) => {
  const langLabel = LANGUAGES.find((l) => l.code === data.language)?.label || data.language;
  const durInfo = DURATIONS.find((d) => d.minutes === data.duration);

  const buildExportText = () => {
    return `${"=".repeat(60)}
PROJETO COMPLETO - Modelador YT
${"=".repeat(60)}

📌 NOME DO PROJETO: ${data.generatedTitle || data.originalTitle || "Sem título"}

📁 NOME SUGERIDO PARA O ARQUIVO DE VÍDEO:
${data.suggestedFileName || "Aguardando geração..."}

📝 TÍTULO:
${data.generatedTitle || data.originalTitle || "Não gerado"}

📄 DESCRIÇÃO:
${data.generatedDescription || data.originalDescription || "Não gerada"}

#️⃣ HASHTAGS:
${data.hashtags || "Não geradas"}

🎬 ROTEIRO E NARRAÇÃO:
${data.generatedScript || "Não gerado"}

🖼️ PROMPTS DE IMAGEM:
${data.imagePrompts || "Não gerados"}

🔗 LINK DO YOUTUBE ORIGINAL:
${data.url}

🌍 Idioma: ${langLabel}
⏱️ Duração: ${durInfo ? `${durInfo.label} (~${durInfo.words} palavras)` : `${data.duration} min`}
⏰ Gerado em: ${data.generatedAt || new Date().toLocaleString("pt-BR")}

${"=".repeat(60)}
`;
  };

  const handleDownload = () => {
    const text = buildExportText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projeto_${(data.suggestedFileName || "video").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="section-card">
      <h2 className="font-display text-lg gold-text mb-4">📦 Exportar Projeto</h2>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/20 text-primary font-semibold text-sm hover:bg-primary/30 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Projeto"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Baixar .TXT
        </button>
      </div>
    </div>
  );
};

export default ExportSection;
