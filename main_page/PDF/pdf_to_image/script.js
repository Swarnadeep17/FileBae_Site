document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("convert-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = form.querySelector('input[type="file"]');
    const split = form.querySelector('input[name="split"]').checked;
    const grayscale = form.querySelector('input[name="grayscale"]').checked;
    const ocr = form.querySelector('input[name="ocr"]').checked;

    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("split", split);
    formData.append("grayscale", grayscale);
    formData.append("ocr", ocr);

    try {
      const res = await fetch("https://us-central1-filebae-13715.cloudfunctions.net/api/pdf-to-image", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Conversion failed.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "converted_images.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.error(err);
    }
  });
});
