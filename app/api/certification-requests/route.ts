import { parseCertificationRequest } from "@/lib/certification-request";
import { limitExam } from "@/lib/exam-rate-limit";
import { prisma } from "@/lib/prisma";
import { readJson, requireOrigin, requestError } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const data = parseCertificationRequest(await readJson(request, 2048));
    const limited = await limitExam(request, "certificationRequest");
    if (limited) return limited;
    await prisma.certificationRequest.create({ data });
    return Response.json({ message: "Thanks. Your certification request has been received." }, {
      status: 201, headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return requestError(error, "Unable to send your request. Please try again.");
  }
}
