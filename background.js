let popupPort=null;
let screenwidth=null;
let screenheight=null;

chrome.system.display.getInfo((displays) => {
  const primaryDisplay = displays[0];
  screenwidth = primaryDisplay.workArea.width;
  screenheight = primaryDisplay.workArea.height;
});

chrome.runtime.onConnect.addListener((port) => {
  console.log('yeahhh');
  if (port.name === 'popup-connection') {
        console.log('connected to port');
        popupPort=port;
  }
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  
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
          width: 406,
          height: 244,
          top:Math.round((screenheight-200)/2),
          left:Math.round((screenwidth-300)/2)
       
      },
      () => {
        //bhej ye message
          setTimeout(() => {
            if (popupPort){popupPort.postMessage(canceledDownloadData);}
            else{console.log('connection not set up yet');}
        }, 1000);

      });
  
  } else {
    // Allow the download
    console.log('default');
  
  }
});




