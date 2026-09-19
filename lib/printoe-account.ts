import type { DesignDocument } from "@/types/design";

function printoeAuth() {
  const token =
    typeof window !== "undefined" ? window.sessionStorage.getItem("printoe_pt") : null;
  const apiBase =
    typeof window !== "undefined" ? window.sessionStorage.getItem("printoe_api") : null;
  return { token, apiBase };
}

export async function saveDesignToPrintoeAccount(doc: DesignDocument) {
  const handoff = doc.productConfiguration.printoeHandoff;
  const stored = printoeAuth();
  const apiBase = handoff?.apiBase || stored.apiBase;
  if (!apiBase) return { ok: false as const, reason: "no-handoff" };
  const token = handoff?.accessToken?.trim() || stored.token;
  if (!token) return { ok: false as const, reason: "auth" };

  const res = await fetch(`${apiBase.replace(/\/$/, "")}/customer/designs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: doc.name || `${doc.productName} design`,
      productSlug: handoff?.slug,
      productName: doc.productName,
      optionsKey: `editor:${doc.projectId}`,
      canvasJson: JSON.stringify(doc),
    }),
  });

  if (res.status === 401) return { ok: false as const, reason: "auth" };
  if (!res.ok) return { ok: false as const, reason: "error" };
  return { ok: true as const };
}

export async function fetchPrintoeSavedDesign(id: string) {
  const { token, apiBase } = printoeAuth();
  if (!token || !apiBase) return null;
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/customer/designs/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { canvasJson?: string | null; previewUrl?: string | null } };
  return json.data ?? null;
}
