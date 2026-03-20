export interface ProjectData {
  url: string;
  language: string;
  duration: number;
  originalTitle: string;
  originalDescription: string;
  transcript: string;
  generatedTitle: string;
  generatedDescription: string;
  generatedScript: string;
  imagePrompts: string;
  hashtags: string;
  suggestedFileName: string;
  thumbnailUrl: string;
  generatedThumbnailBase64: string;
  generatedAt: string;
}

export const LANGUAGES = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

export const DURATIONS = [
  { minutes: 15, words: 2000, chars: 12000, label: "15 min" },
  { minutes: 30, words: 4000, chars: 24000, label: "30 min" },
  { minutes: 45, words: 6000, chars: 36000, label: "45 min" },
];

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
