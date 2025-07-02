import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { emp_id } = body;

    if (!emp_id) {
      return NextResponse.json(
        { success: false, error: "Missing employee ID." },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Get employee data
    const { data: employee, error: employeeError } = await supabase
      .from("employee")
      .select("user_id, dob, last4ssn")
      .eq("emp_id", emp_id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found." },
        { status: 404 },
      );
    }

    // Generate correct password
    // Parse date more explicitly to avoid timezone issues
    const [year, month, day] = employee.dob.split("-").map(Number);
    const correctPassword = `${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}${String(year).slice(-2)}${employee.last4ssn}`;

    // Update user metadata with correct password
    const { data: user, error: updateError } =
      await supabase.auth.admin.updateUserById(employee.user_id, {
        user_metadata: {
          temp_password: correctPassword,
          password_changed: false,
        },
      });

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update user metadata.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      correctPassword,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to update password.",
      },
      { status: 500 },
    );
  }
}
