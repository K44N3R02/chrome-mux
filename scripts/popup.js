import { Session } from './session.js';
import { fuzzySearch } from './fuzzy.js';

let session = await Session.getActiveSession();

const sessionList = (await chrome.storage.local.getKeys())
    .filter((elem) => !elem.endsWith('SessionName'));

const heading = document.getElementById('heading');
const searchForm = document.getElementById('search-form');
const searchBar = document.getElementById('search');
const resultList = document.getElementById('search-results');
const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');
const loadWithoutSavingButton = document.getElementById('load-wo-save-button');
const quickSwitchButton = document.getElementById('quick-switch-button');
const showButton = document.getElementById('show-button');

async function onSaveButtonClicked() {
    await session.capture();
    await session.saveToLocalStorage();
}

async function onLoadButtonClicked() {
    if (searchBar.value.length === 0) {
        return;
    }

    const fuzzyResult = fuzzySearch(sessionList, searchBar.value);

    if (fuzzyResult.length === 0) {
        return;
    }

    await onEnterPressed();
}

async function onLoadWithoutSavingButtonClicked() {
    const fuzzyResult = fuzzySearch(sessionList, searchBar.value);

    if (fuzzyResult.length === 0) {
        return;
    }

    session = await Session.getFromLocalStorage(fuzzyResult[0].item);
    await session.openSession();
}

async function onQuickSwitchButtonClicked() {
    const { previousSessionName } = await chrome.storage.local.get("previousSessionName");
    session = await Session.getFromLocalStorage(previousSessionName);
    await session.openSession();
}

async function onShowButtonClicked() {
    const sessionInfo = document.getElementById('session-info');
    if (sessionInfo === null) {
        document.body.append(session.htmlElement());
    } else {
        sessionInfo.remove();
    }
}

function onSearchInputChanged() {
    const result = fuzzySearch(sessionList, searchBar.value);

    resultList.innerHTML = '';
    result.forEach((data) => {
        const elem = document.createElement('li');
        elem.textContent = data.item;
        resultList.append(elem);
    });
}

async function onEnterPressed() {
    const fuzzyResult = fuzzySearch(sessionList, searchBar.value);

    if (fuzzyResult.length > 0) {
        await session.capture();
        await session.saveToLocalStorage();

        const selectedSessionName = fuzzyResult[0].item;

        session = await Session.openOrCreateSession(selectedSessionName);
        await session.openSession();
        return;
    }

    const selectedSessionName = searchBar.value;

    await chrome.storage.local.set({ previousSessionName: session.name });
    session = await Session.openOrCreateSession(selectedSessionName);
    await chrome.storage.local.set({ activeSessionName: selectedSessionName });
    window.close();
}

searchForm.onsubmit = async (event) => {
    event.preventDefault();
    await onEnterPressed();
};

searchBar.oninput = onSearchInputChanged;
saveButton.onclick = onSaveButtonClicked;
loadButton.onclick = onLoadButtonClicked;
loadWithoutSavingButton.onclick = onLoadWithoutSavingButtonClicked;
quickSwitchButton.onclick = onQuickSwitchButtonClicked;
showButton.onclick = onShowButtonClicked;

onSearchInputChanged();
heading.innerHTML = `Chrome Mux: <i>${session.name}</i>`

