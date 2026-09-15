import { createAdminProduct, listAdminProducts, type ProductFormInput } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const products = await listAdminProducts();
    return Response.json({ products }, { headers: { "cache-control": "no-store" } });
  });
}

export async function POST(request: Request) {
  return withAdmin(request, async () => {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      slug?: string;
    } & Partial<ProductFormInput>;
    if (!body.id || !body.slug || !body.name) {
      return Response.json({ error: "id, slug and name are required" }, { status: 400 });
    }
    const result = await createAdminProduct(body.id, body.slug, body as ProductFormInput);
    if ("error" in result) return Response.json(result, { status: 400 });
    return Response.json({ product: result });
  });
}
