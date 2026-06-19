import { calculatePricePerSquareFoot } from "@/lib/analytics/price";
import { demo_listings } from "@/lib/data/demo-listings";
import { median } from "@/lib/analytics/stats";


export default function Home() {
  const featuredListing = demo_listings[0];
  const pricePerSquareFoot = calculatePricePerSquareFoot(featuredListing);
  const allPricesPerSquareFoot = demo_listings.map((listing) =>
    calculatePricePerSquareFoot(listing),
  );

  const medianPricePerSquareFoot = median(allPricesPerSquareFoot);
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
            First analytics function is live.
          </p>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-medium text-cyan-400">Featured listing</p>

          <h2 className="mt-2 text-2xl font-semibold">
            {featuredListing.address}
          </h2>

          <p className="mt-2 text-slate-300">
            {featuredListing.neighbourhood} · {featuredListing.beds} beds ·{" "}
            {featuredListing.baths} baths · {featuredListing.sqft} sq ft
          </p>

          <p className="mt-4 text-3xl font-bold">
            ${featuredListing.listPrice.toLocaleString()}
          </p>

          <p className="mt-2 text-slate-400">
            ${pricePerSquareFoot.toLocaleString()} per sq ft
          </p>

          <p className="mt-2 text-slate-400">
            Dataset median: ${medianPricePerSquareFoot.toLocaleString()} per sq ft
          </p>
        </div>
      </section>
    </main>
  );
}