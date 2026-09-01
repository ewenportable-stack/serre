import type { HypervisionConfig } from "../types/hypervision";

export function downloadConfig(config: HypervisionConfig): void {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = config.greenhouse.name.trim().toLowerCase().replace(/\s+/g, "-") || "serre";
  a.href = url;
  a.download = `${slug}-hypervision.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseConfigFile(text: string): HypervisionConfig {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || data.version !== 1) {
    throw new Error("Fichier de configuration invalide ou version non supportée.");
  }
  return data as HypervisionConfig;
}
