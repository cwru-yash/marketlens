export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-16 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Residential Listing Intelligence
        </p>

        <h1 className="text-5xl font-bold tracking-tight">
          MarketLens
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Explore residential listings, compare asking prices against nearby
          comparable homes, and understand market positioning with transparent
          analytics.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Current build milestone</p>
          <p className="mt-2 text-xl font-semibold">
            Project scaffold is live.
          </p>
        </div>
      </section>
    </main>
  );
}