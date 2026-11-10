"use client";
import { useState, useTransition } from "react";
import { createEditLink } from "@/app/cards/[id]/actions";

export function ShareButton({ cardId }: { cardId: string }) {
  const [label, setLabel] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const generate = () =>
    start(async () => {
      setError(null);
      setCopied(false);
      try {
        const url = await createEditLink(cardId, label);
        // build from the browser origin so a missing NEXT_PUBLIC_APP_URL can't break the link
        setLink(`${window.location.origin}${url.slice(url.indexOf("/edit/"))}`);
        setLabel("");
      } catch {
        setError("Could not generate link.");
      }
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link!);
      setCopied(true);
    } catch {
      setError("Copy failed. Select the link and copy it manually.");
    }
  };

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 520, width: "100%" }}>
      <input
        placeholder="Who is this link for? (e.g. Jane, Mum)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={100}
      />
      <button onClick={generate} disabled={pending}>
        {pending ? "Generating…" : "Generate edit link"}
      </button>

      {error && <p role="alert">{error}</p>}

      {link && (
        <div style={{ display: "grid", gap: 4 }}>
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <button onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
          <small>Copy it now. For security the link can't be shown again. It works for 7 days.</small>
        </div>
      )}
    </div>
  );
}