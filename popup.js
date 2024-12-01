const pdfjsLib = window['pdfjs-dist/build/pdf'];
console.log('pdfjslib===============>',pdfjsLib);
pdfjsLib.GlobalWorkerOptions.workerSrc = 'build/pdf.worker.min.js';
let sfn=null;
let ab=null;
let df=null;


document.addEventListener('DOMContentLoaded', () => {

  console.log('DOM is ready mf');
  const port = chrome.runtime.connect({ name: "popup-connection" });
  //dom ready hone k bad connect karwana to avoid confusions
  const suggestedTab = document.getElementById('suggestedTab');
  const defaultTab = document.getElementById('defaultTab');
  const saveButton = document.getElementById('saveButton');

  async function suggestFilenameFromContent(url) {
    try {
      const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch PDF.');
    }

      const arrayBuffer = await response.arrayBuffer();
      ab = arrayBuffer;
      if (defaultTab.classList.contains('active')) {
        console.log('ab is defined now you can save with default name');
        hideLoadingAndShowTextbox('default');
      }
      const typedArray = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument(typedArray);
      const pdf = await loadingTask.promise;
      let content = '';

      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();

      textContent.items.forEach(item => {
        content += item.str + ' ';
      });

      console.log(content);
      // Use Chrome's built-in AI to suggest a filename
      const { available } = await ai.languageModel.capabilities();
      if (available !== "no") {
        const session = await ai.languageModel.create({
          temperature: .8,topK:4,
           systemPrompt: `You are a AI based filename suggester.Go through the first page of the file and suggest a SINGLE suitable filename`
        });
        const result = await session.prompt(content);
        const suggestedFilename = result.replace(/\s+/g, '_') ;
        console.log('ANSWER---------->',suggestedFilename);

        sfn = suggestedFilename;
        if (suggestedTab.classList.contains('active')) {
          hideLoadingAndShowTextbox('suggested');
        }
        
      } else {
        throw new Error('AI model is not available');
      }
    } catch (error) {
      console.error('Failed to suggest filename from content:', error);
      throw error;
    }
  }

  function downloadfile(arrayBuffer,suggestedFilename){
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const objectURL = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectURL;
    console.log('blob url--->', a.href);
    a.download = suggestedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectURL);
}

  function hideLoadingAndShowTextbox(tab) {

    document.getElementById('loading-icon').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    if (tab == 'default') {

      document.getElementById('content').value = df;
    } else {
      document.getElementById('content').value = sfn;
    }
}

  function switchTab(tab) {
    if (tab === 'suggested') {
        suggestedTab.classList.add('active');
        defaultTab.classList.remove('active');
      if (sfn) {
        hideLoadingAndShowTextbox('suggested');
      }
      else {
        document.getElementById('loading-icon').style.display = 'block';
        document.getElementById('content').style.display = 'none';
      }
     
    } else {
        defaultTab.classList.add('active');
        suggestedTab.classList.remove('active');
      if (df) {
        hideLoadingAndShowTextbox('default');
        }
    }
}

  suggestedTab.addEventListener('click', () => switchTab('suggested'));
  defaultTab.addEventListener('click', () => switchTab('default'));


  saveButton.addEventListener('click', () => {
    try {
        if (suggestedTab.classList.contains('active') && ab && sfn) {
            console.log('Downloading file with suggested name:', sfn);
            downloadfile(ab, sfn);
        } else if (defaultTab.classList.contains('active') && ab && df) {
            console.log('Downloading file with default name:', df);
            downloadfile(ab,df);
        } else {
            console.error('No filename or data available for download.');
        }
    } catch (error) {
        console.error('Error during file download:', error);
    }
    });


  port.onMessage.addListener(async (message) => {
    console.log("Message from background script to popup:", message);
    try {
      df = message.filename;
      if (defaultTab.classList.contains('active')) { hideLoadingAndShowTextbox('default'); }
        suggestFilenameFromContent(message.url);
    } catch (err) {
        console.error("Error in handling message:", err);
    }
});


});
