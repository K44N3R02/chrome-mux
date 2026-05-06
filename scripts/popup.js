function serializeTab(tab) {
    return `active: ${tab.active}\nid: ${tab.id}\nincognito: ${tab.incognito}\nindex: ${tab.index}\ntitle: ${tab.title}\nurl: ${tab.url}\nwindowId: ${tab.windowId}\n`;
}

function makeListItem(tab) {
    let li = document.createElement('li');
    li.innerHTML = serializeTab(tab).replaceAll('\n', '<br>');
    return li;
}

function makeWindowList(w) {
    let li = document.createElement('li');
    const type = w.incognito ? 'incognito' : 'normal';
    li.innerHTML = `${w.id} - ${type}<ul id=${w.id}></ul>`;
    return li;
}

const windows = await chrome.windows.getAll();
let listRoot = document.getElementById('root');

for (let w of windows) {
    let windowList = makeWindowList(w);
    listRoot.append(windowList);

    const tabs = await chrome.tabs.query({
        windowId: w.id,
    });

    for (let tab of tabs) {
        let item = makeListItem(tab);
        let windowList = document.getElementById(tab.windowId);
        windowList.append(item);
    }
}
