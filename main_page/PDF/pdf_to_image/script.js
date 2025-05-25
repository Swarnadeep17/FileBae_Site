document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("convert-form");
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");

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

    progressContainer.style.display = "block";
    progressBar.value = 0;

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://us-central1-filebae-13715.cloudfunctions.net/api/pdf-to-image");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          progressBar.value = percentComplete;
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "converted_images.zip";
          link.click();
          URL.revokeObjectURL(url);
        } else {
          alert("Conversion failed. Please try again.");
        }
        progressContainer.style.display = "none";
      };

      xhr.onerror = () => {
        alert("An error occurred during the upload. Please try again.");
        progressContainer.style.display = "none";
      };

      xhr.responseType = "blob";
      xhr.send(formData);
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.error(err);
      progressContainer.style.display = "none";
    }
  });
});
