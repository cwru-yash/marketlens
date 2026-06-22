import { useState } from "react";
import type { MarketPosition } from "@/lib/types";

type SortOption = "price_asc" | "price_desc" | "opportunity_first";

type FilterBarProps = {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    searchSuggestions: string[];
    onSearchSuggestionSelect: (value: string) => void;
    marketPositionFilter: MarketPosition | "all";
    onMarketPositionFilterChange: (value: MarketPosition | "all") => void;
    sortOption: SortOption;
    onSortOptionChange: (value: SortOption) => void;
};

export function FilterBar({
    searchQuery,
    onSearchQueryChange,
    searchSuggestions,
    onSearchSuggestionSelect,
    marketPositionFilter,
    onMarketPositionFilterChange,
    sortOption,
    onSortOptionChange,
}: FilterBarProps) {
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const shouldShowSuggestions =
        isSuggestionsOpen &&
        searchQuery.trim().length > 0 &&
        searchSuggestions.length > 0;

    const handleSearchChange = (value: string) => {
        onSearchQueryChange(value);
        setIsSuggestionsOpen(value.trim().length > 0);
    };

    const handleSuggestionSelect = (value: string) => {
        onSearchSuggestionSelect(value);
        setIsSuggestionsOpen(false);
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/40">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)_minmax(220px,0.8fr)]">
                <div className="relative grid gap-2">
                    <label
                        htmlFor="listing-search"
                        className="text-sm font-medium text-slate-300"
                    >
                        Search listings
                    </label>

                    <input
                        id="listing-search"
                        value={searchQuery}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        onFocus={() =>
                            setIsSuggestionsOpen(searchQuery.trim().length > 0)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                setIsSuggestionsOpen(false);
                            }
                        }}
                        placeholder="Search address, neighbourhood, ZIP, or property type..."
                        autoComplete="off"
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-400/20 transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4"
                    />

                    {shouldShowSuggestions ? (
                        <div className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/60">
                            {searchSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-200 focus:bg-cyan-400/10 focus:text-cyan-200 focus:outline-none"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-300">
                        Market position
                    </span>

                    <select
                        value={marketPositionFilter}
                        onChange={(event) =>
                            onMarketPositionFilterChange(
                                event.target.value as MarketPosition | "all",
                            )
                        }
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-400/20 transition focus:border-cyan-400 focus:ring-4"
                    >
                        <option value="all">All listings</option>
                        <option value="potential_opportunity">
                            Potential opportunities
                        </option>
                        <option value="within_range">Within range</option>
                        <option value="above_range">Above range</option>
                        <option value="low_confidence">Low confidence</option>
                    </select>
                </label>

                <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-300">Sort by</span>

                    <select
                        value={sortOption}
                        onChange={(event) =>
                            onSortOptionChange(event.target.value as SortOption)
                        }
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-400/20 transition focus:border-cyan-400 focus:ring-4"
                    >
                        <option value="opportunity_first">Opportunity first</option>
                        <option value="price_asc">Price: low to high</option>
                        <option value="price_desc">Price: high to low</option>
                    </select>
                </label>
            </div>

            <p className="mt-3 text-xs text-slate-500">
                MVP search runs against the current demo dataset. Production search
                would connect to a database or listing provider API.
            </p>
        </div>
    );
}
