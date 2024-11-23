const pdfjsLib = window['pdfjs-dist/build/pdf'];
console.log(pdfjsLib);
pdfjsLib.GlobalWorkerOptions.workerSrc = 'build/pdf.worker.min.js';
let sfn=null;
let ab=null;

async function suggestFilenameFromContent(url) {
      try {
        const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF.');
      }
  
        const arrayBuffer = await response.arrayBuffer();
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
             systemPrompt: `JUST give me a single suitable title (not more than 10 words) after analyzing the content.Hint: you might find a suitable title in the starting few lines itself.`
          });
          const result = await session.prompt(content);
          const suggestedFilename = result.replace(/\s+/g, '_') ;
          console.log('ANSWER---------->',suggestedFilename);

          sfn=suggestedFilename;
          ab=arrayBuffer;
          document.getElementById('isme_dalo').textContent=suggestedFilename;
          
        } else {
          throw new Error('AI model is not available');
        }
      } catch (error) {
        console.error('Failed to suggest filename from content:', error);
        throw error;
      }
    }

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM is ready mf');
  const port = chrome.runtime.connect({ name: "popup-connection" });
  //dom ready hone k bad connect karwana to avoid confusions


  document.getElementById("click").addEventListener("click", () => {
    console.log("Button clicked");
    if (sfn && ab){downloadfile(ab,sfn);}
    else{console.log('either sfn or ab is null');}

});

  port.onMessage.addListener(async (message) => {
    console.log("Message from background script to popup:", message);
    try {
        suggestFilenameFromContent(message.url);
    } catch (err) {
        console.error("Error in handling message:", err);
    }
});


});

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