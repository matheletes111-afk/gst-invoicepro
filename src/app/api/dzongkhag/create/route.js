import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {


  try {
    const body = await req.json();


    const { name, code, status } = body;

    if (!name) {
      return Response.json(
        { success: false, error: "Dzongkhag Name is required" },
        { status: 400 }
      );
    }

    // -------------------------------
    // DUPLICATE CHECK (case-insensitive)
    // -------------------------------
    const existingDzongkhag = await prisma.Dzongkhag.findFirst({
      where: {
        name: { equals: name.toLowerCase() }, // Use lowercase
        status: { in: ["A", "I"] },          // Only active/inactive
      },
    });

    if (existingDzongkhag) {
      return Response.json(
        { success: false, error: "Dzongkhag with this name already exists" },
        { status: 400 }
      );
    }

    // -------------------------------
    // CREATE NEW DZONGKHAG
    // -------------------------------
    const dzongkhag = await prisma.Dzongkhag.create({
      data: {
        name,
        code: code || null, // optional
        status: status || "A",
      },
    });


    // Log activity
    try {
      const user = await getUserFromRequest(req);

      if (user?.id) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const pathname = req.nextUrl.pathname;
        const method = req.method;

        const { default: prisma } = await import('@/lib/prisma');

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'CREATE',
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: dzongkhag,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, dzongkhag });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
