import { getSettings, updateSettings } from "@/lib/api/admin";
import type { StoreSettings } from "@/types";

export async function GET() {
  const settings = await getSettings();
  return Response.json({ settings }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<StoreSettings>;
  const settings = await updateSettings(body);
  return Response.json({ settings });
}
