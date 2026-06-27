// components/CaseStudies.js
// ─────────────────────────────────────────────────────────────────────────────
// Vanilla JS equivalent of the React component — no React, no JSX, no @/ paths.
// Works in your plain HTML website as a type="module" script.
//
// What it does (same as the React version, rewritten for the browser):
//   1. Fetches all case studies from Sanity on page load
//   2. Converts each document into a .jcard using your existing CSS classes
//   3. Injects the cards into #page-casestudies-grid
//   4. Wires up the filter buttons
//   5. Patches openCaseStudy() so clicking a card fetches the full article
// ─────────────────────────────────────────────────────────────────────────────

import { getCaseStudies, getCaseStudyBySlug, toImageUrl } from '../lib/getCaseStudies.js'

// ── Category icon map (matches your existing app.js) ─────────────────────────
const CAT_ICON = {
  strategy:    '💡',
  performance: '🚀',
  seo:         '🔍',
  social:      '📣',
  branding:    '🎨',
  technology:  '⚙️',
}

const CAT_LABEL = {
  strategy:    'Strategy',
  performance: 'Performance',
  seo:         'SEO',
  social:      'Social Media',
  branding:    'Branding',
  technology:  'Technology',
}

// ── Format ISO date → "May 18, 2026" ─────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Build one card (same HTML structure as your existing .jcard) ──────────────
function buildCard(study) {
  const slug     = study.slug
  const cat      = study.category || 'strategy'
  const catLabel = CAT_LABEL[cat] || cat
  const catIcon  = CAT_ICON[cat]  || '📊'
  const imgSrc   = toImageUrl(study.featuredImage, { width: 800, height: 450, quality: 80 })
  const date     = formatDate(study.publishedDate)

  const card = document.createElement('div')
  card.className  = 'jcard'
  card.dataset.cat = cat
  card.style.cursor = 'pointer'

  card.innerHTML = `
    <div class="jcard-img" style="position:relative;">
      <img src="${imgSrc}" alt="${study.featuredImage?.alt || study.title}" loading="lazy">
      <div style="position:absolute;top:10px;left:10px;width:32px;height:32px;
                  border-radius:8px;background:rgba(8,8,8,.75);backdrop-filter:blur(6px);
                  border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;
                  justify-content:center;font-size:15px;" title="${catLabel}">${catIcon}</div>
    </div>
    <div class="jcard-body">
      <div class="jcard-meta">
        <div class="jcard-cat">${catLabel}</div>
        <div class="jcard-date">${date}</div>
      </div>
      <div class="jcard-title">${study.title}</div>
      <div class="jcard-excerpt">${study.shortDescription || ''}</div>
      <div class="jcard-read">Read Full Case Study →</div>
    </div>`

  // Clicking opens the case study overlay (patched below to fetch from Sanity)
  card.addEventListener('click', () => window.openCaseStudy(slug))

  return card
}

// ── Portable Text → HTML (for Challenge / Solution / Results sections) ────────
function portableTextToHtml(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks.map(block => {
    if (block._type !== 'block') return ''
    const text = (block.children || []).map(span => {
      let t = span.text || ''
      if (span.marks?.includes('strong')) t = `<strong style="color:#FF5C00;">${t}</strong>`
      if (span.marks?.includes('em'))     t = `<em>${t}</em>`
      return t
    }).join('')
    switch (block.style) {
      case 'h2': return `<h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:32px 0 14px;">${text}</h2>`
      case 'h3': return `<h3 style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#F5F0EB;margin:24px 0 10px;">${text}</h3>`
      default:   return `<p>${text}</p>`
    }
  }).join('\n')
}

// ── Slug → full Sanity doc cache (avoids re-fetching on repeat opens) ─────────
const _cache = {}

// ── Patch window.openCaseStudy to fetch full content from Sanity ──────────────
// The original function in app.js reads from window.caseStudies[id].
// We intercept calls for Sanity slugs, fetch the full doc, shim it into
// window.caseStudies, then let the original function render as normal.
function patchOpenCaseStudy() {
  const _original = window.openCaseStudy

  window.openCaseStudy = async function(slug) {
    // If the slug is already in the hardcoded caseStudies object, use that
    if (window.caseStudies?.[slug]) {
      return _original.call(this, slug)
    }

    // Show a loading spinner in the overlay immediately
    _showLoader()

    // Fetch from Sanity (use cache if already fetched)
    if (!_cache[slug]) {
      try {
        const doc = await getCaseStudyBySlug(slug)
        if (!doc) { console.warn('[TSM] No Sanity doc for slug:', slug); return }
        _cache[slug] = doc
      } catch (err) {
        console.error('[TSM] Failed to fetch case study:', err)
        return
      }
    }

    const doc = _cache[slug]

    // Build images array (openCaseStudy reads [0] and [1])
    const images = []
    if (doc.featuredImage) {
      images.push({
        url:     toImageUrl(doc.featuredImage, { width: 1200, quality: 85 }),
        caption: doc.featuredImage.caption || doc.title,
      })
    }
    ;(doc.galleryImages || []).slice(0, 1).forEach(img => {
      images.push({
        url:     toImageUrl(img, { width: 1200, quality: 85 }),
        caption: img.caption || '',
      })
    })
    while (images.length < 2) images.push(images[0] || { url: '', caption: '' })

    // Build body HTML from Portable Text sections
    const body = [
      doc.challenge?.length ? `<h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:0 0 14px;">The Challenge</h2>${portableTextToHtml(doc.challenge)}` : '',
      doc.solution?.length  ? `<h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:32px 0 14px;">The Solution</h2>${portableTextToHtml(doc.solution)}`   : '',
      doc.results?.length   ? `<h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:32px 0 14px;">The Results</h2>${portableTextToHtml(doc.results)}`     : '',
    ].filter(Boolean).join('\n') || '<p>Full case study content coming soon.</p>'

    // Shim into window.caseStudies so the original openCaseStudy can render it
    if (!window.caseStudies) window.caseStudies = {}
    window.caseStudies[slug] = {
      title:    doc.title,
      subtitle: doc.shortDescription,
      category: CAT_LABEL[doc.category] || doc.category || '',
      date:     formatDate(doc.publishedDate),
      images,
      body,
    }

    _original.call(this, slug)
  }
}

// ── Loading spinner shown while fetching a full case study ────────────────────
function _showLoader() {
  if (!document.getElementById('cs-overlay')) {
    const el = document.createElement('div')
    el.id = 'cs-overlay'
    el.style.cssText = 'display:none;position:absolute;top:0;left:0;width:100%;z-index:99999;background:#080808;'
    document.documentElement.appendChild(el)
  }
  const overlay = document.getElementById('cs-overlay')
  overlay.innerHTML = `
    <style>
      .cs-load{display:flex;align-items:center;justify-content:center;min-height:100vh;}
      .cs-spin{width:40px;height:40px;border:3px solid rgba(255,92,0,.2);border-top-color:#FF5C00;
               border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 20px;}
      .cs-load-txt{font-family:'Syne',sans-serif;font-size:13px;color:rgba(245,240,235,.4);
                   letter-spacing:.1em;text-transform:uppercase;text-align:center;}
      @keyframes spin{to{transform:rotate(360deg)}}
    </style>
    <div class="cs-load">
      <div><div class="cs-spin"></div><div class="cs-load-txt">Loading…</div></div>
    </div>`
  overlay.style.display = 'block'
  document.documentElement.scrollTop = 0
  document.body.style.visibility = 'hidden'
}

// ── Main render function ──────────────────────────────────────────────────────
// Fetches all case studies and renders them into the grid.
// Call initCaseStudies() once from casestudies.html.
export async function initCaseStudies() {
  const grid = document.getElementById('page-casestudies-grid')
  if (!grid) return   // not on the case studies page

  try {
    const studies = await getCaseStudies()

    if (!studies?.length) {
      console.warn('[TSM] No case studies returned from Sanity.')
      return
    }

    // Clear any hardcoded placeholder content
    grid.innerHTML = ''

    // Render every card
    studies.forEach(study => grid.appendChild(buildCard(study)))

    // Also populate the homepage grid if it exists on this page
    const homeGrid = document.getElementById('home-casestudies-grid')
    if (homeGrid) {
      homeGrid.innerHTML = ''
      studies
        .filter(s => s.featured)
        .slice(0, 4)
        .forEach(study => homeGrid.appendChild(buildCard(study)))
    }

    // Patch openCaseStudy AFTER cards are rendered
    patchOpenCaseStudy()

    console.log(`[TSM] ✓ ${studies.length} case studies loaded from Sanity.`)

  } catch (err) {
    console.error('[TSM] initCaseStudies failed:', err)
    // Graceful degradation: app.js hardcoded cards remain visible
  }
}
