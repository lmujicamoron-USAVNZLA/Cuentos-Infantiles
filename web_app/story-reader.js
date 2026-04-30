/**
 * Story Reader Kids - V20 Generation
 * Logic for story reading, TTS, SFX, and translation
 */

let isSpeaking = false;
let isMusicPlaying = false;
let isEnglish = false;
let englishPages = null;
const synth = window.speechSynthesis;
let storyPages = [];
let currentPage = 0;

const musicThemes = {
    fantasy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    space: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    adventure: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    happy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    forest: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
};

// --- SISTEMA DE SFX CONTEXTUAL (V17) ---
const sfxAssets = {
    magic: "https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3",
    dragon: "https://assets.mixkit.co/active_storage/sfx/2237/2237-preview.mp3",
    hero: "https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3",
    battle: "https://assets.mixkit.co/active_storage/sfx/2555/2555-preview.mp3",
    space: "https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3",
    forest: "https://assets.mixkit.co/active_storage/sfx/2143/2143-preview.mp3",
    water: "https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3",
    treasure: "https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3",
    victory: "https://assets.mixkit.co/active_storage/sfx/133/133-preview.mp3"
};

let playedKeywordsInPage = new Set();

function playContextualSFX(text) {
    if (!text) return;
    // Limpiar texto de etiquetas markdown para evitar falsos positivos
    const cleanText = sanitizeText(text).toLowerCase();
    
    const keywordMap = {
        // PRIORIDAD 1: Magia y Héroes
        '\\b(hada|magia|varita|hechizo|mágico|brillo|encantamiento)\\b': 'magic',
        '\\b(héroe|heroína|superhéroe|mujer maravilla|wonder woman|batman|superman|ironman|spiderman|bugs bunny|valiente|fuerte|maravilla|protector)\\b': 'hero',
        
        // PRIORIDAD 2: Acción y Peligro
        '\\b(pelea|batalla|golpe|punch|escudo|espada|ataque|lucha)\\b': 'battle',
        '\\b(dragón|monstruo|rugido|dinosaurio|peligro|bestia|gigante)\\b': 'dragon',
        
        // PRIORIDAD 3: Ambientes
        '\\b(espacio|cohete|robot|estrella|galaxia|marte|luna|nave)\\b': 'space',
        '\\b(bosque|naturaleza|pájaro|animal|árbol|selva|campo)\\b': 'forest',
        '\\b(agua|mar|océano|río|nadar|burbuja|playa|pez)\\b': 'water',
        '\\b(tesoro|oro|moneda|joya|cofre|diamante|recompensa)\\b': 'treasure'
    };

    for (let [pattern, audioKey] of Object.entries(keywordMap)) {
        if (new RegExp(pattern, 'i').test(cleanText) && !playedKeywordsInPage.has(audioKey)) {
            console.log("🔊 Activando SFX Contextual:", audioKey);
            const audio = new Audio(sfxAssets[audioKey]);
            audio.volume = 0.4;
            audio.play().catch(e => console.warn("Browser blocked SFX auto-play"));
            playedKeywordsInPage.add(audioKey);
            break; 
        }
    }
}

// --- SISTEMA DE MÚSICA MÁGICA ---
function toggleMusic() {
    const music = document.getElementById('bgMusic');
    const btn = document.getElementById('musicBtn');
    
    if (isMusicPlaying) {
        music.pause();
        isMusicPlaying = false;
        btn.style.background = '#64748b'; // Gris cuando apagado
        btn.classList.remove('active');
    } else {
        music.play().then(() => {
            isMusicPlaying = true;
            btn.classList.add('active');
            btn.style.background = '#10b981'; // Verde cuando encendido
        }).catch(e => {
            console.log("Error playing music:", e);
            alert("⚠️ Pulsa cualquier parte de la pantalla primero para activar la música.");
        });
    }
}

// --- SISTEMA DE VOZ MÁGICA (TTS) ---
function toggleSpeech() {
    if (isSpeaking) {
        synth.cancel();
        isSpeaking = false;
        updateSpeakerIcon(false);
    } else {
        readCurrentPage();
    }
}

function readCurrentPage() {
    const p = storyPages[currentPage];
    let textToRead = "";

    if (p.type === 'cover') {
        textToRead = `Hoy leeremos: ${p.title}. ${p.body}`;
    } else if (p.type === 'story') {
        textToRead = p.body;
    } else if (p.type === 'end') {
        textToRead = `Fin. ${p.body}`;
    }

    if (!textToRead) return;

    synth.cancel(); // Detener cualquier lectura previa
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = isEnglish ? 'en-US' : 'es-ES';

    // Intentar buscar una voz más amigable
    const voices = synth.getVoices();
    const targetLang = isEnglish ? 'en' : 'es';
    const voice = voices.find(v => v.lang.startsWith(targetLang) && v.name.includes('Google')) ||
        voices.find(v => v.lang.startsWith(targetLang));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
        isSpeaking = true;
        updateSpeakerIcon(true);
    };

    utterance.onend = () => {
        isSpeaking = false;
        updateSpeakerIcon(false);
        document.querySelectorAll('.word-highlight').forEach(el => el.classList.remove('word-highlight'));
    };

    utterance.onerror = (e) => {
        console.error("TTS Error:", e);
        isSpeaking = false;
        updateSpeakerIcon(false);
    };

    utterance.onboundary = (event) => {
        if (event.name === 'word' && p.type === 'story') {
            const charIndex = event.charIndex;
            const words = p.body.split(' ');
            let currentPos = 0;
            for (let i = 0; i < words.length; i++) {
                // El +1 es por el espacio
                if (charIndex >= currentPos && charIndex <= currentPos + words[i].length) {
                    highlightWord(i);
                    break;
                }
                currentPos += words[i].length + 1;
            }
        }
    };

    synth.speak(utterance);
}

function highlightWord(index) {
    document.querySelectorAll('.word-highlight').forEach(el => el.classList.remove('word-highlight'));
    const wordEl = document.getElementById(`word-${index}`);
    if (wordEl) {
        wordEl.classList.add('word-highlight');
    }
}

function updateSpeakerIcon(active) {
    const icon = document.getElementById('speakerIcon');
    const btn = document.getElementById('speakBtn');

    if (active) {
        btn.classList.add('active-speaker');
        icon.innerHTML = `
            <rect x="6" y="6" width="12" height="12" fill="currentColor" opacity="0.8" />
        `;
    } else {
        btn.classList.remove('active-speaker');
        icon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        `;
    }
}

// --- SISTEMA DE LIMPIEZA DE TEXTO (Markdown strip) ---
function sanitizeText(text) {
    if (!text) return "";
    return text.replace(/\*\*+/g, '')  // Eliminar **
               .replace(/#+/g, '')    // Eliminar #
               .replace(/__+/g, '')   // Eliminar __
               .replace(/`+/g, '')    // Eliminar backticks
               .trim();
}

// --- SISTEMA DE PARTÍCULAS MÁGICAS TEMÁTICAS ---
const canvas = document.getElementById('magicCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let currentTheme = 'happy';

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y, isCollectible = false) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.isCollectible = isCollectible;
        
        if (isCollectible) {
            this.size = Math.random() * 8 + 6;
            this.color = '#fbbf24';
            this.speedX = (Math.random() - 0.5) * 4;
            this.speedY = (Math.random() - 0.5) * 4;
            this.life = 2.0; // Dura más
        } else if (currentTheme === 'space') {
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = -Math.random() * 2 - 0.5;
            this.color = Math.random() > 0.5 ? '#ffffff' : '#67e8f9';
        } 
        else if (currentTheme === 'forest') {
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 + 0.5;
            this.color = Math.random() > 0.5 ? '#4ade80' : '#84cc16';
            this.size = Math.random() * 6 + 3; 
        }
        else if (currentTheme === 'ocean' || currentTheme === 'beach') {
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = -Math.random() * 1.5 - 0.5;
            this.color = '#7dd3fc';
        }
        else {
            this.speedX = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 3 - 1.5;
            this.color = `hsl(${Math.random() * 60 + 280}, 100%, 70%)`; 
        }
        this.life = 1;
    }
    update() {
        if (this.isCollectible) {
            this.x += this.speedX;
            this.y += this.speedY;
            this.speedX *= 0.98;
            this.speedY *= 0.98;
        } else if (currentTheme === 'forest') {
            this.x += Math.sin(this.life * 10) * 0.5;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= (this.isCollectible) ? 0.005 : (currentTheme === 'space' ? 0.01 : 0.02);
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        if (this.isCollectible) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fbbf24';
            ctx.font = `${this.size * 2}px serif`;
            ctx.fillText('✨', this.x - this.size, this.y + this.size);
            ctx.restore();
            return;
        }
        if (currentTheme === 'forest') {
            ctx.ellipse(this.x, this.y, this.size, this.size/2, this.life * Math.PI, 0, Math.PI * 2);
        } else {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        }
        ctx.fill();
    }
}

function createMagicDust(x, y, isCollectible = false) {
    const count = isCollectible ? 5 : 20;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, isCollectible));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(animateParticles);
}

function createBackgroundSparkle() {
    if (particles.length < 50) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const p = new Particle(x, y);
        p.speedX *= 0.2;
        p.speedY *= 0.2;
        p.life = Math.random() * 0.5 + 0.5;
        particles.push(p);
    }
}
setInterval(createBackgroundSparkle, 200);

let magicScore = 0;
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.isCollectible) {
            const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
            if (dist < 30) {
                particles.splice(i, 1);
                magicScore += 10;
                const scoreEl = document.getElementById('magicScore');
                if (scoreEl) scoreEl.innerText = magicScore;
                createMagicDust(p.x, p.y);
                const collectSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
                collectSfx.volume = 0.2;
                collectSfx.play().catch(() => {});
                break;
            }
        }
    }
});

async function initReader() {
    const storyId = localStorage.getItem('currentStoryId');
    if (!storyId) { window.location.href = 'dashboard.html'; return; }

    try {
        let data = null;
        if (navigator.onLine) {
            try {
                const doc = await db.collection("stories").doc(storyId).get();
                if (doc.exists) {
                    data = doc.data();
                    localStorage.setItem(`cached_story_${storyId}`, JSON.stringify(data));
                }
            } catch (netErr) {
                console.warn("⚠️ Error de red:", netErr);
            }
        }

        if (!data) {
            const cached = localStorage.getItem(`cached_story_${storyId}`);
            if (cached) data = JSON.parse(cached);
        }

        if (data) {
            const charImg = data.characterImg || getRelImg(data.character);
            const placeImg = data.placeImg || "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800";

            storyPages = [];
            storyPages.push({
                type: 'cover',
                title: sanitizeText(data.title),
                body: sanitizeText(`Una aventura mágica creada especialmente para ti en ${data.place}`), 
                img: data.coverImg || charImg
            });

            let cleanContent = sanitizeText(data.content.replace(/(\r\n|\n|\r)/gm, " "));
            let sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || [cleanContent];

            let currentChunk = "";
            let sentenceCount = 0;

            sentences.forEach((sentence, index) => {
                currentChunk += sentence + " ";
                sentenceCount++;
                if (sentenceCount >= 3 || index === sentences.length - 1) {
                    storyPages.push({
                        type: 'story',
                        title: "",
                        body: currentChunk.trim(),
                        img: (storyPages.length % 2 !== 0) ? charImg : placeImg
                    });
                    currentChunk = "";
                    sentenceCount = 0;
                }
            });

            storyPages.push({
                type: 'end',
                title: "Fin",
                body: "¡Gracias por leer esta aventura!",
                img: charImg
            });

            const totalNumEl = document.getElementById('totalNum');
            if (totalNumEl) totalNumEl.innerText = storyPages.length;
            currentPage = 0;

            const musicTheme = data.musicTheme || 'happy';
            currentTheme = musicTheme;
            const music = document.getElementById('bgMusic');
            const ambient = document.getElementById('ambientLoop');
            
            stopAllAudio();

            music.src = musicThemes[musicTheme];
            
            const ambientMaps = {
                fantasy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
                space: "https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3",
                forest: "https://assets.mixkit.co/active_storage/sfx/2143/2143-preview.mp3",
                adventure: "https://assets.mixkit.co/active_storage/sfx/2555/2555-preview.mp3",
                happy: "https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3"
            };
            ambient.src = ambientMaps[musicTheme] || ambientMaps.happy;
            ambient.volume = 0.15;

            music.play().then(() => {
                isMusicPlaying = true;
                ambient.play().catch(() => {});
                if (window.Sparky) Sparky.say("¡Siente la música del reino! 🎶✨");
            }).catch(() => {
                isMusicPlaying = false;
                const mbtn = document.getElementById('musicBtn');
                if (mbtn) mbtn.classList.remove('active');
            });
            
            setInterval(() => {
                if (currentPage > 0 && Math.random() > 0.7) {
                    createMagicDust(Math.random() * canvas.width, Math.random() * canvas.height, true);
                }
            }, 3000);

            updateUI();
        }
    } catch (e) {
        console.error(e);
        window.location.href = 'dashboard.html';
    }
}

function openPuzzle() {
    const img = document.getElementById('storyImg').src;
    localStorage.setItem('lastStoryImg', img);
    window.location.href = 'puzzles.html';
}

function getRelImg(char) {
    if (char === 'Robot') return "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&w=800";
    if (char === 'Unicornio') return "https://images.unsplash.com/photo-1550747528-cdb45925b3f7?auto=format&w=800";
    return "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&w=800";
}

function updateUI() {
    const p = storyPages[currentPage];
    const titleEl = document.getElementById('storyTitle');
    const bodyEl = document.getElementById('storyBody');
    const imgEl = document.getElementById('storyImg');

    if (imgEl.getAttribute('src') !== p.img) {
        imgEl.style.opacity = '0';
        setTimeout(() => {
            imgEl.src = p.img;
            imgEl.onload = () => { imgEl.style.opacity = '1'; };
        }, 200);
    } else {
        imgEl.style.opacity = '1';
    }

    if (p.type === 'cover') {
        titleEl.style.display = 'block';
        titleEl.innerText = p.title;
        titleEl.style.fontSize = '2.5rem';
        bodyEl.innerText = p.body;
        bodyEl.style.fontStyle = 'italic';
        bodyEl.style.textAlign = 'center';
    } else if (p.type === 'story') {
        titleEl.style.display = 'none';
        const words = p.body.split(' ');
        bodyEl.innerHTML = words.map((w, i) => `<span id="word-${i}">${w}</span>`).join(' ');
        bodyEl.style.fontStyle = 'normal';
        bodyEl.style.textAlign = 'left';
    } else if (p.type === 'end') {
        titleEl.style.display = 'block';
        titleEl.innerText = "¡Misión Cumplida!";
        bodyEl.innerText = "¡Eres un gran lector! Has completado esta aventura mágica.";
        bodyEl.style.fontStyle = 'normal';
        bodyEl.style.textAlign = 'center';
        for(let i=0; i<3; i++) {
            setTimeout(() => createMagicDust(Math.random() * window.innerWidth, Math.random() * window.innerHeight), i * 300);
        }
        const victoryAudio = new Audio(sfxAssets.victory);
        victoryAudio.volume = 0.5;
        victoryAudio.play().catch(e => console.log("Victory sound blocked"));
    }

    const curNumEl = document.getElementById('currNum');
    if (curNumEl) curNumEl.innerText = currentPage + 1;

    const prevBtn = document.getElementById('prevPage');
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    
    const nextBtn = document.getElementById('nextPage');

    if (currentPage === storyPages.length - 1) {
        const user = firebase.auth().currentUser;
        if (user) {
            db.collection("users").doc(user.uid).update({
                badges: firebase.firestore.FieldValue.arrayUnion('story_read')
            }).catch(e => console.log("Error al dar medalla:", e));
            
            // RECOMPENSA V22: Polvo de Hada por leer (Evitar recompensas múltiples en la misma sesión)
            if (typeof rewardMagicDust === 'function' && !window.storyRewardGranted) {
                rewardMagicDust(10);
                window.storyRewardGranted = true;
                if (window.Sparky) Sparky.say("¡Por ser un lector estrella, ganaste 10 ✨ de polvo de hada! 📚🐉", 5000);
            }
        }
        nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
        nextBtn.onclick = () => window.location.href = 'dashboard.html';
        nextBtn.style.background = '#ef4444';
        nextBtn.style.boxShadow = '0 6px 15px rgba(239, 68, 68, 0.4)';
    } else {
        nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
        nextBtn.onclick = () => changePage(1);
        nextBtn.style.background = 'var(--primary)';
        nextBtn.style.boxShadow = '0 10px 20px rgba(99, 102, 241, 0.3)';
    }

    playedKeywordsInPage.clear();
    setTimeout(() => playContextualSFX(p.body), 1500);

    const progress = ((currentPage + 1) / storyPages.length) * 100;
    const barFill = document.getElementById('readerProgressFill');
    if (barFill) barFill.style.width = `${progress}%`;

    if (window.Sparky && currentPage > 0) {
        const stepPhrases = [
            "¡Increíble descubrimiento! 🕵️‍♂️",
            "¡Eres un gran lector! ⭐",
            "¡Qué valentía la de este cuento! ⚔️",
            "¿Qué pasará después? 🤔✨",
            "¡Tus ojos brillan como estrellas! ✨"
        ];
        if (currentPage % 2 === 0 && currentPage < storyPages.length - 1) {
            Sparky.say(stepPhrases[Math.floor(Math.random() * stepPhrases.length)]);
        }
    }
}

function stopAllAudio() {
    const music = document.getElementById('bgMusic');
    const ambient = document.getElementById('ambientLoop');
    if (music) { music.pause(); music.currentTime = 0; }
    if (ambient) { ambient.pause(); ambient.currentTime = 0; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function changePage(delta) {
    currentPage += delta;
    const pageTurn = document.getElementById('pageTurnSfx');
    if (pageTurn) { pageTurn.currentTime = 0; pageTurn.play().catch(() => {}); }
    createMagicDust(window.innerWidth / 2, window.innerHeight / 2);
    if (isSpeaking) {
        synth.cancel();
        isSpeaking = false;
        updateSpeakerIcon(false);
        setTimeout(() => readCurrentPage(), 500);
    }
    updateUI();
}

async function reportContent() {
    const storyId = localStorage.getItem('currentStoryId');
    if (!storyId) return;
    const confirmed = confirm("¿Deseas reportar esta historia como inapropiada? ✨ Nuestro equipo la revisará de inmediato.");
    if (!confirmed) return;
    try {
        await db.collection("stories").doc(storyId).update({
            flagged: true,
            flaggedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Gracias por ayudarnos a mantener la magia segura. La historia ha sido reportada.");
        window.location.href = 'dashboard.html';
    } catch (e) {
        console.error("Error al reportar:", e);
        alert("Hubo un error al enviar el reporte. Inténtalo de nuevo.");
    }
}

async function translateText(text, target) {
    try {
        const prompt = `Translate this children's story to English (Keep it magical and only output the story): "${text}"`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); 
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=mistral&key=pk_iOJLArs0DLNG7EGm`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("Pollinations Down");
        let translated = await response.text();
        if (translated.trim().startsWith('{') && translated.trim().endsWith('}')) {
            try {
                const jsonData = JSON.parse(translated);
                translated = jsonData.content || jsonData.text || jsonData.story || jsonData.response || "";
            } catch (e) {
                translated = translated.replace(/\{"role":"assistant","reasoning_content":".*?","content":"/i, '')
                                       .replace(/","content":".*?"\}$/i, '')
                                       .replace(/\}$/i, '')
                                       .replace(/^\{/i, '')
                                       .trim();
            }
        }
        translated = translated.replace(/<(thought|reasoning)>[\s\S]*?<\/\1>/gi, '').trim();
        if (!translated || translated.length < 50) throw new Error("Short response");
        return translated;
    } catch (e) {
        console.warn("Pollinations failed, using fallback magic:", e);
        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`);
            const data = await res.json();
            return data[0].map(s => s[0]).join('');
        } catch (err) {
            throw new Error("All magic exhausted");
        }
    }
}

async function toggleLanguage() {
    const storyId = localStorage.getItem('currentStoryId');
    if (!storyId) return;

    if (isEnglish) {
        isEnglish = false;
        const langText = document.getElementById('langText');
        if (langText) langText.innerText = 'EN';
        const cachedES = localStorage.getItem(`cached_story_es_${storyId}`);
        if (cachedES) {
            storyPages = JSON.parse(cachedES);
            updateUI();
        } else {
            location.reload();
        }
    } else {
        const btn = document.getElementById('langBtn');
        const langText = document.getElementById('langText');
        if (!localStorage.getItem(`cached_story_es_${storyId}`)) {
            localStorage.setItem(`cached_story_es_${storyId}`, JSON.stringify(storyPages));
        }
        if (langText) langText.innerText = '🪄';
        btn.disabled = true;

        try {
            if (!englishPages) {
                const cachedEN = localStorage.getItem(`cached_story_en_${storyId}`);
                if (cachedEN) englishPages = JSON.parse(cachedEN);
            }
            if (!englishPages) {
                const fullContent = storyPages.filter(p => p.type === 'story').map(p => p.body).join(' ');
                const translatedText = await translateText(fullContent, 'en');
                const sentences = translatedText.replace(/(\r\n|\n|\r)/gm, " ").trim().match(/[^.!?]+[.!?]+/g) || [translatedText];
                englishPages = [];
                let currentChunk = "";
                let count = 0;
                sentences.forEach((s, idx) => {
                    currentChunk += s + " ";
                    count++;
                    if (count >= 3 || idx === sentences.length - 1) {
                        englishPages.push(currentChunk.trim());
                        currentChunk = "";
                        count = 0;
                    }
                });
                localStorage.setItem(`cached_story_en_${storyId}`, JSON.stringify(englishPages));
            }

            let storyIdx = 0;
            storyPages.forEach(p => {
                if (p.type === 'story' && englishPages[storyIdx]) {
                    p.body = englishPages[storyIdx];
                    storyIdx++;
                } else if (p.type === 'cover') {
                    p.title = "A Magic Adventure";
                    p.body = "A story created with magic ✨";
                } else if (p.type === 'end') {
                    p.title = "The End";
                    p.body = "The adventure was wonderful! Ready for another?";
                }
            });

            isEnglish = true;
            if (langText) langText.innerText = 'ES';
            updateUI();
            createMagicDust(window.innerWidth/2, window.innerHeight/2);
        } catch (err) {
            console.error(err);
            alert("¡Ops! Las hadas están algo dormidas. Usando magia de reserva...");
        } finally {
            if (langText && !isEnglish) langText.innerText = 'EN';
            btn.disabled = false;
        }
    }
}

function getBase64ImageFromUrl(imageUrl) {
    return new Promise((resolve, reject) => {
        const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl.replace(/^https?:\/\//, ''))}&output=webp`;
        let img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            let dataURL = canvas.toDataURL("image/jpeg", 0.8);
            resolve(dataURL);
        };
        img.onerror = () => reject("Error loading image from proxy");
        img.src = proxyUrl;
    });
}

async function generateStoryPDF() {
    const btn = document.getElementById('pdfBtn');
    if (!btn) return;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '⏳';
    btn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a5');
        const title = document.getElementById('storyTitle').innerText || "Mi Cuento Mágico";
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 30;
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, 250, 'F');
        doc.setFontSize(22);
        doc.setTextColor(99, 102, 241);
        const splitTitle = doc.splitTextToSize(title, pageWidth - 20);
        doc.text(splitTitle, pageWidth / 2, y, { align: 'center' });
        y += (splitTitle.length * 10) + 10;
        doc.setFontSize(12);
        doc.setTextColor(148, 163, 184);
        doc.text("Un cuento mágico ilustrado", pageWidth / 2, y, { align: 'center' });
        y += 15;
        const p = storyPages.find(page => page.type === 'cover' || page.type === 'story');
        if (p && p.img) {
            try {
                const base64Img = await getBase64ImageFromUrl(p.img);
                const imgWidth = 100;
                const imgHeight = 100;
                doc.addImage(base64Img, 'JPEG', (pageWidth - imgWidth) / 2, y, imgWidth, imgHeight); 
                y += imgHeight + 20;
            } catch (e) {
                console.warn("No se pudo proxy-cachear la imagen de IA:", e);
                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(24, y, 100, 100, 5, 5, 'FD');
                doc.text("Dibuja a tu héroe aquí", pageWidth / 2, y + 50, { align: 'center' });
                y += 120;
            }
        }
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("Creado en Story Creator Kids", pageWidth / 2, y, { align: 'center' });
        const textPages = storyPages.filter(page => page.type === 'story');
        for (let i = 0; i < textPages.length; i++) {
            doc.addPage();
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, 250, 'F');
            doc.setFontSize(14);
            doc.setTextColor(51, 65, 85);
            const splitText = doc.splitTextToSize(textPages[i].body, pageWidth - 30);
            doc.text(splitText, 15, 30);
            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184);
            doc.text(`— Página ${i + 1} —`, pageWidth / 2, 195, { align: 'center' });
        }
        doc.save(`${title.replace(/\s+/g, '_')}_Librito.pdf`);
        alert("✨ ¡Tu libro real está listo! Ya puedes imprimirlo.");
    } catch (err) {
        console.error(err);
        alert("Ops, hubo un problema mágicos al ensamblar tu libro.");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

// --- SISTEMA DE DIBUJO Y CREATIVIDAD (V22) ---
const drawCanvas = document.getElementById('drawingCanvas');
const drawCtx = drawCanvas ? drawCanvas.getContext('2d') : null;
let isDrawing = false;
let brushColor = '#ef4444';
let brushSize = 5;
let drawingHistory = []; // Para el sistema de Undo
let currentPath = [];
let currentSticker = null;

if (drawCanvas) {
    // Ajustar resolución del canvas al tamaño visual
    const resizeDrawCanvas = () => {
        const rect = drawCanvas.getBoundingClientRect();
        drawCanvas.width = rect.width;
        drawCanvas.height = rect.height;
        redrawHistory();
    };
    window.addEventListener('resize', resizeDrawCanvas);
    setTimeout(resizeDrawCanvas, 1000); // Dar tiempo a que la imagen cargue

    drawCanvas.addEventListener('mousedown', startDrawing);
    drawCanvas.addEventListener('mousemove', draw);
    drawCanvas.addEventListener('mouseup', stopDrawing);
    drawCanvas.addEventListener('mouseout', stopDrawing);

    // Soporte táctil
    drawCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startDrawing(touch);
    }, { passive: false });
    drawCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        draw(touch);
    }, { passive: false });
    drawCanvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    if (currentSticker) {
        placeSticker(e);
        return;
    }
    isDrawing = true;
    currentPath = [];
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = drawCanvas.getBoundingClientRect();
    const x = (e.clientX || e.pageX) - rect.left;
    const y = (e.clientY || e.pageY) - rect.top;

    drawCtx.lineWidth = brushSize;
    drawCtx.lineCap = 'round';
    drawCtx.strokeStyle = brushColor;

    if (currentPath.length === 0) {
        drawCtx.beginPath();
        drawCtx.moveTo(x, y);
    } else {
        drawCtx.lineTo(x, y);
        drawCtx.stroke();
    }
    
    currentPath.push({ x, y, color: brushColor, size: brushSize, type: 'line' });
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        drawingHistory.push([...currentPath]);
        currentPath = [];
    }
}

function setBrushColor(color, el) {
    brushColor = color;
    currentSticker = null; // Desactivar sello al elegir color
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    if (el) el.classList.add('active');
    if (window.Sparky) Sparky.say("¡Qué color tan bonito! 🎨");
}

function undoLastAction() {
    if (drawingHistory.length > 0) {
        drawingHistory.pop();
        redrawHistory();
        if (window.Sparky) Sparky.say("¡No pasa nada! Lo borramos con magia. ↩️");
    }
}

function redrawHistory() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawingHistory.forEach(path => {
        if (path.length === 0) return;
        
        if (path[0].type === 'sticker') {
            const item = path[0];
            drawCtx.font = `${item.size * 8}px serif`;
            drawCtx.textAlign = 'center';
            drawCtx.textBaseline = 'middle';
            drawCtx.fillText(item.sticker, item.x, item.y);
        } else {
            drawCtx.beginPath();
            drawCtx.lineWidth = path[0].size;
            drawCtx.lineCap = 'round';
            drawCtx.strokeStyle = path[0].color;
            drawCtx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                drawCtx.lineTo(path[i].x, path[i].y);
            }
            drawCtx.stroke();
        }
    });
}

function clearDrawing() {
    if (confirm("¿Quieres borrar todo tu dibujo? ✨")) {
        drawingHistory = [];
        redrawHistory();
    }
}

function toggleStickers() {
    const selector = document.getElementById('stickerSelector');
    selector.classList.toggle('active');
}

function selectSticker(sticker) {
    currentSticker = sticker;
    toggleStickers();
    if (window.Sparky) Sparky.say("¡Has elegido un sello mágico! Toca la imagen para ponerlo. ✨");
}

function placeSticker(e) {
    const rect = drawCanvas.getBoundingClientRect();
    const x = (e.clientX || e.pageX) - rect.left;
    const y = (e.clientY || e.pageY) - rect.top;
    
    const stickerItem = [{ x, y, sticker: currentSticker, size: brushSize, type: 'sticker' }];
    drawingHistory.push(stickerItem);
    redrawHistory();
    
    // Pequeño efecto visual
    createMagicDust(e.clientX, e.clientY);
}

function downloadDrawing() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const img = document.getElementById('storyImg');
    
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    
    // Dibujar imagen original
    tempCtx.drawImage(img, 0, 0);
    
    // Dibujar el arte encima (escalado)
    const scaleX = tempCanvas.width / drawCanvas.width;
    const scaleY = tempCanvas.height / drawCanvas.height;
    
    drawingHistory.forEach(path => {
        if (path.length === 0) return;
        if (path[0].type === 'sticker') {
            const item = path[0];
            tempCtx.font = `${item.size * 8 * scaleX}px serif`;
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            tempCtx.fillText(item.sticker, item.x * scaleX, item.y * scaleY);
        } else {
            tempCtx.beginPath();
            tempCtx.lineWidth = path[0].size * scaleX;
            tempCtx.lineCap = 'round';
            tempCtx.strokeStyle = path[0].color;
            tempCtx.moveTo(path[0].x * scaleX, path[0].y * scaleY);
            for (let i = 1; i < path.length; i++) {
                tempCtx.lineTo(path[i].x * scaleX, path[i].y * scaleY);
            }
            tempCtx.stroke();
        }
    });
    
    const link = document.createElement('a');
    link.download = 'mi_obra_magica.png';
    link.href = tempCanvas.toDataURL();
    link.click();
}

async function saveDrawing() {
    downloadDrawing(); // Descargar para que el usuario tenga su copia
    if (window.Sparky) Sparky.say("¡Tu obra de arte ha sido guardada en tu dispositivo! ✨");
    alert("¡Obra guardada! ✨ Se ha descargado una copia de tu creación mágica.");
}

function toggleColoringMode() {
    const wrapper = document.getElementById('drawingWrapper');
    const toolbar = document.getElementById('drawingToolbar');
    const btn = document.getElementById('colorBtn');
    
    if (wrapper.classList.contains('coloring-active')) {
        wrapper.classList.remove('coloring-active');
        toolbar.classList.remove('active');
        btn.classList.remove('active');
    } else {
        wrapper.classList.add('coloring-active');
        toolbar.classList.add('active');
        btn.classList.add('active');
        if (window.Sparky) Sparky.say("¡Bienvenido al Taller de Arte! 🎨✨ ¡A divertirse!");
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.location.href = 'dashboard.html';
    }
    if (e.ctrlKey && e.key === 'z') {
        undoLastAction();
    }
});

// Start animation
animateParticles();
// Start reader
initReader();

