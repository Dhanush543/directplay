// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// v4: NextAuth returns a *single* handler function
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };