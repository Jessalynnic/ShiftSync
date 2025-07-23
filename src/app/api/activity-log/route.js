import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "Business ID is required." },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("business_id", businessId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Database error fetching activities:", error);
      throw error;
    }

    return NextResponse.json({ success: true, activities: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch activities." },
      { status: 500 },
    );
  }
}
