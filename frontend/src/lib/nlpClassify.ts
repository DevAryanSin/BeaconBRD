/**
 * NLP classification utility — maps freeform user input to BRD sections
 * using keyword matching. No external API calls; runs entirely client-side.
 */

export const SECTION_KEYWORDS: Record<string, { keywords: string[]; label: string }> = {
    executive_summary: {
        label: 'Executive Summary',
        keywords: [
            'project', 'overview', 'summary', 'objective', 'goal', 'purpose',
            'vision', 'mission', 'initiative', 'program', 'about', 'background',
            'introduction', 'what is', 'describe', 'scope',
        ],
    },
    functional_requirements: {
        label: 'Functional Requirements',
        keywords: [
            'feature', 'function', 'requirement', 'capability', 'user', 'login',
            'register', 'form', 'search', 'filter', 'CRUD', 'API', 'endpoint',
            'workflow', 'process', 'upload', 'download', 'notification',
            'dashboard', 'report', 'manage', 'create', 'edit', 'delete', 'view',
            'access', 'interface', 'screen', 'page', 'module', 'action',
            'button', 'field', 'input', 'validation', 'permission', 'role',
            'auth', 'payment', 'checkout', 'cart', 'order', 'message', 'chat',
            'comment', 'like', 'share', 'follow', 'subscribe', 'export', 'import',
        ],
    },
    stakeholder_analysis: {
        label: 'Stakeholder Analysis',
        keywords: [
            'stakeholder', 'team', 'customer', 'client', 'sponsor', 'manager',
            'developer', 'designer', 'admin', 'role', 'responsibility',
            'approver', 'reviewer', 'contributor', 'department', 'organization',
            'people', 'who', 'owner', 'actor', 'persona', 'user group',
        ],
    },
    timeline: {
        label: 'Timeline & Milestones',
        keywords: [
            'timeline', 'schedule', 'milestone', 'deadline', 'date', 'quarter',
            'sprint', 'release', 'launch', 'phase', 'duration', 'week', 'month',
            'year', 'Q1', 'Q2', 'Q3', 'Q4', 'ETA', 'delivery', 'when', 'start',
            'end', 'plan', 'roadmap', 'iter', 'iteration', 'cycle',
        ],
    },
    decisions: {
        label: 'Key Decisions',
        keywords: [
            'decision', 'decided', 'chosen', 'policy', 'rule', 'constraint',
            'standard', 'architecture', 'technology', 'stack', 'approach',
            'methodology', 'framework', 'platform', 'chosen', 'selected',
            'approved', 'agreed', 'confirmed', 'mandate', 'governance',
        ],
    },
    assumptions: {
        label: 'Assumptions & Constraints',
        keywords: [
            'assumption', 'constraint', 'limitation', 'risk', 'depend',
            'prerequisite', 'assume', 'unless', 'provided', 'condition',
            'external', 'third-party', 'vendor', 'dependency', 'rely',
            'assumed', 'constraint', 'boundary', 'limit', 'restriction',
            'dependence', 'rely on', 'assumed',
        ],
    },
    success_metrics: {
        label: 'Success Metrics',
        keywords: [
            'metric', 'KPI', 'measure', 'success', 'target', 'goal',
            'benchmark', 'SLA', 'threshold', 'percentage', 'rate', 'performance',
            'ROI', 'adoption', 'engagement', 'conversion', 'how much', 'how many',
            'measurement', 'outcome', 'indicator', 'dashboar', 'analytics',
            'track', 'monitor', 'report', 'dashboard',
        ],
    },
};

/**
 * Classify freeform text against BRD sections.
 * Returns a score (0–1) for each section based on keyword overlap.
 */
export function classifyNLPInput(text: string): Record<string, number> {
    if (!text || text.trim().length < 3) {
        return Object.fromEntries(Object.keys(SECTION_KEYWORDS).map((k) => [k, 0]));
    }

    const lower = text.toLowerCase();
    // Tokenize: split on whitespace and punctuation, keep words >= 2 chars
    const tokens = new Set(
        lower
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length >= 2)
    );

    const scores: Record<string, number> = {};
    for (const [sectionId, { keywords }] of Object.entries(SECTION_KEYWORDS)) {
        let matched = 0;
        for (const kw of keywords) {
            const kwLower = kw.toLowerCase();
            // Check if the keyword appears as a whole word in the text
            const regex = new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(lower)) {
                matched++;
            }
            // Also check if any token matches the keyword
            for (const token of Array.from(tokens)) {
                if (token === kwLower || token.startsWith(kwLower) || kwLower.startsWith(token)) {
                    matched = Math.max(matched, 1);
                }
            }
        }
        // Normalize: score = matched / max(keywords * 0.3, 1) so a single strong match gives ~0.3+
        const maxPossible = Math.max(keywords.length * 0.3, 1);
        scores[sectionId] = Math.min(matched / maxPossible, 1);
    }

    return scores;
}

/**
 * Get section IDs sorted by relevance score (descending), filtered to only sections with score > 0.
 */
export function getTopSections(scores: Record<string, number>, minScore: number = 0.05): string[] {
    return Object.entries(scores)
        .filter(([, score]) => score > minScore)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);
}

/**
 * Default prompts for each BRD section.
 * These are passed as additional_context to the backend agents.
 */
export type SectionKey = keyof typeof SECTION_KEYWORDS;

export const DEFAULT_PROMPTS: Record<string, string> = {
    executive_summary:
        'Provide a concise 3-5 paragraph overview of the project, its objectives, key stakeholders, major constraints, and overall direction.',
    functional_requirements:
        'Generate numbered functional requirements (FR-001, FR-002...) grouped by theme. Each requirement must include: description, acceptance criteria, priority (High/Medium/Low), and dependencies.',
    stakeholder_analysis:
        'Identify all stakeholders mentioned in the communications. For each: note their apparent role, key concerns/preferences, and influence level based on communication volume.',
    timeline:
        'Extract project milestones and deadlines. Group by phase. Include milestone name, date/timeframe, deliverable, and dependencies. Only use dates explicitly mentioned.',
    decisions:
        'Compile business rules and key decisions. Each rule must include: Rule ID (BR-001...), rule statement, category, enforcement mechanism, and priority.',
    assumptions:
        'List project assumptions (mark AI-inferred ones) and risks. Each assumption: ID, description, basis, validation method. Each risk: ID, description, likelihood, impact, mitigation, owner.',
    success_metrics:
        'Derive measurable success criteria from requirements and decisions. Group by category (User Satisfaction, Performance, Business Impact, Quality). Include metric ID, definition, measurement method, and target values.',
};
