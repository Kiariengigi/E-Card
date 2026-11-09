"use client";
import { useMemo, useState, useTransition } from "react";
import { supabase } from "@/lib/supabase";
import Book from "@/app/components/cardview/book";      // adjust to where book.tsx lives
import { pageOrder, SlotKey } from "@/app/types";
import { requestSlotUpload, saveImages } from "./action";

type Pages = Record<SlotKey, string | null>;
const LABELS: Record<SlotKey, string> = {
  frontPage: "Front cover", insideLeft: "Inside left",
  insideRight: "Inside right", backPage: "Back cover",
};
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export function ImageEditor({ token, doc }: { token: string; doc: { version: number; pages: Pages } }) {
  const [version, setVersion] = useState(doc.version);
  const [saved, setSaved] = useState<Pages>(doc.pages);
  const [picked, setPicked] = useState<Partial<Record<SlotKey, { file: File; url: string }>>>({});
  const [editorName, setEditorName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [pending, start] = useTransition();

  const pages = useMemo<Pages>(() => {
    const p = { ...saved };
    for (const k of pageOrder) if (picked[k]) p[k] = picked[k]!.url;
    return p;
  }, [saved, picked]);

  const onPick = (slot: SlotKey, file?: File) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return setMessage("Use a JPG, PNG or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setMessage("Image must be under 5 MB.");
    setMessage(null);
    if (picked[slot]) URL.revokeObjectURL(picked[slot]!.url);
    setPicked((p) => ({ ...p, [slot]: { file, url: URL.createObjectURL(file) } }));
    setPreviewKey((k) => k + 1);   // remount the flipbook so it picks up the new image
  };

  const changed = Object.keys(picked).length > 0;

  const submit = () =>
    start(async () => {
      setMessage(null);
      const paths: Partial<Record<SlotKey, string>> = {};

      for (const slot of pageOrder) {
        const p = picked[slot];
        if (!p) continue;
        const req = await requestSlotUpload(token, slot, p.file.type, p.file.size);
        if (!req.ok) return setMessage("Could not start the upload. The link may have expired.");
        const { error } = await supabase.storage
          .from("Card_Img")
          .uploadToSignedUrl(req.path, req.uploadToken, p.file);
        if (error) return setMessage(`Upload failed for ${LABELS[slot]}. Please try again.`);
        paths[slot] = req.path;
      }

      const res = await saveImages(token, version, paths, editorName);
      if (res.ok) {
        Object.values(picked).forEach((p) => URL.revokeObjectURL(p!.url));
        setSaved((s) => ({ ...s, ...res.pages }));
        setPicked({});
        setVersion(res.version);
        setPreviewKey((k) => k + 1);
        setMessage("Saved.");
      } else if (res.reason === "conflict") {
        setConflict(true);
        setMessage("Someone else changed this card while you were editing. Reload to get the latest version.");
      } else if (res.reason === "bad_input") {
        setMessage("Please enter your name and choose at least one image.");
      } else {
        setMessage("This link is no longer valid. It may have expired or the card was sent.");
      }
    });

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[1fr_340px]">
      <section aria-label="Card preview">
        <Book key={previewKey} pages={pages} />
      </section>

      <aside className="grid content-start gap-4">
        <label className="grid gap-1">
          Your name
          <input value={editorName} onChange={(e) => setEditorName(e.target.value)} maxLength={100} />
        </label>

        {pageOrder.map((slot) => (
          <div key={slot} className="grid grid-cols-[72px_1fr] items-center gap-3">
            {pages[slot] && <img src={pages[slot]!} alt="" className="h-24 w-[72px] rounded object-cover" />}
            <div>
              <div>{LABELS[slot]} {picked[slot] && <em>(unsaved)</em>}</div>
              <label style={{ cursor: "pointer", textDecoration: "underline" }}>
                Replace
                <input type="file" accept={ACCEPT.join(",")} hidden
                  onChange={(e) => onPick(slot, e.target.files?.[0])} />
              </label>
            </div>
          </div>
        ))}

        <button onClick={submit} disabled={pending || !changed || !editorName.trim() || conflict}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        {conflict && <button onClick={() => window.location.reload()}>Reload latest version</button>}
        {message && <p role="status">{message}</p>}
      </aside>
    </main>
  );
}