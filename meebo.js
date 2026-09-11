// meebo.js - Part 1: DOM Elements, Profiles Index, and Theme Configuration
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const downloadBtn = document.getElementById('download-btn');
const vocabCount = document.getElementById('vocab-count');
const modeSelect = document.getElementById('mode-select');
const brainSelect = document.getElementById('brain-select');
const brainUpload = document.getElementById('brain-upload');
const learnSelect = document.getElementById('learn-select');
const explorerContainer = document.getElementById('brain-explorer-container');
const toggleExplorerBtn = document.getElementById('toggle-explorer-btn');
const renameBrainBtn = document.getElementById('rename-brain-btn');
const deleteBrainBtn = document.getElementById('delete-brain-btn');

const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const themePresetsSelect = document.getElementById('theme-presets-select');
const customColorControls = document.getElementById('custom-color-controls');

const colorBgMain = document.getElementById('color-bg-main');
const colorBgPanel = document.getElementById('color-bg-panel');
const colorAccent = document.getElementById('color-accent');
const colorBubble = document.getElementById('color-bubble');

let activeBrainId = "default";
let currentBrainData = { chaotic: {}, grammar: {}, complex: {} };
let brainIndexList = ["default"];

const themesMap = {
emerald: { main: "#1a1a24", panel: "#242432", border: "#2e2e3f", accent: "#0ebd84", hover: "#0cb37d", bubble: "#333344", txt: "#f1f1f1" },
cyberpunk: { main: "#0d0d13", panel: "#161622", border: "#ff0055", accent: "#00f0ff", hover: "#00b8c7", bubble: "#25142f", txt: "#00f0ff" },
midnight: { main: "#0f0c1b", panel: "#191430", border: "#3d2b5c", accent: "#9b5de5", hover: "#7b3fd3", bubble: "#2b1c40", txt: "#f3effa" },
monochrome: { main: "#121212", panel: "#1e1e1e", border: "#2c2c2c", accent: "#e0e0e0", hover: "#b5b5b5", bubble: "#2a2a2a", txt: "#ffffff" }
};

function applyThemeObject(t) {
document.documentElement.style.setProperty('--bg-main', t.main);
document.documentElement.style.setProperty('--bg-panel', t.panel);
document.documentElement.style.setProperty('--border-color', t.border);
document.documentElement.style.setProperty('--accent-color', t.accent);
document.documentElement.style.setProperty('--accent-hover', t.hover);
document.documentElement.style.setProperty('--bubble-meebo', t.bubble);
document.documentElement.style.setProperty('--bubble-text', t.txt || "#ffffff");
}

function saveCustomColors() {
const customObj = {
main: colorBgMain.value, panel: colorBgPanel.value, border: adjustBrightness(colorBgPanel.value, 15),
accent: colorAccent.value, hover: adjustBrightness(colorAccent.value, -15), bubble: colorBubble.value, txt: "#ffffff"
};
localStorage.setItem('meebo_theme_custom_obj', JSON.stringify(customObj));
if (themePresetsSelect.value === "custom") applyThemeObject(customObj);
}

function adjustBrightness(hex, percent) {
let R = parseInt(hex.substring(1,3),16), G = parseInt(hex.substring(3,5),16), B = parseInt(hex.substring(5,7),16);
R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100);
R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255;
R = (R<0)?0:R; G = (G<0)?0:G; B = (B<0)?0:B;
const rHex = (R.toString(16).length==1)?"0"+R.toString(16):R.toString(16);
const gHex = (G.toString(16).length==1)?"0"+G.toString(16):G.toString(16);
const bHex = (B.toString(16).length==1)?"0"+B.toString(16):B.toString(16);
return `#${rHex}${gHex}${bHex}`;
}

themePresetsSelect.addEventListener('change', (e) => {
const val = e.target.value;
localStorage.setItem('meebo_theme_preset_selection', val);
if (val === "custom") {
customColorControls.style.opacity = "1"; customColorControls.style.pointerEvents = "auto"; saveCustomColors();
} else {
customColorControls.style.opacity = "0.4"; customColorControls.style.pointerEvents = "none"; applyThemeObject(themesMap[val]);
}
});

[colorBgMain, colorBgPanel, colorAccent, colorBubble].forEach(input => { input.addEventListener('input', saveCustomColors); });
openSettingsBtn.addEventListener('click', () => settingsModal.style.display = "flex");
closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = "none");
window.addEventListener('click', (e) => { if(e.target === settingsModal) settingsModal.style.display = "none"; });

function loadSavedThemeSettings() {
const savedPreset = localStorage.getItem('meebo_theme_preset_selection') || "emerald";
themePresetsSelect.value = savedPreset;
const savedCustom = localStorage.getItem('meebo_theme_custom_obj');
if (savedCustom) {
const c = JSON.parse(savedCustom);
colorBgMain.value = c.main; colorBgPanel.value = c.panel; colorAccent.value = c.accent; colorBubble.value = c.bubble;
}
if (savedPreset === "custom" && savedCustom) {
customColorControls.style.opacity = "1"; customColorControls.style.pointerEvents = "auto"; applyThemeObject(JSON.parse(savedCustom));
} else {
customColorControls.style.opacity = "0.4"; customColorControls.style.pointerEvents = "none"; applyThemeObject(themesMap[savedPreset] || themesMap.emerald);
}
}

// meebo.js - Part 2: JSON Browser Node Tree Layout Parser & Registry Operations
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
const nodeDiv = document.createElement('div'); nodeDiv.className = 'brain-node';
const keySpan = document.createElement('span'); keySpan.className = 'brain-key';

let label = key;
if (key.includes('____')) label = key.replace(/____/g, ' ');
else if (key.includes('__')) label = key.replace(/__/g, ' ');

keySpan.innerText = `"${label}": `;
const valuesDiv = document.createElement('div'); valuesDiv.className = 'brain-values'; valuesDiv.innerText = JSON.stringify(targetData[key]);
keySpan.addEventListener('click', () => nodeDiv.classList.toggle('expanded'));
nodeDiv.appendChild(keySpan); nodeDiv.appendChild(valuesDiv); explorerContainer.appendChild(nodeDiv);
});
}

function loadIndex() {
const index = localStorage.getItem('meebo_index_list');
if (index) brainIndexList = JSON.parse(index);
rebuildBrainDropdown();
}

function rebuildBrainDropdown() {
brainSelect.innerHTML = "";
brainIndexList.forEach(id => {
const option = document.createElement('option'); option.value = id;
option.innerText = id === "default" ? "Default Brain" : `🧠 ${id}`;
if (id === activeBrainId) option.selected = true;
brainSelect.appendChild(option);
});
}

renameBrainBtn.addEventListener('click', () => {
if (activeBrainId === "default") { alert("The baseline 'Default Brain' cannot be renamed."); return; }
const newName = prompt(`Enter a new name for "${activeBrainId}":`, activeBrainId);
if (!newName) return;
const cleanName = newName.replace(/[^a-zA-Z0-9_\s]/g, "").trim().replace(/\s+/g, "_");
if (!cleanName || brainIndexList.includes(cleanName)) return;
localStorage.setItem(`meebo_profile_${cleanName}`, JSON.stringify(currentBrainData));
localStorage.removeItem(`meebo_profile_${activeBrainId}`);
brainIndexList = brainIndexList.map(id => id === activeBrainId ? cleanName : id);
localStorage.setItem('meebo_index_list', JSON.stringify(brainIndexList));
activeBrainId = cleanName; rebuildBrainDropdown(); appendMessage("System", `Profile renamed to: "${cleanName}"`, "system-msg");
});

deleteBrainBtn.addEventListener('click', () => {
if (activeBrainId === "default") { alert("The core 'Default Brain' cannot be deleted."); return; }
if (!confirm(`Are you sure you want to permanently delete the profile: "${activeBrainId}"?`)) return;
localStorage.removeItem(`meebo_profile_${activeBrainId}`);
brainIndexList = brainIndexList.filter(id => id !== activeBrainId);
localStorage.setItem('meebo_index_list', JSON.stringify(brainIndexList));
activeBrainId = "default"; rebuildBrainDropdown(); loadActiveBrain(); appendMessage("System", "Selected custom brain profile purged from device.", "system-msg");
});

async function loadActiveBrain() {
const savedData = localStorage.getItem(`meebo_profile_${activeBrainId}`);
if (savedData) {
const parsed = JSON.parse(savedData);
currentBrainData.chaotic = parsed.chaotic || {};
currentBrainData.grammar = parsed.grammar || {};
currentBrainData.complex = parsed.complex || {};
appendMessage("System", `Loaded active profile [${activeBrainId}].`, "system-msg");
} else if (activeBrainId === "default") {
try {
const response = await fetch('brain.json');
if (response.ok) {
const data = await response.json();
currentBrainData.chaotic = data.chaotic || {};
currentBrainData.grammar = data.grammar || {};
currentBrainData.complex = data.complex || {};
appendMessage("System", "Synced Default profile with repository endpoints.", "system-msg");
}
} catch (e) { currentBrainData = { chaotic: {}, grammar: {}, complex: {} }; }
} else { currentBrainData = { chaotic: {}, grammar: {}, complex: {} }; }
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

// meebo.js - Part 3: Text Learning Mechanics, Multi-Order Chain Generators, and Flow Events
function appendMessage(sender, text, className) {
const msgDiv = document.createElement('div'); msgDiv.className = `msg ${className}`; msgDiv.innerText = text;
chatBox.appendChild(msgDiv); chatBox.scrollTop = chatBox.scrollHeight;
}

function learnFromSentence(text) {
if (text.toLowerCase().trim() === "meebo wipe memory") return;
const words = text.trim().split(/\s+/);
if (words.length < 2) return;

// 1st Order (Chaotic)
for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i].toLowerCase(); const nextWord = words[i + 1];
if (!currentBrainData.chaotic[currentWord]) currentBrainData.chaotic[currentWord] = [];
if (!currentBrainData.chaotic[currentWord].includes(nextWord)) currentBrainData.chaotic[currentWord].push(nextWord);
}
// 2nd Order (Grammar)
if (words.length >= 3) {
for (let i = 0; i < words.length - 2; i++) {
const currentPair = `${words[i].toLowerCase()}__${words[i+1].toLowerCase()}`; const nextWord = words[i + 2];
if (!currentBrainData.grammar[currentPair]) currentBrainData.grammar[currentPair] = [];
if (!currentBrainData.grammar[currentPair].includes(nextWord)) currentBrainData.grammar[currentPair].push(nextWord);
}
}
// 4th Order (Complex Phrase Structure)
if (words.length >= 5) {
for (let i = 0; i < words.length - 4; i++) {
const currentQuad = `${words[i].toLowerCase()}____${words[i+1].toLowerCase()}____${words[i+2].toLowerCase()}____${words[i+3].toLowerCase()}`;
const nextWord = words[i + 4];
if (!currentBrainData.complex[currentQuad]) currentBrainData.complex[currentQuad] = [];
if (!currentBrainData.complex[currentQuad].includes(nextWord)) currentBrainData.complex[currentQuad].push(nextWord);
}
}
saveActiveBrain(); updateInterfaceCount();
if (explorerContainer.style.display === "block") renderBrainExplorer();
}

function generateChaoticReply(words) {
let currentWord = words[Math.floor(Math.random() * words.length)].toLowerCase();
if (!currentBrainData.chaotic[currentWord]) {
const keys = Object.keys(currentBrainData.chaotic);
if (keys.length === 0) return "Active profile's memory paths are empty...";
currentWord = keys[Math.floor(Math.random() * keys.length)];
}
let sentence = [currentWord]; let wordPointer = currentWord;
for (let i = 0; i < 10; i++) {
const possibilities = currentBrainData.chaotic[wordPointer];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord); wordPointer = nextWord.toLowerCase();
}
let res = sentence.join(" ");
return res.charAt(0).toUpperCase() + res.slice(1);
}

function generateGrammarReply(words) {
let key1 = "", key2 = "";
if (words.length >= 2) {
for (let i = 0; i < words.length - 1; i++) {
if (currentBrainData.grammar[`${words[i].toLowerCase()}__${words[i+1].toLowerCase()}`]) {
key1 = words[i].toLowerCase(); key2 = words[i+1].toLowerCase(); break;
}
}
}
const keys = Object.keys(currentBrainData.grammar);
if (keys.length === 0) return "Active profile needs 2-word phrase blocks. Keep chatting!";
if (!key1 || !key2) {
const randomKey = keys[Math.floor(Math.random() * keys.length)]; [key1, key2] = randomKey.split('__');
}
let sentence = [key1, key2];
for (let i = 0; i < 12; i++) {
const currentPair = `${key1}__${key2}`; const possibilities = currentBrainData.grammar[currentPair];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord); key1 = key2; key2 = nextWord.toLowerCase();
}
let res = sentence.join(" ");
return res.charAt(0).toUpperCase() + res.slice(1);
}

function generateComplexReply(words) {
let k1 = "", k2 = "", k3 = "", k4 = "";
if (words.length >= 4) {
for (let i = 0; i < words.length - 3; i++) {
const lookKey = `${words[i].toLowerCase()}____${words[i+1].toLowerCase()}____${words[i+2].toLowerCase()}____${words[i+3].toLowerCase()}`;
if (currentBrainData.complex[lookKey]) {
k1 = words[i].toLowerCase(); k2 = words[i+1].toLowerCase(); k3 = words[i+2].toLowerCase(); k4 = words[i+3].toLowerCase();
break;
}
}
}
const keys = Object.keys(currentBrainData.complex);
if (keys.length === 0) return "Complex Mode requires sentences with at least 5 words to map trajectories.";
if (!k1 || !k2 || !k3 || !k4) {
const randomKey = keys[Math.floor(Math.random() * keys.length)];
[k1, k2, k3, k4] = randomKey.split('____');
}
let sentence = [k1, k2, k3, k4];
for (let i = 0; i < 15; i++) {
const currentQuad = `${k1}____${k2}____${k3}____${k4}`; const possibilities = currentBrainData.complex[currentQuad];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord); k1 = k2; k2 = k3; k3 = k4; k4 = nextWord.toLowerCase();
}
let res = sentence.join(" ");
return res.charAt(0).toUpperCase() + res.slice(1);
}

function handleWipe() {
currentBrainData = { chaotic: {}, grammar: {}, complex: {} }; saveActiveBrain(); updateInterfaceCount();
if (explorerContainer.style.display === "block") renderBrainExplorer();
appendMessage("System", `🚨 wiped profile [${activeBrainId}] database parameters.`, "system-msg");
}

function handleSend() {
const text = userInput.value.trim(); if (!text) return;
appendMessage("You", text, "user-msg"); userInput.value = "";
if (text.toLowerCase() === "meebo wipe memory") { handleWipe(); return; }

const strategy = learnSelect.value;
if (strategy === "adaptive" || strategy === "silent") learnFromSentence(text);
if (strategy === "silent") return;

const isAskingQuestion = text.endsWith("?"); const mentionedName = text.toLowerCase().includes("meebo");
if (isAskingQuestion || mentionedName || strategy === "adaptive") {
setTimeout(() => {
const words = text.trim().split(/\s+/);
const selectedMode = modeSelect.value;
let reply = "";
if (selectedMode === "chaotic") reply = generateChaoticReply(words);
else if (selectedMode === "grammar") reply = generateGrammarReply(words);
else reply = generateComplexReply(words);
appendMessage("Meebo", reply, "meebo-msg");
}, 500);
}
}

function updateInterfaceCount() {
if (vocabCount && currentBrainData) {
const mode = modeSelect.value; const target = currentBrainData[mode] || {};
vocabCount.innerText = `${Object.keys(target).length} (${mode})`;
}
}

brainUpload.addEventListener('change', (event) => {
const files = event.target.files; if (!files || files.length === 0) return;
const file = files; const reader = new FileReader();
reader.onload = function(e) {
try {
const uploadedJson = JSON.parse(e.target.result);
const profileName = file.name.replace(".json", "").toLowerCase().replace(/[^a-z0-9]/g, "_");
if (!brainIndexList.includes(profileName)) { brainIndexList.push(profileName); localStorage.setItem('meebo_index_list', JSON.stringify(brainIndexList)); }
localStorage.setItem(`meebo_profile_${profileName}`, JSON.stringify(uploadedJson));
activeBrainId = profileName; rebuildBrainDropdown(); loadActiveBrain();
appendMessage("System", `Successfully loaded and activated uploaded brain: "${file.name}"`, "system-msg");
} catch (err) { appendMessage("System", "🔴 ERROR: Invalid JSON file structure template.", "system-msg"); }
};
reader.readAsText(file);
});

brainSelect.addEventListener('change', (e) => { activeBrainId = e.target.value; loadActiveBrain(); });
modeSelect.addEventListener('change', () => { updateInterfaceCount(); if (explorerContainer.style.display === "block") renderBrainExplorer(); });

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

loadIndex(); loadSavedThemeSettings(); loadActiveBrain();


