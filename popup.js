
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'build/pdf.worker.min.js';

let suggestedFilename = null;
let arrayBuffer = null;
let defaultFilename = null;

document.addEventListener('DOMContentLoaded', () => {
  const port = chrome.runtime.connect({ name: "popup-connection" });
  const suggestedTab = document.getElementById('suggestedTab');
  const defaultTab = document.getElementById('defaultTab');
  const saveButton = document.getElementById('saveButton');
  const errorMessage = document.getElementById('error-message');

  // Utility Functions
  const toggleLoading = (show) => {
    document.getElementById('loading-icon').style.display = show ? 'block' : 'none';
    document.getElementById('content').style.display = show ? 'none' : 'block';
  };

  const updateTextboxContent = (content) => {
    document.getElementById('content').value = content;
  };

  const triggerError = () => {
    saveButton.classList.add('error');
    errorMessage.style.display = 'block';
    setTimeout(() => {
      saveButton.classList.remove('error');
      errorMessage.style.display = 'none';
    }, 1500);
  };

  const downloadFile = (buffer, filename) => {
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  // Business Logic
  const suggestFilenameFromContent = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch PDF.');

      arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const content = textContent.items.map((item) => item.str).join(' ');

      const aiCapabilities = await ai.languageModel.capabilities();
      if (aiCapabilities.available !== "no") {
        const session = await ai.languageModel.create({
          temperature: 0.8,
          topK: 3,
          systemPrompt: `You are an AI-based filename suggester. Suggest a SINGLE suitable filename based on the first page of a PDF, no longer than 10 words.`,
        });
        suggestedFilename = (await session.prompt(content)).replace(/\s+/g, '_');
        if (suggestedTab.classList.contains('active')) {
          toggleLoading(false);
          updateTextboxContent(suggestedFilename);
        }
      } else {
        throw new Error('AI model is not available');
      }
    } catch (error) {
      console.error('Error suggesting filename:', error);
      throw error;
    }
  };

  const switchTab = (tab) => {
    suggestedTab.classList.toggle('active', tab === 'suggested');
    defaultTab.classList.toggle('active', tab === 'default');

    if (tab === 'suggested') {
      if (suggestedFilename) {
        toggleLoading(false);
        updateTextboxContent(suggestedFilename);
      } else {
        toggleLoading(true);
      }
    } else if (tab === 'default') {
      if (defaultFilename) {
        toggleLoading(false);
        updateTextboxContent(defaultFilename);
      }
    }
  };

  // Event Listeners
  suggestedTab.addEventListener('click', () => switchTab('suggested'));
  defaultTab.addEventListener('click', () => switchTab('default'));

  saveButton.addEventListener('click', () => {
    try {
      if (suggestedTab.classList.contains('active') && arrayBuffer && suggestedFilename) {
        downloadFile(arrayBuffer, suggestedFilename);
      } else if (defaultTab.classList.contains('active') && arrayBuffer && defaultFilename) {
        downloadFile(arrayBuffer, defaultFilename);
      } else {
        triggerError();
      }
    } catch (error) {
      console.error('Error during file download:', error);
    }
  });

  port.onMessage.addListener(async (message) => {
    try {
      defaultFilename = message.filename;
      if (defaultTab.classList.contains('active')) {
        toggleLoading(false);
        updateTextboxContent(defaultFilename);
      }
      await suggestFilenameFromContent(message.url);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
});
