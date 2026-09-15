import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { readStoredCv } from "@/lib/cvStorage";
import { prisma } from "@/lib/db";

type CvRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: CvRouteProps) {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.application.findUnique({ where: { id } });

  if (!application) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cv = await readStoredCv(application.cvStorageType, application.cvPath);

  return new NextResponse(cv.body, {
    headers: {
      "Content-Type": cv.contentType,
      "Content-Disposition": `attachment; filename="${application.cvOriginalName.replaceAll('"', "")}"`,
      "Content-Length": String(application.cvSize),
      "Cache-Control": "private, no-store",
    },
  });
}
