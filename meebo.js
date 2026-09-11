// meebo.js - Part 1: Elements Mapping Core
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const ttsToggle = document.getElementById('tts-toggle');
const emotionToggle = document.getElementById('emotion-toggle');
const smartToggle = document.getElementById('smart-toggle'); 
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

// 🖥️ PANEL EXPANSION SYSTEM HANDLES
const expandSidebarBtn = document.getElementById('expand-sidebar-btn');
const expandChatBtn = document.getElementById('expand-chat-btn');
const emojiPanel = document.getElementById('emoji-panel');

// 📊 AUDIO OVERLAY CANVAS HANDLES
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');

let animationFrameId = null;
let audioContext = null;
let analyser = null;
let micStream = null;
let sourceNode = null;
let isVisualizerActive = false;
let syntheticWavePhase = 0; 

let activeBrainId = "default";
let currentBrainData = { chaotic: {}, grammar: {} };
let brainIndexList = ["default"];
let isMeeboSpeaking = false;

// Web Speech API Instantiation 
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
}

const themesMap = {
emerald: { 
    main: "#0b0b10", panel: "rgba(30,30,45,0.4)", border: "rgba(255,255,255,0.08)", 
    accent: "#0ebd84", hover: "#0cb37d", bubble: "#1e1e2d", txt: "#f1f1f1" 
},
cyberpunk: { 
    main: "#05050a", panel: "rgba(255,0,85,0.05)", border: "rgba(255,0,85,0.2)", 
    accent: "#00f0ff", hover: "#00b8c7", bubble: "#1a0826", txt: "#00f0ff" 
},
midnight: { 
    main: "#06040d", panel: "rgba(155,93,229,0.06)", border: "rgba(155,93,229,0.2)", 
    accent: "#9b5de5", hover: "#7b3fd3", bubble: "#150e26", txt: "#f3effa" 
},
monochrome: { 
    main: "#080808", panel: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", 
    accent: "#e0e0e0", hover: "#b5b5b5", bubble: "#161616", txt: "#ffffff" 
}
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
if (themePresetsSelect && themePresetsSelect.value === "custom") applyThemeObject(customObj);
}

function adjustBrightness(hex, percent) {
let R = parseInt(hex.substring(1,3),16), G = parseInt(hex.substring(3,5),16), B = parseInt(hex.substring(5,7),16);
R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100);
R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255;
R = (R<0)?0:R; G = (G<0)?0:B; B = (B<0)?0:B;
const rHex = (R.toString(16).length==1)?"0"+R.toString(16):R.toString(16);
const gHex = (G.toString(16).length==1)?"0"+G.toString(16):G.toString(16);
const bHex = (B.toString(16).length==1)?"0"+B.toString(16):B.toString(16);
return `#${rHex}${gHex}${bHex}`;
}

if (themePresetsSelect) {
    themePresetsSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    localStorage.setItem('meebo_theme_preset_selection', val);
    if (val === "custom") {
    customColorControls.style.opacity = "1"; customColorControls.style.pointerEvents = "auto"; saveCustomColors();
    } else {
    customColorControls.style.opacity = "0.4"; customColorControls.style.pointerEvents = "none"; applyThemeObject(themesMap[val]);
    }
    });
}

expandSidebarBtn.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-fullscreen');
    document.body.classList.remove('chat-fullscreen');
    expandSidebarBtn.innerText = document.body.classList.contains('sidebar-fullscreen') ? "✕" : "⛶";
    expandChatBtn.innerText = "⛶";
});

expandChatBtn.addEventListener('click', () => {
    document.body.classList.toggle('chat-fullscreen');
    document.body.classList.remove('sidebar-fullscreen');
    expandChatBtn.innerText = document.body.classList.contains('chat-fullscreen') ? "✕" : "⛶";
    expandSidebarBtn.innerText = "⛶";
});

function loadSavedThemeSettings() {
const savedPreset = localStorage.getItem('meebo_theme_preset_selection') || "emerald";
if (themePresetsSelect) themePresetsSelect.value = savedPreset;
const savedCustom = localStorage.getItem('meebo_theme_custom_obj');
if (savedCustom && colorBgMain) {
const c = JSON.parse(savedCustom);
colorBgMain.value = c.main; colorBgPanel.value = c.panel; colorAccent.value = c.accent; colorBubble.value = c.bubble;
}
if (savedPreset === "custom" && savedCustom) {
applyThemeObject(JSON.parse(savedCustom));
} else {
if (customColorControls) { customColorControls.style.opacity = "0.4"; customColorControls.style.pointerEvents = "none"; }
applyThemeObject(themesMap[savedPreset] || themesMap.emerald);
}
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
option.innerText = id === "default" ? "Baseline Default Brain" : `🧠 ${id}`;
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
currentBrainData.chaotic = parsed.chaotic || {}; currentBrainData.grammar = parsed.grammar || {};
appendMessage("System", `Loaded active profile [${activeBrainId}].`, "system-msg");
} else if (activeBrainId === "default") {
try {
const response = await fetch('brain.json');
if (response.ok) {
const data = await response.json();
currentBrainData.chaotic = data.chaotic || {}; currentBrainData.grammar = data.grammar || {};
appendMessage("System", "Synced Default profile with repository endpoints.", "system-msg");
}
} catch (e) { currentBrainData = { chaotic: {}, grammar: {} }; }
} else { currentBrainData = { chaotic: {}, grammar: {} }; }
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
const msgDiv = document.createElement('div'); msgDiv.className = `msg ${className}`; msgDiv.innerText = text;
chatBox.appendChild(msgDiv); chatBox.scrollTop = chatBox.scrollHeight;
}

function renderBrainExplorer() {
const selectedMode = modeSelect.value;
const targetData = currentBrainData[selectedMode] || {};
const keys = Object.keys(targetData).sort();
if (keys.length === 0) {
explorerContainer.innerHTML = `<div style="color: #8a8a9e; font-style: italic; padding: 5px;">The [${selectedMode}] JSON dictionary is currently empty.</div>`;
return;
}
explorerContainer.innerHTML = `<div style="color: #8a8a9e; margin-bottom: 8px; font-weight: bold; font-family: monospace;">json_structure: brain.${selectedMode}</div>`;
keys.forEach(key => {
const nodeDiv = document.createElement('div'); nodeDiv.className = 'brain-node';
const keySpan = document.createElement('span'); keySpan.className = 'brain-key';
const formattedKey = key.includes('__') ? `"${key.replace(/__/g, ' ')}"` : `"${key}"`;
keySpan.innerText = `${formattedKey}: `;
const valuesDiv = document.createElement('div'); valuesDiv.className = 'brain-values'; valuesDiv.innerText = JSON.stringify(targetData[key]);
keySpan.addEventListener('click', () => nodeDiv.classList.toggle('expanded'));
nodeDiv.appendChild(keySpan); nodeDiv.appendChild(valuesDiv); explorerContainer.appendChild(nodeDiv);
});
}

function learnFromSentence(text) {
if (text.toLowerCase().trim() === "meebo wipe memory") return;
const words = text.trim().split(/\s+/); if (words.length < 2) return;
for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i].toLowerCase(); const nextWord = words[i + 1];
if (!currentBrainData.chaotic[currentWord]) currentBrainData.chaotic[currentWord] = [];
if (!currentBrainData.chaotic[currentWord].includes(nextWord)) currentBrainData.chaotic[currentWord].push(nextWord);
}
if (words.length >= 3) {
for (let i = 0; i < words.length - 2; i++) {
const currentPair = `${words[i].toLowerCase()}__${words[i+1].toLowerCase()}`; const nextWord = words[i + 2];
if (!currentBrainData.grammar[currentPair]) currentBrainData.grammar[currentPair] = [];
if (!currentBrainData.grammar[currentPair].includes(nextWord)) currentBrainData.grammar[currentPair].push(nextWord);
}
}
saveActiveBrain(); updateInterfaceCount();
if (explorerContainer.style.display === "block") renderBrainExplorer();
}

function generateChaoticReply(words) {
    let currentWord = ""; const cleanSpokenWords = words.map(w => w.toLowerCase());
    const validContextWords = cleanSpokenWords.filter(w => currentBrainData.chaotic[w]);
    if (smartToggle.checked && validContextWords.length > 0) {
        currentWord = validContextWords[Math.floor(Math.random() * validContextWords.length)];
    } else {
        const userSelection = cleanSpokenWords.filter(w => w.replace(/[^a-z]/g, "").length > 0);
        if (userSelection.length > 0) currentWord = userSelection[Math.floor(Math.random() * userSelection.length)];
        if (!currentWord || !currentBrainData.chaotic[currentWord]) {
            const keys = Object.keys(currentBrainData.chaotic); if (keys.length === 0) return "Active profile's memory paths are empty...";
            currentWord = keys[Math.floor(Math.random() * keys.length)];
        }
    }
    let sentence = [currentWord]; let wordPointer = currentWord;
    for (let i = 0; i < 12; i++) {
        const possibilities = currentBrainData.chaotic[wordPointer]; if (!possibilities || possibilities.length === 0) break;
        const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)]; sentence.push(nextWord); wordPointer = nextWord.toLowerCase();
    }
    let outStr = sentence.join(" "); return outStr.charAt(0).toUpperCase() + outStr.slice(1);
}

function generateGrammarReply(words) {
    let key1 = "", key2 = ""; const cleanWords = words.map(w => w.toLowerCase());
    if (smartToggle.checked) {
        if (cleanWords.length >= 2) {
            for (let i = 0; i < cleanWords.length - 1; i++) {
                const potentialPair = `${cleanWords[i]}__${cleanWords[i+1]}`;
                if (currentBrainData.grammar[potentialPair]) { key1 = cleanWords[i]; key2 = cleanWords[i+1]; break; }
            }
        }
        if (!key1 || !key2) {
            const matchingKeys = Object.keys(currentBrainData.grammar).filter(key => cleanWords.some(w => key.split('__').includes(w)));
            if (matchingKeys.length > 0) { const randomPair = matchingKeys[Math.floor(Math.random() * matchingKeys.length)]; [key1, key2] = randomPair.split('__'); }
        }
    } else {
        if (cleanWords.length >= 2) {
            for (let i = 0; i < cleanWords.length - 1; i++) {
                if (currentBrainData.grammar[`${cleanWords[i]}__${cleanWords[i+1]}`]) { key1 = cleanWords[i]; key2 = cleanWords[i+1]; break; }
            }
        }
    }
    const keys = Object.keys(currentBrainData.grammar);
    if (keys.length === 0) return "Active profile requires more pairs. Teach me multiple word combos!";
    if (!key1 || !key2) { const randomKey = keys[Math.floor(Math.random() * keys.length)]; [key1, key2] = randomKey.split('__'); }
    let sentence = [key1, key2];
    for (let i = 0; i < 14; i++) {
        const currentPair = `${key1}__${key2}`; const possibilities = currentBrainData.grammar[currentPair];
        if (!possibilities || possibilities.length === 0) break;
        const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)]; sentence.push(nextWord); key1 = key2; key2 = nextWord.toLowerCase();
    }
    let outStr = sentence.join(" "); return outStr.charAt(0).toUpperCase() + outStr.slice(1);
}

function startAudioVisualizer(type, calculatedTone = "neutral") {
    isVisualizerActive = true; canvas.style.display = "block";
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const waveColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || "#0ebd84";

    function drawLoop() {
        if (!isVisualizerActive) return;
        animationFrameId = requestAnimationFrame(drawLoop);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2; ctx.strokeStyle = waveColor; ctx.beginPath();
        const width = canvas.width; const height = canvas.height; const midY = height / 2;

        if (type === "mic" && analyser) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount); analyser.getByteTimeDomainData(dataArray);
            const sliceWidth = width / dataArray.length; let x = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const v = dataArray[i] / 128.0; const y = v * midY;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                x += sliceWidth;
            }
        } else if (type === "tts") {
            let amplitude = 8; let frequency = 0.08;
            if (calculatedTone === "angry") { amplitude = 14; frequency = 0.18; }
            else if (calculatedTone === "kind") { amplitude = 4; frequency = 0.04; }
            syntheticWavePhase += frequency;
            for (let x = 0; x < width; x++) {
                const y = midY + Math.sin(x * 0.05 + syntheticWavePhase) * Math.cos(x * 0.01 + syntheticWavePhase) * amplitude;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
    drawLoop();
}

function stopAudioVisualizer() {
    isVisualizerActive = false; if (animationFrameId) cancelAnimationFrame(animationFrameId);
    ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = "none";
}

// 📐 VERTICALLY OVERALIGNED DICTIONARY MAPS TO REMOVE EDGE SPILLAGE
function analyzeInputTone(text) {
    const LowerText = text.toLowerCase();
    
    const kindWords = [
        "love", "happy", "nice", "good", "great", 
        "cool", "friend", "best", "thank", "awesome", 
        "please", "sweet", "calm", "slow"
    ];
    
    const angryWords = [
        "hate", "mad", "angry", "stop", "bad", 
        "worst", "broken", "dumb", "stupid", "annoying", 
        "loud", "fast", "shut", "kill"
    ];
    
    let score = 0;
    kindWords.forEach(w => { if(LowerText.includes(w)) score++; });
    angryWords.forEach(w => { if(LowerText.includes(w)) score--; });
    
    if (text === text.toUpperCase() && text.replace(/[^a-zA-Z]/g, "").length > 3) {
        score -= 2;
    }
    
    if (score > 0) return "kind";
    if (score < 0) return "angry";
    return "neutral";
}

function speakMeeboText(textToSpeak, calculatedTone) {
    if ('speechSynthesis' in window && ttsToggle.checked) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const availableVoices = window.speechSynthesis.getVoices();
        let targetVoice = availableVoices.find(v => v.name.includes("Chrome OS US English Male")) || availableVoices.find(v => v.name.includes("Google US English Male"));
        if (targetVoice) utterance.voice = targetVoice;
        
        let chosenRate = 0.82; let chosenPitch = 0.35;
        if (emotionToggle.checked) {
            if (calculatedTone === "angry") { chosenRate = 1.25; chosenPitch = 0.15; }
            else if (calculatedTone === "kind") { chosenRate = 0.75; chosenPitch = 0.55; }
        }
        utterance.rate = chosenRate; utterance.pitch = chosenPitch;
        utterance.onstart = () => { isMeeboSpeaking = true; startAudioVisualizer("tts", calculatedTone); };
        utterance.onend = () => { isMeeboSpeaking = false; stopAudioVisualizer(); };
        utterance.onerror = () => { isMeeboSpeaking = false; stopAudioVisualizer(); };
        window.speechSynthesis.speak(utterance);
    }
}

function handleWipe() {
currentBrainData = { chaotic: {}, grammar: {} }; saveActiveBrain(); updateInterfaceCount();
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
        const words = text.trim().split(/\s+/); const currentTone = analyzeInputTone(text);
        let activeMode = modeSelect.value;
        if (emotionToggle.checked) {
            if (currentTone === "angry") activeMode = "chaotic";
            if (currentTone === "kind") activeMode = "grammar";
        }
        const reply = activeMode === "chaotic" ? generateChaoticReply(words) : generateGrammarReply(words);
        let emotionLabel = (emotionToggle.checked && currentTone !== "neutral") ? ` [Tone: ${currentTone.toUpperCase()}]` : "";
        appendMessage("Meebo" + emotionLabel, reply, "meebo-msg");
        speakMeeboText(reply, currentTone);
    }, 500);
}
}

function updateInterfaceCount() {
if (vocabCount && currentBrainData) {
const mode = modeSelect.value; const target = currentBrainData[mode] || {};
vocabCount.innerText = `${Object.keys(target).length} (${mode})`;
}
}

// 😊 VERTICAL STACKED EMOJI SELECTIONS MATRIX populator
const emojisList = [
    "🤖", "🦾", "👾", "🚀", "⚡", "🔋", 
    "🧠", "✨", "🔥", "💬", "🎮", "🛸", 
    "👀", "👍", "👑", "❤️", "⭐", "🎵"
];
emojisList.forEach(emoji => {
    const btn = document.createElement('button'); btn.className = 'emoji-btn'; btn.innerText = emoji; btn.type = 'button';
    btn.addEventListener('click', () => { userInput.value += emoji; userInput.focus(); });
    if (emojiPanel) emojiPanel.appendChild(btn);
});

if (recognition) {
    micBtn.addEventListener('click', async () => {
        if (isMeeboSpeaking) return;
        if (micBtn.classList.contains('listening')) { recognition.stop(); } else {
            window.speechSynthesis.cancel(); isMeeboSpeaking = false;
            try {
                if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                analyser = audioContext.createAnalyser(); analyser.fftSize = 256;
                sourceNode = audioContext.createMediaStreamSource(micStream); sourceNode.connect(analyser);
                startAudioVisualizer("mic");
            } catch(e) {}
            setTimeout(() => {
                userInput.value = ""; userInput.placeholder = "Listening to your voice...";
                micBtn.classList.add('listening'); micBtn.innerText = "🛑";
                try { recognition.start(); } catch(err) { micBtn.classList.remove('listening'); micBtn.innerText = "🎙️"; stopAudioVisualizer(); }
            }, 100);
        }
    });

    recognition.onresult = (event) => {
        let transcript = event.results[event.results.length - 1].transcript;
        transcript = transcript.replace(/\bamiibo\b/gi, "Meebo").replace(/\bameebo\b/gi, "Meebo");
        userInput.value = transcript;
    };
    recognition.onspeechend = () => { recognition.stop(); };
    recognition.onend = () => {
        micBtn.classList.remove('listening'); micBtn.innerText = "🎙️"; userInput.placeholder = "Type a message to Meebo...";
        stopAudioVisualizer(); if (micStream) { micStream.getTracks().forEach(track => track.stop()); micStream = null; }
        if (userInput.value.trim() !== "") handleSend();
    };
    recognition.onerror = () => { micBtn.classList.remove('listening'); micBtn.innerText = "🎙️"; userInput.placeholder = "Type a message to Meebo..."; stopAudioVisualizer(); if (micStream) { micStream.getTracks().forEach(track => track.stop()); micStream = null; } };
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
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
} catch (err) {}
}; reader.readAsText(file);
});

brainSelect.addEventListener('change', (e) => { activeBrainId = e.target.value; loadActiveBrain(); });
modeSelect.addEventListener('change', () => { updateInterfaceCount(); if (explorerContainer.style.display === "block") renderBrainExplorer(); });
downloadBtn.addEventListener('click', () => {
const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentBrainData, null, 2));
const downloadAnchor = document.createElement('a'); downloadAnchor.setAttribute("href", dataStr);
downloadAnchor.setAttribute("download", `${activeBrainId}_brain.json`); document.body.appendChild(downloadAnchor);
downloadAnchor.click(); downloadAnchor.remove();
});

toggleExplorerBtn.addEventListener('click', () => {
    if (explorerContainer.style.display === "block") { explorerContainer.style.display = "none"; toggleExplorerBtn.innerText = "🔍 View Brain"; } 
    else { explorerContainer.style.display = "block"; toggleExplorerBtn.innerText = "🙈 Hide Brain"; renderBrainExplorer(); }
});

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

loadIndex(); loadSavedThemeSettings(); loadActiveBrain();
