import { NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"

const enableAuth = "ATH#1013where"

export default enableAuth
  ? withAuth({ pages: { signIn: "/admin/login" } })
  : (req: Request) => NextResponse.next()

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
