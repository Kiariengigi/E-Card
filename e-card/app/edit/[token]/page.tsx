import { notFound } from "next/navigation";
import { resolveLink } from "@/lib/shareLink";
import { ImageEditor } from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolved = await resolveLink(token);
  if (!resolved) notFound();

  const d = resolved.document as Record<string, any>;
  if (d.status && d.status !== "draft")
    return <main style={{ padding: 24 }}>This card has been sent and can no longer be edited.</main>;

  return (
    <ImageEditor
      token={token}
      doc={{
        version: d.version ?? 0,
        pages: {
          frontPage: d.frontPage ?? null,
          insideLeft: d.insideLeft ?? null,
          insideRight: d.insideRight ?? null,
          backPage: d.backPage ?? null,
        },
      }}
    />
  );
}