import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/sign-in' },
});

export const config = {
  matcher: [
    // Protect all app routes EXCEPT:
    // - Static files (_next/static, _next/image, favicon.ico, etc.)
    // - Auth routes (sign-in, sign-up, setup)
    // - API routes
    // - Root path (/) - MUST be excluded for iOS PWA to work (no server-side redirects)
    '/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up|setup|api|hero.jpg|cyberpunk-hero.jpg|public|manifest.json|service-worker.js).+)',
  ],
};
