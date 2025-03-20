import { initializingFunctionsCommand, runDumpCommand } from './commands';

console.log(`start panel id ${chrome.runtime.id}`);

// chrome.runtime.onMessage.addListener(
//   function(message, sender, sendResponse) {
//     console.log('on message', message, sender, sendResponse);
//     // do what you want to the message
//     const body = document.querySelector("body");
//     console.log('body 2', body);
// });

// chrome.runtime.onMessageExternal.addListener(
//   function(request, sender, sendResponse) {
//     console.log('on message', request, sender, sendResponse);
//     const body = document.querySelector("body");
//     console.log('body 3', body);
// });

let interval: any;

const parseTreeChild = (data: any): string => {
  if (!data.children?.length) return '';
  const parsedHTML = data.children.map((child: any) => {
    if (!child.children?.length) {
      return `<li>${child.name}</li>`;
    }
    return `
      <span class="caret">${child.name}</span>
      <ul class="nested">
        ${parseTreeChild(child)}
      </ul>
    `;
  });
  return parsedHTML.join('');
};

const parseDataIntoHTMLTree = (data: any) => {
  return `
    <ul id="tree-list-view">
      <li>
        <span class="caret">${data.name}</span>
        <ul class="nested">
          ${parseTreeChild(data)}
        </ul>
      </li>
    </ul> 
  `;
};

const runStartButtonClick = () => {
  console.log('running eval');
  chrome.devtools.inspectedWindow.eval(
    initializingFunctionsCommand,
    (result, isException) => {
      if (isException?.isException) {
        console.error(`Exception: ${isException.value}`);
        return;
      }
      console.log('result', result);
    }
  );

  interval = setInterval(() => {
    console.log('interval start');
    chrome.devtools.inspectedWindow.eval(
      runDumpCommand,
      (result: any, isException) => {
        if (isException?.isException) {
          console.error(`Exception: ${isException.value}`);
          return;
        }
        console.log('result', result);
        if (contentWrapper && result) {
          contentWrapper.innerHTML = parseDataIntoHTMLTree(result);
          const togglers = document.getElementsByClassName('caret');

          for (let toggler of togglers) {
            toggler.addEventListener('click', function (this: Element) {
              this.parentElement?.querySelector('.nested')?.classList.toggle('active');
              this.classList.toggle('caret-down');
            });
          }
        }
      }
    );
  }, 3000);
};

const runStopButtonClick = () => {
  console.log('stopping script');
  clearInterval(interval);
  interval = null;
};

const startBtn = document.getElementById('start-button');
const contentWrapper = document.getElementById('content-wrapper');
const stopBtn = document.getElementById('stop-button');
startBtn?.addEventListener('click', runStartButtonClick);
stopBtn?.addEventListener('click', runStopButtonClick);
