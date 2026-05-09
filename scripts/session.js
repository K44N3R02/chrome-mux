export class Session {
    constructor(name, windowList) {
        this.name = name;
        this.windowList = windowList;
    }

    async capture() {
        this.windowList = await captureState();
    }

    async openSession() {
        const currentWindows = await chrome.windows.getAll();
        this.windowList.forEach(async (w) => await w.open());
        currentWindows.forEach(async (w) => await chrome.windows.remove(w.id));
        const { activeSessionName } = await chrome.storage.local.get("activeSessionName");
        await chrome.storage.local.set({ previousSessionName: activeSessionName });
        await chrome.storage.local.set({ activeSessionName: this.name });
    }

    toJSON() {
        return {
            name: this.name,
            windowList: this.windowList.map(win => win.toJSON()),
        };
    }

    static fromJSON(json) {
        const windowList = (json.windowList || []).map(winJson => Window.fromJSON(winJson));
        return new Session(json.name, windowList);
    }

    static async getActiveSession() {
        const { activeSessionName } = await chrome.storage.local.get('activeSessionName');

        if (activeSessionName === undefined || activeSessionName === null) {
            return new Session('default', []);
        }

        return await Session.getFromLocalStorage(activeSessionName);
    }

    static async getFromLocalStorage(sessionName) {
        const json = await chrome.storage.local.get(sessionName);
        return Session.fromJSON(json[sessionName]);
    }

    async saveToLocalStorage() {
        const data = {};
        data[this.name] = this.toJSON();
        await chrome.storage.local.set(data);
    }

    htmlElement() {
        let sessionElement = document.createElement('div');
        sessionElement.id = 'session-info';

        let sessionTitle = document.createElement('h2');
        sessionTitle.textContent = this.name;
        sessionElement.append(sessionTitle);

        let sessionWindows = document.createElement('ul');

        for (let w of this.windowList) {
            let windowElement = w.htmlElement();
            sessionWindows.append(windowElement);
        }

        sessionElement.append(sessionWindows);

        return sessionElement;
    }
}

class Window {
    constructor(id, isFocused, isIncognito, activeTabIndex = 0, tabList = []) {
        this.id = id;
        this.isFocused = isFocused;
        this.isIncognito = isIncognito;
        this.tabList = tabList;
        this.activeTabIndex = activeTabIndex;
    }

    async open() {
        const chromeWindow = await chrome.windows.create({
            focused: this.isFocused,
            incognito: this.isIncognito,
        });

        if (chromeWindow === undefined) {
            alert('Unexpected Error: Window cannot be opened');
            return;
        }

        const [dummyTab] = await chrome.tabs.query({
            windowId: chromeWindow.id
        });

        this.tabList.entries().forEach(
            async ([i, t]) => await t.open(this.activeTabIndex === i,
                                           chromeWindow.id));

        await chrome.tabs.remove(dummyTab.id);
    }

    toJSON() {
        return {
            id: this.id,
            isFocused: this.isFocused,
            isIncognito: this.isIncognito,
            activeTabIndex: this.activeTabIndex,
            tabList: this.tabList.map(tab => tab.toJSON()),
        };
    }

    static fromJSON(json) {
        const tabList = (json.tabList || []).map(tabJson => Tab.fromJSON(tabJson));
        return new Window(
            json.id,
            json.isFocused,
            json.isIncognito,
            json.activeTabIndex,
            tabList
        );
    }

    htmlElement() {
        let li = document.createElement('li');
        const type = this.isIncognito ? 'incognito' : 'normal';
        li.innerHTML = `${this.id} - ${type}<ul></ul>`;
        const ul = li.querySelector('ul');

        for (const [index, tab] of this.tabList.entries()) {
            let elem = tab.htmlElement();
            if (index === this.activeTabIndex) {
                elem.style.color = 'green';
            }
            ul.append(elem);
        }

        return li;
    }
}

class Tab {
    /// scrollPosition and zoom has no effect yet.
    constructor(url, title, isPinned = false, scrollPosition = { x: 0, y: 0 }, zoom = 1) {
        this.url = url;
        this.title = title;
        this.isPinned = isPinned;
        this.scrollPosition = scrollPosition;
        this.zoom = zoom;
    }

    async open(isFocused, windowId) {
        chrome.tabs.create({
            active: isFocused,
            pinned: this.isPinned,
            url: this.url,
            windowId: windowId,
        });
    }

    serializeTab() {
        return `pinned: ${this.isPinned}<br>title: ${this.title}<br>url: ${this.url}`;
    }

    toJSON() {
        return {
            url: this.url,
            title: this.title,
            isPinned: this.isPinned,
            scrollPosition: this.scrollPosition,
            zoom: this.zoom,
        };
    }

    static fromJSON(json) {
        return new Tab(
            json.url,
            json.title,
            json.isPinned,
            json.scrollPosition,
            json.zoom
        );
    }

    htmlElement() {
        let li = document.createElement('li');
        li.innerHTML = this.serializeTab();
        return li;
    }
}

async function captureState() {
    const chromeWindows = await chrome.windows.getAll();
    chromeWindows.sort((a, b) => a.left !== b.left ? b.left - a.left : b.top - a.top);
    let result = [];

    for (let chromeWindow of chromeWindows) {
        let win = new Window(chromeWindow.id, chromeWindow.focused, chromeWindow.incognito);
        result.push(win);

        const chromeTabs = await chrome.tabs.query({
            windowId: chromeWindow.id,
        });
        chromeTabs.sort((a, b) => a.index - b.index);

        for (const chromeTab of chromeTabs) {
            let tab = new Tab(chromeTab.url, chromeTab.title, chromeTab.pinned);
            win.tabList.push(tab);
            if (chromeTab.active) {
                win.activeTabIndex = chromeTab.index;
            }
        }
    }

    return result;
}
