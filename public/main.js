document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("tool-container");

  try {
    const response = await fetch("main_page/");
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const folders = Array.from(doc.querySelectorAll("a"))
      .map(link => link.getAttribute("href"))
      .filter(href => href.endsWith("/"));

    // Load metadata from tools.json
    const toolsMeta = await fetch("tools.json").then(res => res.json());

    for (const folder of folders) {
      const type = folder.replace("/", "");
      const res = await fetch(`main_page/${type}/`);
      const resText = await res.text();
      const innerDoc = parser.parseFromString(resText, "text/html");
      const tools = Array.from(innerDoc.querySelectorAll("a"))
        .map(link => link.getAttribute("href"))
        .filter(file => file.endsWith(".html"));

      const categoryDiv = document.createElement("div");
      categoryDiv.className = "category";
      categoryDiv.innerHTML = `<h2>${type.toUpperCase()}</h2>`;

      const ul = document.createElement("ul");
      ul.className = "tool-list";

      tools.forEach(tool => {
        const id = tool.replace(".html", "");
        const meta = toolsMeta[type]?.tools?.find(t => t.id === id);

        const name = meta?.name || id.replace(/_/g, " ");
        const icon = meta?.icon || "https://cdn-icons-png.flaticon.com/512/565/565547.png";

        const li = document.createElement("li");
        li.innerHTML = `
          <a href="tool.html?tool=${id}" style="text-decoration:none; color:inherit; display:flex; align-items:center; gap:10px;">
            <img src="${icon}" alt="${name}" style="width:24px; height:24px;">
            <span>${name}</span>
          </a>`;
        ul.appendChild(li);
      });

      categoryDiv.appendChild(ul);
      container.appendChild(categoryDiv);
    }
  } catch (error) {
    container.innerHTML = `<p>Error loading tools. Please try again later.</p>`;
    console.error(error);
  }
});
