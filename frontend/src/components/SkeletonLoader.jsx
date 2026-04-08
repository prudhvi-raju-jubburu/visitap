export function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface border border-white/5">
      <div className="h-48 skeleton"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton rounded w-3/4"></div>
        <div className="h-4 skeleton rounded w-1/2"></div>
        <div className="h-4 skeleton rounded w-full"></div>
        <div className="h-4 skeleton rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center space-y-4 w-full max-w-2xl px-4">
        <div className="h-10 skeleton rounded-xl mx-auto w-3/4"></div>
        <div className="h-6 skeleton rounded-xl mx-auto w-1/2"></div>
        <div className="h-4 skeleton rounded mx-auto w-2/3"></div>
        <div className="flex gap-3 justify-center mt-6">
          <div className="h-12 w-36 skeleton rounded-xl"></div>
          <div className="h-12 w-36 skeleton rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
