// script.js — Case Studies page Sanity fetch
// Loaded only by casestudies.html (inline, after the grid element).
// Fetches from Sanity using the current schema field names and delegates
// card-click handling to openCaseStudy() defined in app.js, so the
// detail overlay is identical to the one shown on the homepage.

(async function initCaseStudiesPage() {
  const PROJECT_ID = 'jva6pfeq';
  const DATASET    = 'production';
  const API_VER    = '2024-01-01';

  const query = encodeURIComponent(`*[_type == "caseStudy"] | order(publishedDate desc) {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    category,
    shortExcerpt,
    "heroImgUrl":    heroImage.asset->url + "?w=1200&auto=format",
    "heroCaption":   heroImage.caption,
    "secondImgUrl":  secondImage.asset->url + "?w=1200&auto=format",
    "secondCaption": secondImage.caption,
    "cardImg":       heroImage.asset->url + "?w=800&auto=format",
    "bodyBlocks":    body[]{_type, style, children[]{text, marks, _type}},
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

  // Convert Portable Text blocks → HTML (same logic as app.js blocksToHtml)
  function blocksToHtml(blocks) {
    if (!blocks || !blocks.length) return '';
    return blocks.map(function(block) {
      if (block._type !== 'block') return '';
      var inner = (block.children || []).map(function(child) {
        var txt = (child.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var marks = child.marks || [];
        if (marks.indexOf('strong') !== -1) txt = '<strong style="color:#FF5C00;">' + txt + '</strong>';
        if (marks.indexOf('em')     !== -1) txt = '<em>' + txt + '</em>';
        return txt;
      }).join('');
      var style = block.style || 'normal';
      if (style === 'h2') return '<h2 style="font-family:Syne,sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:32px 0 14px;">' + inner + '</h2>';
      if (style === 'h3') return '<h3 style="font-family:Syne,sans-serif;font-size:17px;font-weight:700;color:#F5F0EB;margin:24px 0 10px;">' + inner + '</h3>';
      return inner ? '<p>' + inner + '</p>' : '';
    }).join('');
  }

  // Register each doc into app.js's caseStudies object so openCaseStudy() works
  docs.forEach(function(doc) {
    const id = doc.slug || doc._id;
    if (!id) return;

    const dateStr = doc.publishedDate
      ? new Date(doc.publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';

    // Store in the same legacy shape app.js expects
    if (typeof caseStudies !== 'undefined') {
      caseStudies[id] = {
        title:    doc.title    || 'Untitled',
        subtitle: doc.subtitle || '',
        category: CAT_LABEL[doc.category] || doc.category || '',
        date:     dateStr,
        images: [
          { url: doc.heroImgUrl   || '', caption: doc.heroCaption   || '' },
          { url: doc.secondImgUrl || '', caption: doc.secondCaption || '' },
        ],
        body: blocksToHtml(doc.bodyBlocks),
      };
    }
  });

  // Build card HTML using openCaseStudy (defined in app.js) so clicks work identically
  function buildCard(doc) {
    const id       = doc.slug || doc._id;
    const cat      = (doc.category || 'strategy').toLowerCase();
    const catLabel = CAT_LABEL[cat] || doc.category || '';
    const catIcon  = CAT_ICON[cat]  || '📊';
    const dateStr  = doc.publishedDate
      ? new Date(doc.publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    const img      = doc.cardImg || '';
    const excerpt  = doc.shortExcerpt || '';

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
