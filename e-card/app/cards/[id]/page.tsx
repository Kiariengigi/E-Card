import React from 'react'; 
import Book from '../../components/cardview/book'
import { SlotKey, pageOrder } from '@/app/types';
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShareButton } from "./shareButton";
import { markSent, revokeLink } from "./actions";

export const dynamic = "force-dynamic";

interface CardPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CardViewPage({ params, searchParams }: CardPageProps) {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams

    const hasAllPagesInQuery = pageOrder.every(
        (key) => typeof resolvedSearchParams[key] === 'string'
    ); 

    if (hasAllPagesInQuery) {
        const pages = Object.fromEntries(
            pageOrder.map((key) => [key, resolvedSearchParams[key] as string])
        ) as Record<SlotKey, string | null>; 

        return (
            <main className='min-h-screen bg-gray-100 flex items-center justify-center'>
                <Book pages={pages}/>
            </main>
        )
    }

    const { id } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase.from("cards").select("*").eq("id", id).single();
  if (!doc) notFound();

  const { data: links } = await supabase
    .from("share_links")
    .select("id, label, expires_at, revoked_at, created_at")
    .eq("document_id", id)
    .order("created_at", { ascending: false });

  const { data: revisions } = await supabase
    .from("document_revisions")
    .select("id, version, editor_name, created_at")
    .eq("document_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const now = new Date();

    return (
    <main className='min-h-screen bg-gray-100 flex items-center justify-center'>
            <Book id={resolvedParams.id} />
        <main style={{ display: "grid", gap: 24, maxWidth: 720, margin: "2rem auto" }}>
      <header>
        <h1>{doc.title}</h1>
        <p>Status: <strong>{doc.status}</strong> · Version {doc.version}</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{doc.content}</pre>
      </header>

      {doc.status === "draft" ? (
        <>
          <section>
            <h2>Share for editing</h2>
            <ShareButton documentId={id} />
          </section>

          <section>
            <h2>Links</h2>
            <ul>
              {links?.map((l) => {
                const active = !l.revoked_at && new Date(l.expires_at) > now;
                return (
                  <li key={l.id}>
                    {l.label ?? "Unlabeled"} · expires {new Date(l.expires_at).toLocaleDateString()} ·{" "}
                    {l.revoked_at ? "revoked" : active ? "active" : "expired"}
                    {active && (
                      <form action={revokeLink.bind(null, id, l.id)} style={{ display: "inline", marginLeft: 8 }}>
                        <button>Revoke</button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <form action={markSent.bind(null, id)}>
            <button>Mark as sent (locks document, revokes all links)</button>
          </form>
        </>
      ) : (
        <p>This document has been sent and is locked.</p>
      )}

      <section>
        <h2>Edit history</h2>
        <ul>
          {revisions?.map((r) => (
            <li key={r.id}>
              v{r.version} by {r.editor_name} · {new Date(r.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </main>
    </main>
    )
}
