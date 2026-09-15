import { listAdminReviews, setReviewPublished } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const reviews = await listAdminReviews();
    return Response.json({ reviews }, { headers: { "cache-control": "no-store" } });
  });
}

export async function PATCH(request: Request) {
  return withAdmin(request, async () => {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      published?: boolean;
    };
    if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
    const review = await setReviewPublished(body.id, Boolean(body.published));
    if (!review) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ review });
  });
}
