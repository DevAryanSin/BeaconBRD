"use client";

import { useMemo } from "react";
import { Sparkles, X, HelpCircle, ChevronRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBRDStore } from "@/store/useBRDStore";
import { classifyNLPInput, getTopSections, type SectionKey } from "@/lib/nlpClassify";

const SECTION_ORDER: SectionKey[] = [
    "executive_summary",
    "functional_requirements",
    "stakeholder_analysis",
    "timeline",
    "decisions",
    "assumptions",
    "success_metrics",
];

const SECTION_LABELS: Record<SectionKey, string> = {
    executive_summary: "Executive Summary",
    functional_requirements: "Functional Requirements",
    stakeholder_analysis: "Stakeholder Analysis",
    timeline: "Timeline & Milestones",
    decisions: "Key Decisions",
    assumptions: "Assumptions & Constraints",
    success_metrics: "Success Metrics",
};

const SCORE_COLORS = {
    high: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    low: "text-zinc-500 bg-white/5 border-white/5",
};

function getScoreLevel(score: number): "high" | "medium" | "low" {
    if (score >= 0.3) return "high";
    if (score >= 0.1) return "medium";
    return "low";
}

function ScorePill({ score }: { score: number }) {
    const level = getScoreLevel(score);
    const pct = Math.round(score * 100);
    return (
        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", SCORE_COLORS[level])}>
            {pct}%
        </span>
    );
}

export default function NLPInputPanel({ onSend }: { onSend?: () => void }) {
    const nlpInput = useBRDStore((s) => s.nlpInput);
    const setNlpInput = useBRDStore((s) => s.setNlpInput);
    const generating = useBRDStore((s) => s.generating);

    const scores = useMemo(() => classifyNLPInput(nlpInput), [nlpInput]);
    const topSections = useMemo(() => getTopSections(scores), [scores]);
    const hasInput = nlpInput.trim().length > 0;

    const handleClear = () => setNlpInput("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (hasInput && !generating && onSend) {
                onSend();
            }
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-cyan-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-zinc-300">Draft Input</span>
                <span className="text-[9px] text-zinc-600 font-mono">NLP</span>
            </div>

            {/* Textarea */}
            <div className="relative">
                <textarea
                    value={nlpInput}
                    onChange={(e) => setNlpInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your project, requirements, goals, constraints...&#10;&#10;Example: We need a user authentication system with OAuth2 login, support for 10k concurrent users, and a Q4 2025 launch target."
                    className="glass-input w-full text-xs p-3 pr-16 rounded-lg resize-none leading-relaxed"
                    rows={8}
                    disabled={generating}
                />
                {hasInput && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                            onClick={handleClear}
                            className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                            title="Clear input"
                        >
                            <X size={12} />
                        </button>
                        <button
                            onClick={() => { if (hasInput && !generating && onSend) onSend(); }}
                            disabled={generating || !onSend}
                            className="p-1 rounded-md text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors disabled:opacity-30"
                            title="Generate BRD (Ctrl+Enter)"
                        >
                            <Send size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Detected sections */}
            {hasInput && (
                <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                        Detected Sections
                    </p>
                    <div className="space-y-1">
                        {SECTION_ORDER.map((sectionId) => {
                            const score = scores[sectionId] ?? 0;
                            const isTop = topSections.includes(sectionId);
                            if (!isTop && score < 0.02) return null;
                            return (
                                <div
                                    key={sectionId}
                                    className={cn(
                                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors",
                                        isTop ? "bg-white/5" : "opacity-40"
                                    )}
                                >
                                    {isTop && <ChevronRight size={9} className="text-cyan-500 flex-shrink-0" />}
                                    <span className="text-[11px] text-zinc-400 flex-1 truncate">
                                        {SECTION_LABELS[sectionId]}
                                    </span>
                                    <ScorePill score={score} />
                                </div>
                            );
                        })}
                    </div>
                    {topSections.length === 0 && (
                        <p className="text-[10px] text-zinc-600 italic flex items-center gap-1">
                            <HelpCircle size={9} />
                            No specific sections detected — input will be applied to all sections
                        </p>
                    )}
                </div>
            )}

            {/* Hint */}
            <p className="text-[10px] text-zinc-700 leading-relaxed">
                Press <kbd className="font-mono text-zinc-500 bg-white/5 px-1 rounded">Ctrl+Enter</kbd> or click the send button to generate.
            </p>
        </div>
    );
}
