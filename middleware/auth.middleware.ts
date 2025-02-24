import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const authMiddleware=  async(req:NextRequest)=>
{
    const session = await getServerSession(authOptions);
    if (!session || session.user.role!=="admin") {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
}
export default authMiddleware;