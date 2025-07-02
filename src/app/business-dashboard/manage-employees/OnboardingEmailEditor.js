"use client";

import { useState, useEffect } from "react";
import { getBusinessIdForCurrentUser } from "../roleUtils";
import { supabase } from "../../../supabaseClient";

export default function OnboardingEmailEditor() {
  const [businessId, setBusinessId] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Email template settings
  const [emailSettings, setEmailSettings] = useState({
    subject: "Welcome to {business_name}! Your Account is Ready",
    greeting: "Hi {first_name},",
    welcomeMessage:
      "Welcome to the team! We're excited to have you on board at {business_name}.",
    accountMessage:
      "Your account has been successfully created and you can now access our workforce management platform.",
    nextSteps: [
      "Log in using your credentials above",
      "Complete your profile setup",
      "Review your schedule and upcoming shifts",
    ],
    helpMessage:
      "If you have any questions or need assistance getting started, please don't hesitate to reach out to your manager or our support team.",
    footerMessage:
      "This email was sent by ShiftSync on behalf of {business_name}.",
  });

  // Sample data for preview (with dynamic business name)
  const sampleData = {
    first_name: "Sarah",
    last_name: "Johnson",
    business_name: businessInfo?.business_name || "Your Business",
    emp_id: "EMP-2024-001",
  };

  // Function to replace variables in text
  const replaceVariables = (text) => {
    return text
      .replace(/{first_name}/g, sampleData.first_name)
      .replace(/{last_name}/g, sampleData.last_name)
      .replace(/{business_name}/g, sampleData.business_name)
      .replace(/{emp_id}/g, sampleData.emp_id);
  };

  // Generate preview HTML
  const generatePreview = () => {
    const subject = replaceVariables(emailSettings.subject);
    const greeting = replaceVariables(emailSettings.greeting);
    const welcomeMessage = replaceVariables(emailSettings.welcomeMessage);
    const accountMessage = replaceVariables(emailSettings.accountMessage);
    const helpMessage = replaceVariables(emailSettings.helpMessage);
    const footerMessage = replaceVariables(emailSettings.footerMessage);

    const nextStepsHtml = emailSettings.nextSteps
      .filter((step) => step.trim())
      .map((step) => `<li>${replaceVariables(step)}</li>`)
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Welcome to ${sampleData.business_name}!</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Your account is ready</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; line-height: 1.6; color: #374151;">
          <!-- Greeting -->
          <p style="font-size: 18px; font-weight: 600; margin: 0 0 20px 0; color: #111827;">${greeting}</p>

          <!-- Welcome Message -->
          <p style="margin: 0 0 20px 0; font-size: 16px;">${welcomeMessage}</p>

          <!-- Account Message -->
          <p style="margin: 0 0 30px 0; font-size: 16px;">${accountMessage}</p>

          <!-- Login Credentials -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">Your Login Credentials</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600; color: #374151;">Employee ID:</span>
              <span style="color: #6b7280;">${sampleData.emp_id}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600; color: #374151;">Temporary Password:</span>
              <span style="color: #6b7280;">TempPass123!</span>
            </div>
          </div>

          <!-- Next Steps -->
          ${
            nextStepsHtml
              ? `
          <div style="margin: 0 0 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">Next Steps</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              ${nextStepsHtml}
            </ul>
          </div>
          `
              : ""
          }

          <!-- Help Message -->
          <p style="margin: 0 0 30px 0; font-size: 16px;">${helpMessage}</p>

          <!-- Login Button -->
          <div style="text-align: center; margin: 0 0 30px 0;">
            <a href="#" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Login to Your Account</a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${footerMessage}</p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">© 2024 ShiftSync. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    async function fetchBusinessInfo() {
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);

        if (bId) {
          // Fetch business information
          const { data: businessData, error: businessError } = await supabase
            .from("business")
            .select("business_name, business_email")
            .eq("business_id", bId)
            .single();

          if (businessError) {
            console.error("Error fetching business info:", businessError);
            setError("Failed to fetch business information.");
          } else {
            setBusinessInfo(businessData);
          }
        }
      } catch (err) {
        console.error("Error in fetchBusinessInfo:", err);
        setError("Failed to fetch business information.");
      }
    }
    fetchBusinessInfo();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      // TODO: Save email settings to database
      // For now, just simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save email settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEmailSettings({
      subject: "Welcome to {business_name}! Your Account is Ready",
      greeting: "Hi {first_name},",
      welcomeMessage:
        "Welcome to the team! We're excited to have you on board at {business_name}.",
      accountMessage:
        "Your account has been successfully created and you can now access our workforce management platform.",
      nextSteps: [
        "Log in using your credentials above",
        "Complete your profile setup",
        "Review your schedule and upcoming shifts",
      ],
      helpMessage:
        "If you have any questions or need assistance getting started, please don't hesitate to reach out to your manager or our support team.",
      footerMessage:
        "This email was sent by ShiftSync on behalf of {business_name}.",
    });
  };

  const updateNextStep = (index, value) => {
    const newNextSteps = [...emailSettings.nextSteps];
    newNextSteps[index] = value;
    setEmailSettings((prev) => ({ ...prev, nextSteps: newNextSteps }));
  };

  const addNextStep = () => {
    setEmailSettings((prev) => ({
      ...prev,
      nextSteps: [...prev.nextSteps, ""],
    }));
  };

  const removeNextStep = (index) => {
    setEmailSettings((prev) => ({
      ...prev,
      nextSteps: prev.nextSteps.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Onboarding Email Template
        </h3>
        <p className="text-sm text-gray-600">
          Customize the email template that new employees receive when they're
          added to your business.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">
            Email settings saved successfully!
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Preview Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-medium text-gray-900">Email Preview</h4>
          <p className="text-sm text-gray-600">
            See how your email will look to new employees
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg
            className={`w-4 h-4 transform transition-transform ${showPreview ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Subject: {replaceVariables(emailSettings.subject)}
            </h5>
          </div>
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            dangerouslySetInnerHTML={{ __html: generatePreview() }}
          />
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              This preview shows how the email will look with sample data:{" "}
              {sampleData.first_name} {sampleData.last_name} at{" "}
              {sampleData.business_name}
            </p>
          </div>
        </div>
      )}

      {/* Email Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Subject
        </label>
        <input
          type="text"
          value={emailSettings.subject}
          onChange={(e) =>
            setEmailSettings((prev) => ({ ...prev, subject: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Welcome to {business_name}! Your Account is Ready"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use {"{business_name}"} to include the business name dynamically
        </p>
      </div>

      {/* Email Content */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Email Content
        </label>

        {/* Greeting */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Greeting
          </label>
          <input
            type="text"
            value={emailSettings.greeting}
            onChange={(e) =>
              setEmailSettings((prev) => ({
                ...prev,
                greeting: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Hi {first_name},"
          />
        </div>

        {/* Welcome Message */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Welcome Message
          </label>
          <textarea
            value={emailSettings.welcomeMessage}
            onChange={(e) =>
              setEmailSettings((prev) => ({
                ...prev,
                welcomeMessage: e.target.value,
              }))
            }
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Welcome to the team! We're excited to have you on board..."
          />
        </div>

        {/* Account Message */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Account Message
          </label>
          <textarea
            value={emailSettings.accountMessage}
            onChange={(e) =>
              setEmailSettings((prev) => ({
                ...prev,
                accountMessage: e.target.value,
              }))
            }
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your account has been successfully created..."
          />
        </div>

        {/* Next Steps */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Next Steps
          </label>
          <div className="space-y-2">
            {emailSettings.nextSteps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateNextStep(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Step ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeNextStep(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={emailSettings.nextSteps.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addNextStep}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Next Step
            </button>
          </div>
        </div>

        {/* Help Message */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Help Message
          </label>
          <textarea
            value={emailSettings.helpMessage}
            onChange={(e) =>
              setEmailSettings((prev) => ({
                ...prev,
                helpMessage: e.target.value,
              }))
            }
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="If you have any questions..."
          />
        </div>

        {/* Footer Message */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Footer Message
          </label>
          <input
            type="text"
            value={emailSettings.footerMessage}
            onChange={(e) =>
              setEmailSettings((prev) => ({
                ...prev,
                footerMessage: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="This email was sent by ShiftSync on behalf of {business_name}."
          />
        </div>
      </div>

      {/* Variables Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Available Variables
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          <div>
            <code className="bg-blue-100 px-1 rounded">{"{first_name}"}</code> -
            Employee's first name
          </div>
          <div>
            <code className="bg-blue-100 px-1 rounded">{"{last_name}"}</code> -
            Employee's last name
          </div>
          <div>
            <code className="bg-blue-100 px-1 rounded">
              {"{business_name}"}
            </code>{" "}
            - Your business name
          </div>
          <div>
            <code className="bg-blue-100 px-1 rounded">{"{emp_id}"}</code> -
            Employee ID
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
