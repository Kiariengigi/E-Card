// app/documents/[id]/ShareButton.tsx
"use client";
import { useState, useTransition } from "react";
import { createEditLink } from "./actions";

export function ShareButton({ documentId }: { documentId: string }) {
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
        setLink(await createEditLink(documentId, label));
        setLabel("");
      } catch {
        setError("Could not generate link.");
      }
    });

  const copy = async () => {
    await navigator.clipboard.writeText(link!);
    setCopied(true);
  };

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
      <input
        placeholder="Who is this link for? (e.g. Jane, Legal)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <button onClick={generate} disabled={pending}>
        {pending ? "Generating…" : "Generate edit link"}
      </button>

      {error && <p role="alert">{error}</p>}

      {link && (
        <div style={{ display: "grid", gap: 4 }}>
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <button onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
          <small>Copy it now. For security the link can't be shown again.</small>
        </div>
      )}
    </div>
  );
}