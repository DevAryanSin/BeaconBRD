"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X, RotateCcw, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBRDStore } from "@/store/useBRDStore";
import { DEFAULT_PROMPTS, type SectionKey } from "@/lib/nlpClassify";

const SECTIONS: { id: SectionKey; title: string; icon: string }[] = [
    { id: "executive_summary", title: "Executive Summary", icon: "1" },
    { id: "functional_requirements", title: "Functional Requirements", icon: "2" },
    { id: "stakeholder_analysis", title: "Stakeholder Analysis", icon: "3" },
    { id: "timeline", title: "Timeline & Milestones", icon: "4" },
    { id: "decisions", title: "Key Decisions", icon: "5" },
    { id: "assumptions", title: "Assumptions & Constraints", icon: "6" },
    { id: "success_metrics", title: "Success Metrics", icon: "7" },
];

function SectionRow({ section, isExpanded, onToggle }: {
    section: typeof SECTIONS[0];
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const customPrompt = useBRDStore((s) => s.customPrompts[section.id]);
    const setCustomPrompt = useBRDStore((s) => s.setCustomPrompt);
    const resetCustomPrompt = useBRDStore((s) => s.resetCustomPrompt);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(customPrompt || "");

    const isCustom = !!customPrompt?.trim();
    const hasContent = (customPrompt || "").trim().length > 0;

    const handleSave = () => {
        const trimmed = draft.trim();
        if (trimmed) {
            setCustomPrompt(section.id, trimmed);
        } else {
            resetCustomPrompt(section.id);
        }
        setEditing(false);
    };

    const handleReset = () => {
        resetCustomPrompt(section.id);
        setDraft("");
        setEditing(false);
    };

    return (
        <div className={cn(
            "rounded-lg border transition-colors",
            isCustom ? "border-cyan-500/20 bg-cyan-500/5" : "border-white/5 bg-white/[0.02]"
        )}>
            {/* Collapsed header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left group"
            >
                <span className="text-[10px] font-mono text-zinc-700 w-4 flex-shrink-0">{section.icon}</span>
                <span className="text-[11px] text-zinc-400 flex-1 truncate group-hover:text-zinc-200 transition-colors">
                    {section.title}
                </span>
                {isCustom && (
                    <span className="text-[8px] font-mono uppercase tracking-wider text-cyan-500/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/15">
                        Custom
                    </span>
                )}
                {isExpanded ? (
                    <ChevronUp size={12} className="text-zinc-600 flex-shrink-0" />
                ) : (
                    <ChevronDown size={12} className="text-zinc-600 flex-shrink-0" />
                )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-2">
                    {editing ? (
                        <>
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder={DEFAULT_PROMPTS[section.id]}
                                className="glass-input w-full text-[11px] p-2.5 rounded-lg resize-none leading-relaxed font-mono"
                                rows={5}
                                autoFocus
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-zinc-600 font-mono">
                                    {draft.length} chars
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleReset}
                                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                                    >
                                        <RotateCcw size={9} /> Reset
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDraft(customPrompt || "");
                                            setEditing(false);
                                        }}
                                        className="text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20 transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div
                            onClick={() => setEditing(true)}
                            className="cursor-pointer group"
                        >
                            {hasContent ? (
                                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3 group-hover:text-zinc-300 transition-colors">
                                    {customPrompt}
                                </p>
                            ) : (
                                <p className="text-[11px] text-zinc-600 italic group-hover:text-zinc-500 transition-colors">
                                    Using default prompt — click to customize
                                </p>
                            )}
                            <p className="text-[9px] text-zinc-700 mt-1.5 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to edit prompt
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SectionPromptEditor() {
    const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);
    const customPrompts = useBRDStore((s) => s.customPrompts);
    const customCount = Object.values(customPrompts).filter((p) => p.trim().length > 0).length;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare size={13} className="text-purple-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-zinc-300">Section Prompts</span>
                    {customCount > 0 && (
                        <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/15">
                            {customCount} custom
                        </span>
                    )}
                </div>
            </div>

            {/* Section list */}
            <div className="space-y-1">
                {SECTIONS.map((section) => (
                    <SectionRow
                        key={section.id}
                        section={section}
                        isExpanded={expandedSection === section.id}
                        onToggle={() => setExpandedSection(
                            expandedSection === section.id ? null : section.id
                        )}
                    />
                ))}
            </div>

            {/* Hint */}
            <p className="text-[10px] text-zinc-700 leading-relaxed">
                Custom prompts override the default instructions sent to each section&apos;s AI agent.
                Changes take effect on the next generation.
            </p>
        </div>
    );
}
