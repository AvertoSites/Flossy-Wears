import { getSettings, updateSettings } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";
import type { StoreSettings } from "@/types";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const settings = await getSettings();
    return Response.json({ settings }, { headers: { "cache-control": "no-store" } });
  });
}

export async function PUT(request: Request) {
  return withAdmin(request, async () => {
    const body = (await request.json().catch(() => ({}))) as Partial<StoreSettings>;
    const settings = await updateSettings(body);
    return Response.json({ settings });
  });
}
