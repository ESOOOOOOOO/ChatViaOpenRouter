import { ModelDto } from "../DTOs/OpenRouterResponse.dto";

export function rankModelsByCreated(models: ModelDto[]): ModelDto[] {
  return models.sort((a, b) => b.created - a.created);
}
