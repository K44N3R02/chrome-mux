import {
    getSuggestions,
    saveActiveSession,
    loadSession,
    saveAndLoadNewSession,
    createNewSession,
    quickSwitch,
} from './actions.js';

const heading = document.getElementById('heading');
const searchForm = document.getElementById('search-form');
const searchBar = document.getElementById('search');
const resultList = document.getElementById('search-results');
const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');
const loadWithoutSavingButton = document.getElementById('load-wo-save-button');
const quickSwitchButton = document.getElementById('quick-switch-button');
const showButton = document.getElementById('show-button');
const settingsButton = document.getElementById('settings-button');

async function onLoadButtonClicked() {
    if (searchBar.value.length === 0) {
        return;
    }

    const suggestions = await getSuggestions(searchBar.value);

    if (suggestions.length === 0) {
        return;
    }

    await saveAndLoadNewSession(suggestions[0].item);
}

async function onLoadWithoutSavingButtonClicked() {
    const suggestions = await getSuggestions(searchBar.value);

    if (suggestions.length === 0) {
        return;
    }

    loadSession(suggestions[0].item);
}

async function onShowButtonClicked() {
    const sessionInfo = document.getElementById('session-info');
    if (sessionInfo === null) {
        document.body.append(session.htmlElement());
    } else {
        sessionInfo.remove();
    }
}

async function onSearchInputChanged() {
    const suggestions = await getSuggestions(searchBar.value);

    resultList.innerHTML = '';
    suggestions.forEach((data) => {
        const elem = document.createElement('li');
        elem.textContent = data.item;
        resultList.append(elem);
    });
}

async function onEnterPressed() {
    const suggestions = await getSuggestions(searchBar.value);
    console.log(suggestions);

    if (suggestions.length > 0) {
        saveAndLoadNewSession(suggestions[0].item);
        return;
    }

    await createNewSession(searchBar.value);
    window.close();
}

searchForm.onsubmit = async (event) => {
    event.preventDefault();
    await onEnterPressed();
};

searchBar.oninput = onSearchInputChanged;
saveButton.onclick = saveActiveSession;
loadButton.onclick = onLoadButtonClicked;
loadWithoutSavingButton.onclick = onLoadWithoutSavingButtonClicked;
quickSwitchButton.onclick = quickSwitch;
showButton.onclick = onShowButtonClicked;
settingsButton.onclick = async () => {
    if (chrome.runtime.openOptionsPage) {
        await chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('html/settings.html'));
    }
};

onSearchInputChanged();

const { activeSessionName } = await chrome.storage.local.get("activeSessionName");
heading.innerHTML = `Chrome Mux: <i>${activeSessionName}</i>`

