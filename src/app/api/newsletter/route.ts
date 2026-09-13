import { newsletterSchema } from "@/lib/validations/misc";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid email" },
      { status: 400 },
    );
  }

  // TODO(firebase): persist the subscriber / forward to the email platform.
  return Response.json({ ok: true });
}
