/**
 * useBRDStore.ts
 * Zustand store for BRD sections, conflicts, NLP input, and custom prompts.
 * Wired to the real FastAPI backend via apiClient.ts.
 */
import { create } from 'zustand';
import {
    generateBRD,
    generateBRDSection,
    getBRD,
    editBRDSection,
    approveBRD,
    type BRDSections,
    type BRDSectionMeta,
    type ValidationFlag,
} from '@/lib/apiClient';

export interface BRDSection {
    id: string;
    title: string;
    content: string;
    citations: string[];
    lastEdited?: Date;
    humanEdited?: boolean;
    version?: number;
    snapshotId?: string | null;
    sourceChunkIds?: string[];
    generatedAt?: string | null;
}

interface BRDStore {
    sections: BRDSection[];
    flags: ValidationFlag[];
    acknowledgedFlagKeys: string[];
    snapshotId: string | null;
    loading: boolean;
    generating: boolean;
    generatingSection: string | null;
    error: string | null;
    isApproved: boolean;

    // NLP draft input
    nlpInput: string;
    setNlpInput: (text: string) => void;

    // Custom prompts per section
    customPrompts: Record<string, string>;
    setCustomPrompt: (sectionId: string, prompt: string) => void;
    resetCustomPrompt: (sectionId: string) => void;
    loadCustomPrompts: (sessionId: string) => void;
    saveCustomPrompts: (sessionId: string) => void;

    generateAll: (sessionId: string) => Promise<void>;
    generateSection: (sessionId: string, sectionId: string) => Promise<void>;
    loadBRD: (sessionId: string) => Promise<void>;
    updateSection: (sessionId: string, sectionId: string, content: string) => Promise<void>;
    acknowledgeFlag: (key: string) => void;
    approveAll: (sessionId: string) => Promise<void>;
}

const SECTION_META: { id: keyof BRDSections; title: string }[] = [
    { id: 'executive_summary', title: 'Executive Summary' },
    { id: 'functional_requirements', title: 'Functional Requirements' },
    { id: 'stakeholder_analysis', title: 'Stakeholder Analysis' },
    { id: 'timeline', title: 'Timeline & Milestones' },
    { id: 'decisions', title: 'Key Decisions' },
    { id: 'assumptions', title: 'Assumptions & Constraints' },
    { id: 'success_metrics', title: 'Success Metrics' },
];

function sectionsFromAPI(raw: BRDSections, meta: Record<string, BRDSectionMeta>): BRDSection[] {
    return SECTION_META.map(({ id, title }) => ({
        id: id as string,
        title,
        content: raw[id] ?? '',
        citations: [],
        humanEdited: meta[id]?.human_edited ?? false,
        version: meta[id]?.version_number ?? 1,
        snapshotId: meta[id]?.snapshot_id ?? null,
        sourceChunkIds: meta[id]?.source_chunk_ids ?? [],
        generatedAt: meta[id]?.generated_at ?? null,
    }));
}

export const useBRDStore = create<BRDStore>((set, get) => ({
    sections: SECTION_META.map(({ id, title }) => ({ id: id as string, title, content: '', citations: [] })),
    flags: [],
    acknowledgedFlagKeys: [],
    snapshotId: null,
    loading: false,
    generating: false,
    generatingSection: null,
    error: null,
    isApproved: false,

    // NLP draft input
    nlpInput: '',
    setNlpInput: (text: string) => set({ nlpInput: text }),

    // Custom prompts per section
    customPrompts: {},
    setCustomPrompt: (sectionId: string, prompt: string) =>
        set((state) => ({ customPrompts: { ...state.customPrompts, [sectionId]: prompt } })),
    resetCustomPrompt: (sectionId: string) => {
        const { customPrompts, ...rest } = get();
        const next = { ...customPrompts };
        delete next[sectionId];
        set({ customPrompts: next });
    },
    loadCustomPrompts: (sessionId: string) => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(`brd_prompts_${sessionId}`);
            if (raw) set({ customPrompts: JSON.parse(raw) });
        } catch { /* ignore */ }
    },
    saveCustomPrompts: (sessionId: string) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(`brd_prompts_${sessionId}`, JSON.stringify(get().customPrompts));
        } catch { /* ignore */ }
    },

    /**
     * Trigger BRD generation.
     * Shows a generating state — this call takes 30-90 seconds.
     * Passes NLP input + custom prompts as additional context.
     */
    generateAll: async (sessionId) => {
        set({ generating: true, error: null });
        try {
            if (typeof window !== "undefined") {
                localStorage.removeItem(`brd_approved_${sessionId}`);
            }
            set({ isApproved: false });

            const state = get();
            const nlpInput = state.nlpInput.trim();
            const customPrompts = state.customPrompts;
            const hasCustomInput = nlpInput.length > 0 || Object.keys(customPrompts).some(k => customPrompts[k].trim().length > 0);

            if (!hasCustomInput) {
                // No NLP input or custom prompts — use standard generation
                const res = await generateBRD(sessionId);
                set({ snapshotId: res.snapshot_id });
                await get().loadBRD(sessionId);
            } else {
                // Generate each section individually with NLP context
                for (const { id: sectionId } of SECTION_META) {
                    const customPrompt = customPrompts[sectionId]?.trim();
                    const parts: string[] = [];
                    if (customPrompt) parts.push(`USER PROMPT FOR THIS SECTION:\n${customPrompt}`);
                    if (nlpInput) parts.push(`ADDITIONAL CONTEXT FROM USER DRAFT INPUT:\n${nlpInput}`);
                    const additionalContext = parts.length > 0 ? parts.join('\n\n') : '';
                    try {
                        await generateBRDSection(sessionId, sectionId as string, additionalContext);
                    } catch {
                        // Continue generating other sections even if one fails
                    }
                }
                await get().loadBRD(sessionId);
            }
        } catch (e) {
            set({ error: e instanceof Error ? e.message : 'Generation failed' });
        } finally {
            set({ generating: false });
        }
    },

    /**
     * Trigger generation for a single BRD section.
     * Passes NLP input + custom prompt as additional context to the agent.
     */
    generateSection: async (sessionId, sectionId) => {
        set({ generatingSection: sectionId, error: null });
        try {
            if (typeof window !== "undefined") {
                localStorage.removeItem(`brd_approved_${sessionId}`);
            }
            set({ isApproved: false });

            const state = get();
            const nlpInput = state.nlpInput.trim();
            const customPrompt = state.customPrompts[sectionId]?.trim();
            const parts: string[] = [];
            if (customPrompt) parts.push(`USER PROMPT FOR THIS SECTION:\n${customPrompt}`);
            if (nlpInput) parts.push(`ADDITIONAL CONTEXT FROM USER DRAFT INPUT:\n${nlpInput}`);
            const additionalContext = parts.length > 0 ? parts.join('\n\n') : '';

            await generateBRDSection(sessionId, sectionId, additionalContext);
            // Reload the results
            await get().loadBRD(sessionId);
        } catch (e) {
            set({ error: e instanceof Error ? e.message : 'Generation failed' });
        } finally {
            set({ generatingSection: null });
        }
    },

    /**
     * Load existing BRD sections from the DB (does not re-generate).
     */
    loadBRD: async (sessionId) => {
        set({ loading: true, error: null });
        try {
            const data = await getBRD(sessionId);
            const approved = typeof window !== "undefined" ? localStorage.getItem(`brd_approved_${sessionId}`) === "true" : false;
            set({
                sections: sectionsFromAPI(data.sections, data.section_meta ?? {}),
                flags: data.flags,
                snapshotId: data.snapshot_id ?? get().snapshotId,
                isApproved: approved,
            });
        } catch (e) {
            set({ error: e instanceof Error ? e.message : 'Failed to load BRD' });
        } finally {
            set({ loading: false });
        }
    },

    /**
     * Save a human-edited section and lock it from AI overwrite.
     */
    updateSection: async (sessionId, sectionId, content) => {
        const { snapshotId } = get();
        if (!snapshotId) {
            set({ error: 'No snapshot ID — generate the BRD first.' });
            return;
        }
        set({ loading: true, error: null });
        try {
            await editBRDSection(sessionId, sectionId, content, snapshotId);
            // Optimistically update local state
            set((state) => ({
                sections: state.sections.map((s) =>
                    s.id === sectionId ? { ...s, content, lastEdited: new Date(), humanEdited: true } : s
                ),
            }));
        } catch (e) {
            set({ error: e instanceof Error ? e.message : 'Save failed' });
        } finally {
            set({ loading: false });
        }
    },

    /**
     * Mark a validation flag as acknowledged so the export page respects the user's decision.
     * key should be a stable composite: `${section_name}::${flag_type}::${description}`.
     */
    acknowledgeFlag: (key: string) => {
        set((state) => ({
            acknowledgedFlagKeys: state.acknowledgedFlagKeys.includes(key)
                ? state.acknowledgedFlagKeys
                : [...state.acknowledgedFlagKeys, key],
        }));
    },

    approveAll: async (sessionId) => {
        set({ loading: true, error: null });
        try {
            await approveBRD(sessionId);
            if (typeof window !== "undefined") {
                localStorage.setItem(`brd_approved_${sessionId}`, "true");
            }
            set({ isApproved: true });
            // Reload the BRD to clear the flags in the UI
            await get().loadBRD(sessionId);
        } catch (e) {
            set({ error: e instanceof Error ? e.message : 'Approve failed' });
        } finally {
            set({ loading: false });
        }
    },
}));
