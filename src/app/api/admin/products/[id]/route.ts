import {
  deleteAdminProduct,
  getAdminProduct,
  updateAdminProduct,
  type ProductFormInput,
} from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdmin(request, async () => {
    const { id } = await params;
    const product = await getAdminProduct(id);
    if (!product) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ product }, { headers: { "cache-control": "no-store" } });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdmin(request, async () => {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { slug?: string } & Partial<
      ProductFormInput & { variantStock: Record<string, number> }
    >;
    const result = await updateAdminProduct(id, body);
    if (!result) return Response.json({ error: "Not found" }, { status: 404 });
    if ("error" in result) return Response.json(result, { status: 400 });
    return Response.json({ product: result });
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdmin(request, async () => {
    const { id } = await params;
    const ok = await deleteAdminProduct(id);
    if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  });
}
