const port = chrome.runtime.connect({ name: 'popup' });

const memoryUsageContainer = document.getElementById('memory-usage');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.memoryData) {
    const memory = request.memoryData;

    memoryUsageContainer.innerHTML = `
          <p>Frames per second: ${(memory.frames)}</p>
          <em>
            This number indicates how many frames are shown each second. 
            A low number can make the page feel slow or jumpy when you interact with it. 
            Making animations simpler and reducing page complexity can help improve the smoothness of the experience.
          </em>
          <br />
          <br />

          <p>Total JS Heap Size: ${(memory.JSHeapTotalSize / 1048576).toFixed(2)} MB</p>
          <p>Used JS Heap Size: ${(memory.JSHeapUsedSize / 1048576).toFixed(2)} MB</p>
      `;
  }
});

/**
 *     Fort some reason dom_content_loaded show me 84-85 seconds
 *     <p>Page loading time: ${formatDOMLoaded(memory.dom_content_loaded)}</p>
          <em>
            This time was spent on loading and processing the HTML document. 
            This metric helps to understand when a user can start interacting with a web page
          </em>
          <br />
          <br />
 * 
 */

function formatDOMLoaded(value) {
  const seconds = Math.floor(value / 1000);
  const milliseconds = Math.round(value % 1000);
  return `${seconds} sec ${milliseconds} ms`;
}
