import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { appRouter } from '@/server/trpc/root';
import { createTRPCContext } from '@/server/trpc/trpc';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
    onError: ({ path, error }) => {
      // Always log tRPC errors for debugging in production
      console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, {
        message: error.message,
        code: error.code,
        cause: error.cause,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    },
  });

export { handler as GET, handler as POST };
