import { getAdminProduct, updateAdminProduct } from "@/lib/api/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ product }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const product = await updateAdminProduct(id, {
    price: body.price as number | undefined,
    compareAtPrice: body.compareAtPrice as number | null | undefined,
    badges: body.badges as never,
    active: body.active as boolean | undefined,
    variantStock: body.variantStock as Record<string, number> | undefined,
  });
  if (!product) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ product });
}
