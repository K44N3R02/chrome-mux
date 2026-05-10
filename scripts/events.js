import { Session } from './session.js';
import {
    getSuggestions,
    saveAndLoadNewSession
} from './actions.js';

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install') {
        await chrome.storage.local.set({
            activeSessionName: 'default',
            previousSessionName: 'default',
        });
        const session = new Session('default');
        await session.capture();
        await session.saveToLocalStorage();
    }
});

chrome.runtime.onStartup.addListener(async () => {
    const session = await Session.getActiveSession();
    await session.openSession();
});

chrome.omnibox.onInputChanged.addListener(async (input, suggest) => {
    await chrome.omnibox.setDefaultSuggestion({
        description: 'Enter a session name to save and switch to that session'
    });
    const sessionSuggestions = await getSuggestions(input);
    const suggestions = sessionSuggestions.map(({ item }) => {
        return { content: item, description: `Switch to ${item}` };
    });
    suggest(suggestions);
});

chrome.omnibox.onInputEntered.addListener(async (input) => {
    const sessionSuggestions = await getSuggestions(input);
    if (sessionSuggestions.length === 0) {
        return;
    }

    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    });
    await chrome.tabs.remove(tab.id);

    saveAndLoadNewSession(sessionSuggestions[0].item);
});
