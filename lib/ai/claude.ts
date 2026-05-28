import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas i miljön.");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const SEO_MODEL = "claude-sonnet-4-6";

/** Anropar Claude och förväntar sig ett JSON-objekt tillbaka. Kastar vid ogiltig JSON. */
export async function completeJson<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const claude = getClaude();
  const msg = await claude.messages.create({
    model: SEO_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const jsonText = stripCodeFence(text);
  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error(`Claude returnerade ogiltig JSON: ${text.slice(0, 300)}`);
  }
}

function stripCodeFence(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fence ? fence[1].trim() : text;
}
