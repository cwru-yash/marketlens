import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import {
    getComparableListings,
    getFallbackComparableListings,
} from "@/lib/analytics/comps";
import { enrichListings } from "@/lib/analytics/score";
import { getListings } from "@/lib/data/listing-provider";
import type { EnrichedListing, Listing } from "@/lib/types";

const MIN_COMP_COUNT = 2;

type AiInsight = {
    summary: string;
    riskFlags: string[];
    questionsToAsk: string[];
    nextSteps: string[];
};

type MethodologySummary = {
    comparableStrategy: "strict" | "fallback";
    strictComparableCount: number;
    returnedComparableCount: number;
    minimumComparableCount: number;
    primaryRules: string[];
    fallbackRules: string[];
    disclaimer: string;
};

type InsightFacts = {
    address: string;
    neighbourhood: string;
    zipcode: string;
    property_type: string;
    listPrice: number;
    beds: number;
    baths: number;
    sqft: number;
    daysOnMarket: number;
    analytics: EnrichedListing["analytics"];
    comparables: Array<{
        address: string;
        neighbourhood: string;
        listPrice: number;
        pricePerSqft: number;
        marketPosition: string;
    }>;
    methodology: MethodologySummary;
};

const insightResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        riskFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            maxItems: 3,
        },
        questionsToAsk: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            maxItems: 3,
        },
        nextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            maxItems: 3,
        },
    },
    required: ["summary", "riskFlags", "questionsToAsk", "nextSteps"],
};

function buildMethodologySummary(
    strictComparableCount: number,
    returnedComparableCount: number,
): MethodologySummary {
    return {
        comparableStrategy:
            strictComparableCount >= MIN_COMP_COUNT ? "strict" : "fallback",
        strictComparableCount,
        returnedComparableCount,
        minimumComparableCount: MIN_COMP_COUNT,
        primaryRules: [
            "same neighbourhood",
            "same property type",
            "bedrooms within +/-1",
            "bathrooms within +/-1",
            "square footage within +/-20%",
        ],
        fallbackRules: ["same property type", "bedrooms within +/-1"],
        disclaimer:
            "MarketLens signals are for prioritization and due diligence, not investment advice or an appraisal.",
    };
}

function getComparableSet(
    rawListing: Listing,
    listings: Listing[],
): {
    comparableListings: Listing[];
    methodology: MethodologySummary;
} {
    const strictComps = getComparableListings(rawListing, listings);
    const comparableListings =
        strictComps.length >= MIN_COMP_COUNT
            ? strictComps
            : getFallbackComparableListings(rawListing, listings);

    return {
        comparableListings,
        methodology: buildMethodologySummary(
            strictComps.length,
            comparableListings.length,
        ),
    };
}

function buildFacts(
    listing: EnrichedListing,
    comparableListings: EnrichedListing[],
    methodology: MethodologySummary,
): InsightFacts {
    return {
        address: listing.address,
        neighbourhood: listing.neighbourhood,
        zipcode: listing.zipcode,
        property_type: listing.property_type,
        listPrice: listing.listPrice,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        daysOnMarket: listing.daysOnMarket,
        analytics: listing.analytics,
        comparables: comparableListings.map((comparable) => ({
            address: comparable.address,
            neighbourhood: comparable.neighbourhood,
            listPrice: comparable.listPrice,
            pricePerSqft: comparable.analytics.pricePerSqft,
            marketPosition: comparable.analytics.marketPosition,
        })),
        methodology,
    };
}

function buildFallbackInsight(facts: InsightFacts): AiInsight {
    const riskFlags = [
        facts.analytics.lowConfidence
            ? "Comparable confidence is limited because the current dataset has fewer close matches."
            : null,
        facts.methodology.comparableStrategy === "fallback"
            ? "The comparable set used fallback rules, so neighbourhood-level similarity may be weaker."
            : null,
        facts.analytics.marketPosition === "above_range"
            ? "The listing is priced above the comparable median on a price-per-square-foot basis."
            : null,
        facts.daysOnMarket > 45
            ? "Days on market is elevated for this demo set and may deserve closer review."
            : null,
    ].filter((flag): flag is string => Boolean(flag));

    return {
        summary: `${facts.address} is a ${facts.beds}-bed, ${facts.baths}-bath ${facts.property_type} in ${facts.neighbourhood} listed at $${facts.listPrice.toLocaleString()}. MarketLens calculates $${facts.analytics.pricePerSqft}/sqft versus a comparable median of $${facts.analytics.compMedianPricePerSqft}/sqft, with a ${facts.analytics.priceDeltaPct.toFixed(1)}% delta. This is a due-diligence aid based only on current listing and comparable facts.`,
        riskFlags:
            riskFlags.length > 0
                ? riskFlags
                : [
                    "No major deterministic risk flag is shown by the current demo analytics, but property condition, title, taxes, and inspection findings are not represented here.",
                ],
        questionsToAsk: [
            "What recent repairs, renovations, or deferred maintenance should be verified during inspection?",
            "Do taxes, insurance, HOA fees, utilities, or local assessments materially change carrying costs?",
            "Are there condition, title, permitting, rental, or zoning issues not visible in the listing data?",
        ],
        nextSteps: [
            "Review the comparable listings and confirm whether their condition and location are truly similar.",
            "Verify the listing facts against disclosures, inspection results, public records, and appraisal context.",
            "Use the MarketLens signal as a screening aid, not as investment advice or a purchase recommendation.",
        ],
    };
}

function limitSentences(value: string, maxSentences: number): string {
    const sentences = value.match(/[^.!?]+[.!?]+/g);

    if (!sentences || sentences.length <= maxSentences) {
        return value;
    }

    return sentences.slice(0, maxSentences).join(" ").replace(/\s+/g, " ").trim();
}

function normalizeInsight(value: unknown, fallback: AiInsight): AiInsight {
    if (!value || typeof value !== "object") {
        return fallback;
    }

    const candidate = value as Partial<AiInsight>;

    return {
        summary:
            typeof candidate.summary === "string"
                ? limitSentences(candidate.summary, 3)
                : fallback.summary,
        riskFlags: Array.isArray(candidate.riskFlags)
            ? candidate.riskFlags
                .filter((item): item is string => typeof item === "string")
                .slice(0, 3)
            : fallback.riskFlags,
        questionsToAsk: Array.isArray(candidate.questionsToAsk)
            ? candidate.questionsToAsk.filter(
                (item): item is string => typeof item === "string",
            ).slice(0, 3)
            : fallback.questionsToAsk,
        nextSteps: Array.isArray(candidate.nextSteps)
            ? candidate.nextSteps
                .filter((item): item is string => typeof item === "string")
                .slice(0, 3)
            : fallback.nextSteps,
    };
}

async function generateGeminiInsight(facts: InsightFacts): Promise<AiInsight> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const fallback = buildFallbackInsight(facts);

    if (!apiKey) {
        return fallback;
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model,
            contents: [
                "You are a real-estate due-diligence summarizer for MarketLens.",
                "Return structured JSON only with summary, riskFlags, questionsToAsk, and nextSteps.",
                "Keep summary concise: 2-3 sentences maximum.",
                "Return at most 3 riskFlags, at most 3 questionsToAsk, and at most 3 nextSteps.",
                "Do not provide investment advice. Do not decide whether this property is a good investment.",
                "Do not invent facts outside the provided listing and comparable data.",
                "Explain that this is a due-diligence aid.",
                "Mention confidence limits when compCount is low or when methodology uses fallback comparables.",
                `Facts: ${JSON.stringify(facts)}`,
            ].join("\n"),
            config: {
                responseMimeType: "application/json",
                responseSchema: insightResponseSchema,
            },
        });

        const parsed = JSON.parse(response.text ?? "{}");
        return normalizeInsight(parsed, fallback);
    } catch (error) {
        console.warn("Gemini insight generation failed; using fallback.", error);
        return fallback;
    }
}

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Request body must be valid JSON." },
            { status: 400 },
        );
    }

    const listingId =
        body && typeof body === "object" && "listingId" in body
            ? (body as { listingId?: unknown }).listingId
            : null;

    if (typeof listingId !== "string" || listingId.trim().length === 0) {
        return NextResponse.json(
            { error: "listingId is required." },
            { status: 400 },
        );
    }

    const listings = await getListings();
    const rawListing = listings.find((listing) => listing.id === listingId);

    if (!rawListing) {
        return NextResponse.json(
            { error: "Listing not found." },
            { status: 404 },
        );
    }

    const enrichedListings = enrichListings(listings);
    const enrichedListing = enrichedListings.find(
        (listing) => listing.id === listingId,
    );

    if (!enrichedListing) {
        return NextResponse.json(
            { error: "Listing not found." },
            { status: 404 },
        );
    }

    const { comparableListings, methodology } = getComparableSet(
        rawListing,
        listings,
    );
    const comparableIds = new Set(comparableListings.map((listing) => listing.id));
    const enrichedComparables = enrichedListings.filter((listing) =>
        comparableIds.has(listing.id),
    );
    const facts = buildFacts(enrichedListing, enrichedComparables, methodology);
    const insight = await generateGeminiInsight(facts);

    return NextResponse.json(insight);
}
