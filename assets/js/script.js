async function getCaseStudies() {
  const query = `
    *[_type == "caseStudy"] | order(publishedDate desc){
      _id,
      title,
      shortDescription,
      projectUrl
    }
  `;

  const projectId = "jva6pfeq";
  const dataset = "production";

  const url = `https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.result;
}

function renderCaseStudies(items) {
  const container = document.getElementById("case-studies");

  container.innerHTML = items
    .map(
      (item) => `
      <div class="card">
        <h2>${item.title}</h2>
        <p>${item.shortDescription}</p>
        <a href="${item.projectUrl}" target="_blank">Open</a>
      </div>
    `
    )
    .join("");
}

async function init() {
  const data = await getCaseStudies();

  console.log("SANITY DATA:", data); // IMPORTANT CHECK

  renderCaseStudies(data);
}

init();
