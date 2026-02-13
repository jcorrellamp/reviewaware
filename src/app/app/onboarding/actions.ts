"use server";

import { createClient } from "@/lib/supabase/server";
import { generateShortCode } from "@/lib/short-code";

export type OnboardingResult = {
  success: boolean;
  error?: string;
  shortCode?: string;
};

export async function saveOnboarding(formData: FormData): Promise<OnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get account_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "No account found" };
  }

  const accountId = profile.account_id;

  // Enforce single-location per account (V1)
  const { data: existing } = await supabase
    .from("locations")
    .select("id")
    .eq("account_id", accountId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: "Location already configured" };
  }

  // Parse form fields
  const businessName = formData.get("business_name") as string;
  const businessAddress = formData.get("business_address") as string;
  const businessPhone = formData.get("business_phone") as string;
  const businessEmail = formData.get("business_email") as string;
  const googleReviewUrl = formData.get("google_review_url") as string;
  const contactUsUrl = (formData.get("contact_us_url") as string) || null;

  // Automation settings
  const sendDelayMinutes = parseInt(
    (formData.get("send_delay_minutes") as string) || "60",
    10
  );
  const reminder1Days = parseInt(
    (formData.get("reminder1_days") as string) || "3",
    10
  );
  const reminder2Enabled = formData.get("reminder2_enabled") === "true";
  const reminder2Days = parseInt(
    (formData.get("reminder2_days") as string) || "7",
    10
  );
  const cooldownDays = parseInt(
    (formData.get("cooldown_days") as string) || "30",
    10
  );
  const sendWindowStart =
    (formData.get("send_window_start") as string) || "09:00";
  const sendWindowEnd =
    (formData.get("send_window_end") as string) || "19:00";

  // Validate required fields
  if (!businessName || !businessAddress || !businessPhone || !businessEmail || !googleReviewUrl) {
    return { success: false, error: "Please fill in all required fields" };
  }

  // Validate google_review_url is a URL
  try {
    new URL(googleReviewUrl);
  } catch {
    return { success: false, error: "Google Review URL must be a valid URL" };
  }

  // Generate unique short code (retry on collision)
  let shortCode = generateShortCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: collision } = await supabase
      .from("locations")
      .select("id")
      .eq("short_code", shortCode)
      .maybeSingle();

    if (!collision) break;
    shortCode = generateShortCode();
    attempts++;
  }

  if (attempts >= 5) {
    return { success: false, error: "Failed to generate short code. Please try again." };
  }

  // Insert location
  const { error: locationError } = await supabase.from("locations").insert({
    account_id: accountId,
    name: businessName,
    address: businessAddress,
    business_phone: businessPhone,
    business_email: businessEmail,
    google_review_url: googleReviewUrl,
    contact_us_url: contactUsUrl,
    short_code: shortCode,
  });

  if (locationError) {
    console.error("Location insert error:", locationError.message);
    return { success: false, error: "Failed to save location" };
  }

  // Update account_settings with automation defaults
  const { error: settingsError } = await supabase
    .from("account_settings")
    .update({
      send_delay_minutes: sendDelayMinutes,
      reminder1_days: reminder1Days,
      reminder2_enabled: reminder2Enabled,
      reminder2_days: reminder2Days,
      cooldown_days: cooldownDays,
      send_window_start: sendWindowStart,
      send_window_end: sendWindowEnd,
    })
    .eq("account_id", accountId);

  if (settingsError) {
    console.error("Settings update error:", settingsError.message);
    // Location was created, so continue — settings can be updated later
  }

  return { success: true, shortCode };
}
