"use server"; 
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"; 
import { generateToken, hashToken } from "@/lib/token"; 

async function requireUser() {
    const supabase = await createClient() 
    const { data: { user } } = await supabase.auth.getUser()
    return supabase
}

export async function createEditLink(card_id: string, label?: string) {
    const supabase = await requireUser()

    const token = generateToken()
    const { error } = await supabase.from("share_links").insert({
        card_id: card_id, 
        token_hash: hashToken(token), 
        label: label?.trim().slice(0, 100) || null, 
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    if (error) {
    console.error("Supabase insert error:", error);
    throw new Error(`Could not create link: ${error.message}`);
}

    revalidatePath('/documents/${documentId}')
    return `${process.env.NEXT_PUBLIC_APP_URL}/edit/${token}`
}

export async function revokeLink(documentId: string, linkId: string) {
    const supabase = await requireUser(); 
    await supabase 
        .from("share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", linkId)
        .is("revoked_at", null)
    revalidatePath(`/documents/${documentId}`)
}

export async function markSent(documentId: string) {
    const supabase = await requireUser()
    await supabase.from("documents").update({ status: "sent"}).eq("id", documentId)
    await supabase 
        .from("share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("document_id", documentId)
        .is("revoked_at", null)
    revalidatePath(`/documents/${documentId}`)
}