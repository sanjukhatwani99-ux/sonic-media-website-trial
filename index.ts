// schemaTypes/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Schema registry — import every document type here and export as an array.
// Sanity Studio reads this file automatically via sanity.config.ts.
// Add more types below as your CMS grows (e.g. blogPost, teamMember).
// ─────────────────────────────────────────────────────────────────────────────

import { caseStudy } from './caseStudy'

export const schemaTypes = [caseStudy]
