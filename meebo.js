// meebo.js - Multi-Brain Local Dashboard Profile Engine
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const downloadBtn = document.getElementById('download-btn');
const vocabCount = document.getElementById('vocab-count');
const modeSelect = document.getElementById('mode-select');
const brainSelect = document.getElementById('brain-select');
const brainUpload = document.getElementById('brain-upload');

// Base structural setup
let activeBrainId = "default";
let currentBrainData = { chaotic: {}, grammar: {} };

// Index list to track what brain keys exist across resets
let brainIndexList = ["default"];

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

async function loadActiveBrain() {
const savedData = localStorage.getItem(`meebo_profile_${activeBrainId}`);

if (savedData) {
const parsed = JSON.parse(savedData);
currentBrainData.chaotic = parsed.chaotic || {};
currentBrainData.grammar = parsed.grammar || {};
appendMessage("System", `Loaded active profile [${activeBrainId}].`, "system-msg");
} else if (activeBrainId === "default") {
// Fallback fallback to fetch repo baseline for default profile if empty
try {
const response = await fetch('brain.json');
if (response.ok) {
const data = await response.json();
currentBrainData.chaotic = data.chaotic || {};
currentBrainData.grammar = data.grammar || {};
appendMessage("System", "Synced Default profile with repo repository benchmarks.", "system-msg");
}
} catch (e) {
currentBrainData = { chaotic: {}, grammar: {} };
}
} else {
currentBrainData = { chaotic: {}, grammar: {} };
}
updateInterfaceCount();
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

// Train active profile layer paths
for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i];
const nextWord = words[i + 1];
if (!currentBrainData.chaotic[currentWord]) currentBrainData.chaotic[currentWord] = [];
if (!currentBrainData.chaotic[currentWord].includes(nextWord)) {
currentBrainData.chaotic[currentWord].push(nextWord);
}
}

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

// 📂 PROCESS NEW UPLOADED BRAIN FILE
brainUpload.addEventListener('change', (event) => {
const file = event.target.files[0];
if (!file) return;

const reader = new FileReader();
reader.onload = function(e) {
try {
const uploadedJson = JSON.parse(e.target.result);
// Grab filename minus extension to use as profile identifier label
const profileName = file.name.replace(".json", "").toLowerCase().replace(/[^a-z0-9]/g, "_");

// Format check
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

// Dropdown change listener
brainSelect.addEventListener('change', (e) => {
activeBrainId = e.target.value;
loadActiveBrain();
});

modeSelect.addEventListener('change', updateInterfaceCount);

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

