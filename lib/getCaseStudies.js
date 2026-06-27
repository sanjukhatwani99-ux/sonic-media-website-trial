// lib/getCaseStudies.js
// ─────────────────────────────────────────────────────────────────────────────
// Ready-to-use fetch functions for every case study display pattern on the site.
// Import whichever function you need — no other setup required.
//
// IMPORTANT: _type must be "caseStudy" (camelCase, singular) — this is the
// `name` field in schemaTypes/caseStudy.ts. "casestudies" would return nothing.
// ─────────────────────────────────────────────────────────────────────────────

import { client, imageUrl } from './sanity.js'

// ── 1. ALL CASE STUDIES ───────────────────────────────────────────────────────
// Returns every published case study, newest first.
// Used to populate the full grid on casestudies.html.

export async function getCaseStudies() {
  return client.fetch(`
    *[_type == "caseStudy"] | order(publishedDate desc) {
      _id,
      title,
      "slug": slug.current,
      clientName,
      category,
      shortDescription,
      publishedDate,
      featured,
      featuredImage {
        asset,
        alt,
        caption
      }
    }
  `)
}

// ── 2. SINGLE CASE STUDY BY SLUG ─────────────────────────────────────────────
// Returns one case study with its full article content.
// Call this when a user clicks a card to open the detail overlay.
//
// Usage:
//   const study = await getCaseStudyBySlug('d2c-growth-playbook')

export async function getCaseStudyBySlug(slug) {
  return client.fetch(`
    *[_type == "caseStudy" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      clientName,
      industry,
      category,
      services,
      shortDescription,
      publishedDate,
      completionDate,
      projectUrl,
      technologies,
      featured,
      featuredImage {
        asset,
        alt,
        caption
      },
      galleryImages[] {
        asset,
        alt,
        caption
      },
      challenge[] {
        ...,
        markDefs[] { ... }
      },
      solution[] {
        ...,
        markDefs[] { ... }
      },
      results[] {
        ...,
        markDefs[] { ... }
      },
      seoTitle,
      seoDescription
    }
  `, { slug })
}

// ── 3. FEATURED CASE STUDIES (for homepage) ───────────────────────────────────
// Returns up to `limit` case studies where the Featured toggle is ON.
// Used to populate the homepage #home-casestudies-grid.
//
// Usage:
//   const featured = await getFeaturedCaseStudies()      // default: 4 items
//   const featured = await getFeaturedCaseStudies(3)     // only 3 items

export async function getFeaturedCaseStudies(limit = 4) {
  return client.fetch(`
    *[_type == "caseStudy" && featured == true] | order(publishedDate desc) [0...$limit] {
      _id,
      title,
      "slug": slug.current,
      clientName,
      category,
      shortDescription,
      publishedDate,
      featuredImage {
        asset,
        alt,
        caption
      }
    }
  `, { limit })
}

// ── 4. CASE STUDIES BY CATEGORY (for filter buttons) ─────────────────────────
// Returns all case studies matching a specific category.
// Valid values: "strategy" | "performance" | "seo" | "social" | "branding" | "technology"
//
// Usage:
//   const seoStudies = await getCaseStudiesByCategory('seo')

export async function getCaseStudiesByCategory(category) {
  return client.fetch(`
    *[_type == "caseStudy" && category == $category] | order(publishedDate desc) {
      _id,
      title,
      "slug": slug.current,
      clientName,
      category,
      shortDescription,
      publishedDate,
      featuredImage {
        asset,
        alt,
        caption
      }
    }
  `, { category })
}

// ── IMAGE URL SHORTCUT ────────────────────────────────────────────────────────
// Re-exported here so you only need one import in your page scripts.
//
// Usage:
//   import { getCaseStudies, toImageUrl } from './lib/getCaseStudies.js'
//   const url = toImageUrl(study.featuredImage, { width: 800, height: 450 })
export { imageUrl as toImageUrl }
