// LLM_PROVIDER_DEFAULT styr routerns initialval.
//
//   "auto"   — försök Claude först, fall tillbaka till Gemini vid fel/budget cap
//   "claude" — bara Claude (failar om Claude inte fungerar)
//   "gemini" — bara Gemini (för testning / kostnadsnoll)
//
// Override-flaggan kan också sättas runtime via /admin/llm-usage så Leonard
// kan tvinga ett provider-val utan att deploya om.

import { LLM_COLLECTIONS, llmGet, llmSave } from "./storage";

export type ProviderMode = "auto" | "claude" | "gemini";

const RUNTIME_OVERRIDE_ID = "provider-override";
const VALID_MODES: ProviderMode[] = ["auto", "claude", "gemini"];

function envDefault(): ProviderMode {
  const raw = (process.env.LLM_PROVIDER_DEFAULT ?? "auto").toLowerCase();
  return (VALID_MODES as string[]).includes(raw) ? (raw as ProviderMode) : "auto";
}

/**
 * Aktuellt provider-läge. Kontrollerar Wix-overriden först — Leonard kan toggla
 * från /admin/llm-usage utan deploy.
 */
export async function getProviderMode(): Promise<ProviderMode> {
  const override = await llmGet<{ mode?: ProviderMode }>(LLM_COLLECTIONS.spend, RUNTIME_OVERRIDE_ID);
  if (override?.mode && (VALID_MODES as string[]).includes(override.mode)) return override.mode;
  return envDefault();
}

export async function setProviderMode(mode: ProviderMode): Promise<void> {
  if (!(VALID_MODES as string[]).includes(mode)) {
    throw new Error(`Ogiltigt provider-läge: ${mode}`);
  }
  await llmSave(LLM_COLLECTIONS.spend, RUNTIME_OVERRIDE_ID, {
    id: RUNTIME_OVERRIDE_ID,
    mode,
    updatedAt: new Date().toISOString(),
  });
}

export function isClaudeAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function isGeminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
