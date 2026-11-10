import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CardScreen from "@/app/components/cardview/CardScreen";
import { ShareButton } from "../../components/cardview/shareButton";
import { markSent, revokeLink } from "./actions";

export const dynamic = "force-dynamic";

export default async function CardViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase.from("cards").select("*").eq("id", id).single();
  if (!doc) notFound();

  const pages = {
    frontPage: doc.frontPage ?? null,
    insideLeft: doc.insideLeft ?? null,
    insideRight: doc.insideRight ?? null,
    backPage: doc.backPage ?? null,
  };
  const isDraft = !doc.status || doc.status === "draft";

  // owner tools are shown only to signed-in users
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <CardScreen id={id} pages={pages} canEdit={isDraft} />;

  const { data: links } = await supabase
    .from("share_links")
    .select("id, label, expires_at, revoked_at, created_at")
    .eq("card_id", id)
    .order("created_at", { ascending: false });

  const { data: revisions } = await supabase
    .from("document_revisions")
    .select("id, version, editor_name, created_at")
    .eq("card_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const now = new Date();

  return (
    <CardScreen id={id} pages={pages} canEdit={isDraft}>
      <div style={{ display: "grid", gap: 24, maxWidth: 720, width: "100%", padding: 16 }}>
        <p>Status: <strong>{doc.status ?? "draft"}</strong> · Version {doc.version ?? 0}</p>

        {isDraft ? (
          <>
            <section>
              <h2>Share for editing</h2>
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
              <button>Mark as sent (locks card, revokes all links)</button>
            </form>
          </>
        ) : (
          <p>This card has been sent and is locked.</p>
        )}

        <section>
          <h2>Edit history</h2>
          <ul>
            {revisions?.map((r) => (
              <li key={r.id}>
                v{r.version}{r.editor_name ? ` by ${r.editor_name}` : ""} · {new Date(r.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </CardScreen>
  );
}