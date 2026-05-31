"use server";

import { revalidatePath } from "next/cache";
import { setProviderMode, type ProviderMode } from "@/lib/llm/provider";

export async function setProviderModeAction(formData: FormData): Promise<void> {
  const mode = String(formData.get("mode") ?? "auto") as ProviderMode;
  await setProviderMode(mode);
  revalidatePath("/admin/llm-usage");
}
