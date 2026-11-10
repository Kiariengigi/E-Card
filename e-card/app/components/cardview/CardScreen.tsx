"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Book from "./book";
import { SlotKey } from "@/app/types";
import { createEditLink } from "@/app/cards/[id]/actions";
import { ShareButton } from "./shareButton"

export default function CardScreen({
  id,
  pages,
  canEdit = true,
  children,
}: {
  id: string;
  pages: Record<SlotKey, string | null>;
  canEdit?: boolean;
  children?: ReactNode; // owner tools, rendered below the card
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // set after mount so server and client HTML match
  useEffect(() => setOrigin(window.location.origin), []);

  const goToEdit = async () => {
    setOpening(true);
    setError(null);
    try {
      const url = await createEditLink(id, "Edit");
      router.push(url.slice(url.indexOf("/edit/")));
    } catch (e) {
      console.error(e);
      setError("Couldn't open the editor. Please try again.");
      setOpening(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 py-6">
      <Book pages={pages} />

      {canEdit && (
        <button
          type="button"
          onClick={goToEdit}
          disabled={opening}
          className="px-6 py-3 rounded-lg font-semibold shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400"
        >
          {opening ? "Opening editor…" : "Edit card images"}
        </button>
      )}

      {canEdit && <ShareButton cardId={id} />}
      
      {error && <p role="status" className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-400">
        Shareable link: {origin}/cards/{id}
      </p>

      {children}
    </main>
  );
}