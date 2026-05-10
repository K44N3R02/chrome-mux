import { Session } from './session.js';

const sessionListContainer = document.getElementById('session-list');
const ioArea = document.getElementById('io-area');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const copyBtn = document.getElementById('copy-btn');

async function renderSessions() {
    sessionListContainer.innerHTML = 'Loading sessions...';
    const allData = await chrome.storage.local.get(null);
    const sessionNames = Object.keys(allData).filter(key => !key.endsWith('SessionName'));

    if (sessionNames.length === 0) {
        sessionListContainer.innerHTML = 'No sessions found.';
        return;
    }

    sessionListContainer.innerHTML = '';
    for (const name of sessionNames) {
        const sessionData = allData[name];
        const session = Session.fromJSON(sessionData);
        const item = createSessionItem(session);
        sessionListContainer.appendChild(item);
    }
}

exportBtn.onclick = async () => {
    const allData = await chrome.storage.local.get(null);
    ioArea.value = JSON.stringify(allData, null, 2);
};

copyBtn.onclick = () => {
    ioArea.select();
    document.execCommand('copy');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = originalText, 2000);
};

importBtn.onclick = async () => {
    try {
        const data = JSON.parse(ioArea.value);
        if (confirm('This will OVERWRITE your current sessions. Are you sure?')) {
            await chrome.storage.local.clear();
            await chrome.storage.local.set(data);
            renderSessions();
            alert('Import successful!');
        }
    } catch (e) {
        alert('Invalid JSON: ' + e.message);
    }
};

function createSessionItem(session) {
    const div = document.createElement('div');
    div.className = 'session-item';

    const header = document.createElement('div');
    header.className = 'session-header';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'session-name';
    nameSpan.textContent = session.name;

    const actions = document.createElement('div');
    actions.className = 'session-actions';

    const renameBtn = document.createElement('button');
    renameBtn.textContent = 'Rename';
    renameBtn.onclick = () => renameSession(session.name);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteSession(session.name);

    const expandBtn = document.createElement('button');
    expandBtn.textContent = 'Expand';
    expandBtn.onclick = () => toggleExpand(session, div);

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(expandBtn);

    header.appendChild(nameSpan);
    header.appendChild(actions);
    div.appendChild(header);

    return div;
}

async function renameSession(oldName) {
    const newName = prompt('Enter new name for session:', oldName);
    if (!newName || newName === oldName) return;

    const data = await chrome.storage.local.get(oldName);
    if (data[oldName]) {
        const sessionData = data[oldName];
        sessionData.name = newName;
        
        const newData = {};
        newData[newName] = sessionData;
        
        await chrome.storage.local.set(newData);
        await chrome.storage.local.remove(oldName);

        // Update active/previous session names if they match
        const metadata = await chrome.storage.local.get(['activeSessionName', 'previousSessionName']);
        if (metadata.activeSessionName === oldName) {
            await chrome.storage.local.set({ activeSessionName: newName });
        }
        if (metadata.previousSessionName === oldName) {
            await chrome.storage.local.set({ previousSessionName: newName });
        }

        renderSessions();
    }
}

async function deleteSession(name) {
    if (!confirm(`Are you sure you want to delete session "${name}"?`)) return;
    
    await chrome.storage.local.remove(name);
    
    // If deleted active session, maybe reset it?
    const { activeSessionName } = await chrome.storage.local.get('activeSessionName');
    if (activeSessionName === name) {
        await chrome.storage.local.set({ activeSessionName: 'default' });
    }
    
    renderSessions();
}

function toggleExpand(session, container) {
    let details = container.querySelector('.session-details');
    if (details) {
        details.remove();
        container.querySelector('.session-actions button:last-child').textContent = 'Expand';
    } else {
        details = document.createElement('div');
        details.className = 'session-details';
        
        session.windowList.forEach((win, wIdx) => {
            const winDiv = document.createElement('div');
            winDiv.className = 'window-item';
            winDiv.textContent = `Window ${wIdx + 1} (${win.isIncognito ? 'Incognito' : 'Normal'})`;
            
            const tabList = document.createElement('ul');
            win.tabList.forEach(tab => {
                const tabLi = document.createElement('li');
                tabLi.className = 'tab-item';
                tabLi.textContent = tab.title || tab.url;
                tabLi.title = tab.url;
                tabList.appendChild(tabLi);
            });
            
            winDiv.appendChild(tabList);
            details.appendChild(winDiv);
        });
        
        container.appendChild(details);
        container.querySelector('.session-actions button:last-child').textContent = 'Collapse';
    }
}

renderSessions();
