console.log('inject script start', chrome.runtime.id);
const tabId = chrome.runtime.id;
(async () => {
  console.log('sending message', tabId);
  await chrome.runtime.sendMessage(tabId, { data: 'test' })
})()
console.log("injected");
