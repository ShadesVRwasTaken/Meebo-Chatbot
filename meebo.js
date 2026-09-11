// meebo.js - Complete Browser Learning Chatbot with Semantic Detection
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let brain = {};

// Load existing memory from the repository file (or fallback to browser local cache)
async function loadBrain() {
try {
const response = await fetch('brain.json');
if (response.ok) {
brain = await response.json();
appendMessage("System", `Meebo successfully loaded ${Object.keys(brain).length} word connections from permanent repo memory.`, "system-msg");
} else {
// Check local browser storage cache if brain.json isn't built yet
const savedBrain = localStorage.getItem('meebo_web_brain');
if (savedBrain) {
brain = JSON.parse(savedBrain);
appendMessage("System", "Loaded vocabulary from local browser storage cache.", "system-msg");
}
}
} catch (e) {
appendMessage("System", "Starting with a fresh blank brain template.", "system-msg");
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

// Remove punctuation so words link up cleanly
const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
const words = cleanText.split(/\s+/);
if (words.length < 2) return;

for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i];
const nextWord = words[i + 1];
if (!brain[currentWord]) brain[currentWord] = [];
if (!brain[currentWord].includes(nextWord)) {
brain[currentWord].push(nextWord);
}
}
// Save to immediate local browser cache
localStorage.setItem('meebo_web_brain', JSON.stringify(brain));
}

function generateReply(starterText) {
const cleanText = starterText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
const words = cleanText.split(/\s+/);
let currentWord = words[Math.floor(Math.random() * words.length)];

if (!brain[currentWord]) {
const keys = Object.keys(brain);
if (keys.length === 0) return "I am still learning...";
currentWord = keys[Math.floor(Math.random() * keys.length)];
}

let sentence = [currentWord];
for (let i = 0; i < 10; i++) {
const possibilities = brain[currentWord];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord);
currentWord = nextWord;
}
return sentence.join(" ");
}

function handleWipe() {
brain = {};
localStorage.removeItem('meebo_web_brain');
appendMessage("System", "🚨 EMERGENCY WIPE: Memory reset locally. Paste empty {} into brain.json to sync to repo permanently.", "system-msg");
}

function handleSend() {
const text = userInput.value.trim();
if (!text) return;

// 1. Display your text on the page layout
appendMessage("You", text, "user-msg");
userInput.value = "";

// 2. Check for the Emergency Wipe Trigger
if (text.toLowerCase() === "meebo wipe memory") {
handleWipe();
return;
}

// 3. Meebo processes and maps the words in the background
learnFromSentence(text);

// 4. SEMANTIC DETECTION: Look for a question mark (?) OR his name
const isAskingQuestion = text.endsWith("?");
const mentionedName = text.toLowerCase().includes("meebo");

if (isAskingQuestion || mentionedName) {
// Meebo responds because you are directly engaging him
setTimeout(() => {
const reply = generateReply(text);
appendMessage("Meebo", reply, "meebo-msg");
}, 500);
} else {
// Meebo learns silently in the background because it's a statement
console.log("Statement detected. Meebo is listening silently...");
}
}

// 5. Interface Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

// Initialize Meebo's memory banks on startup
loadBrain();

