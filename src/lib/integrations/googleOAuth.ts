import { google } from "googleapis";

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "dummy_google_client_id";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "dummy_google_client_secret";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/integrations/google/callback";

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const GOOGLE_SCOPES = {
  GOOGLE_CALENDAR: [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
  GMAIL: ["https://www.googleapis.com/auth/gmail.send"],
  GOOGLE_SHEETS: ["https://www.googleapis.com/auth/drive.file"],
};

export function generateGoogleAuthUrl(service: "GOOGLE_CALENDAR" | "GMAIL" | "GOOGLE_SHEETS"): string {
  const oauth2Client = getGoogleOAuthClient();
  const scopes = GOOGLE_SCOPES[service];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true, // Autorización incremental para no pisar permisos previos
    scope: scopes,
    state: JSON.stringify({ service }),
  });
}
