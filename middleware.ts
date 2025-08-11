import { NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"

const enableAuth = !!process.env.NEXTAUTH_SECRET

export default enableAuth
  ? withAuth({ pages: { signIn: "/admin/login" } })
  : (req: Request) => NextResponse.next()

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
