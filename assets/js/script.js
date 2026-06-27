const CS_CAT_ICON = {
  'strategy':'💡',
  'performance':'🚀',
  'seo':'🔍',
  'social':'📣',
  'branding':'🎨',
  'technology':'⚙️'
};

async function getCaseStudies() {
  const query = `
    *[_type == "caseStudy"] | order(publishedDate desc){
      _id,
      title,
      shortDescription,
      projectUrl,
      category,
      clientName,
      industry,
      slug,
      completionDate,
      featuredImage{
        asset->{url},
        alt,
        caption
      },
      services,
      "challengeText": challenge[0].children[0].text,
      "solutionText": solution[0].children[0].text,
      "resultsText": results[0].children[0].text
    }
  `;

  const projectId = "jva6pfeq";
  const dataset = "production";
  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  const data = await res.json();
  return data.result || [];
}

function buildSanityJcard(item) {
  const imgUrl = item.featuredImage?.asset?.url
    ? `${item.featuredImage.asset.url}?w=800&h=500&fit=crop&auto=format`
    : 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop';

  const cat = (item.category || 'strategy').toLowerCase();
  const catLabel = item.category
    ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
    : 'Strategy';
  const catIcon = CS_CAT_ICON[cat] || '📊';
  const id = item.slug?.current || item._id;

  const date = item.completionDate
    ? new Date(item.completionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return `
    <div class="jcard" onclick="openSanityCase('${id}')" style="cursor:pointer;" data-cat="${cat}">
      <div class="jcard-img" style="position:relative;">
        <img src="${imgUrl}" alt="${item.featuredImage?.alt || item.title}" loading="lazy">
        <div style="position:absolute;top:10px;left:10px;width:32px;height:32px;border-radius:8px;background:rgba(8,8,8,.75);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:15px;" title="${catLabel}">${catIcon}</div>
      </div>
      <div class="jcard-body">
        <div class="jcard-meta">
          <div class="jcard-cat">${catLabel}</div>
          ${date ? `<div class="jcard-date">${date}</div>` : ''}
        </div>
        <div class="jcard-title">${item.title}</div>
        <div class="jcard-excerpt">${item.shortDescription || ''}</div>
        <div class="jcard-read">Read Full Case Study →</div>
      </div>
    </div>
  `;
}

// Store sanity data globally so openSanityCase can access it
window._sanityCaseStudies = {};

function openSanityCase(id) {
  const cs = window._sanityCaseStudies[id];
  if (!cs) return;

  if (!document.getElementById('cs-overlay')) {
    const shell = document.createElement('div');
    shell.id = 'cs-overlay';
    shell.style.cssText = 'display:none;position:absolute;top:0;left:0;width:100%;z-index:99999;background:#080808;';
    document.documentElement.appendChild(shell);
  }
  const overlay = document.getElementById('cs-overlay');

  const imgUrl = cs.featuredImage?.asset?.url
    ? `${cs.featuredImage.asset.url}?w=1200&h=675&fit=crop&auto=format`
    : 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80';

  const date = cs.completionDate
    ? new Date(cs.completionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
    : '';

  const services = cs.services?.join(', ') || cs.category || '';

  const bodyHtml = `
    ${cs.challengeText ? `<h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:32px 0 14px;">The Challenge</h2><p>${cs.challengeText}</p>` : ''}
    ${cs.solutionText ? `<h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:32px 0 14px;">The Solution</h2><p>${cs.solutionText}</p>` : ''}
    ${cs.resultsText ? `<h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#F5F0EB;margin:32px 0 14px;">Results</h2><p style="white-space:pre-line;">${cs.resultsText}</p>` : ''}
    ${cs.projectUrl ? `<p style="margin-top:32px;"><a href="${cs.projectUrl}" target="_blank" rel="noopener" style="color:#FF5C00;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;">View Live Project →</a></p>` : ''}
  `;

  const titleWords = cs.title.split(' ');
  const half = Math.ceil(titleWords.length / 2);

  overlay.innerHTML = `<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
.cs-nav{position:sticky;top:0;z-index:100;background:rgba(8,8,8,.93);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 48px;height:68px;display:flex;align-items:center;justify-content:space-between;}
.cs-brand{display:flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-size:14px;font-weight:800;letter-spacing:.04em;color:#F5F0EB;}
.cs-close{padding:8px 20px;border-radius:50px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(245,240,235,.6);font-family:'Syne',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.cs-close:hover{background:rgba(255,92,0,.15);border-color:rgba(255,92,0,.35);color:#FF5C00;}
.cs-hero{padding:90px 72px 72px;background:#0f0f0f;position:relative;overflow:hidden;}
.cs-hero::before{content:'';position:absolute;top:0;right:0;width:600px;height:600px;background:radial-gradient(circle,rgba(255,92,0,.07) 0%,transparent 70%);pointer-events:none;}
.cs-eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#FF5C00;margin-bottom:20px;}
.cs-eyebrow::before{content:'';width:22px;height:1.5px;background:#FF5C00;}
.cs-h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,7vw,100px);line-height:.92;letter-spacing:.02em;margin-bottom:16px;color:#F5F0EB;}
.cs-h1 span{color:#FF5C00;}
.cs-meta{font-family:'Syne',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;color:#666;text-transform:uppercase;}
.cs-body{max-width:960px;margin:0 auto;padding:72px 72px 100px;}
.cs-img-wrap{border-radius:16px;overflow:hidden;margin-bottom:14px;aspect-ratio:16/9;background:#161616;}
.cs-img-wrap img{width:100%;height:100%;object-fit:cover;display:block;}
.cs-img-cap{font-family:'Syne',sans-serif;font-size:12px;font-weight:600;color:rgba(245,240,235,.4);letter-spacing:.06em;margin-bottom:40px;padding-left:4px;}
.cs-article{font-size:17px;line-height:1.9;color:rgba(245,240,235,.72);font-weight:300;padding:44px;border-radius:16px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);}
.cs-article p{margin-bottom:20px;}
.cs-footer{border-top:1px solid rgba(255,255,255,.05);padding:32px 72px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;}
.cs-footer-copy{font-size:13px;color:#666;}
.cs-footer-copy span{color:#FF5C00;}
.cs-back{display:inline-flex;align-items:center;gap:8px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#FF5C00;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:gap .25s;background:none;border:none;}
.cs-back:hover{gap:14px;}
.cs-cta-band{background:#0f0f0f;border-top:1px solid rgba(255,92,0,.15);border-bottom:1px solid rgba(255,92,0,.15);padding:64px 72px;text-align:center;position:relative;overflow:hidden;}
.cs-cta-band::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:300px;background:radial-gradient(ellipse,rgba(255,92,0,.09) 0%,transparent 70%);pointer-events:none;}
.cs-cta-eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#FF5C00;margin-bottom:18px;}
.cs-cta-eyebrow::before{content:'';width:22px;height:1.5px;background:#FF5C00;}
.cs-cta-h{font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,5vw,68px);line-height:.95;letter-spacing:.02em;color:#F5F0EB;margin-bottom:16px;}
.cs-cta-h span{color:#FF5C00;}
.cs-cta-p{font-size:15px;line-height:1.75;color:rgba(245,240,235,.55);font-weight:300;max-width:480px;margin:0 auto 36px;}
.cs-cta-btn{display:inline-flex;align-items:center;gap:10px;background:#FF5C00;color:#fff;padding:16px 38px;border-radius:50px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;letter-spacing:.04em;text-decoration:none;position:relative;overflow:hidden;box-shadow:0 0 30px rgba(255,92,0,.4);transition:all .3s;}
.cs-cta-btn:hover{transform:translateY(-3px);box-shadow:0 0 50px rgba(255,92,0,.65);}
@media(max-width:768px){.cs-nav,.cs-footer{padding-left:20px;padding-right:20px;}.cs-hero{padding:60px 20px 48px;}.cs-body{padding:40px 20px 80px;}.cs-article{padding:28px;font-size:15px;}.cs-cta-band{padding:48px 24px;}}
</style>
<nav class="cs-nav">
  <div class="cs-brand"><img src="https://res.cloudinary.com/dq2nrpky0/image/upload/v1779787887/favicon_oalxfi.png" alt="The Sonic Media Logo" style="width:34px;height:34px;object-fit:contain;flex-shrink:0;" />THE SONIC MEDIA</div>
  <button class="cs-close" id="cs-close-btn">✕ Close</button>
</nav>
<div class="cs-hero">
  <div class="cs-eyebrow">${cs.clientName || cs.category || 'Case Study'}</div>
  <h1 class="cs-h1">${titleWords.slice(0, half).join(' ')}<br><span>${titleWords.slice(half).join(' ')}</span></h1>
  <div class="cs-meta">${date}${date && services ? ' &nbsp;·&nbsp; ' : ''}${services}${services ? ' &nbsp;·&nbsp; ' : ''}The Sonic Media</div>
</div>
<div class="cs-body">
  <div class="cs-img-wrap"><img src="${imgUrl}" alt="${cs.title}" loading="lazy"></div>
  ${cs.featuredImage?.caption ? `<div class="cs-img-cap">${cs.featuredImage.caption}</div>` : ''}
  <div class="cs-article">${bodyHtml}</div>
</div>
<div class="cs-cta-band">
  <div class="cs-cta-eyebrow">Ready to Grow?</div>
  <div class="cs-cta-h">Work With <span>The Sonic Media</span></div>
  <p class="cs-cta-p">Let's build your brand's next growth chapter together — strategy, content, performance, and technology under one roof.</p>
  <a class="cs-cta-btn" href="#" onclick="closeSanityCase();window.navigate&&window.navigate('contact');return false;">Get a Strategy Call →</a>
</div>
<div class="cs-footer">
  <div class="cs-footer-copy">© 2026 <span>The Sonic Media</span>. All rights reserved.</div>
  <button class="cs-back" id="cs-back-btn">← Back to Case Studies</button>
</div>`;

  overlay._returnScrollY = null;
  overlay._returnAnchor = null;

  const slug = cs.slug?.current || id;
  history.pushState({ sanityCaseStudy: id }, cs.title + ' — The Sonic Media', '/case-studies/' + slug);
  document.title = cs.title + ' — The Sonic Media';

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = 'https://thesonicmedia.com/case-studies/' + slug;

  overlay.style.display = 'block';
  document.documentElement.scrollTop = 0;
  document.body.style.visibility = 'hidden';

  ['cursor','cursor-follower','cursor-trail','mouse-glow'].forEach(function(eid) {
    var el = document.getElementById(eid);
    if (el) document.documentElement.appendChild(el);
  });
  if (window.lenis) { window.lenis.destroy(); window.lenis = null; }

  function closeHandler() { closeSanityCase(); }
  document.getElementById('cs-close-btn').addEventListener('click', closeHandler);
  document.getElementById('cs-back-btn').addEventListener('click', closeHandler);

  overlay._keyHandler = function(e) { if (e.key === 'Escape') closeSanityCase(); };
  document.addEventListener('keydown', overlay._keyHandler);
}

function closeSanityCase() {
  const overlay = document.getElementById('cs-overlay');
  if (!overlay || overlay.style.display === 'none') return;
  overlay.style.display = 'none';
  document.body.style.visibility = '';
  ['cursor','cursor-follower','cursor-trail','mouse-glow'].forEach(function(eid) {
    var el = document.getElementById(eid);
    if (el) document.body.appendChild(el);
  });
  if (window._initLenis) window._initLenis();
  if (overlay._keyHandler) { document.removeEventListener('keydown', overlay._keyHandler); overlay._keyHandler = null; }
  history.pushState({ sanityCaseStudy: null }, 'Case Studies — The Sonic Media', '/casestudies');
  document.title = 'Case Studies — The Sonic Media';
  let canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = 'https://thesonicmedia.com/casestudies';
}

async function init() {
  const items = await getCaseStudies();
  console.log("SANITY DATA:", items);

  if (!items || items.length === 0) return;

  // Store in global lookup for openSanityCase
  items.forEach(item => {
    const key = item.slug?.current || item._id;
    window._sanityCaseStudies[key] = item;
  });

  // Inject cards into the existing grid used by app.js
  const grid = document.getElementById('page-casestudies-grid');
  if (grid) {
    grid.innerHTML = items.map(item => buildSanityJcard(item)).join('');
  }

  // Also inject first 4 into home grid if present
  const homeGrid = document.getElementById('home-casestudies-grid');
  if (homeGrid) {
    homeGrid.innerHTML = items.slice(0, 4).map(item => buildSanityJcard(item)).join('');
  }
}

init();
