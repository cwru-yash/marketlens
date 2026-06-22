import { DashboardExplorer } from "@/app/components/DashboardExplorer";
import { enrichListings } from "@/lib/analytics/score";
import { getListings } from "@/lib/data/listing-provider";

export default async function Home() {
  const listings = await getListings();
  const enrichedListings = enrichListings(listings);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 md:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-8 shadow-2xl shadow-cyan-950/20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Residential Listing Intelligence
          </p>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-end">
            <div>
              <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
                MarketLens
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Explore residential listings on a map, compare asking prices
                against similar homes, and prioritize listings that may deserve
                deeper due diligence.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <p className="text-sm font-medium text-cyan-300">
                MVP methodology
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Demo listings are enriched through a transparent comparable-home
                engine using price per square foot, property type, beds, baths,
                square footage, and neighborhood-level matching.
              </p>
            </div>
          </div>
        </div>

        <DashboardExplorer listings={enrichedListings} />
      </section>
    </main>
  );
}
