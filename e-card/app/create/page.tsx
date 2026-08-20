"use client";

import React, { useRef } from "react";
import { SlotKey, SortingState, pageOrder } from "../types";
import { supabase } from "@/lib/supabase";
import Sqids from 'sqids'
import { useRouter } from "next/navigation"


const slotLabels: Record<SlotKey, string> = {
  frontPage: "Front Page",
  insideLeft: "Inside Left",
  insideRight: "Inside Right",
  backPage: "Back Page",
};

interface MagazineLayoutEditorProps {
  // The single source of truth now lives with the parent (see BookEditorPage.tsx)
  value: SortingState;
  onChange: (next: SortingState) => void;
  // Called when the user clicks "Generate & View Card"
  onGenerate?: () => void;
}

export default function MagazineLayoutEditor({ value, onChange, onGenerate }: MagazineLayoutEditorProps) {
  const state = value;
  const router = useRouter()

  // All four slots need an image before there's anything to flip through
  const allSlotsFilled = pageOrder.every((slotKey) => Boolean(state.slots[slotKey]));

  const [draggedImg, setDraggedImg] = React.useState<string | null>(null);

  // Files are keyed by their blob URL (not by slot), so the File object
  // travels with the image no matter how it gets dragged around between
  // slots / the pool.
  const [fileMap, setFileMap] = React.useState<Record<string, File>>({});

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<SlotKey | "pool" | null>(null);

  // --- Local File Upload & Preview Logic ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setFileMap((prev) => ({ ...prev, [imageUrl]: file }));
    assignImageToTarget(imageUrl, activeSlotRef.current);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOSDrop = (e: React.DragEvent, target: SlotKey | "pool") => {
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setFileMap((prev) => ({ ...prev, [imageUrl]: file }));
      assignImageToTarget(imageUrl, target);
      return true;
    }
    return false;
  };

  const assignImageToTarget = (imageUrl: string, target: SlotKey | "pool" | null) => {
    const newAvailable = [...state.availableImages];
    const newSlots = { ...state.slots };

    if (target === "pool") {
      newAvailable.push(imageUrl);
    } else if (target) {
      if (newSlots[target]) newAvailable.push(newSlots[target] as string);
      newSlots[target] = imageUrl;
    }
    onChange({ availableImages: newAvailable, slots: newSlots });
  };

  const triggerFileInput = (target: SlotKey | "pool") => {
    activeSlotRef.current = target;
    fileInputRef.current?.click();
  };

  // --- Internal Drag Handlers ---
  const handleDragStart = (e: React.DragEvent, imgPath: string) => {
    setDraggedImg(imgPath);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropToSlot = (e: React.DragEvent, targetSlot: SlotKey) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleOSDrop(e, targetSlot);
      return;
    }

    if (!draggedImg) return;

    const newAvailable = state.availableImages.filter((img) => img !== draggedImg);
    const newSlots = { ...state.slots };

    (Object.keys(newSlots) as SlotKey[]).forEach((key) => {
      if (newSlots[key] === draggedImg) newSlots[key] = null;
    });

    if (state.slots[targetSlot]) {
      newAvailable.push(state.slots[targetSlot] as string);
    }

    newSlots[targetSlot] = draggedImg;
    onChange({ availableImages: newAvailable, slots: newSlots });
    setDraggedImg(null);
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleOSDrop(e, "pool");
      return;
    }

    if (!draggedImg) return;
    if (state.availableImages.includes(draggedImg)) return;

    const newAvailable = [...state.availableImages, draggedImg];
    const newSlots = { ...state.slots };

    (Object.keys(newSlots) as SlotKey[]).forEach((key) => {
      if (newSlots[key] === draggedImg) newSlots[key] = null;
    });

    onChange({ availableImages: newAvailable, slots: newSlots });
    setDraggedImg(null);
  }

  // --- Upload + Save ---
  async function uploadCardImage(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('Card_Img')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.log('Error uploading image:', error)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('Card_Img')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }

  async function createCardRecord(cardData: {
    id: string
    num_Page: number
    frontPage: string
    insideLeft: string
    insideRight: string
    backPage: string
  }) {
    const { data, error } = await supabase
      .from('Cards')
      .insert([cardData])
      .select()

    if (error) {
      console.log("Error creating card", error)
      return null
    }

    console.log("Card Created", data)
    return data
  }

  const createCard = async () => {
    if (!allSlotsFilled) {
      console.log("Not all slots are filled yet");
      return;
    }

    setIsSubmitting(true);
    try {
      const sqids = new Sqids({ minLength: 10 });
      // Random seed per card so every card gets a unique id
      const id = sqids.encode([Date.now(), Math.floor(Math.random() * 100000)]);

      const uploads = await Promise.all(
        pageOrder.map(async (slotKey) => {
          const imageUrl = state.slots[slotKey];
          const file = imageUrl ? fileMap[imageUrl] : null;

          if (!file) {
            console.log(`No file found for slot "${slotKey}" (image: ${imageUrl})`);
            return [slotKey, null] as const;
          }

          const ext = file.name.split('.').pop();
          const path = `${id}/${slotKey}.${ext}`;
          const url = await uploadCardImage(file, path);
          return [slotKey, url] as const;
        })
      );

      const urls = Object.fromEntries(uploads) as Record<SlotKey, string | null>;

      if (Object.values(urls).some((url) => !url)) {
        console.log("One or more image uploads failed", urls);
        return;
      }

    const result = await createCardRecord({
        id,
        num_Page: 9,
        frontPage: urls.frontPage as string,
        insideLeft: urls.insideLeft as string,
        insideRight: urls.insideRight as string,
        backPage: urls.backPage as string,
      });
    if (result) {
      router.push(`/cards/${id}`)
    }
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderDraggableImage = (imgPath: string, clickTarget: SlotKey | "pool") => (
    <div
      key={imgPath}
      draggable
      onDragStart={(e) => handleDragStart(e, imgPath)}
      onDragEnd={() => setDraggedImg(null)}
      onClick={() => triggerFileInput(clickTarget)}
      className="w-32 h-44 cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200 ease-in-out shadow-md rounded-md overflow-hidden border border-gray-300 bg-white flex items-center justify-center relative group"
    >
      <img
        src={imgPath}
        alt="Sortable item"
        className="object-cover w-full h-full pointer-events-none"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
        <span className="text-white text-xs font-semibold px-2 text-center pointer-events-none">
          Click to Replace this
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(Object.keys(state.slots) as SlotKey[]).map((slotKey) => {
            const currentImage = state.slots[slotKey];

            return (
              <div key={slotKey} className="flex flex-col items-center group">
                <h3 className="font-medium text-gray-700 mb-3">{slotLabels[slotKey]}</h3>
                <div
                  onClick={() => !currentImage && triggerFileInput(slotKey)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropToSlot(e, slotKey)}
                  className={`w-full aspect-[3/4] rounded-lg border-2 transition-colors flex items-center justify-center relative overflow-hidden cursor-pointer
                    ${
                      draggedImg
                        ? "border-blue-400 border-dashed bg-blue-50"
                        : "border-gray-300 border-dashed bg-gray-100 hover:bg-gray-200"
                    }
                  `}
                >
                  {currentImage ? (
                    renderDraggableImage(currentImage, slotKey)
                  ) : (
                    <span className="text-gray-400 text-sm font-medium pointer-events-none group-hover:text-gray-600 transition-colors">
                      Drop or Click
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional: a pool area for images not currently assigned to a slot */}
        {state.availableImages.length > 0 && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDropToAvailable}
            className="flex flex-wrap gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg"
          >
            {state.availableImages.map((img) => renderDraggableImage(img, "pool"))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            disabled={!allSlotsFilled || isSubmitting}
            onClick={async () => {
              onGenerate?.();
              await createCard();
            }}
            className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition-colors
              ${
                allSlotsFilled && !isSubmitting
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {isSubmitting ? "Uploading..." : "Generate & View Card"}
          </button>
          {!allSlotsFilled && (
            <span className="text-xs text-gray-400">
              Add an image to all four pages to generate the card
            </span>
          )}
        </div>
      </div>
    </div>
  );
}