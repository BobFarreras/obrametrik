export async function GET() {
  return Response.json(
    { status: "ok", service: "obrametrik-web" },
    { headers: { "cache-control": "no-store" } },
  );
}
