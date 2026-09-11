// meebo.js - Dual Personality (1st and 2nd Order) Chatbot Engine
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const downloadBtn = document.getElementById('download-btn');
const vocabCount = document.getElementById('vocab-count');
const modeSelect = document.getElementById('mode-select');

// Brain structure split into two separate rooms
let brain = {
chaotic: {},
grammar: {}
};

async function loadBrain() {
try {
const response = await fetch('brain.json');
if (response.ok) {
const data = await response.json();
// Fallback structure check if old json doesn't have mode keys
brain.chaotic = data.chaotic || {};
brain.grammar = data.grammar || {};
appendMessage("System", "Meebo successfully synced both personalities from repository memory.", "system-msg");
} else {
const savedBrain = localStorage.getItem('meebo_web_brain');
if (savedBrain) {
const data = JSON.parse(savedBrain);
brain.chaotic = data.chaotic || {};
brain.grammar = data.grammar || {};
appendMessage("System", "Loaded vocabulary from local browser storage cache.", "system-msg");
}
}
} catch (e) {
appendMessage("System", "Starting with a fresh blank brain template.", "system-msg");
}
updateInterfaceCount();
}

function appendMessage(sender, text, className) {
const msgDiv = document.createElement('div');
msgDiv.className = `msg ${className}`;
msgDiv.innerText = text;
chatBox.appendChild(msgDiv);
chatBox.scrollTop = chatBox.scrollHeight;
}

// 🧠 Triggers BOTH learning paths simultaneously so he expands his knowledge equally
function learnFromSentence(text) {
if (text.toLowerCase().trim() === "meebo wipe memory") return;

const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
const words = cleanText.split(/\s+/);
if (words.length < 2) return;

// 1. Train Chaotic Brain Layer (1st Order)
for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i];
const nextWord = words[i + 1];
if (!brain.chaotic[currentWord]) brain.chaotic[currentWord] = [];
if (!brain.chaotic[currentWord].includes(nextWord)) {
brain.chaotic[currentWord].push(nextWord);
}
}

// 2. Train Grammar Brain Layer (2nd Order)
if (words.length >= 3) {
for (let i = 0; i < words.length - 2; i++) {
const currentPair = `${words[i]}_${words[i+1]}`;
const nextWord = words[i + 2];
if (!brain.grammar[currentPair]) brain.grammar[currentPair] = [];
if (!brain.grammar[currentPair].includes(nextWord)) {
brain.grammar[currentPair].push(nextWord);
}
}
}

localStorage.setItem('meebo_web_brain', JSON.stringify(brain));
updateInterfaceCount();
}

// 🚀 CHAOTIC GENERATION (1st Order Single Word Lookup)
function generateChaoticReply(words) {
let currentWord = words[Math.floor(Math.random() * words.length)];
if (!brain.chaotic[currentWord]) {
const keys = Object.keys(brain.chaotic);
if (keys.length === 0) return "I have nothing in my chaotic memory yet...";
currentWord = keys[Math.floor(Math.random() * keys.length)];
}

let sentence = [currentWord];
for (let i = 0; i < 10; i++) {
const possibilities = brain.chaotic[currentWord];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord);
currentWord = nextWord;
}
return sentence.join(" ");
}

// 📖 GRAMMAR GENERATION (2nd Order Duo Word Lookup)
function generateGrammarReply(words) {
let key1 = "", key2 = "";
if (words.length >= 2) {
for (let i = 0; i < words.length - 1; i++) {
if (brain.grammar[`${words[i]}_${words[i+1]}`]) {
key1 = words[i]; key2 = words[i+1];
break;
}
}
}
const keys = Object.keys(brain.grammar);
if (keys.length === 0) return "I don't have enough grammar links yet. Speak 3+ word sentences to teach me!";

if (!key1 || !key2) {
const randomKey = keys[Math.floor(Math.random() * keys.length)];
[key1, key2] = randomKey.split('_');
}

let sentence = [key1, key2];
for (let i = 0; i < 12; i++) {
const currentPair = `${key1}_${key2}`;
const possibilities = brain.grammar[currentPair];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord);
key1 = key2; key2 = nextWord;
}
return sentence.join(" ");
}

function handleWipe() {
brain = { chaotic: {}, grammar: {} };
localStorage.removeItem('meebo_web_brain');
updateInterfaceCount();
appendMessage("System", "🚨 EMERGENCY WIPE: Dual memories reset locally.", "system-msg");
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

// Look up what mode the user selected on screen
const selectedMode = modeSelect.value;
let reply = "";

if (selectedMode === "chaotic") {
reply = generateChaoticReply(words);
} else {
reply = generateGrammarReply(words);
}

appendMessage("Meebo", reply, "meebo-msg");
}, 500);
}
}

function updateInterfaceCount() {
if (vocabCount && brain) {
const selectedMode = modeSelect.value;
const count = Object.keys(brain[selectedMode]).length;
vocabCount.innerText = `${count} (${selectedMode})`;
}
}

// Watch dropdown changes to immediately swap the visible stats count
modeSelect.addEventListener('change', updateInterfaceCount);

if (downloadBtn) {
downloadBtn.addEventListener('click', () => {
const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(brain, null, 2));
const downloadAnchor = document.createElement('a');
downloadAnchor.setAttribute("href", dataStr);
downloadAnchor.setAttribute("download", "brain.json");
document.body.appendChild(downloadAnchor);
downloadAnchor.click();
downloadAnchor.remove();
});
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

loadBrain();

