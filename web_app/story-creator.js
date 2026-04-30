/**
 * Story Creator Kids - V20 Generation
 * Logic for story creation and character management
 */

let currentStep = 1;
const totalSteps = 4;
const selections = {
    Personaje: '',
    Lugar: '',
    Titulo: '',
    PersonajeImg: '',
    LugarImg: '',
    PersonajePrompt: '', // ADN del Héroe
    musicTheme: 'happy'
};

// --- SISTEMA DE PESTAÑAS ---
function switchTab(tabId, btn) {
    // Desactivar todas las pestañas y contenidos
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // Activar seleccionada
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

// --- SISTEMA DE ÁLBUM DE HÉROES (Firestore V17) ---
async function loadHeroAlbum() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const grid = document.getElementById('heroAlbumGrid');
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;">🪄 Abriendo el cofre...</div>';

    try {
        const snapshot = await db.collection("users").doc(user.uid).collection("heroes").orderBy("createdAt", "desc").get();
        
        if (snapshot.empty) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">💎</div>
                    <p style="font-weight: 600;">Tu álbum está vacío.</p>
                    <p style="font-size: 0.9rem;">¡Genera un héroe con magia y guárdalo aquí!</p>
                </div>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const hero = doc.data();
            const card = createAssetCard('Personaje', hero.name, hero.url, 0, true, hero.descriptionPrompt || '');
            grid.appendChild(card);
        });
    } catch (e) {
        console.error("Error loading album:", e);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">Error al abrir el cofre mágico.</p>';
    }
}

async function saveHeroToAlbum(name, url, btn) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Debes entrar a tu cuenta para guardar héroes.");
        return;
    }

    if (btn.classList.contains('saved')) return;

    btn.innerHTML = '⏳';
    btn.disabled = true;

    try {
        await db.collection("users").doc(user.uid).collection("heroes").add({
            name: name,
            url: url,
            descriptionPrompt: btn.dataset.prompt || '', // Guardamos el ADN
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        btn.innerHTML = '💖';
        btn.classList.add('saved');
        btn.title = "¡Guardado en tu álbum!";
        
        // Efecto visual
        if (typeof createMagicDust === 'function') {
            createMagicDust(btn.getBoundingClientRect().left, btn.getBoundingClientRect().top);
        }
    } catch (e) {
        console.error("Error saving hero:", e);
        alert("Uy, no pudimos guardar a tu héroe. ¡Intenta de nuevo!");
        btn.innerHTML = '⭐';
        btn.disabled = false;
    }
}

// --- CARGA DE OPCIONES POR DEFECTO ---
function loadDefaultOptions() {
    const charGrid = document.getElementById('charactersGrid');
    const placeGrid = document.getElementById('placesGrid');

    // Sugerencias Iniciales de Personajes
    const defaultChars = [
        { name: 'Un Gato Valiente', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f431.svg' },
        { name: 'Un Robot Amigo', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f916.svg' },
        { name: 'Una Princesa Maga', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f478.svg' },
        { name: 'Un Dinosaurio', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f996.svg' }
    ];

    defaultChars.forEach((c, idx) => {
        const card = createAssetCard('Personaje', c.name, c.url, idx + 100);
        charGrid.appendChild(card);
    });

    // Sugerencias Iniciales de Lugares
    const defaultPlaces = [
        { name: 'Un Bosque Encantado', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f332.svg' },
        { name: 'El Espacio Exterior', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f680.svg' },
        { name: 'Un Castillo Mágico', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3f0.svg' }
    ];

    defaultPlaces.forEach((p, idx) => {
        const card = createAssetCard('Lugar', p.name, p.url, idx + 100);
        placeGrid.appendChild(card);
    });
}

function loadCustomAssets() {
    const assets = JSON.parse(localStorage.getItem('magicAssets') || '{"Personaje":[], "Lugar":[]}');

    // Cargar Personajes (Con verificación de seguridad)
    if (assets.Personaje && Array.isArray(assets.Personaje)) {
        const charGrid = document.getElementById('charactersGrid');
        assets.Personaje.forEach((asset, idx) => {
            const card = createAssetCard('Personaje', asset.name, asset.url, idx + 1);
            charGrid.prepend(card);
        });
    }

    // Cargar Lugares (Con verificación de seguridad)
    if (assets.Lugar && Array.isArray(assets.Lugar)) {
        const placeGrid = document.getElementById('placesGrid');
        assets.Lugar.forEach((asset, idx) => {
            const card = createAssetCard('Lugar', asset.name, asset.url, idx + 1);
            placeGrid.prepend(card);
        });
    }
}

function createAssetCard(type, name, url, index = 1, isFromAlbum = false, prompt = '') {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.dataset.prompt = prompt; // Guardamos el ADN en el elemento
    
    // Botón de Guardado (Solo para personajes nuevos buscados)
    let saveBtnHtml = '';
    if (type === 'Personaje' && !isFromAlbum) {
        saveBtnHtml = `<button class="save-hero-btn" data-prompt="${prompt}" onclick="event.stopPropagation(); saveHeroToAlbum('${name}', '${url}', this)" title="Guardar en mi álbum">⭐</button>`;
    } else if (isFromAlbum) {
        saveBtnHtml = `<div class="save-hero-btn saved" style="cursor: default;">💎</div>`;
    }

    card.onclick = function () { selectOption(this, type); };

    card.innerHTML = `
        ${saveBtnHtml}
        <div style="width: 140px; height: 140px; border-radius: 50%; overflow: hidden; margin: 0 auto 1rem; background: #fdf2f8; border: 4px solid white; box-shadow: 0 8px 20px rgba(99,102,241,0.15); position: relative; display: flex; align-items: center; justify-content: center;">
            <div class="img-loader-text" style="position: absolute; font-size: 1.2rem; font-weight: bold; color: #8b5cf6; z-index: 1; animation: pulse 1s infinite; text-align: center; width: 80%;">Buscando Magia...</div>
            <img src="${url}" alt="${name}"
                 style="width: 100%; height: 100%; object-fit: cover; position: relative; z-index: 2; opacity: 0; display: block; transition: opacity 0.8s ease-in-out;" 
                 onload="this.previousElementSibling.style.display='none'; this.style.opacity='1'; if(!selections['${type}Img']) selections['${type}Img'] = this.src;"
                 onerror="handleImageError(this, '${name}', '${type}', ${index})">
        </div>
        <h3>${name}</h3>
    `;
    return card;
}

// --- SISTEMA DE ERRORES INTELIGENTE ---
function handleImageError(img, name, type, index) {
    console.log("Magic Fallback for:", name);
    if (!img.dataset.tried) img.dataset.tried = "";
    
    // PRIORIDAD 0: Reintento con la misma URL (una vez)
    if (index === 0 && !img.dataset.retried) {
        img.dataset.retried = "true";
        setTimeout(() => {
            img.src = img.src + "&retry=" + Date.now();
        }, 2000);
        return;
    }

    const cleanName = name.toLowerCase().replace(/^(un |una |el |la |mi |un |el |al |de |los |las )+/, '').trim();

    // PRIORIDAD 1: Curated Library (solo si no se ha intentado ya)
    if (curatedImages[cleanName] && index === 0 && !img.dataset.tried.includes("curated")) {
        img.dataset.tried += "curated,";
        img.src = curatedImages[cleanName];
        return;
    }

    // PRIORIDAD 2: Master Dictionary Category Check
    const entry = Object.entries(masterDictionary).find(([k]) => new RegExp(`\\b${k}\\b`, 'i').test(cleanName));
    const category = entry ? entry[1].cat : 'subject';
    const subcategory = entry ? entry[1].sub : '';

    if (category === 'landscape' || subcategory === 'animal') {
        const unique_seed = encodeURIComponent(cleanName) + "_" + Math.floor(Math.random() * 9999);
        img.src = `https://api.dicebear.com/7.x/initials/svg?seed=${unique_seed}&backgroundColor=c084fc&fontSize=40&chars=A`;
    } else {
        // ULTIMATE V13: The Weserv Bridge
        const currentSrc = img.src;
        if (!img.dataset.retryLevel) img.dataset.retryLevel = '0';
        
        if (img.dataset.retryLevel === '0' && currentSrc.includes('pollinations.ai') && !img.dataset.tried.includes("weserv")) {
            img.dataset.retryLevel = '1';
            img.dataset.tried += "weserv,";
            img.src = `https://images.weserv.nl/?url=${encodeURIComponent(currentSrc.replace('https://', ''))}&fallback=https://api.dicebear.com/7.x/initials/svg?seed=error`;
            return;
        }

        const unique_seed = encodeURIComponent(cleanName) + "_" + index + "_" + Math.floor(Math.random() * 1000);
        if ((cleanName.includes('robot') || subcategory === 'robot') && !img.dataset.tried.includes("robot")) {
            img.dataset.tried += "robot,";
            if (index % 2 === 0) img.src = `https://robohash.org/${unique_seed}?set=set1&bgset=bg1`;
            else img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${unique_seed}&backgroundColor=fbbf24`;
        } else if ((subcategory === 'hero' || subcategory === 'tech-hero' || cleanName.match(/niño|niña|héroe|spiderman|ironman|batman/)) && !img.dataset.tried.includes("hero")) {
            img.dataset.tried += "hero,";
            const skinColors = ['f2d3b1', 'ecad80', 'd1a3a4', '825c44'];
            img.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${unique_seed}&backgroundColor=c084fc&skinColor=${skinColors[index % 4]}`;
            img.parentElement.style.background = '#c084fc';
        } else {
            // Final fallback: Initials
            img.src = `https://api.dicebear.com/7.x/initials/svg?seed=${unique_seed}&backgroundColor=c084fc&fontSize=40&chars=✨`.replace('✨', 'M');
        }
    }
}

// DICCIONARIO MAESTRO: Unificación total de términos y categorías
const masterDictionary = {
    // CATEGORÍA: SUJETOS (Personajes, Animales) -> Fallback: DiceBear
    'oso': { en: 'bear', cat: 'subject', sub: 'animal' },
    'mono': { en: 'monkey', cat: 'subject', sub: 'animal' },
    'jirafa': { en: 'giraffe', cat: 'subject', sub: 'animal' },
    'vaca': { en: 'cow', cat: 'subject', sub: 'animal' },
    'cerdo': { en: 'pig', cat: 'subject', sub: 'animal' },
    'caballo': { en: 'horse', cat: 'subject', sub: 'animal' },
    'raton': { en: 'mouse', cat: 'subject', sub: 'animal' },
    'ratón': { en: 'mouse', cat: 'subject', sub: 'animal' },
    'gallo': { en: 'rooster', cat: 'subject', sub: 'animal' },
    'perro': { en: 'dog', cat: 'subject', sub: 'animal' },
    'perrito': { en: 'cute dog', cat: 'subject', sub: 'animal' },
    'gato': { en: 'cat', cat: 'subject', sub: 'animal' },
    'gato con botas': { en: 'Puss in Boots', cat: 'subject', sub: 'character' },
    'botas': { en: 'boots', cat: 'modifier' },
    'gatito': { en: 'cute cat', cat: 'subject', sub: 'animal' },
    'leon': { en: 'lion', cat: 'subject', sub: 'animal' },
    'león': { en: 'lion', cat: 'subject', sub: 'animal' },
    'tigre': { en: 'tiger', cat: 'subject', sub: 'animal' },
    'elefante': { en: 'elephant', cat: 'subject', sub: 'animal' },
    'conejo': { en: 'rabbit', cat: 'subject', sub: 'animal' },
    'pajaro': { en: 'bird', cat: 'subject', sub: 'animal' },
    'pájaro': { en: 'bird', cat: 'subject', sub: 'animal' },
    'pulpo': { en: 'octopus', cat: 'subject', sub: 'animal' },
    'tiburon': { en: 'shark', cat: 'subject', sub: 'animal' },
    'tiburón': { en: 'shark', cat: 'subject', sub: 'animal' },
    'ballena': { en: 'whale', cat: 'subject', sub: 'animal' },
    'gallo': { en: 'colorful rooster', cat: 'subject' },
    'dinosaurio': { en: 'dinosaur', cat: 'subject' },
    'dragon': { en: 'dragon', cat: 'subject' },
    'dragón': { en: 'dragon', cat: 'subject' },
    'sapo': { en: 'frog', cat: 'subject' },
    'rana': { en: 'frog', cat: 'subject' },
    'sapito': { en: 'cute frog', cat: 'subject' },
    'superman': { en: 'Superman superhero, iconic blue suit and red cape, Clark Kent', cat: 'subject', sub: 'hero' },
    'batman': { en: 'Batman superhero, dark black tactical suit and cape, Bruce Wayne', cat: 'subject', sub: 'hero' },
    'spiderman': { en: 'Spider-man superhero, red and blue web suit, Peter Parker', cat: 'subject', sub: 'hero' },
    'el hombre araña': { en: 'Spider-man superhero, red and blue web suit, Peter Parker', cat: 'subject', sub: 'hero' },
    'hombre araña': { en: 'Spider-man superhero, red and blue web suit, Peter Parker', cat: 'subject', sub: 'hero' },
    'ironman': { en: 'Ironman superhero, red and gold metallic armor, glowing arc reactor, Tony Stark', cat: 'subject', sub: 'hero' },
    'iron man': { en: 'Ironman superhero, red and gold metallic armor, glowing arc reactor, Tony Stark', cat: 'subject', sub: 'hero' },
    'hulk': { en: 'giant green muscular superhero hulk, Bruce Banner', cat: 'subject', sub: 'hero' },
    'thor': { en: 'Thor superhero with hammer and lightning, god of thunder', cat: 'subject', sub: 'hero' },
    'wonderwoman': { en: 'Wonder Woman superhero, golden tiara, red/blue suit, Lasso of Truth, Diana Prince', cat: 'subject', sub: 'hero' },
    'wonder woman': { en: 'Wonder Woman superhero, golden tiara, red/blue suit, Lasso of Truth, Diana Prince', cat: 'subject', sub: 'hero' },
    'la mujer maravilla': { en: 'Wonder Woman superhero, golden tiara, red/blue suit, Lasso of Truth, Diana Prince', cat: 'subject', sub: 'hero' },
    'mujer maravilla': { en: 'Wonder Woman superhero, golden tiara, red/blue suit, Lasso of Truth, Diana Prince', cat: 'subject', sub: 'hero' },
    'gato con botas': { en: 'Puss in Boots cat, hat, boots and sword', cat: 'subject', sub: 'animal' },
    'robot': { en: 'friendly high-tech shiny robot, cinematic 3D style', cat: 'subject', sub: 'robot' },
    'princesa': { en: 'beautiful fairytale princess with elegant dress and crown, cinematic 3D animation style, Pixar style', cat: 'subject' },
    'principe': { en: 'handsome fairytale prince with royal tunic and crown, cinematic 3D animation style, Pixar style', cat: 'subject' },
    'príncipe': { en: 'handsome fairytale prince with royal tunic and crown, cinematic 3D animation style, Pixar style', cat: 'subject' },
    'hada': { en: 'magical glowing fairy with wings and wand, sparkles, cinematic 3D animation', cat: 'subject' },
    'mago': { en: 'wise old wizard with pointy hat and magical staff, cinematic 3D animation style', cat: 'subject' },
    'pirata': { en: 'charismatic pirate with hat and eye patch, cinematic 3D animation style', cat: 'subject' },
    'ninja': { en: 'cool ninja in black outfit, cinematic 3D animation style', cat: 'subject' },
    'caballero': { en: 'brave knight in shiny silver armor with sword, cinematic 3D animation style', cat: 'subject' },
    'astronauta': { en: 'brave astronaut in detailed white spacesuit, cinematic 3D animation style', cat: 'subject' },
    'bosque': { en: 'breathtaking enchanted forest with glowing plants and magical atmosphere, cinematic 3D landscape, unreal engine 5 render', cat: 'landscape' },
    'playa': { en: 'tropical paradise beach with crystal clear water and golden sand, 3D cinematic lighting', cat: 'landscape' },
    'mar': { en: 'deep blue ocean with underwater coral reef, cinematic 3D render', cat: 'landscape' },
    'espacio': { en: 'epic outer space with colorful nebulae and bright stars, cinematic 3D render', cat: 'landscape' },
    'castillo': { en: 'grand magical fairytale castle on a hill, cinematic 3D animation style, Disney style', cat: 'landscape' },
    'ciudad': { en: 'colorful futuristic city with flying vehicles, cinematic 3D animation style', cat: 'landscape' },
    'nieve': { en: 'snowy landscape', cat: 'landscape' },
    'volcan': { en: 'erupting volcano', cat: 'landscape' },
    'volcán': { en: 'erupting volcano', cat: 'landscape' },
    'cohete': { en: 'rocket ship', cat: 'landscape' },
    'isla': { en: 'tropical island', cat: 'landscape' },
    'desierto': { en: 'sand desert', cat: 'landscape' },
    'montaña': { en: 'high mountain landscape', cat: 'landscape' },
    'rio': { en: 'running river', cat: 'landscape' },
    'río': { en: 'running river', cat: 'landscape' },
    'lago': { en: 'peaceful lake', cat: 'landscape' },
    'disneylandia': { en: 'magical theme park castle, disney style', cat: 'landscape' },
    'disney landia': { en: 'magical theme park castle, disney style', cat: 'landscape' },
    'disney': { en: 'magical amusement park', cat: 'landscape' },
    'new york': { en: 'new york city skyline', cat: 'landscape' },
    'paris': { en: 'paris eiffel tower', cat: 'landscape' },
    'parís': { en: 'paris eiffel tower', cat: 'landscape' },
    'londres': { en: 'london city big ben', cat: 'landscape' },
    'roma': { en: 'rome colosseum', cat: 'landscape' },
    'egipto': { en: 'egypt pyramids', cat: 'landscape' },
    'japón': { en: 'japan mount fuji', cat: 'landscape' },
    'auto': { en: 'modern colorful car', cat: 'landscape' },
    'carro': { en: 'modern colorful car', cat: 'landscape' },
    'avion': { en: 'airplane flying', cat: 'landscape' },
    'avión': { en: 'airplane flying', cat: 'landscape' },
    'barco': { en: 'sailing boat', cat: 'landscape' },
    'bicicleta': { en: 'colorful bicycle', cat: 'landscape' },
    'tren': { en: 'toy train', cat: 'landscape' },
    'camion': { en: 'big truck', cat: 'landscape' },
    'camión': { en: 'big truck', cat: 'landscape' },
    'planeta': { en: 'mysterious planet in space', cat: 'landscape' },
    'marte': { en: 'red planet mars surface', cat: 'landscape' },
    'jupiter': { en: 'giant gas planet jupiter', cat: 'landscape' },
    'júpiter': { en: 'giant gas planet jupiter', cat: 'landscape' },
    'saturno': { en: 'planet saturn with rings', cat: 'landscape' },
    'luna': { en: 'moon surface with craters', cat: 'landscape' },
    'estrella': { en: 'bright shining star in space', cat: 'landscape' }
};

const modifierDictionary = {
    'rojo': 'red', 'azul': 'blue', 'verde': 'green', 'amarillo': 'yellow',
    'blanco': 'white', 'negro': 'black', 'rosa': 'pink', 'morado': 'purple',
    'naranja': 'orange', 'gris': 'gray', 'marrón': 'brown', 'cafe': 'brown',
    'café': 'brown', 'grande': 'large', 'gigante': 'giant', 'pequeño': 'small',
    'diminuto': 'tiny', 'valiente': 'brave', 'feliz': 'happy', 'triste': 'sad',
    'enojado': 'angry', 'furioso': 'furious', 'lindo': 'cute', 'tierno': 'cute',
    'hermoso': 'beautiful', 'feo': 'ugly', 'fuerte': 'strong', 'rapido': 'fast',
    'rápido': 'fast', 'lento': 'slow', 'volador': 'flying', 'fuego': 'fire',
    'hielo': 'ice', 'agua': 'water', 'tierra': 'earth', 'luz': 'light', 'oscuro': 'dark',
    'magico': 'magical', 'mágico': 'magical'
};

function generateMagicSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

// Initial state reset
function resetCreatorState() {
    // 1. Limpiar variables
    selections.Personaje = '';
    selections.Lugar = '';
    selections.Titulo = '';
    selections.PersonajeImg = '';
    selections.LugarImg = '';
    selections.PersonajePrompt = '';
    selections.musicTheme = 'happy';
    currentStep = 1;

    // 2. Limpiar inputs visuales
    document.getElementById('storyTitle').value = '';
    document.getElementById('storyPreview').value = '';
    document.getElementById('characterSearch').value = '';
    document.getElementById('placeSearch').value = '';

    // 3. Desmarcar tarjetas
    document.querySelectorAll('.option-card.selected').forEach(card => card.classList.remove('selected'));

    // 4. Reiniciar UI de pasos
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step1').classList.add('active');

    // 5. Reiniciar botones y progreso
    document.getElementById('progressFill').style.width = '25%';
    document.getElementById('prevBtn').disabled = false;
    document.getElementById('prevBtn').innerText = 'Volver';
    document.getElementById('nextBtn').innerText = 'Siguiente';
    document.getElementById('nextBtn').style.background = 'var(--primary)';
}

// Adaptive music themes
const musicThemes = {
    fantasy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    space: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    adventure: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    happy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    forest: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    mystery: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    water: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    party: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
};

async function selectOption(el, category) {
    const cards = el.parentElement.querySelectorAll('.option-card');
    cards.forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    selections[category] = el.querySelector('h3').innerText;
    const imgUrl = el.querySelector('img').src;
    selections[category + 'Img'] = imgUrl;
    
    if (category === 'Personaje') {
        selections.PersonajePrompt = el.dataset.prompt || '';
    }

    updateAmbientMusic();
}

function updateAmbientMusic() {
    const charName = (selections.Personaje || '').toLowerCase();
    const placeName = (selections.Lugar || '').toLowerCase();
    const music = document.getElementById('magicMusic');

    let selectedThemeKey = 'happy';

    if (placeName.match(/bosque|selva|árbol|naturaleza/)) {
        selectedThemeKey = 'forest';
    } else if (placeName.match(/cueva|noche|misterio|oscuro|mansión/)) {
        selectedThemeKey = 'mystery';
    } else if (placeName.match(/mar|océano|agua|peces|submarino/)) {
        selectedThemeKey = 'water';
    } else if (charName.match(/hada|princesa|unicornio|mago|bruja|castillo/)) {
        selectedThemeKey = 'fantasy';
    } else if (charName.match(/robot|espacio|alien|astronauta|futuro/) || placeName.match(/marte|luna|planeta|espacio/)) {
        selectedThemeKey = 'space';
    } else if (charName.match(/celebración|fiesta|cumpleaños|parque|feria|carnaval|diversión/) || placeName.match(/parque|feria|carnaval|festival/)) {
        selectedThemeKey = 'party';
    } else if (charName.match(/dinosaurio|dragón|león|tigre|aventura|superman|batman|spiderman|bugs bunny|bugs|conejo|pirata|ninja|caballero|ironman|hulk|thor|wonder woman/)) {
        selectedThemeKey = 'adventure';
    }

    const selectedTheme = musicThemes[selectedThemeKey];

    if (music && music.src !== selectedTheme) {
        music.pause();
        music.src = selectedTheme;
        selections.musicTheme = selectedThemeKey;
        music.play().catch(() => console.log("Audio waiting for interaction"));
    }
    
    if (placeName.match(/espacio|noche|cueva/)) {
        document.body.style.background = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
    } else {
        document.body.style.background = `linear-gradient(135deg, #fdf2f8 0%, #e0e7ff 100%)`;
    }
}

async function changeStep(delta) {
    const nextStep = currentStep + delta;

    if (nextStep < 1) {
        window.location.href = 'dashboard.html';
        return;
    }

    if (delta === 1) {
        if (currentStep === 1) {
            const charQuery = document.getElementById('characterSearch').value.trim();
            if (!charQuery || !selections.Personaje) {
                alert("¡Escribe y busca un personaje antes de continuar! ✨");
                return;
            }
        }
        if (currentStep === 2 && !selections.Lugar) { alert("¡Elige un lugar!"); return; }

        if (currentStep === 3) {
            const title = document.getElementById('storyTitle').value.trim();
            if (!title) { alert("¡Dale un título a tu aventura!"); return; }
            
            if (typeof checkSafetyAndAlert === 'function' && !checkSafetyAndAlert(title)) return;

            if (!navigator.onLine) {
                alert("🧚‍♀️ Las hadas necesitan internet para inspirarse. ¡Busca una señal mágica (WiFi)!");
                return;
            }

            selections.Titulo = title;
            
            const nextBtn = document.getElementById('nextBtn');
            const originalText = nextBtn.innerText;
            nextBtn.innerHTML = "<span>⏳ Conjurando magia...</span>";
            nextBtn.disabled = true;
            nextBtn.style.opacity = "0.7";

            try {
                const success = await generateStoryPreview();
                if (!success) {
                    nextBtn.innerHTML = originalText;
                    nextBtn.disabled = false;
                    nextBtn.style.opacity = "1";
                    return;
                }
            } catch (err) {
                nextBtn.innerHTML = originalText;
                nextBtn.disabled = false;
                nextBtn.style.opacity = "1";
                return;
            }
        }

        if (currentStep === 4) {
            const nextBtn = document.getElementById('nextBtn');
            const oldText = nextBtn.innerHTML;
            nextBtn.innerHTML = "<span>⏳ Guardando...</span>";
            nextBtn.disabled = true;
            
            try {
                await saveFinalStory();
            } catch (e) {
                nextBtn.innerHTML = oldText;
                nextBtn.disabled = false;
                alert("Error al guardar: " + e.message);
            }
            return; 
        }
    }

    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep = nextStep;
    document.getElementById(`step${currentStep}`).classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.disabled = false;
        prevBtn.style.display = "block";
        prevBtn.style.opacity = "1";
        prevBtn.innerText = "Atrás";
        prevBtn.style.color = "#000000";
        prevBtn.style.backgroundColor = "#ffffff";
        prevBtn.style.borderColor = "#000000";
        prevBtn.style.borderWidth = "3px";
        prevBtn.style.fontWeight = "900";
        prevBtn.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
    }
    
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
        nextBtn.style.pointerEvents = "auto";

        if (currentStep === totalSteps) {
            nextBtn.innerHTML = "❤️ ¡Me encanta! (Guardar)";
            nextBtn.style.background = "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)";
            nextBtn.style.boxShadow = "0 10px 20px rgba(236, 72, 153, 0.3)";
            nextBtn.style.transform = "scale(1.05)";
        } else {
            nextBtn.innerText = "Siguiente";
            nextBtn.style.background = "linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)";
            nextBtn.style.boxShadow = "0 4px 15px rgba(99,102,241,0.2)";
            nextBtn.style.transform = "scale(1)";
        }
    }

    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${(currentStep / totalSteps) * 100}%`;
    }
}

async function magicalFetch(prompt, seed = 42, timeoutMs = 25000) {
    const models = ['mistral', 'openai', 'llama']; 
    for (const model of models) {
        const controller = new AbortController();
        const currentTimeout = (model === 'openai') ? 10000 : timeoutMs; 
        const timeout = setTimeout(() => controller.abort(), currentTimeout);
        try {
            console.log(`🪄 Conjurando con modelo: ${model}...`);
            const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}&seed=${seed}&nologo=true`;
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (res && res.ok) {
                const text = await res.text();
                if (text && text.length > 50) return text;
            }
        } catch (e) {
            clearTimeout(timeout);
            console.warn(`⚠️ Modelo ${model} falló:`, e.message);
        }
    }
    return null;
}

async function generateStoryPreview() {
    if (window.Sparky) Sparky.react('magic');

    const character = selections.Personaje;
    const place = selections.Lugar;
    const title = selections.Titulo;
    const textarea = document.getElementById('storyPreview');
    const redrawBtn = document.getElementById('redrawBtn');
    
    if (textarea) {
        textarea.value = "Escribiendo magia... (esto tardará solo unos segundos) ✨";
        textarea.style.opacity = "0.5";
        textarea.style.pointerEvents = "none";
    }
    
    if (redrawBtn) redrawBtn.disabled = true;

    try {
        const randomSeed = Math.floor(Math.random() * 999999);
        const safePrompt = `Eres un narrador experto en cuentos infantiles mágicos. Escribe EN ESPAÑOL un cuento encantador para niños de 5 a 10 años con la siguiente información:
- PROTAGONISTA: ${character}
- ESCENARIO: ${place}
- TÍTULO: "${title}"

ESTRUCTURA OBLIGATORIA (exactamente 7 párrafos separados por línea en blanco):
1. INTRODUCCIÓN: Describe al protagonista y el mundo mágico donde vive. Usa 3 oraciones vivas y coloridas.
2. LLAMADO A LA AVENTURA: Algo inesperado y emocionante le sucede al protagonista. Incluye una frase de diálogo entrecomillada.
3. PRIMER OBSTÁCULO: El protagonista enfrenta su primer gran reto o misterio.
4. AYUDA MÁGICA: Aparece un nuevo amigo, objeto mágico o habilidad especial que ayuda al héroe.
5. CLÍMAX: El momento más emocionante e intenso del cuento. Usa una onomatopeya como ¡BOOM!, ¡WHOOSH!, ¡ZAP! o ¡CRASH!
6. RESOLUCIÓN: El protagonista supera el reto gracias a su valentía o astucia. Incluye una frase de diálogo final.
7. FINAL FELIZ: Cómo quedó el mundo y qué lección aprendieron todos. Termina con una frase inspiradora.

REGLAS CRÍTICAS:
- Mínimo 550 palabras en total
- Lenguaje sencillo, descriptivo y accesible a niños
- Tono alegre, mágico y lleno de esperanza
- NO incluyas títulos, numeración de párrafos ni metadatos
- Escribe SOLO el texto del cuento, nada más
(Semilla: ${randomSeed})`;

        let text = await magicalFetch(safePrompt, randomSeed, 25000);
        
        if (!text) {
            console.warn("⚠️ IA falló por completo, usando respaldo mágico de alta calidad.");
            text = `¡Había una vez una sorpresa mágica en el reino de ${place}! ${character} se despertó esa mañana sintiendo que algo increíble estaba a punto de suceder. El cielo brillaba con colores de arcoíris y las flores cantaban melodías suaves. "¡Hoy es el gran día!", exclamó ${character} con alegría. Caminó por los senderos de cristal hasta llegar al centro del lugar, donde un mapa antiguo apareció flotando ante sus ojos. El mapa mostraba el camino hacia la Aventura de la Amistad Perdida, un secreto guardado con cariño durante milenios. Acompañado por el suave susurro del viento, nuestro querido protagonista superó tres grandes desafíos con valentía y alegría. En cada paso, aprendió algo nuevo sobre el valor de ser uno mismo. Finalmente, al llegar a la meta, no encontró oro ni joyas, sino un espejo mágico que mostraba que el verdadero tesoro era la luz que llevaba en su corazón. Desde aquel día, ${character} vivió feliz, recordando siempre que la verdadera magia ocurre cuando soñamos en grande. ✨`;
        }

        let storyContent = sanitizeText(text);

        if (typeof validateContent === 'function') {
            const safetyResult = validateContent(storyContent);
            if (!safetyResult.valid) {
                console.warn("⚠️ Contenido bloqueado, reintentando limpieza profunda...");
                const strictPrompt = `Cuento infantil tierno y largo sobre ${character} en ${place}. Usa palabras dulces. Sin nada inadecuado.`;
                const cleanedText = await magicalFetch(strictPrompt, randomSeed + 1, 15000); 
                if (cleanedText) storyContent = sanitizeText(cleanedText);
            }
        }

        if (textarea) textarea.value = storyContent;
        return true;

    } catch (error) {
        console.error("Error en flujo de generación:", error);
        return false;
    } finally {
        if (textarea) {
            textarea.style.opacity = "1";
            textarea.style.pointerEvents = "auto";
        }
        if (redrawBtn) redrawBtn.disabled = false;
    }
}

function sanitizeText(text) {
    if (!text) return "";
    
    let cleaned = text.trim();
    if (cleaned.startsWith('{')) {
        try {
            const parsed = JSON.parse(cleaned);
            cleaned = parsed.title || parsed.content || parsed.story || parsed.text || cleaned;
        } catch(e) {
            cleaned = cleaned.replace(/^\{.*?"(title|content|story)":\s*"/i, '')
                             .replace(/"\s*\}$/, '')
                             .replace(/^\{/, '')
                             .replace(/\}$/, '');
        }
    }

    return cleaned.replace(/\*\*/g, '')
                  .replace(/^["'«]/, '')
                  .replace(/["'»]$/, '')
                  .replace(/[\[\(]Nota Mágica:.*?[\]\)]/gi, '')
                  .replace(/<(thought|reasoning)>[\s\S]*?<\/\1>/gi, '')
                  .trim();
}

function downloadStoryAsFile(title, content) {
    console.log("💾 Activando Guardado de Rescate...");
    try {
        const blob = new Blob([`TITULO: ${title}\n\nCUENTO:\n${content}`], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Cuento_${title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        return true;
    } catch(e) { 
        console.error("Error en descarga:", e); 
        return false; 
    }
}

async function saveFinalStory() {
    let user = firebase.auth().currentUser;
    
    if (!user) {
        await new Promise(r => setTimeout(r, 1000));
        user = firebase.auth().currentUser;
    }

    if (!user) {
        const localUser = JSON.parse(localStorage.getItem('cuentos_kids_user') || '{}');
        if (localUser && localUser.uid) {
            user = { uid: localUser.uid, email: localUser.email || 'usuario@cuentos.kids' };
        }
    }

    if (!user) {
        alert("Uy, parece que tu sesión mágica expiró. Por favor, entra de nuevo.");
        window.location.href = 'login.html';
        return;
    }
    
    if (window.Sparky) Sparky.react('save');

    const loader = document.getElementById('finalMagicLoader');
    const textarea = document.getElementById('storyPreview');
    const storyText = textarea ? textarea.value : "";

    if (!storyText || storyText.includes("Escribiendo magia...") || storyText.length < 50) {
        alert("🧚‍♀️ ¡Espera! Las hadas aún están terminando de escribir tu cuento.");
        return;
    }

    const finalContent = sanitizeText(storyText);
    const finalTitle = sanitizeText(selections.Titulo || document.getElementById('storyTitle').value);

    const storyToSave = {
        userId: user.uid,
        userEmail: user.email,
        title: finalTitle,
        character: selections.Personaje,
        place: selections.Lugar,
        characterImg: selections.PersonajeImg,
        placeImg: selections.LugarImg,
        coverImg: selections.PersonajeImg,
        musicTheme: selections.musicTheme || 'happy',
        content: finalContent
    };

    try {
        if (window.StoryDB) {
            window.StoryDB.saveStory(storyToSave);
            console.log("📍 Guardado local preventivo efectuado.");
        }
    } catch (localErr) {
        console.warn("⚠️ No se pudo realizar el guardado local, procediendo solo con nube.");
    }

    if (loader) {
        loader.querySelector('h2').innerText = "¡Guardando en la Biblioteca!";
        loader.style.display = 'flex';
    }

    let timeStampFallback = new Date();
    try {
       timeStampFallback = firebase.firestore.FieldValue.serverTimestamp();
    } catch(e) { console.log("Usando fecha local."); }

    try {
        const db = firebase.firestore();
        const savePromise = db.collection("stories").add({
            ...storyToSave,
            createdAt: timeStampFallback
        });

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Database timeout")), 3500)
        );

        await Promise.race([savePromise, timeoutPromise]);
        
        try {
            const userDoc = await db.collection("users").doc(user.uid).get();
            if (userDoc.exists) {
                const currentBadges = userDoc.data().badges || [];
                const badgesToAdd = [];

                // Medalla: Primer cuento
                if (!currentBadges.includes('first_story')) {
                    badgesToAdd.push('first_story');
                }

                // Medalla: Sabio Nocturno (crear cuento entre las 8pm y las 6am)
                const currentHour = new Date().getHours();
                const isNight = currentHour >= 20 || currentHour < 6;
                if (isNight && !currentBadges.includes('night_owl')) {
                    badgesToAdd.push('night_owl');
                    console.log('🦉 ¡Medalla Sabio Nocturno desbloqueada!');
                }

                if (badgesToAdd.length > 0) {
                    await db.collection("users").doc(user.uid).update({
                        badges: firebase.firestore.FieldValue.arrayUnion(...badgesToAdd)
                    });
                }
                
                // RECOMPENSA V22: Polvo de Hada por crear un cuento
                if (typeof rewardMagicDust === 'function') {
                    await rewardMagicDust(20);
                }
            }
        } catch (bE) { console.warn("Error recompensas:", bE); }

    } catch (saveErr) {
        console.warn("⚠️ Base de datos lenta. Ya está a salvo localmente.");
        downloadStoryAsFile(finalTitle, finalContent);
        alert("✨ ¡Historia guardada en tu biblioteca local! La nube está un poco lenta ahora.");
    }

    if (loader) loader.querySelector('h2').innerText = "¡Historia Guardada! ✨";
    setTimeout(() => window.location.replace('dashboard.html'), 300);
}

// --- SISTEMA DE ESPEJO MÁGICO (Live Preview) ---
function debounce(func, timeout = 600) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

const liveSearchCharacter = debounce(() => searchMagicCharacter(true), 300);
const liveSearchPlace = debounce(() => searchMagicPlace(true), 300);

const curatedImages = {
    'ironman': 'https://gen.pollinations.ai/image/Iron%20Man%20superhero%20red%20gold%20metallic%20armor%20glowing%20arc%20reactor%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=42&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'iron man': 'https://gen.pollinations.ai/image/Iron%20Man%20superhero%20red%20gold%20metallic%20armor%20glowing%20arc%20reactor%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=42&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'spiderman': 'https://gen.pollinations.ai/image/Spider-Man%20superhero%20red%20blue%20web%20suit%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=7&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'spider man': 'https://gen.pollinations.ai/image/Spider-Man%20superhero%20red%20blue%20web%20suit%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=7&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'batman': 'https://gen.pollinations.ai/image/Batman%20superhero%20dark%20black%20cape%20and%20mask%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=13&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'hulk': 'https://gen.pollinations.ai/image/Hulk%20giant%20green%20muscular%20superhero%20raging%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=22&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'superman': 'https://gen.pollinations.ai/image/Superman%20superhero%20blue%20red%20cape%20S%20logo%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=5&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'thor': 'https://gen.pollinations.ai/image/Thor%20Norse%20god%20superhero%20with%20hammer%20and%20lightning%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=15&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'kaliman': 'https://gen.pollinations.ai/image/Kaliman%20superhero%20with%20white%20turban%20and%20ruby%2C%20blue%20eyes%2C%203D%20Pixar%20Disney%20style%2C%20cinematic%20studio%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=100&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'bugs bunny': 'https://gen.pollinations.ai/image/Bugs%20Bunny%20looney%20tunes%20character%2C%203D%20Pixar%20Disney%20animation%20style%2C%20cinematic%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=88&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm',
    'bugs': 'https://gen.pollinations.ai/image/Bugs%20Bunny%20looney%20tunes%20character%2C%203D%20Pixar%20Disney%20animation%20style%2C%20cinematic%20lighting%2C%20white%20background%2C%20highly%20detailed?width=512&height=512&seed=88&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm'
};

function saveCustomAsset(type, name, url) {
    try {
        let assets = JSON.parse(localStorage.getItem('magicAssets') || '{"Personaje":[],"Lugar":[]}');
        if (!assets[type]) assets[type] = [];
        assets[type] = [{name, url, date: new Date().getTime()}, ...assets[type]].slice(0, 10);
        localStorage.setItem('magicAssets', JSON.stringify(assets));
    } catch(e) { console.warn("Local Storage Magic fail", e); }
}

async function searchMagicCharacter(isLive = false) {
    const queryInput = document.getElementById('characterSearch');
    const query = queryInput.value.trim();
    if (!query) return;
    
    if (typeof checkSafetyAndAlert === 'function' && !checkSafetyAndAlert(query)) return;

    const grid = document.getElementById('charactersGrid');
    const loader = document.getElementById('magicLoader');
    const btn = document.getElementById('searchCharBtn');

    if (loader) loader.style.display = 'block';
    if (!isLive && btn) btn.disabled = true;
    
    grid.innerHTML = ''; 
    grid.classList.add('searching-active');

    try {
        const name = query.charAt(0).toUpperCase() + query.slice(1);
        const queryLower = query.toLowerCase();

        let curatedKey = Object.keys(curatedImages).find(key => {
            if (key === queryLower) return true;
            const regex = new RegExp(`\\b${key.replace('-', '\\-')}\\b`, 'i');
            return regex.test(queryLower);
        });

        let magicUrl;
        if (curatedKey) {
            magicUrl = curatedImages[curatedKey];
        } else {
            let cleanedQuery = query.toLowerCase().replace(/^(en |de |un |una |la |el |al )+/, '').replace(/[`'"]/g, '').trim();
            let translatedQuery = cleanedQuery;
            let currentCategory = 'subject';

            const sortedDictKeys = Object.keys(masterDictionary).sort((a, b) => b.length - a.length);
            for (let key of sortedDictKeys) {
                const regex = new RegExp(`\\b${key}\\b`, 'gi');
                if (regex.test(translatedQuery)) {
                    translatedQuery = translatedQuery.replace(regex, masterDictionary[key].en);
                    currentCategory = masterDictionary[key].cat;
                }
            }
            
            const sortedModKeys = Object.keys(modifierDictionary).sort((a, b) => b.length - a.length);
            for (let modKey of sortedModKeys) {
                const regex = new RegExp(`\\b${modKey}\\b`, 'gi');
                if (regex.test(translatedQuery)) {
                    translatedQuery = translatedQuery.replace(regex, modifierDictionary[modKey]);
                }
            }

            const seed = generateMagicSeed(cleanedQuery);
            let safeQuery = translatedQuery.replace(/ironman|iron man/gi, 'super hero with red and gold armor').replace(/spiderman|spider man/gi, 'hero with red and blue suit').replace(/batman/gi, 'hero with black bat suit');
            
            const finalPrompt = `${safeQuery}, 3D character portrait, Disney Pixar animation style, vibrant colors, soft cinematic lighting, white background, highly detailed, 8K quality, friendly expression, professional illustration, NO TEXT, NO WATERMARKS, NO LOGOS`;
            magicUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(finalPrompt)}?width=512&height=512&seed=${seed}&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm`;
        }

        selections.PersonajeImg = magicUrl;

        let draftCard = document.getElementById('charDraftCard');
        if (!draftCard) {
            draftCard = createAssetCard('Personaje', name, magicUrl, 0, false, query);
            draftCard.id = 'charDraftCard';
            draftCard.style.border = '2px solid #8b5cf6';
            grid.prepend(draftCard);
        } else {
            draftCard.style.border = '2px solid #8b5cf6';
            draftCard.querySelector('h3').innerText = name;
            const img = draftCard.querySelector('img');
            const ld = draftCard.querySelector('.img-loader-text');

            if (ld) {
                ld.style.display = 'block';
                ld.innerHTML = '✨';
            }
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            img.style.opacity = '0';
            img.style.display = 'block';
            img.alt = name;
            draftCard.dataset.prompt = query;
            delete img.dataset.retried;

            setTimeout(() => {
                img.src = magicUrl;
            }, 50);
        }

        grid.classList.add('searching-active');
        selectOption(draftCard, 'Personaje');
        saveCustomAsset('Personaje', name, magicUrl);

    } catch (e) {
        console.error("Error Magic Mirror:", e);
    } finally {
        if (!isLive && btn) btn.disabled = false;
        if (loader) {
            const delay = isLive ? 100 : 200; 
            setTimeout(() => {
                loader.style.display = 'none';
            }, delay);
        }
    }
}

async function searchMagicPlace(isLive = false) {
    const queryInput = document.getElementById('placeSearch');
    const query = queryInput.value.trim();
    if (!query || query.length < 3) return;
    
    if (typeof checkSafetyAndAlert === 'function' && !checkSafetyAndAlert(query)) return;

    const grid = document.getElementById('placesGrid');
    const loader = document.getElementById('placeMagicLoader');
    const btn = document.querySelector('.place-magic-btn');

    if (loader) loader.style.display = 'block';
    if (!isLive && btn) btn.disabled = true;
    
    grid.innerHTML = '';
    grid.classList.add('searching-active');

    try {
        let cleanedQuery = query.toLowerCase().replace(/^(en |de |un |una |la |el |al |a |los |las )+/gi, '').replace(/[`'"]/g, '').trim();
        const name = cleanedQuery.charAt(0).toUpperCase() + cleanedQuery.slice(1);

        let curatedKey = Object.keys(curatedImages).find(key => {
            const regex = new RegExp(`\\b${key.replace('-', '\\-')}\\b`, 'i');
            return regex.test(cleanedQuery);
        });

        let magicUrl;
        if (curatedKey) {
            magicUrl = curatedImages[curatedKey];
        } else {
            let translatedPlace = cleanedQuery;
            const sortedDictKeys = Object.keys(masterDictionary).sort((a, b) => b.length - a.length);
            for (let key of sortedDictKeys) {
                const regex = new RegExp(`\\b${key}\\b`, 'gi');
                if (regex.test(translatedPlace)) {
                    translatedPlace = translatedPlace.replace(regex, masterDictionary[key].en);
                }
            }

            const seed = Math.floor(Math.random() * 999999);
            const placePrompt = `Epic 3D Pixar Disney cinematic landscape of ${translatedPlace}, magical fairytale atmosphere, volumetric golden lighting, dreamlike, ultra-detailed, professional render, masterpiece, NO PEOPLE, NO TEXT`;
            magicUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(placePrompt)}?width=512&height=512&seed=${seed}&nologo=true&model=flux&key=pk_iOJLArs0DLNG7EGm`;
        }

        selections.LugarImg = magicUrl;

        let draftCard = document.getElementById('placeDraftCard');
        if (!draftCard) {
            draftCard = createAssetCard('Lugar', name, magicUrl);
            draftCard.id = 'placeDraftCard';
            draftCard.style.border = '2px solid #8b5cf6';
            grid.prepend(draftCard);
        } else {
            draftCard.style.border = '2px solid #8b5cf6';
            draftCard.querySelector('h3').innerText = name;
            const img = draftCard.querySelector('img');
            const lt = draftCard.querySelector('.img-loader-text');

            if (lt) {
                lt.style.display = 'block';
                lt.innerHTML = '✨';
            }
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            img.style.opacity = '0';
            img.style.display = 'block';
            delete img.dataset.retried;

            setTimeout(() => {
                img.src = magicUrl;
            }, 50);
        }

        grid.classList.add('searching-active');
        selectOption(draftCard, 'Lugar');
        saveCustomAsset('Lugar', name, magicUrl);

    } catch (e) {
        console.error("Error Espejo Mágico Lugar:", e);
    } finally {
        if (!isLive && btn) btn.disabled = false;
        if (loader) {
            const delay = isLive ? 300 : 1000;
            setTimeout(() => {
                loader.style.display = 'none';
            }, delay);
        }
    }
}

function filterCharacters() {
    const input = document.getElementById('characterSearch');
    const filter = input ? input.value.trim().toLowerCase() : "";
    const grid = document.getElementById('charactersGrid');

    if (!grid) return;

    if (filter.length === 0) {
        grid.classList.remove('searching-active');
        grid.innerHTML = '';
        return;
    }

    grid.classList.add('searching-active');
    if (filter.length >= 2) liveSearchCharacter();
}

function toggleClearBtn(id) {
    const input = document.getElementById(id);
    const btn = document.getElementById('clear-' + id);
    if (input && btn) {
        if (input.value.trim().length > 0) btn.classList.add('visible');
        else btn.classList.remove('visible');
    }
}

function clearSearch(id) {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = '';
    input.focus();

    const music = document.getElementById('magicMusic');
    if (music) {
        music.pause();
        music.currentTime = 0;
    }

    const container = input.closest('.search-container');
    if (container) {
        container.classList.remove('flash-active');
        void container.offsetWidth;
        container.classList.add('flash-active');
    }

    toggleClearBtn(id);

    const gridId = id === 'characterSearch' ? 'charactersGrid' : 'placesGrid';
    const grid = document.getElementById(gridId);
    if (grid) grid.classList.remove('searching-active');

    const draftId = id === 'characterSearch' ? 'charDraftCard' : 'placeDraftCard';
    const draftCard = document.getElementById(draftId);
    if (draftCard) draftCard.remove();

    if (id === 'characterSearch') filterCharacters();
    else filterPlaces();
}

function filterPlaces() {
    const input = document.getElementById('placeSearch');
    const filter = input ? input.value.trim().toLowerCase() : "";
    const grid = document.getElementById('placesGrid');

    if (!grid) return;

    if (filter.length === 0) {
        grid.classList.remove('searching-active');
        grid.innerHTML = '';
        return;
    }

    grid.classList.add('searching-active');
    if (filter.length >= 3) liveSearchPlace();
}

function updateOnlineStatus() {
    const banner = document.getElementById('offlineBanner');
    if (banner) {
        banner.style.display = navigator.onLine ? 'none' : 'block';
    }
}

// Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!document.getElementById('parentalGate')) {
                changeStep(-1);
            }
        }
    });

    // Identificar Usuario Mágico
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const badge = document.getElementById('userBadge');
            const nameEl = document.getElementById('userNameBadge');
            const imgEl = document.getElementById('userAvatarBadge');

            const name = user.displayName || user.email.split('@')[0];
            if (nameEl) nameEl.innerText = name;

            if (imgEl) {
                if (user.photoURL) {
                    imgEl.src = user.photoURL;
                } else {
                    const firstName = name.split(' ')[0].toLowerCase();
                    const isGirl = firstName.endsWith('a') || firstName === 'belen' || firstName === 'carmen';
                    const seed = encodeURIComponent(name);

                    let avatarOptions = "radius=50";
                    if (isGirl) {
                        avatarOptions += "&backgroundColor=fbc3bc&top=bigHair";
                    } else {
                        avatarOptions += "&backgroundColor=a2d2ff&top=shortFlat";
                    }

                    imgEl.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${avatarOptions}`;
                }
            }

            if (badge) {
                setTimeout(() => {
                    badge.style.top = "1rem";
                    badge.style.transform = "translateY(0%)";
                }, 300);
            }
        }
    });

    resetCreatorState();
    changeStep(0);
});
