export type SlotKey = "frontPage" | "insideLeft" | "insideRight" | "backPage"

export const pageOrder: SlotKey[] = [
    "frontPage", 
    "insideLeft", 
    "insideRight", 
    "backPage"
]

export interface SortingState {
    availableImages: string[]
    slots: Record<SlotKey, string | null>
}

export const emptySortingState: SortingState = {
    availableImages: [], 
    slots: { frontPage: null, insideLeft: null, insideRight: null, backPage: null }
}