export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    passcode?: string;
  } | null;

  const expected = process.env.ADMIN_PASSCODE ?? "flossy-admin";

  if (!body?.passcode || body.passcode !== expected) {
    return Response.json({ ok: false }, { status: 401 });
  }

  return Response.json({ ok: true });
}
