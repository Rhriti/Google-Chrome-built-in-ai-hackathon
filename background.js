
// chrome.downloads.download({
//       url: `https://www.uscis.gov/sites/default/files/document/lesson-plans/Government_and_You_handouts.pdf`,
//       filename: 'x',
//     });


// chrome.downloads.onCreated.addListener((downloadItem) => {
// console.log(downloadItem);
// });

// Pause the download after a delay
// Pause 1 millisecound after the download starts


chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  console.log('download url -------->',downloadItem.url);
  if (downloadItem.mime && downloadItem.mime.includes('pdf') && !downloadItem.url.startsWith('blob') ) {
    chrome.downloads.cancel(downloadItem.id, () => {
      console.log(`Blocked download of file: ${downloadItem.filename}`);
    });

    const canceledDownloadData = {
      url: downloadItem.url,
      filename: downloadItem.filename,
      mime: downloadItem.mime,
    };
    // console.log(canceledDownloadData);

    chrome.windows.create(
      {
          url: chrome.runtime.getURL('popup.html'),
          type: 'popup',
          width: 300,
          height: 200,
          // left: Math.floor((window.screen.width - 400) / 2),
          // top: Math.floor((window.screen.height - 600) / 2)
      },
      () => {
          
        setTimeout(() => {
          const port = chrome.runtime.connect({ name: 'popup-connection' });
          port.postMessage({ canceledDownload: canceledDownloadData });

          port.onDisconnect.addListener(() => {
            console.log('Disconnected from popup');
          });
        }, 1000);

      });
  

  } else {
    // Allow the download
    console.log('default');
    // suggest();
  }
});




