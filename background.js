
let popupPort = null;
let screenwidth = null;
let screenheight = null;

// Fetch screen dimensions
chrome.system.display.getInfo((displays) => {
  const primaryDisplay = displays[0];
  screenwidth = primaryDisplay.workArea.width;
  screenheight = primaryDisplay.workArea.height;
});

// Listen for popup connections
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connection established');
  if (port.name === 'popup-connection') {
    popupPort = port;
  }
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  if (downloadItem.mime && downloadItem.mime.includes('pdf') && !downloadItem.url.startsWith('blob')) {
    // Attempt to cancel only if the download is "in progress"
    chrome.downloads.search({ id: downloadItem.id }, (results) => {
      const download = results[0];
      if (download && download.state === 'in_progress') {
        chrome.downloads.cancel(downloadItem.id, () => {
          if (chrome.runtime.lastError) {
            console.log('Error canceling download:', chrome.runtime.lastError.message);
          } else {
            console.log(`Blocked download of file: ${downloadItem.filename}`);
          }
        });
      } else {
        console.log('Download is not in progress, cannot cancel.');
      }
    });

    // Pass download data to the popup window
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
        height: 280,
        top: Math.round((screenheight - 280) / 2),
        left: Math.round((screenwidth - 406) / 2),
      },
      () => {
        setTimeout(() => {
          if (popupPort) {
            popupPort.postMessage(canceledDownloadData);
          } else {
            console.log('Popup port is not yet set up');
          }
        }, 1000);
      }
    );
  } else {
    // Allow the download to proceed
    console.log('Default behavior: download allowed');
  }
});



