import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const { auth, handlers: { GET, POST } } = NextAuth(authConfig);

export { GET, POST, auth }
