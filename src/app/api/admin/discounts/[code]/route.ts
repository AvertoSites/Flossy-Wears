import { deleteDiscount, setDiscountActive } from "@/lib/api/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = (await request.json().catch(() => ({}))) as { active?: boolean };
  const discount = await setDiscountActive(
    decodeURIComponent(code),
    Boolean(body.active),
  );
  if (!discount) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ discount });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ok = await deleteDiscount(decodeURIComponent(code));
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
