import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/sign-in" },
});

export const config = {
  matcher: [
    // Protect all app routes EXCEPT static files and auth routes
    "/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up|api|hero.jpg|cyberpunk-hero.jpg|public).*)",
  ],
};