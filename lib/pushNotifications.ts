"use client";

/** Lazy entry point so Firebase SDK is not loaded until the user opts in. */
export async function enablePushNotifications() {
  const { registerPushDevice } = await import("@/lib/firebaseMessaging");
  return registerPushDevice();
}
