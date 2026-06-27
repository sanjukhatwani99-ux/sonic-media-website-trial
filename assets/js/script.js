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
      featuredImage{
        asset->{url},
        alt,
        caption
      },
      services,
      completionDate,
      slug
    }
  `;

  const projectId = "jva6pfeq";
  const dataset = "production";

  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.result;
}

function renderCaseStudies(items) {
  const container = document.getElementById("case-studies");

  if (!items || items.length === 0) {
    container.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:40px 0;">No case studies found.</p>';
    return;
  }

  container.innerHTML = items.map((item) => {
    const imgUrl = item.featuredImage?.asset?.url
      ? `${item.featuredImage.asset.url}?w=800&h=500&fit=crop&auto=format`
      : 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop';

    const alt = item.featuredImage?.alt || item.title;
    const category = item.category || 'strategy';
    const services = item.services?.slice(0, 2).join(', ') || '';

    return `
      <article class="jnl-card" data-cat="${category}">
        <a href="${item.projectUrl || '#'}" target="_blank" rel="noopener noreferrer" class="jnl-card-img-wrap">
          <img src="${imgUrl}" alt="${alt}" class="jnl-card-img" loading="lazy" />
          <div class="jnl-card-overlay"></div>
          <span class="jnl-card-cat">${category}</span>
        </a>
        <div class="jnl-card-body">
          <div class="jnl-card-meta">
            <span>${item.clientName || ''}</span>
            ${services ? `<span>${services}</span>` : ''}
          </div>
          <h2 class="jnl-card-title">${item.title}</h2>
          <p class="jnl-card-excerpt">${item.shortDescription || ''}</p>
          <a href="${item.projectUrl || '#'}" target="_blank" rel="noopener noreferrer" class="jnl-card-read">
            View Project <span>→</span>
          </a>
        </div>
      </article>
    `;
  }).join('');
}

async function init() {
  const data = await getCaseStudies();
  console.log("SANITY DATA:", data);
  renderCaseStudies(data);
}

init();
