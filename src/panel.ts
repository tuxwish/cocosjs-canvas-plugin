import { initializingFunctionsCommand, runDumpCommand } from './commands';

const DEFAULT_UPDATE_TIME = 3000;

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

const parseElementClick = (event: any, item: any) => {
  console.log('parseElementClick', item);
  document.querySelectorAll('span.nested-name.selected').forEach((selectedItem: Element) => {
    selectedItem.classList.remove('selected');
  });
  chrome.devtools.inspectedWindow.eval(
    `
      (async () => {
        while (cc.find('Canvas').getChildByName('RedBorder')) {
          console.log('while');
          cc.find('Canvas').getChildByName('RedBorder').destroy();
          await window.delay(10);
        }
      })();
    `,
    (result: any, isException) => {
      if (isException?.isException) {
        console.error(`Exception: ${isException.value}`);
      }
    }
  );
  event.target.classList.add('selected');
  console.log(`test ${item.payload.fullPath} ${typeof item.payload.fullPath}`);
  console.log(`
    (async () => {
        await window.delay(500);
        selectedNode = cc.find('${item.payload.fullPath}');
        console.log('selectedNode', selectedNode, '${item.payload.fullPath}');
        showRedBorderOver(selectedNode);
      })();
    `);
  chrome.devtools.inspectedWindow.eval(
    `
      (async () => {
        await window.delay(500);
        selectedNode = cc.find('${item.payload.fullPath}');
        console.log('selectedNode', selectedNode, '${item.payload.fullPath}');
        showRedBorderOver(selectedNode);
      })();
    `,
    (result: any, isException) => {
      if (isException?.isException) {
        console.error(`Exception: ${isException.value}`);
      }
    }
  );
  if (propertiesPanelWrapper) {
    propertiesPanelWrapper.innerHTML = '';
    propertiesPanelWrapper.innerHTML = `
      <div id="payload-properties-table">
        ${Object.keys(item.payload).map((propertyKey) => `
          <div class="payload-properties-table-item">
            <div class="payload-properties-table-item-name">${propertyKey}:</div>
            <div class="payload-properties-table-item-value">${item.payload[propertyKey]}</div>
          </div>
        `).join('')}
      </div>`;
  }
}

const parseTreeChild = (data: any): any => {
  if (!data.children?.length) return;
  const listArray = data.children.map((child: any) => {
    const liElement = document.createElement('li');
    if (!child.children?.length) {
      const listEmptySpan = document.createElement('span');
      listEmptySpan.textContent = child.name;
      listEmptySpan.addEventListener('click', (event) => parseElementClick(event, child));
      liElement.appendChild(listEmptySpan);
    } else {
      const caretSpan = document.createElement('span');
      caretSpan.classList.add('caret');
      const span = document.createElement('span');
      span.classList.add('nested-name');
      span.textContent = child.name;
      span.addEventListener('click', (event) => parseElementClick(event, child));
      const nestedList = document.createElement('ul');
      nestedList.classList.add('nested');

      const nestedElements = parseTreeChild(child);
      nestedElements.forEach((nestedChild: any) => {
        nestedList.appendChild(nestedChild);
      });

      liElement.appendChild(caretSpan);
      liElement.appendChild(span);
      liElement.appendChild(nestedList);
    }
    return liElement;
  });
  return listArray;
};

const parseDataIntoHTMLTree = (data: any): HTMLUListElement => {
  const ulList = document.createElement('ul');
  ulList.id = "tree-list-view";
  const topLiElement = document.createElement('li');
  const topElementCaret = document.createElement('span');
  topElementCaret.classList.add('caret');
  topElementCaret.textContent = data.name;
  topLiElement.appendChild(topElementCaret);
  const nestedUlList = document.createElement('ul');
  nestedUlList.classList.add('nested');

  const listChilds = parseTreeChild(data);
  listChilds.forEach((listChild: any) => {
    nestedUlList.appendChild(listChild);    
  });

  topLiElement.appendChild(nestedUlList);
  ulList.appendChild(topLiElement);
  return ulList;
};

const runStartButtonClick = function (this: Element) {
  this.classList.toggle('active');
  stopBtn?.classList.toggle('active');

  interval = setInterval(() => {
    console.log('interval start');
    actionLoader?.classList.add('visible');
    chrome.devtools.inspectedWindow.eval(
      runDumpCommand,
      (result: any, isException) => {
        if (isException?.isException) {
          console.error(`Exception: ${isException.value}`);
          return;
        }
        console.log('result', result);
        if (treePanelWrapper && result) {
          treePanelWrapper.innerHTML = '';
          treePanelWrapper.appendChild(parseDataIntoHTMLTree(result));
          const togglers = document.getElementsByClassName('caret');

          for (let toggler of togglers) {
            toggler.addEventListener('click', function (this: Element) {
              this.parentElement?.querySelector('.nested')?.classList.toggle('active');
              this.classList.toggle('caret-down');
            });
          }
        }
        actionLoader?.classList.remove('visible');
      }
    );
  }, Number(intervalInput?.value) || DEFAULT_UPDATE_TIME);
};

const runStopButtonClick = function (this: Element) {
  console.log('stopping script');
  clearInterval(interval);
  interval = null;
  this.classList.toggle('active');
  startBtn?.classList.toggle('active');
};

const treePanelWrapper = document.getElementById('top-tree-panel-wrapper');
const propertiesPanelWrapper = document.getElementById('bottom-properties-panel-wrapper');
const startBtn = document.getElementById('start-button');
const stopBtn = document.getElementById('stop-button');
const intervalInput = document.getElementById('update-interval-time') as HTMLInputElement;
const actionLoader = document.getElementById('action-loader');

startBtn?.addEventListener('click', runStartButtonClick);
stopBtn?.addEventListener('click', runStopButtonClick);
if (intervalInput) {
  intervalInput.value = `${DEFAULT_UPDATE_TIME}`;
}

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
