// meebo.js - Part 1: Brain Profiles, Registry, Rename & Delete Mechanics
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const downloadBtn = document.getElementById('download-btn');
const vocabCount = document.getElementById('vocab-count');
const modeSelect = document.getElementById('mode-select');
const brainSelect = document.getElementById('brain-select');
const brainUpload = document.getElementById('brain-upload');
const explorerContainer = document.getElementById('brain-explorer-container');
const toggleExplorerBtn = document.getElementById('toggle-explorer-btn');
const renameBrainBtn = document.getElementById('rename-brain-btn');
const deleteBrainBtn = document.getElementById('delete-brain-btn');

let activeBrainId = "default";
let currentBrainData = { chaotic: {}, grammar: {} };
let brainIndexList = ["default"];

// 🔍 BUILT-IN INTERACTIVE JSON VISUALIZER LOGIC
function renderBrainExplorer() {
const selectedMode = modeSelect.value;
const targetData = currentBrainData[selectedMode] || {};
const keys = Object.keys(targetData).sort();

if (keys.length === 0) {
explorerContainer.innerHTML = `<div style="color: #8a8a9e; font-style: italic; padding: 5px;">The [${selectedMode}] JSON dictionary is currently empty. Type to add paths!</div>`;
return;
}

explorerContainer.innerHTML = `<div style="color: #8a8a9e; margin-bottom: 8px; font-weight: bold; font-family: monospace;">json_structure: brain.${selectedMode}</div>`;

keys.forEach(key => {
const nodeDiv = document.createElement('div');
nodeDiv.className = 'brain-node';

const keySpan = document.createElement('span');
keySpan.className = 'brain-key';
const formattedKey = key.includes('_') ? `"${key.replace('_', ' ')}"` : `"${key}"`;
keySpan.innerText = `${formattedKey}: `;

const valuesDiv = document.createElement('div');
valuesDiv.className = 'brain-values';
valuesDiv.innerText = JSON.stringify(targetData[key]);

keySpan.addEventListener('click', () => {
nodeDiv.classList.toggle('expanded');
});

nodeDiv.appendChild(keySpan);
nodeDiv.appendChild(valuesDiv);
explorerContainer.appendChild(nodeDiv);
});
}

toggleExplorerBtn.addEventListener('click', () => {
if (explorerContainer.style.display === "block") {
explorerContainer.style.display = "none";
toggleExplorerBtn.style.borderColor = "#444455";
} else {
renderBrainExplorer();
explorerContainer.style.display = "block";
toggleExplorerBtn.style.borderColor = "#0ebd84";
}
});

function loadIndex() {
const index = localStorage.getItem('meebo_index_list');
if (index) {
brainIndexList = JSON.parse(index);
}
rebuildBrainDropdown();
}

function rebuildBrainDropdown() {
brainSelect.innerHTML = "";
brainIndexList.forEach(id => {
const option = document.createElement('option');
option.value = id;
option.innerText = id === "default" ? "Default Brain" : `🧠 ${id}`;
if (id === activeBrainId) option.selected = true;
brainSelect.appendChild(option);
});
}

// ✏️ PROFILE RENAME HANDLER
renameBrainBtn.addEventListener('click', () => {
if (activeBrainId === "default") {
alert("The baseline 'Default Brain' cannot be renamed.");
return;
}

const newName = prompt(`Enter a new name for "${activeBrainId}":`, activeBrainId);
if (!newName) return;

const cleanName = newName.toLowerCase().replace(/[^a-z0-9]/g, "_").trim();
if (!cleanName) return;

if (brainIndexList.includes(cleanName)) {
alert("A brain profile with that identifier name already exists.");
return;
}

// Copy data to new registry slot, clear old track slot
localStorage.setItem(`meebo_profile_${cleanName}`, JSON.stringify(currentBrainData));
localStorage.removeItem(`meebo_profile_${activeBrainId}`);

// Update structural index pointer arrays
brainIndexList = brainIndexList.map(id => id === activeBrainId ? cleanName : id);
localStorage.setItem('meebo_index_list', JSON.stringify(brainIndexList));

activeBrainId = cleanName;
rebuildBrainDropdown();
appendMessage("System", `Profile renamed to: "${cleanName}"`, "system-msg");
});

// ❌ PROFILE DELETE HANDLER
deleteBrainBtn.addEventListener('click', () => {
if (activeBrainId === "default") {
alert("The core 'Default Brain' cannot be deleted.");
return;
}

const confirmDelete = confirm(`Are you sure you want to permanently delete the profile: "${activeBrainId}"?`);
if (!confirmDelete) return;

// Purge entry storage profiles
localStorage.removeItem(`meebo_profile_${activeBrainId}`);

// Filter out deleted indices
brainIndexList = brainIndexList.filter(id => id !== activeBrainId);
localStorage.setItem('meebo_index_list', JSON.stringify(brainIndexList));

// Reset selection defaults back to main index track
activeBrainId = "default";
rebuildBrainDropdown();
loadActiveBrain();
appendMessage("System", "Selected custom brain profile purged from device.", "system-msg");
});

// meebo.js - Part 2: Learning Loop Arrays & Text Conversions
async function loadActiveBrain() {
const savedData = localStorage.getItem(`meebo_profile_${activeBrainId}`);

if (savedData) {
const parsed = JSON.parse(savedData);
currentBrainData.chaotic = parsed.chaotic || {};
currentBrainData.grammar = parsed.grammar || {};
appendMessage("System", `Loaded active profile [${activeBrainId}].`, "system-msg");
} else if (activeBrainId === "default") {
try {
const response = await fetch('brain.json');
if (response.ok) {
const data = await response.json();
currentBrainData.chaotic = data.chaotic || {};
currentBrainData.grammar = data.grammar || {};
appendMessage("System", "Synced Default profile with repository endpoints.", "system-msg");
}
} catch (e) {
currentBrainData = { chaotic: {}, grammar: {} };
}
} else {
currentBrainData = { chaotic: {}, grammar: {} };
}
updateInterfaceCount();
if (explorerContainer.style.display === "block") renderBrainExplorer();
}

function saveActiveBrain() {
localStorage.setItem(`meebo_profile_${activeBrainId}`, JSON.stringify(currentBrainData));
if (!brainIndexList.includes(activeBrainId)) {
brainIndexList.push(activeBrainId);
localStorage.setItem('meebo_index_list', JSON.stringify(brainIndexList));
rebuildBrainDropdown();
}
}

function appendMessage(sender, text, className) {
const msgDiv = document.createElement('div');
msgDiv.className = `msg ${className}`;
msgDiv.innerText = text;
chatBox.appendChild(msgDiv);
chatBox.scrollTop = chatBox.scrollHeight;
}

function learnFromSentence(text) {
if (text.toLowerCase().trim() === "meebo wipe memory") return;

const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
const words = cleanText.split(/\s+/);
if (words.length < 2) return;

// Train Chaotic Layer
for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i];
const nextWord = words[i + 1];
if (!currentBrainData.chaotic[currentWord]) currentBrainData.chaotic[currentWord] = [];
if (!currentBrainData.chaotic[currentWord].includes(nextWord)) {
currentBrainData.chaotic[currentWord].push(nextWord);
}
}

// Train Grammar Layer
if (words.length >= 3) {
for (let i = 0; i < words.length - 2; i++) {
const currentPair = `${words[i]}_${words[i+1]}`;
const nextWord = words[i + 2];
if (!currentBrainData.grammar[currentPair]) currentBrainData.grammar[currentPair] = [];
if (!currentBrainData.grammar[currentPair].includes(nextWord)) {
currentBrainData.grammar[currentPair].push(nextWord);
}
}
}
saveActiveBrain();
updateInterfaceCount();
if (explorerContainer.style.display === "block") renderBrainExplorer();
}

function generateChaoticReply(words) {
let currentWord = words[Math.floor(Math.random() * words.length)];
if (!currentBrainData.chaotic[currentWord]) {
const keys = Object.keys(currentBrainData.chaotic);
if (keys.length === 0) return "Active profile's chaotic layout is empty...";
currentWord = keys[Math.floor(Math.random() * keys.length)];
}
let sentence = [currentWord];
for (let i = 0; i < 10; i++) {
const possibilities = currentBrainData.chaotic[currentWord];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord);
currentWord = nextWord;
}
return sentence.join(" ");
}

function generateGrammarReply(words) {
let key1 = "", key2 = "";
if (words.length >= 2) {
for (let i = 0; i < words.length - 1; i++) {
if (currentBrainData.grammar[`${words[i]}_${words[i+1]}`]) {
key1 = words[i]; key2 = words[i+1];
break;
}
}
}
const keys = Object.keys(currentBrainData.grammar);
if (keys.length === 0) return "Active profile needs 3+ word sentences to trigger structural metrics.";

if (!key1 || !key2) {
const randomKey = keys[Math.floor(Math.random() * keys.length)];
[key1, key2] = randomKey.split('_');
}
let sentence = [key1, key2];
for (let i = 0; i < 12; i++) {
const currentPair = `${key1}_${key2}`;
const possibilities = currentBrainData.grammar[currentPair];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord);
key1 = key2; key2 = nextWord;
}
return sentence.join(" ");
}

function handleWipe() {
currentBrainData = { chaotic: {}, grammar: {} };
saveActiveBrain();
updateInterfaceCount();
if (explorerContainer.style.display === "block") renderBrainExplorer();
appendMessage("System", `🚨 wiped profile [${activeBrainId}] database parameters.`, "system-msg");
}

function handleSend() {
const text = userInput.value.trim();
if (!text) return;

appendMessage("You", text, "user-msg");
userInput.value = "";

if (text.toLowerCase() === "meebo wipe memory") {
handleWipe();
return;
}

learnFromSentence(text);

const isAskingQuestion = text.endsWith("?");
const mentionedName = text.toLowerCase().includes("meebo");

if (isAskingQuestion || mentionedName) {
setTimeout(() => {
const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
const words = cleanText.split(/\s+/);
const selectedMode = modeSelect.value;
const reply = selectedMode === "chaotic" ? generateChaoticReply(words) : generateGrammarReply(words);
appendMessage("Meebo", reply, "meebo-msg");
}, 500);
}
}

function updateInterfaceCount() {
if (vocabCount && currentBrainData) {
const mode = modeSelect.value;
const target = currentBrainData[mode] || {};
vocabCount.innerText = `${Object.keys(target).length} (${mode})`;
}
}

brainUpload.addEventListener('change', (event) => {
const files = event.target.files;
if (!files || files.length === 0) return;
const file = files[0];

const reader = new FileReader();
reader.onload = function(e) {
try {
const uploadedJson = JSON.parse(e.target.result);
const profileName = file.name.replace(".json", "").toLowerCase().replace(/[^a-z0-9]/g, "_");

if (!brainIndexList.includes(profileName)) {
brainIndexList.push(profileName);
localStorage.setItem('meebo_index_list', JSON.stringify(brainIndexList));
}

localStorage.setItem(`meebo_profile_${profileName}`, JSON.stringify(uploadedJson));
activeBrainId = profileName;

rebuildBrainDropdown();
loadActiveBrain();
appendMessage("System", `Successfully loaded and activated uploaded brain: "${file.name}"`, "system-msg");
} catch (err) {
appendMessage("System", "🔴 ERROR: Invalid JSON file structure template.", "system-msg");
}
};
reader.readAsText(file);
});

brainSelect.addEventListener('change', (e) => {
activeBrainId = e.target.value;
loadActiveBrain();
});

modeSelect.addEventListener('change', () => {
updateInterfaceCount();
if (explorerContainer.style.display === "block") renderBrainExplorer();
});

downloadBtn.addEventListener('click', () => {
const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentBrainData, null, 2));
const downloadAnchor = document.createElement('a');
downloadAnchor.setAttribute("href", dataStr);
downloadAnchor.setAttribute("download", `${activeBrainId}_brain.json`);
document.body.appendChild(downloadAnchor);
downloadAnchor.click();
downloadAnchor.remove();
});

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

loadIndex();
loadActiveBrain();
