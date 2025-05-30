document.addEventListener('DOMContentLoaded', () => {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const resultContainer = document.getElementById('resultContainer');
  const imagePreview = document.getElementById('imagePreview');
  const downloadBtn = document.getElementById('downloadBtn');

  // Set up PDF.js worker path
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  // Handle drag and drop events
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#000';
    uploadArea.style.backgroundColor = '#f0f0f0';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#ccc';
    uploadArea.style.backgroundColor = '';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#ccc';
    uploadArea.style.backgroundColor = '';
    
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // Handle click on upload area
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  });

  // Handle download
  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = imagePreview.src;
    link.download = `converted-image-${Date.now()}.png`;
    link.click();
  });

  // Process PDF file
  async function handleFile(file) {
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    // Show progress bar
    uploadArea.style.display = 'none';
    progressContainer.style.display = 'block';
    updateProgress(5);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // Get first page
      
      updateProgress(30);
      
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
      
      updateProgress(80);
      
      // Convert to image
      const imageData = canvas.toDataURL('image/png');
      imagePreview.src = imageData;
      
      updateProgress(100);
      
      // Show results
      setTimeout(() => {
        progressContainer.style.display = 'none';
        resultContainer.style.display = 'block';
      }, 500);
      
    } catch (error) {
      console.error('Conversion error:', error);
      progressText.textContent = 'Error: ' + error.message;
      setTimeout(() => {
        resetConverter();
      }, 2000);
    }
  }

  function updateProgress(percent) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `Processing: ${percent}%`;
  }

  function resetConverter() {
    progressContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    resultContainer.style.display = 'none';
    fileInput.value = '';
    progressFill.style.width = '0%';
  }
});
