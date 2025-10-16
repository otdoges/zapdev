export async function POST() {
  return Response.json({ error: "Realtime not enabled" }, { status: 501 });
}
