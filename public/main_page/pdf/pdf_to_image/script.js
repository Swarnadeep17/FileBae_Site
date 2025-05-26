document.getElementById("pdfForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const form = e.target;
  const progress = document.getElementById("progress");
  const result = document.getElementById("result");
  progress.style.display = "block";
  result.innerHTML = "";

  const formData = new FormData(form);
  try {
    const response = await fetch("https://us-central1-filebae-13715.cloudfunctions.net/pdf-to-image", {
      method: "POST",
      body: formData
    });
    const blob = await response.blob();

    if (blob.type.startsWith("application/zip")) {
      const url = URL.createObjectURL(blob);
      result.innerHTML = `<a href="${url}" download="images.zip">Download Images</a>`;
    } else {
      result.innerHTML = "Unexpected response format.";
    }
  } catch (err) {
    console.error(err);
    result.innerHTML = "Conversion failed. Please try again.";
  } finally {
    progress.style.display = "none";
  }
});
