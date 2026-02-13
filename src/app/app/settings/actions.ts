"use server";

import { createClient } from "@/lib/supabase/server";

export type SettingsResult = {
  success: boolean;
  error?: string;
};

export async function updateSettings(
  formData: FormData
): Promise<SettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "No account found" };
  }

  const accountId = profile.account_id;
  const locationId = formData.get("location_id") as string;

  if (!locationId) {
    return { success: false, error: "Missing location ID" };
  }

  // Parse business fields
  const businessName = formData.get("business_name") as string;
  const businessAddress = formData.get("business_address") as string;
  const businessPhone = formData.get("business_phone") as string;
  const businessEmail = formData.get("business_email") as string;
  const googleReviewUrl = formData.get("google_review_url") as string;
  const contactUsUrl = (formData.get("contact_us_url") as string) || null;

  if (
    !businessName ||
    !businessAddress ||
    !businessPhone ||
    !businessEmail ||
    !googleReviewUrl
  ) {
    return { success: false, error: "Please fill in all required fields" };
  }

  try {
    new URL(googleReviewUrl);
  } catch {
    return { success: false, error: "Google Review URL must be a valid URL" };
  }

  // Update location (RLS ensures account_id match)
  const { error: locationError } = await supabase
    .from("locations")
    .update({
      name: businessName,
      address: businessAddress,
      business_phone: businessPhone,
      business_email: businessEmail,
      google_review_url: googleReviewUrl,
      contact_us_url: contactUsUrl,
    })
    .eq("id", locationId)
    .eq("account_id", accountId);

  if (locationError) {
    console.error("Location update error:", locationError.message);
    return { success: false, error: "Failed to update location" };
  }

  // Parse automation settings
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

  // Update account_settings
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
    return { success: false, error: "Failed to update settings" };
  }

  return { success: true };
}
