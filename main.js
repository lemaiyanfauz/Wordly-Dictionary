const $ = (id) => document.getElementById(id);
const searchForm = $('search-form'), wordInput = $('word-input'), resultDiv = $('result');
const savedEntries = $('saved-entries'), tabSearch = $('tab-search'), tabSaved = $('tab-saved');
const viewSearch = $('view-search'), viewSaved = $('view-saved');

const getSaved     = () => JSON.parse(localStorage.getItem('wordlySaved') || '[]');
const isSaved      = (w) => getSaved().some(e => e.word === w);
const persistSaved = (l) => localStorage.setItem('wordlySaved', JSON.stringify(l));
const saveEntry    = (entry) => { const l = getSaved().filter(e => e.word !== entry.word); l.unshift(entry); persistSaved(l.slice(0, 30)); };
const deleteEntry  = (w) => { persistSaved(getSaved().filter(e => e.word !== w)); renderSaved(); };
const clearAll     = () => { localStorage.removeItem('wordlySaved'); renderSaved(); };

const playAudio = (url, btn) => { 
    const audio = new Audio(url);
    btn.disabled = true;
    btn.innerHTML = '&#9646;&#9646; Playing...';

    audio.play(); 

    audio.onended = () => { 
        btn.disabled = false; 
        btn.innerHTML = '&#9654; Play Pronunciation'; 
    };
};

const buildCardHTML = (entry) => `
    <h2>${entry.word}</h2>
    ${entry.phonetic ? `<p class="phonetic"><em>${entry.phonetic}</em></p>` : ''}
${entry.audio ? `<button class="audio-btn" onclick="playAudio('${entry.audio}', this)" aria-label="Play pronunciation">Play Pronunciation</button>` : ''}    ${entry.meanings.map(m => `
        <div class="meaning">
            <strong>${m.partOfSpeech}</strong>
            <p>${m.definition}</p>
            ${m.example ? `<p class="example">Example: ${m.example}</p>` : ''}
            ${m.synonyms?.length ? `<p class="synonyms"><span>Synonyms:</span> ${m.synonyms.join(', ')}</p>` : ''}
        </div>`).join('')}
    ${entry.source ? `<p class="source">Source: <a href="${entry.source}" target="_blank" rel="noopener noreferrer">${entry.source}</a></p>` : ''}`;

const renderSaved = () => {
    const list = getSaved();
    if (!list.length) { savedEntries.innerHTML = '<p class="placeholder-text">No saved words yet.</p>'; return; }
    savedEntries.innerHTML = `
        <div class="saved-header">
            <p class="saved-count">${list.length} saved word${list.length > 1 ? 's' : ''}</p>
            <button class="clear-all-btn" onclick="clearAll()">Clear All</button>
        </div>
        ${list.map(e => `
            <div class="history-entry">
                <button class="delete-btn" onclick="deleteEntry('${e.word}')">Remove</button>
                ${buildCardHTML(e)}
            </div>`).join('')}`;
};

const fetchWord = async (e) => {
    e.preventDefault();
    const word = wordInput.value.trim();
    if (!word) { resultDiv.innerHTML = '<p class="error-text">Please enter a word.</p>'; return; }
    resultDiv.innerHTML = `<p class="placeholder-text">Searching for "${word}"...</p>`;
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!res.ok) throw new Error(`"${word}" not found. Check your spelling.`);
        const raw = (await res.json())[0];
        const entry = {
            word: raw.word,
            phonetic: raw.phonetic || raw.phonetics?.[0]?.text || '',
            audio: (raw.phonetics || []).find(p => p.audio)?.audio || '',
            source: raw.sourceUrls?.[0] || '',
            meanings: raw.meanings.map(m => ({
                partOfSpeech: m.partOfSpeech,
                definition: m.definitions[0]?.definition || 'No definition available.',
                example: m.definitions[0]?.example || '',
                synonyms: [...(m.synonyms || []), ...(m.definitions[0]?.synonyms || [])].slice(0, 6)
            }))
        };
        const saved = isSaved(entry.word);
        resultDiv.innerHTML = `${buildCardHTML(entry)}
            <button class="save-btn ${saved ? 'saved' : ''}" id="save-btn" onclick="handleSave()" ${saved ? 'disabled' : ''}>
                ${saved ? 'Saved' : 'Save Word'}
            </button>`;
        window._currentEntry = entry;
    } catch (err) {
        resultDiv.innerHTML = `<div class="error-box" role="alert"><p class="error-text">${err.message}</p></div>`;
    }
};

const handleSave = () => {
    if (!window._currentEntry) return;
    saveEntry(window._currentEntry);
    const btn = $('save-btn');
    if (btn) { btn.textContent = 'Saved'; btn.disabled = true; btn.classList.add('saved'); }
};

// Tab switching
const switchTab = (show, hide, showView, hideView) => {
    show.classList.add('active'); show.setAttribute('aria-selected', 'true');
    hide.classList.remove('active'); hide.setAttribute('aria-selected', 'false');
    showView.classList.remove('hidden'); hideView.classList.add('hidden');
};

tabSearch.addEventListener('click', () => switchTab(tabSearch, tabSaved, viewSearch, viewSaved));
tabSaved.addEventListener('click', () => { switchTab(tabSaved, tabSearch, viewSaved, viewSearch); renderSaved(); });
searchForm.addEventListener('submit', fetchWord);
