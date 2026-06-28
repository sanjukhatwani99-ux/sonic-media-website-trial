// script.js — Case Studies page Sanity fetch
// Loaded only by casestudies.html (inline, after the grid element).
// Fetches the full structured case study schema (PART A format) from Sanity
// and delegates card-click handling to openCaseStudy() in app.js.

(async function initCaseStudiesPage() {
  const PROJECT_ID = 'jva6pfeq';
  const DATASET    = 'production';
  const API_VER    = '2024-01-01';

  // GROQ query — matches the updated caseStudy.ts field names (PART A + PART B)
  const query = encodeURIComponent(`*[_type == "caseStudy"] | order(publishedDate desc) {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    category,
    shortExcerpt,
    introBody,
    "heroImgUrl":    heroImage.asset->url + "?w=1200&auto=format",
    "heroCaption":   heroImage.caption,
    "heroAlt":       heroImage.alt,
    "secondImgUrl":  secondImage.asset->url + "?w=1200&auto=format",
    "secondCaption": secondImage.caption,
    "secondAlt":     secondImage.alt,
    "cardImg":       coalesce(featuredCardImage.asset->url, heroImage.asset->url) + "?w=800&auto=format",
    "clientOverviewBlocks": clientOverview[]{_type, style, listItem, children[]{text, marks, _type}},
    "challengeBlocks":      challenge[]{_type, style, listItem, children[]{text, marks, _type}},
    "strategyBlocks":       strategy[]{_type, style, listItem, children[]{text, marks, _type}},
    "timelineBlocks":       timeline[]{_type, style, listItem, children[]{text, marks, _type}},
    "executionBlocks":      execution[]{_type, style, listItem, children[]{text, marks, _type}},
    "resultsBlocks":        results[]{_type, style, listItem, children[]{text, marks, _type}},
    proofVisualNote,
    proofPerformance,
    testimonialQuote,
    testimonialAuthor,
    "faqItems":      faqItems[]{question, answer},
    ctaLine,
    publishedDate
  }`);

  const url = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VER}/data/query/${DATASET}?query=${query}`;

  let docs;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    docs = (data && data.result) ? data.result : [];
  } catch (e) {
    console.warn('[script.js] Sanity fetch failed:', e);
    return;
  }

  if (!docs.length) return;

  const CAT_ICON  = { strategy:'💡', performance:'🚀', seo:'🔍', social:'📣', branding:'🎨', technology:'⚙️', ai:'🤖', photo:'🎬', ecommerce:'🛒', influencer:'🤝' };
  const CAT_LABEL = { strategy:'Strategy', performance:'Performance', seo:'SEO', social:'Social Media', branding:'Branding', technology:'Technology', ai:'AI', photo:'Photo / Videography', ecommerce:'E-commerce', influencer:'Influencer' };

  // Convert Portable Text blocks → HTML (supports h3, bullet, number lists)
  function blocksToHtml(blocks) {
    if (!blocks || !blocks.length) return '';
    var html = '';
    var listState = null; // 'bullet' | 'number' | null

    function closeList() {
      if (listState === 'bullet')  { html += '</ul>'; listState = null; }
      if (listState === 'number')  { html += '</ol>'; listState = null; }
    }

    blocks.forEach(function(block) {
      if (block._type !== 'block') return;
      var inner = (block.children || []).map(function(child) {
        var txt = (child.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var marks = child.marks || [];
        if (marks.indexOf('strong') !== -1) txt = '<strong style="color:#FF5C00;">' + txt + '</strong>';
        if (marks.indexOf('em')     !== -1) txt = '<em>' + txt + '</em>';
        return txt;
      }).join('');

      var style    = block.style    || 'normal';
      var listItem = block.listItem || null;

      // Handle list items
      if (listItem === 'bullet') {
        if (listState !== 'bullet') { closeList(); html += '<ul style="margin:12px 0 12px 24px;color:rgba(245,240,235,.68);">'; listState = 'bullet'; }
        html += '<li style="margin-bottom:6px;">' + inner + '</li>';
        return;
      }
      if (listItem === 'number') {
        if (listState !== 'number') { closeList(); html += '<ol style="margin:12px 0 12px 24px;color:rgba(245,240,235,.68);">'; listState = 'number'; }
        html += '<li style="margin-bottom:6px;">' + inner + '</li>';
        return;
      }

      closeList();

      if (style === 'h2') { html += '<h2 style="font-family:Syne,sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:36px 0 14px;">' + inner + '</h2>'; return; }
      if (style === 'h3') { html += '<h3 style="font-family:Syne,sans-serif;font-size:17px;font-weight:700;color:#F5F0EB;margin:28px 0 10px;">' + inner + '</h3>'; return; }
      if (inner) html += '<p style="margin-bottom:18px;">' + inner + '</p>';
    });

    closeList();
    return html;
  }

  // Register each doc into app.js's caseStudies object in the new structured shape
  docs.forEach(function(doc) {
    const id = doc.slug || doc._id;
    if (!id) return;

    const dateStr = doc.publishedDate
      ? new Date(doc.publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';

    if (typeof caseStudies !== 'undefined') {
      caseStudies[id] = {
        // Card + header fields
        title:    doc.title    || 'Untitled',
        subtitle: doc.subtitle || '',
        category: CAT_LABEL[doc.category] || doc.category || '',
        date:     dateStr,

        // Legacy images array (overlay still reads images[0] and images[1])
        images: [
          { url: doc.heroImgUrl   || '', caption: doc.heroCaption   || '', alt: doc.heroAlt   || doc.title || '' },
          { url: doc.secondImgUrl || '', caption: doc.secondCaption || '', alt: doc.secondAlt || doc.subtitle || '' },
        ],

        // PART A structured content — rendered by openCaseStudy's new branch
        introBody:       doc.introBody        || '',
        clientOverview:  blocksToHtml(doc.clientOverviewBlocks),
        challengeHtml:   blocksToHtml(doc.challengeBlocks),
        strategyHtml:    blocksToHtml(doc.strategyBlocks),
        timelineHtml:    blocksToHtml(doc.timelineBlocks),
        executionHtml:   blocksToHtml(doc.executionBlocks),
        resultsHtml:     blocksToHtml(doc.resultsBlocks),
        proofVisualNote: doc.proofVisualNote   || '',
        proofPerformance:doc.proofPerformance  || '',
        testimonialQuote:doc.testimonialQuote  || '',
        testimonialAuthor:doc.testimonialAuthor|| '',
        faqItems:        doc.faqItems          || [],
        ctaLine:         doc.ctaLine           || '',

        // Signal to openCaseStudy that this entry uses the new format
        _format: 'structured',
      };
    }
  });

  // Build card HTML
  function buildCard(doc) {
    const id       = doc.slug || doc._id;
    const cat      = (doc.category || 'strategy').toLowerCase();
    const catLabel = CAT_LABEL[cat] || doc.category || '';
    const catIcon  = CAT_ICON[cat]  || '📊';
    const dateStr  = doc.publishedDate
      ? new Date(doc.publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    const img    = doc.cardImg || '';
    const excerpt = doc.shortExcerpt || '';

    return `<div class="jcard" onclick="openCaseStudy('${id}')" style="cursor:pointer;" data-cat="${cat}">
      <div class="jcard-img" style="position:relative;">
        <img src="${img}" alt="${doc.title || ''}" loading="lazy">
        <div style="position:absolute;top:10px;left:10px;width:32px;height:32px;border-radius:8px;background:rgba(8,8,8,.75);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:15px;" title="${catLabel}">${catIcon}</div>
      </div>
      <div class="jcard-body">
        <div class="jcard-meta">
          <div class="jcard-cat">${catLabel}</div>
          <div class="jcard-date">${dateStr}</div>
        </div>
        <div class="jcard-title">${doc.title || ''}</div>
        <div class="jcard-excerpt">${excerpt}</div>
        <div class="jcard-read">Read Article →</div>
      </div>
    </div>`;
  }

  // Overwrite the grid with fresh Sanity data
  const grid = document.getElementById('page-casestudies-grid');
  if (grid) {
    grid.innerHTML = docs.map(buildCard).join('');
  }
})();
