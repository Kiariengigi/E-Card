import "server-only"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { hashToken } from "@/lib/token"

export type card = {
    id: string
    title?: string | null
    content?: string | null
    version?: number | null
}

export async function resolveLink(token: string) {
    console.log("[resolveLink] token length:", token?.length)
    if (!token || token.length > 128) return null 

    const { data, error } = await supabaseAdmin
        .from("share_links")
        .select("id, label, expires_at, revoked_at, card_id, cards(*)")
        .eq("token_hash", hashToken(token))
        .maybeSingle()
    
        console.log("[resolveLink] result:", {
    error: error?.message,
    found: !!data,
    revoked: data?.revoked_at,
    expires: data?.expires_at,
    doc: data?.cards,
  });

    if (error || !data || data.revoked_at || new Date(data.expires_at) < new Date()) return null

    const doc = (Array.isArray(data.cards) ? data.cards[0] : data.cards) as card | null
    if (!doc || doc.id !== data.card_id) return null
    
    return {
        linkId: data.id as string,
        documentId: doc.id,
        document: doc,
    }
}