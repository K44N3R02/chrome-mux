import { Session } from './session.js';
import { fuzzySearch } from './fuzzy.js';

export async function getSuggestions(query) {
    const sessionList = (await chrome.storage.local.getKeys())
        .filter((elem) => !elem.endsWith('SessionName'));
    return fuzzySearch(sessionList, query);
}

export async function saveActiveSession() {
    const session = await Session.getActiveSession();
    await session.capture();
    await session.saveToLocalStorage();
}

export async function loadSession(sessionName) {
    const session = await Session.getFromLocalStorage(sessionName);
    await session.openSession();
}

export async function saveAndLoadNewSession(sessionName) {
    await saveActiveSession();
    await loadSession(sessionName);
}

export async function createNewSession(sessionName) {
    const { activeSessionName } = await chrome.storage.local.get('activeSessionName');
    console.log(activeSessionName);
    await chrome.storage.local.set({ previousSessionName: activeSessionName });

    const newSession = new Session(sessionName, []);
    await newSession.capture();
    await newSession.saveToLocalStorage();
    console.log(newSession);

    await chrome.storage.local.set({ activeSessionName: sessionName });
}

export async function quickSwitch() {
    const { previousSessionName } = await chrome.storage.local.get('previousSessionName');
    const session = await Session.getFromLocalStorage(previousSessionName);
    await session.openSession();
}
