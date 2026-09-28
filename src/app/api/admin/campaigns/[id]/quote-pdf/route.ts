import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Streams a campaign's quote PDF. Admin-only — the PDF isn't public, unlike
 * profile photos, since it carries unitPriceBrand figures. */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const file = adminStorage.bucket().file(`quotePdfs/${id}/devis.pdf`);
  const [exists] = await file.exists();
  if (!exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [buffer] = await file.download();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="devis-${id}.pdf"`,
    },
  });
}
