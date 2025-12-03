export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <div className="text-6xl">📡</div>
        <h1 className="text-3xl font-bold text-foreground">You're Offline</h1>
        <p className="text-muted-foreground max-w-md">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
