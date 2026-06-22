"use client";

import { useState } from "react";

type AiInsight = {
    summary: string;
    riskFlags: string[];
    questionsToAsk: string[];
    nextSteps: string[];
};

type AiInsightPanelProps = {
    listingId: string | null;
};

type InsightState =
    | { status: "idle" }
    | { status: "loading"; listingId: string }
    | { status: "ready"; listingId: string; insight: AiInsight }
    | { status: "error"; listingId: string; message: string };

function InsightList({
    title,
    items,
}: {
    title: string;
    items: string[];
}) {
    return (
        <div>
            <p className="text-sm font-medium text-slate-300">{title}</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-400">
                {items.map((item) => (
                    <li key={item} className="rounded-lg bg-slate-950/70 px-3 py-2">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function AiInsightPanel({ listingId }: AiInsightPanelProps) {
    const [insightState, setInsightState] = useState<InsightState>({
        status: "idle",
    });

    if (!listingId) {
        return null;
    }

    const isLoading =
        insightState.status === "loading" && insightState.listingId === listingId;
    const readyInsight =
        insightState.status === "ready" && insightState.listingId === listingId
            ? insightState.insight
            : null;
    const errorMessage =
        insightState.status === "error" && insightState.listingId === listingId
            ? insightState.message
            : null;
    const displayedInsight = readyInsight
        ? {
            ...readyInsight,
            riskFlags: readyInsight.riskFlags.slice(0, 3),
            questionsToAsk: readyInsight.questionsToAsk.slice(0, 3),
            nextSteps: readyInsight.nextSteps.slice(0, 3),
        }
        : null;

    async function handleGenerateInsight() {
        if (!listingId) {
            return;
        }

        setInsightState({ status: "loading", listingId });

        try {
            const response = await fetch("/api/ai/insight", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ listingId }),
            });

            if (!response.ok) {
                const errorBody = (await response.json().catch(() => null)) as {
                    error?: string;
                } | null;
                throw new Error(errorBody?.error ?? "Unable to generate insight.");
            }

            const insight = (await response.json()) as AiInsight;
            setInsightState({ status: "ready", listingId, insight });
        } catch (error) {
            setInsightState({
                status: "error",
                listingId,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to generate insight.",
            });
        }
    }

    return (
        <div className="mt-6 rounded-xl border border-cyan-400/20 bg-slate-950 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-cyan-300">
                        AI due-diligence summary
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        AI summarizes existing analytics; it does not replace inspection,
                        appraisal, or investment due diligence.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleGenerateInsight}
                    disabled={isLoading}
                    className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading
                        ? "Generating..."
                        : "Generate AI due-diligence summary"}
                </button>
            </div>

            {errorMessage ? (
                <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                    {errorMessage}
                </p>
            ) : null}

            {displayedInsight ? (
                <div className="mt-4 space-y-4">
                    <div>
                        <p className="text-sm font-medium text-slate-300">Summary</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            {displayedInsight.summary}
                        </p>
                    </div>

                    <InsightList title="Risk flags" items={displayedInsight.riskFlags} />
                    <InsightList
                        title="Questions to ask"
                        items={displayedInsight.questionsToAsk}
                    />
                    <InsightList title="Next steps" items={displayedInsight.nextSteps} />
                </div>
            ) : null}
        </div>
    );
}
