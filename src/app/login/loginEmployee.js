import { supabase } from "../../supabaseClient";

export async function loginEmployee(employeeIdOrEmail, password) {
  try {
    // Check if input looks like an email
    const isEmail = employeeIdOrEmail.includes("@");

    // Build the query based on whether it's an email or employee ID
    let query = supabase.from("employee").select(`
        emp_id,
        user_id,
        first_name,
        last_name,
        email_address,
        last4ssn,
        dob,
        business_id,
        role_id,
        is_active,
        full_time,
        roles(role_name, is_manager)
      `);

    if (isEmail) {
      query = query.eq("email_address", employeeIdOrEmail);
    } else {
      query = query.eq("emp_id", employeeIdOrEmail);
    }

    const { data: employee, error: employeeError } = await query.single();

    if (employeeError || !employee) {
      return {
        success: false,
        message: "Employee not found",
      };
    }

    if (!employee.is_active) {
      return {
        success: false,
        message: "Employee account is inactive",
      };
    }

    // Check if employee has a user_id (auth account)
    if (!employee.user_id) {
      return {
        success: false,
        message:
          "Employee account not properly set up. Please contact your administrator.",
      };
    }

    // Check if this is a business owner
    const isBusinessOwner = employee.roles?.role_name === "Business Owner";

    // Try to sign in with the employee's email and provided password
    const { data: authData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: employee.email_address,
        password: password,
      });

    if (loginError) {
      return {
        success: false,
        message: loginError.message,
      };
    }

    // Check if this is the default password
    const defaultPassword = generateDefaultPassword(
      employee.dob,
      employee.last4ssn,
    );
    const isDefaultPassword = password === defaultPassword;

    // Get the auth user to check metadata
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Failed to retrieve user after login",
      };
    }

    // Check if password has been changed (from user metadata)
    const passwordChanged = user.user_metadata?.password_changed || false;

    // If using default password and haven't changed it yet, prompt for change
    if (isDefaultPassword && !passwordChanged) {
      return {
        success: true,
        message: "Login successful",
        employee: employee,
        user: user,
        promptPasswordChange: true,
        isBusinessOwner: isBusinessOwner,
      };
    }

    // If using default password but it was already changed, this is an error
    if (isDefaultPassword && passwordChanged) {
      return {
        success: false,
        message:
          "This appears to be the default password, but it was already changed. Please use your new password.",
      };
    }

    // Successful login with non-default password
    return {
      success: true,
      message: "Login successful",
      employee: employee,
      user: user,
      promptPasswordChange: false,
      isBusinessOwner: isBusinessOwner,
    };
  } catch (error) {
    console.error("Employee login error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

// Generate default password based on DOB and last 4 SSN
function generateDefaultPassword(dob, last4ssn) {
  // Format: MMDD + YY + last4ssn
  // Parse date more explicitly to avoid timezone issues
  const [year, month, day] = dob.split("-").map(Number);
  return `${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}${String(year).slice(-2)}${last4ssn}`;
}
