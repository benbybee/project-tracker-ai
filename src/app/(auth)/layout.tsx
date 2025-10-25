import '@/app/globals.css';
import HeroImage from '@/components/auth/hero-image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center
      bg-[radial-gradient(1200px_800px_at_-10%_-10%,rgba(99,102,241,.30),transparent),radial-gradient(900px_700px_at_110%_110%,rgba(56,189,248,.22),transparent)]
      dark:bg-[radial-gradient(1200px_800px_at_-10%_-10%,rgba(99,102,241,.35),transparent),radial-gradient(900px_700px_at_110%_110%,rgba(6,182,212,.22),transparent)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div
          className="grid md:grid-cols-2 gap-0 rounded-[24px] overflow-hidden
            border border-white/30 bg-white/55 dark:bg-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,.10)]"
        >
          {/* Left visual panel */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 p-6">
              <HeroImage />
            </div>
          </div>
          {/* Right form panel */}
          <div className="px-8 lg:px-12 py-10 bg-white/70 dark:bg-white/5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
