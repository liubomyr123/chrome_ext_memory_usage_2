let interval = null;
let active_tab_id = null;
let is_popup_open = false;

chrome.runtime.onConnect.addListener((port) => {
    console.log('port:popup:connected', port);

    if (port.name === 'popup') {
        is_popup_open = true;
        if (!interval) {
            monitor_memory_usage();
        }

        port.onDisconnect.addListener(async () => {
            console.log('port:popup:disconnected', port);
            is_popup_open = false;
            if (interval) {
                clearInterval(interval)
                interval = null;
                await detach_debugger(active_tab_id);
            }
        });
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    if (interval) {
        clearInterval(interval)
        interval = null;
    }
    if (is_popup_open) {
        monitor_memory_usage();
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        if (interval) {
            clearInterval(interval)
            interval = null;
        }
        if (is_popup_open) {
            monitor_memory_usage();
        }
    }
});

async function detach_debugger(tabId) {
    try {
        await chrome.debugger.detach({ tabId });
        console.log('Debugger detached successfully for tab id:', tabId);
    } catch (err) {
        console.warn('No debugger attached or error detaching:', err);
    }
}

function monitor_memory_usage() {
    interval = setInterval(async () => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tab = tabs[0];
            active_tab_id = tab && tab.id || null;

            if (active_tab_id && tab && tab.url && !tab.url.startsWith("chrome://")) {

                await detach_debugger(active_tab_id);
                await chrome.debugger.attach(
                    { tabId: active_tab_id },
                    "1.3"
                );
                chrome.debugger.sendCommand({ tabId: active_tab_id }, "Performance.enable");
                const result = await chrome.debugger.sendCommand({ tabId: active_tab_id }, "Performance.getMetrics");

                console.log('result', result);

                const memory_metrics = result.metrics.filter(metric => metric.name.includes('JSHeap'));
                const memoryData = {
                    JSHeapUsedSize: memory_metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value || 0,
                    JSHeapTotalSize: memory_metrics.find(metric => metric.name === 'JSHeapTotalSize')?.value || 0,
                    dom_content_loaded: result.metrics.find(metric => metric.name === 'DomContentLoaded')?.value || 0,
                    frames: result.metrics.find(metric => metric.name === 'Frames')?.value || 0
                };

                if (is_popup_open) {
                    chrome.runtime.sendMessage({ memoryData });
                }
            } else {
                console.warn("Can not monitor chrome:// URL");
            }
        });
    }, 1_000);
}
