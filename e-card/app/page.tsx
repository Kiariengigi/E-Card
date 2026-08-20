"use client";

import React, { useState } from "react";
import MagazineLayoutEditor from "./components/cardview/MagazineLayoutEditor";
import Book from "./components/cardview/book";
import { SortingState, emptySortingState } from "./types";

export default function BookEditorPage() {
  const [sorting, setSorting] = useState<SortingState>(emptySortingState);
  const [view, setView] = useState<"edit" | "preview">("edit");

  if (view === "preview") {
    return (
      <>
      <div className="flex flex-col items-center gap-6 p-8">
        <button
          type="button"
          onClick={() => setView("edit")}
          className="self-start px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ← Back to editor
        </button>
      </div>
      <Book pages={sorting.slots} />
      </>
    );
  }

  return (
    <MagazineLayoutEditor
      value={sorting}
      onChange={setSorting}
      onGenerate={() => setView("preview")}
    />
  );
}