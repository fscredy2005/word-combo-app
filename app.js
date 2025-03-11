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

async function fetchDefinition(word) {
  try {
    let response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) throw new Error("No definition found");
    let data = await response.json();
    return data[0]?.meanings[0]?.definitions[0]?.definition || null;
  } catch (error) {
    return null;
  }
}

function updateResults(targetId, source) {
  const container = document.getElementById(targetId);
  container.innerHTML = Object.keys(source)
    .sort((a, b) => a - b)
    .map(length =>
      source[length].map(
        entry => `<strong>${entry.word} (${length})</strong>: ${entry.definition} [Usage: ${entry.usage}%]`
      ).join("<br>")
    ).join("<br>");
}

async function startSearch() {
  const input = document.getElementById("lettersInput").value.trim().toLowerCase();
  remainingWords = getCombinations(input);
  while (remainingWords.length) {
    let word = remainingWords.shift();
    let definition = await fetchDefinition(word);
    if (definition) addDefinition(word, definition, foundDefinitions);
    updateResults("result", foundDefinitions);
  }
}
