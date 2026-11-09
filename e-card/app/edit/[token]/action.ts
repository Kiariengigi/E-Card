"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveLink } from "@/lib/shareLink";
import { randomUUID } from "crypto"; 
import { pageOrder, SlotKey } from "@/app/types";

const BUCKET = "Card_Img"; 
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const; 
const MAX_BYTES = 5 * 1024 * 1024; 

export async function requestSlotUpload(
  token: string, slot: SlotKey, contentType: string, size: number
) {
  if (
    !pageOrder.includes(slot) || !(contentType in EXT) || 
    !Number.isInteger(size) || size <= 0 || size > MAX_BYTES 
  ) return { ok: false, reason: "bad_input" } as const; 

  const resolved = await resolveLink(token); 
  if (!resolved) return { ok: false, reason: "invalid" } as const; 

  const path = `${resolved.documentId}/${slot}-${randomUUID()}.${EXT[contentType as keyof typeof EXT]}`; 
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, reason: "invalid" } as const;

  return { ok: true, path: data.path, uploadToken: data.token } as const;
}

export async function saveImages(
  token: string, baseVersion: number, paths: Partial<Record<SlotKey, string>>, editorName: string
){
  const name = editorName.trim(); 
  if(!name || name.length > 100 || !Number.isInteger(baseVersion) || Object.keys(paths).length === 0)
    return { ok: false, reason: "bad_input" } as const;

  const resolved = await resolveLink(token); 
  if (!resolved) return { ok: false, reason: "invalid" } as const; 
  const docId = resolved.documentId

    const urls: Partial<Record<SlotKey, string>> = {};
  for (const slot of pageOrder) {
    const p = paths[slot];
    if (p === undefined) continue;
    const ok = new RegExp(`^${docId}/${slot}-[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(p);
    if (!ok) return { ok: false, reason: "bad_input" } as const;
    urls[slot] = supabaseAdmin.storage.from(BUCKET).getPublicUrl(p).data.publicUrl;
}

  const { data, error } = await supabaseAdmin.rpc("save_card_images", {
    p_link_id: resolved.linkId,
    p_card_id: docId,
    p_base_version: baseVersion,
    p_front: urls.frontPage ?? null,
    p_inside_left: urls.insideLeft ?? null,
    p_inside_right: urls.insideRight ?? null,
    p_back: urls.backPage ?? null,
    p_editor_name: name,
  });

  if (error) {
    console.error("[saveImages] rpc error:", error); 
    return { ok: false, reason: "invalid" } as const;
  }
  
  if (data == null) return { ok: false, reason: "conflict" } as const;

  try{
    const doc = resolved.document as Record<string, any>; 
    const old = pageOrder
      .filter((s) => urls[s] && typeof doc[s] === "string")
      .map((s) => (doc[s] as string).split(`/${BUCKET}/`)[1])
      .filter((p): p is string => !!p && p.startsWith(`${docId}/`));
    if (old.length) await supabaseAdmin.storage.from(BUCKET).remove(old);
  } catch {}

  return { ok: true, version: data as number, pages: urls } as const;
}