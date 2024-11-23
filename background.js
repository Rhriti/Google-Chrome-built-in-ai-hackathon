let popupPort=null;

chrome.runtime.onConnect.addListener((port) => {
  console.log('yeahhh');
  if (port.name === 'popup-connection') {
        console.log('connected to port');
        popupPort=port;
  }
});

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
  
    chrome.windows.create(
      {
          url: chrome.runtime.getURL('popup.html'),
          type: 'popup',
          width: 300,
          height: 200,
       
      },
      () => {
        //bhej ye message
          setTimeout(() => {
            if (popupPort){popupPort.postMessage(canceledDownloadData);}
            else{console.log('connection not set up yet');}
        }, 100);

      });
  
  } else {
    // Allow the download
    console.log('default');
    // suggest();
  }
});




