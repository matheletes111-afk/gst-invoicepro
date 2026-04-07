import { NextResponse } from "next/server";
import { getUserFromRequest, isSuperAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const isAdmin = isSuperAdmin(user.email);
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}

