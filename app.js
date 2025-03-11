let foundDefinitions = {};
let extraDefinitions = {};
let remainingWords = [];
let searchActive = false;

const frequencyData = {
    "the": 1, "be": 2, "to": 3, "and": 4, "of": 5,
    "cat": 500, "act": 700, "dog": 1000,
    "go": 1200, "do": 1500, "run": 2500,
    "apple": 5000, "zebra": 8000, "xylophone": 15000
};

let successfulSearches = 0;
let failedSearches = 0;

// Estimate word usage
function estimateUsagePercentage(word) {
    const rank = frequencyData[word.toLowerCase()];
    if (rank) {
        if (rank <= 1000) return 90;
        if (rank <= 2000) return 70;
        if (rank <= 3000) return 50;
        if (rank <= 5000) return 30;
        return 10;
    }
    return 5;
}

// Fetch definition with retry logic
async function fetchDefinition(word, retryCount = 3) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
    try {
        let response = await fetch(url);
        if (!response.ok) throw new Error(`No definition found for '${word}'`);

        let data = await response.json();
        if (data.length > 0) {
            return data[0]?.meanings[0]?.definitions[0]?.definition || null;
        }
        return null;
    } catch (error) {
        console.warn(`❌ Error fetching '${word}': ${error.message}`);
        if (retryCount > 0) {
            console.log(`🔄 Retrying for '${word}'...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Retry after 500ms
            return fetchDefinition(word, retryCount - 1);
        } else {
            failedSearches++;
            return null;
        }
    }
}

// Display search results
function updateResults(targetId, source) {
    const container = document.getElementById(targetId);
    container.innerHTML = Object.keys(source)
        .sort((a, b) => a - b)
        .map(length =>
            source[length]
                .map(entry => `<strong>${entry.word} (${length})</strong>: ${entry.definition} [Usage: ${entry.usage}%]`)
                .join("<br>")
        )
        .join("<br>");
}

// Update status
function updateStatus(message) {
    document.getElementById('status').innerText = message;
}

// Generate combinations
function getCombinations(string) {
    let results = new Set();

    function findCombinations(prefix, remaining) {
        if (prefix.length >= 2) results.add(prefix);
        for (let i = 0; i < remaining.length; i++) {
            findCombinations(prefix + remaining[i], remaining.slice(0, i) + remaining.slice(i + 1));
        }
    }

    findCombinations("", string);
    return Array.from(results);
}

// Add definition to results
function addDefinition(word, definition, target) {
    const length = word.length;
    if (!target[length]) target[length] = [];
    if (!target[length].some(entry => entry.word === word)) {
        target[length].push({
            word,
            definition,
            usage: estimateUsagePercentage(word)
        });
    }
}

// Start search
async function startSearch() {
    const input = document.getElementById("lettersInput").value.trim().toLowerCase();
    if (!input) {
        alert("Please enter some letters!");
        return;
    }

    successfulSearches = 0;
    failedSearches = 0;
    foundDefinitions = {};

    updateStatus("🔎 Starting search...");
    document.getElementById('loader').style.display = 'block';

    remainingWords = getCombinations(input);
    console.log(`💡 Total combinations generated: ${remainingWords.length}`);

    for (let word of remainingWords) {
        console.log(`🔍 Searching for: ${word}`);
        let definition = await fetchDefinition(word);
        if (definition) {
            addDefinition(word, definition, foundDefinitions);
            successfulSearches++;
            updateResults("result", foundDefinitions);
        } else {
            console.log(`❌ No definition found for: '${word}'`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    document.getElementById('loader').style.display = 'none';
    updateStatus(`✅ Search complete! Found: ${successfulSearches}, Failed: ${failedSearches}`);
}

// Extra search
async function extraSearch(length) {
    const wordsToSearch = remainingWords.filter(word => word.length === length);
    if (!wordsToSearch.length) {
        updateStatus(`No additional ${length}-letter words found.`);
        return;
    }

    updateStatus(`🔎 Searching for ${length}-letter words...`);
    document.getElementById('loader').style.display = 'block';

    for (let word of wordsToSearch) {
        console.log(`🔍 Extra search for: ${word}`);
        let definition = await fetchDefinition(word);
        if (definition) {
            addDefinition(word, definition, extraDefinitions);
            successfulSearches++;
            updateResults("extraResult", extraDefinitions);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    document.getElementById('loader').style.display = 'none';
    updateStatus(`✅ Extra search complete! Found: ${successfulSearches}, Failed: ${failedSearches}`);
}
