document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("fileTypeContainer");

  // List of available tool categories and their tools
  const structure = {
    PDF: ["pdf_to_image", "pdf_to_word"],
    Image: ["image_to_pdf", "image_to_word"]
  };

  for (let [type, tools] of Object.entries(structure)) {
    const section = document.createElement("div");
    section.innerHTML = `<h2>${type}</h2>`;
    tools.forEach(tool => {
      const link = document.createElement("a");
      link.href = `main_page/${type}/${tool}.html`;
      link.textContent = tool.replace(/_/g, " ").toUpperCase();
      link.className = "tool-link";
      section.appendChild(link);
    });
    container.appendChild(section);
  }
});
