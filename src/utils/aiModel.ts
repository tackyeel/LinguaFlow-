import type { AiService, AppConfig } from "../types/config";

type AiModelRole = "text" | "vision";

export function getActiveAiService(config: AppConfig, role: AiModelRole = "text"): AiService | undefined {
  const requestedId =
    role === "vision"
      ? (config.aiSettings.visionServiceId || config.aiSettings.defaultServiceId).trim()
      : config.aiSettings.defaultServiceId.trim();
  return (
    config.services.ai.find((service) => service.id === requestedId) ??
    (role === "vision" ? config.services.ai.find((service) => service.id === config.aiSettings.defaultServiceId) : undefined) ??
    config.services.ai[0]
  );
}

export function getActiveAiModelName(config: AppConfig, role: AiModelRole = "text") {
  const service = getActiveAiService(config, role);
  return service?.model.trim() || service?.name.trim() || service?.provider.trim() || "AI";
}
