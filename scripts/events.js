import { Session } from './session.js';

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install') {
        await chrome.storage.local.set({ activeSessionName: 'default' });
        const session = new Session('default');
        await session.capture();
        await session.saveToLocalStorage();
    }
});

chrome.runtime.onStartup.addListener(async () => {
    const session = await Session.fromLocalStorage();
    await session.openSession();
});
