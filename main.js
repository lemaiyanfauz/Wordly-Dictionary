const searchBtn = document.getElementById('search-btn');
const wordInput = document.getElementById('word-input');
const resultDiv = document.getElementById('result');

const fetchWord = async () => {
    const word = wordInput.value.trim();
    if (!word) return;

    resultDiv.innerHTML = `<p class="placeholder-text">Searching for "${word}"...</p>`;

    try {   
        const response =await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        if (!response.ok) throw new Error("Word couldn't find that word. Check your spelling!");

        const data = await response.json();
        const entry = data[0];// Get the first result entry

        //Build the result content
        resultDiv.innerHTML = `
            <h2>${entry.word}</h2>
            <p class="phonetic"><em>${entry.phonetic || ''}</em></p>
            ${entry.meanings.map(m => `
                <div class="meaning">
                    <strong>${m.partOfSpeech}</strong>
                    <p>${m.definitions[0].definition}</p>
                    ${m.definitions[0].example ? `<p style="font-size: 0.9em; opacity: 0.7;">Example: ${m.definitions[0].example}</p>` : ''}
                </div>
            `).join('')}
            `;
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: red; text-align: center;">${error.message}</p>`;
        }

};

// Event listeners for button click and 'enter'key
searchBtn.addEventListener('click', fetchWord);
wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWord();
});