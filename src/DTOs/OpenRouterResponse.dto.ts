export interface ArchitectureDto {
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
  instruct_type: string;
}

export interface TopProviderDto {
  is_moderated: boolean;
  context_length: number;
  max_completion_tokens: number;
}

export interface PricingDto {
  prompt: string;
  completion: string;
  image: string;
  request: string;
  web_search: string;
  internal_reasoning: string;
  input_cache_read: string;
  input_cache_write: string;
}

export interface ModelDto {
  id: string;
  name: string;
  created: number;
  description: string;
  architecture: ArchitectureDto;
  top_provider: TopProviderDto;
  pricing: PricingDto;
  canonical_slug: string;
  context_length: number;
  hugging_face_id: string;
  per_request_limits: Record<string, unknown>; // or object
  supported_parameters: string[];
}

export interface OpenRouterResponse {
  data: ModelDto[];
}