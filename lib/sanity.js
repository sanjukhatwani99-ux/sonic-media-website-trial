// lib/sanity.js
// ─────────────────────────────────────────────────────────────────────────────
// Sanity client for The Sonic Media website.
//
// This is a plain browser ES module — no npm, no bundler, no build step.
// It loads @sanity/client directly from the esm.sh CDN, which re-exports
// the official package as a browser-compatible ES module.
//
// Your credentials (from sanity.config.ts):
//   projectId : azp8do9e
//   dataset   : production
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@sanity/client@6'

// ── Client ────────────────────────────────────────────────────────────────────

export const client = createClient({
  projectId:  'azp8do9e',
  dataset:    'production',
  apiVersion: '2024-01-01',   // pin to a past date — never changes behaviour
  useCdn:     true,           // true = fast CDN cache (perfect for published content)
})

// ── Image URL helper ──────────────────────────────────────────────────────────
// Converts a Sanity image reference object into a real CDN URL.
//
// Usage:
//   imageUrl(doc.featuredImage)                      → full-size URL
//   imageUrl(doc.featuredImage, { width: 800 })      → resized URL
//   imageUrl(doc.featuredImage, { width: 800, height: 450, quality: 80 })
//
// The URL format Sanity uses:
//   https://cdn.sanity.io/images/{projectId}/{dataset}/{id}-{dimensions}.{ext}
//   with optional query params: ?w=800&h=450&q=80&fit=crop&auto=format
export function imageUrl(imageAsset, { width, height, quality = 80 } = {}) {
  // Guard: return empty string if no asset reference is present
  if (!imageAsset?.asset?._ref) return ''

  // The _ref format is: "image-{id}-{WxH}-{ext}"
  // e.g. "image-abc123def456-1920x1080-jpg"
  const ref = imageAsset.asset._ref
  const parts = ref.split('-')
  // parts[0] = "image"
  // parts[1] = the file hash/id
  // parts[2] = dimensions like "1920x1080"
  // parts[3] = extension like "jpg" or "png" or "webp"
  const id   = parts[1]
  const dims = parts[2]
  const ext  = parts[3]

  const base = `https://cdn.sanity.io/images/azp8do9e/production/${id}-${dims}.${ext}`

  const params = new URLSearchParams()
  if (width)   params.set('w', String(width))
  if (height)  params.set('h', String(height))
  params.set('q', String(quality))
  params.set('fit', 'crop')
  params.set('auto', 'format')   // serves WebP to browsers that support it

  return `${base}?${params.toString()}`
}

// ── GROQ query helpers ────────────────────────────────────────────────────────
// Pre-built queries for the Case Studies page and homepage.
// Call these from your page scripts — they return plain JS objects/arrays.

// Card-level fields (used on listing grids)
const CARD_PROJECTION = `
  _id,
  title,
  "slug": slug.current,
  clientName,
  category,
  shortDescription,
  publishedDate,
  featured,
  featuredImage { asset, alt, caption }
`

// Full article fields (used when a case study is opened)
const FULL_PROJECTION = `
  ${CARD_PROJECTION},
  industry,
  services,
  galleryImages[]{ asset, alt, caption },
  challenge[]{ ..., markDefs[]{...} },
  solution[] { ..., markDefs[]{...} },
  results[]  { ..., markDefs[]{...} },
  technologies,
  projectUrl,
  completionDate,
  seoTitle,
  seoDescription
`

/**
 * Fetch all published case studies, newest first.
 * Used to populate the #page-casestudies-grid on casestudies.html.
 */
export async function fetchAllCaseStudies() {
  return client.fetch(
    `*[_type == "caseStudy"] | order(publishedDate desc) { ${CARD_PROJECTION} }`
  )
}

/**
 * Fetch up to `limit` case studies where featured == true, newest first.
 * Used for the homepage #home-casestudies-grid.
 * @param {number} limit - max number of items (default 4)
 */
export async function fetchFeaturedCaseStudies(limit = 4) {
  return client.fetch(
    `*[_type == "caseStudy" && featured == true] | order(publishedDate desc) [0...${limit}] { ${CARD_PROJECTION} }`
  )
}

/**
 * Fetch one case study with its full article content, by slug.
 * Used when a user clicks a card to open the article overlay.
 * @param {string} slug - the slug.current value, e.g. "d2c-growth-playbook"
 */
export async function fetchCaseStudyBySlug(slug) {
  return client.fetch(
    `*[_type == "caseStudy" && slug.current == $slug][0] { ${FULL_PROJECTION} }`,
    { slug }
  )
}

/**
 * Fetch all case studies in a given category, newest first.
 * Useful if you later want server-side filtering instead of client-side.
 * @param {string} category - one of: strategy, performance, seo, social, branding, technology
 */
export async function fetchCaseStudiesByCategory(category) {
  return client.fetch(
    `*[_type == "caseStudy" && category == $category] | order(publishedDate desc) { ${CARD_PROJECTION} }`,
    { category }
  )
}
