import { supabase } from "./supabase";

export async function getCard(id: string) {
    const { data, error } = await supabase
        .from("Cards")
        .select("*")
        .eq("id", id)
        .single()
    
    if (error) {
        console.log("Error Fetching card:", error)
        return null
    }

    return data
}