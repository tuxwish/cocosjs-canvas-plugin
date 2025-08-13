const tabId = chrome.runtime.id;
(async () => {
  await chrome.runtime.sendMessage(tabId, { data: 'test' })
})()

