/**
 * Dashboard Logic - V22 Generation
 * Emergency Fix: Force close all modals on load to prevent stuck UI
 */
(function() {
    const hideModals = () => {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => {
            m.classList.remove('active');
            m.style.display = 'none';
        });
    };
    hideModals();
    // Reintento agresivo por si el DOM no está listo o algo los abre
    const interval = setInterval(hideModals, 100);
    setTimeout(() => clearInterval(interval), 3000);
})();

// UTILITIES
function checkSafetyAndAlert(text) {
    const forbidden = ['malo', 'feo', 'grosero']; // Ejemplo simple
    const found = forbidden.find(w => text.toLowerCase().includes(w));
    if (found) {
        alert("¡Cuidado! Esa palabra no es muy mágica. Intentemos con algo más alegre. ✨");
        return false;
    }
    return true;
}

// UI ELEMENTS
const displayNameEl = document.getElementById('displayUserName');
const userAvatarEl = document.getElementById('userAvatar');
const libraryGrid = document.getElementById('storiesGrid'); 
let currentStoriesData = []; // Guardar historias para filtrado local
let currentStoriesTab = 'my-stories';
let storyToDelete = null;
let storyToEdit = null;
let storyToUpdateImage = null;
let selectedImageUrl = null;

// LOGOUT
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// CONTROL DE SESIÓN
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        if (user.email === 'luisalberto.mm4130@gmail.com' || user.email === 'luis.mujicam65@gmail.com') {
            const sideAdmin = document.getElementById('sideAdminItem');
            if (sideAdmin) sideAdmin.style.display = 'block';
        }
        const rawName = user.displayName || user.email.split('@')[0];
        const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/[._]/g, ' ');
        
        if (displayNameEl) displayNameEl.innerText = `¡Hola, ${cleanName}! ✨`; 
        
        const userNameSmall = document.getElementById('userName');
        if (userNameSmall) userNameSmall.innerText = cleanName;

        // Cargar Avatar Guardado desde Firestore (V21.5 Persistence Fix - Priority over Auth photoURL)
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().avatarSeed) {
                const savedSeed = doc.data().avatarSeed;
                const name = user.displayName || user.email.split('@')[0];
                const isGirl = name.toLowerCase().endsWith('a');
                let avatarOptions = "radius=25";
                if (isGirl) avatarOptions += "&backgroundColor=fbc3bc&top=bigHair";
                else avatarOptions += "&backgroundColor=a2d2ff&top=shortFlat";
                
                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(savedSeed)}&${avatarOptions}`;
                userAvatarEl.src = url;
                const largeAvatar = document.getElementById('profileAvatarLarge');
                if (largeAvatar) largeAvatar.src = url;
                
                // Cargar Polvo de Hada (V22)
                const magicDust = doc.data().magicDust || 0;
                const dustEl = document.getElementById('magicDustDisplay');
                if (dustEl) dustEl.innerText = magicDust;
            } else if (user.photoURL) {
                userAvatarEl.src = user.photoURL;
            } else {
                const name = user.displayName || user.email.split('@')[0];
                const firstName = name.split(' ')[0].toLowerCase();
                const isGirl = firstName.endsWith('a') || firstName === 'belen' || firstName === 'carmen';
                const seed = encodeURIComponent(name);
                let avatarOptions = "radius=25";
                if (isGirl) avatarOptions += "&backgroundColor=fbc3bc&top=bigHair";
                else avatarOptions += "&backgroundColor=a2d2ff&top=shortFlat";
                containerAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${avatarOptions}`;
                userAvatarEl.src = containerAvatarUrl;
            }
        }).catch(e => {
            console.log("Error loading avatar preference:", e);
            if (user.photoURL) userAvatarEl.src = user.photoURL;
        });

        loadBadges(user.uid);
        loadStories(user.uid);

        // 🐉 SPARKY: Saludo contextual al entrar al dashboard
        setTimeout(() => {
            if (window.Sparky) {
                const firstName = (user.displayName || user.email.split('@')[0]).split(' ')[0];
                const hour = new Date().getHours();
                let greeting;
                if (hour < 12) greeting = `¡Buenos días, ${firstName}! ☀️ ¿Creamos magia hoy?`;
                else if (hour < 18) greeting = `¡Hola, ${firstName}! 🌤️ ¡Lista una nueva aventura!`;
                else if (hour < 20) greeting = `¡Buenas tardes, ${firstName}! 🌅 ¡El reino te espera!`;
                else greeting = `¡Hola, Sabio Nocturno ${firstName}! 🌙 ¿Otro cuento de medianoche?`;
                Sparky.say(greeting, 5000);
            }
        }, 2000);
    } else {
        window.location.href = 'login.html';
    }
});

async function loadStories(userId) {
    const grid = document.getElementById('storiesGrid');
    try {
        let firebaseStories = [];
        try {
            const snapshot = await db.collection('stories')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            firebaseStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'firebase' }));
        } catch (fbErr) {
            console.warn("Firebase offline o lento, usando solo local.");
        }

        const localStories = window.StoryDB ? window.StoryDB.getAllStories().filter(s => s.userId === userId) : [];
        
        const mergedStories = [...firebaseStories];
        localStories.forEach(local => {
            const isDuplicated = mergedStories.find(s => s.id === local.id || s.title === local.title);
            if (!isDuplicated) {
                mergedStories.push({ ...local, source: 'local' });
            }
        });

        currentStoriesData = mergedStories.sort((a, b) => {
            const getTimeValue = (val) => {
                if (!val) return 0;
                if (val.seconds) return val.seconds * 1000;
                const t = new Date(val).getTime();
                return isNaN(t) ? 0 : t;
            };
            return getTimeValue(b.createdAt) - getTimeValue(a.createdAt);
        });

        renderStoriesFromData(currentStoriesData);
        
        const storiesCount = currentStoriesData.length;
        const countBadge = document.getElementById('storyCount');
        if (countBadge) countBadge.innerText = storiesCount;
        updateMagicPower(storiesCount);
        
    } catch (error) {
        console.error('Error al cargar cuentos:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 2rem;">Ops, los gnomos de la red están haciendo travesuras. Prueba a recargar.</p>';
    }
}

function filterDashboardStories() {
    const query = document.getElementById('dashboardSearch').value.toLowerCase().trim();
    if (!query) {
        renderStoriesFromData(currentStoriesData);
        return;
    }
    const filtered = currentStoriesData.filter(story => 
        (story.title && story.title.toLowerCase().includes(query)) ||
        (story.character && story.character.toLowerCase().includes(query))
    );
    renderStoriesFromData(filtered);
}

function filterStories() {
    const query = document.getElementById('storySearch').value.toLowerCase().trim();
    if (!query) {
        renderStoriesFromData(currentStoriesData);
        return;
    }
    const filtered = currentStoriesData.filter(s => 
        (s.title && s.title.toLowerCase().includes(query)) ||
        (s.character && s.character.toLowerCase().includes(query))
    );
    renderStoriesFromData(filtered);
}

async function deleteStory(id) {
    try {
        if (!id.startsWith('local_')) {
            await db.collection('stories').doc(id).delete();
        }
        if (window.StoryDB) window.StoryDB.deleteStory(id);
        const user = firebase.auth().currentUser;
        if (user) loadStories(user.uid);
    } catch (e) {
        console.error("Error al borrar:", e);
    }
}

function renderStoriesFromData(data) {
    const grid = document.getElementById('storiesGrid');
    grid.innerHTML = '';

    const cleanText = (t) => {
        if (!t) return "";
        let s = t.trim();
        if (s.startsWith('{')) {
            try { const p = JSON.parse(s); s = p.title || p.text || s; } catch(e) { s = s.replace(/\{.*?"title":\s*"/i, '').replace(/"\}$/, ''); }
        }
        return s.replace(/\*\*/g, '').replace(/[#*]/g, '').trim();
    };

    if (data.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 3.5rem; margin-bottom: 1rem;">🕳️</div>
                <h3 style="color: var(--text-main); font-weight: 700;">No encontramos ese cuento...</h3>
                <p style="color: var(--text-muted);">¿Quizás lo escribió un fantasma invisible? Prueba con otra palabra.</p>
            </div>
        `;
        return;
    }

    data.forEach(story => {
        const card = document.createElement('div');
        card.className = 'story-card';
        card.onclick = (e) => {
            if (e.target.closest('button')) return;
            localStorage.setItem('currentStoryId', story.id);
            window.location.href = 'story-reader.html';
        };

        const offlineBadge = !navigator.onLine ? '<span class="offline-badge">💾 Offline</span>' : '';
        const isFavorite = story.isFavorite || false;

        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn delete" onclick="confirmDelete('${story.id}', '${story.title}')" title="Borrar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
                <button class="action-btn export" onclick="exportToPDF('${story.id}')" title="Descargar PDF">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button class="action-btn edit" onclick="openEditModal('${story.id}')" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button class="action-btn image" onclick="openImageModal('${story.id}')" title="Cambiar Imagen">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </button>
                <div style="flex: 1;"></div>
                <button class="action-btn fav ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${story.id}', ${isFavorite})" title="Favorito">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
            </div>
            <img src="${story.coverImg || story.characterImg || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}" 
                 class="story-thumb" alt="${cleanText(story.title)}" loading="lazy"
                 onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'">
            <div class="story-info">
                <h3>${cleanText(story.title) || 'Cuento Mágico'}</h3>
                <p>
                    <span>👤 ${cleanText(story.characterSelected) || cleanText(story.character) || 'Héroe'}</span> • <span>📍 ${cleanText(story.place) || 'Reino'}</span>
                </p>
                ${offlineBadge}
            </div>
        `;
        grid.appendChild(card);
    });
}

async function exportToPDF(id) {
    const story = currentStoriesData.find(s => s.id === id);
    if (!story) return;
    alert(`Generando PDF de "${story.title}"... ✨`);
    // Aquí iría la lógica de jsPDF, pero por ahora damos feedback
}

// Secciones consolidadas de UI y navegación

async function switchDashboardTab(tab, element = null) {
    currentStoriesTab = tab;
    if (element) {
        document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
    }
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => item.classList.remove('active'));
    const sideItem = document.getElementById(`side-${tab}`);
    if (sideItem) sideItem.classList.add('active');
    const user = firebase.auth().currentUser;
    if (!user) return;
    const grid = document.getElementById('storiesGrid');
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Buscando en los rincones del reino...</p>';
    try {
        if (tab === 'my-stories') {
            await loadStories(user.uid);
        } else if (tab === 'favorites') {
            const snapshot = await db.collection("stories")
                .where("userId", "==", user.uid)
                .where("isFavorite", "==", true)
                .get();
            currentStoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderStoriesFromData(currentStoriesData);
        } else if (tab === 'global') {
            const snapshot = await db.collection("stories")
                .where("isPublic", "==", true)
                .limit(20)
                .get();
            currentStoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderStoriesFromData(currentStoriesData);
        }
    } catch (error) {
        console.error("Error al cambiar pestaña:", error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #ef4444;">No pudimos cruzar el puente mágico ahora mismo.</p>';
    }
}

// Modales y navegación avanzada manejados al final del archivo

async function toggleFavorite(storyId, currentStatus) {
    try {
        await db.collection("stories").doc(storyId).update({
            isFavorite: !currentStatus
        });
        const user = firebase.auth().currentUser;
        if (user) {
            if (currentStoriesTab === 'my-stories') loadStories(user.uid);
            else if (currentStoriesTab === 'favorites') switchDashboardTab('favorites', document.querySelector('.tab-item[onclick*="favorites"]'));
            else if (currentStoriesTab === 'global') switchDashboardTab('global', document.querySelector('.tab-item[onclick*="global"]'));
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
    }
}

// --- PERFIL Y ESTADÍSTICAS ---
async function openProfileModal() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const rawName = user.displayName || user.email.split('@')[0];
    const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/[._]/g, ' ');
    document.getElementById('profileName').innerText = cleanName;
    document.getElementById('profileUserEmail').innerText = user.email;
    document.getElementById('profileAvatarLarge').src = document.getElementById('userAvatar').src;
    try {
        const storiesSnap = await db.collection("stories").where("userId", "==", user.uid).get();
        document.getElementById('statStoriesCount').innerText = storiesSnap.size;
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            const badges = userDoc.data().badges || [];
            document.getElementById('statBadgesCount').innerText = badges.length;
        }
        const globalStoryCount = document.getElementById('storyCount');
        if (globalStoryCount) globalStoryCount.innerText = storiesSnap.size;
        updateMagicPower(storiesSnap.size);

        const hour = new Date().getHours();
        let greeting = "¡Hola";
        if (hour < 12) greeting = "¡Buenos días";
        else if (hour < 18) greeting = "¡Buenas tardes";
        else greeting = "¡Buenas noches";
        const name = user.displayName || user.email.split('@')[0];
        const level = Math.floor(storiesSnap.size / 5) + 1;
        const titles = ["Aprendiz", "Hechicero", "Guardián", "Maestro", "Gran Hechicero", "Leyenda"];
        const magicTitle = titles[Math.min(level - 1, titles.length - 1)];
        const displayUserEl = document.getElementById('displayUserName');
        if (displayUserEl) displayUserEl.innerText = `${greeting}, ${magicTitle} ${name}! ✨`;
        document.getElementById('profileModal').classList.add('active');
    } catch (e) {
        console.error("Error en perfil:", e); 
    }
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

function updateMagicPower(count) {
    const level = Math.floor(count / 5) + 1;
    const progress = ((count % 5) / 5) * 100;
    const levelEl = document.getElementById('magicLevelDisplay');
    const fillEl = document.getElementById('magicPowerFill');
    const rankEl = document.getElementById('magicRankText');
    if (levelEl) levelEl.innerText = `Nv. ${level}`;
    if (fillEl) fillEl.style.width = `${progress}%`;
    const ranks = ["Aprendiz de Hechicero", "Iniciado del Cristal", "Guardián de Historias", "Maestro de la Tinta Mágica", "Gran Hechicero de Palabras", "Leyenda Eterna de los Cuentos"];
    const rankIndex = Math.min(level - 1, ranks.length - 1);
    if (rankEl) rankEl.innerText = ranks[rankIndex];
}

// --- ÁLBUM DE HÉROES ---
async function openAlbumModal() {
    toggleSidebar();
    const user = firebase.auth().currentUser;
    if (!user) return;
    document.getElementById('albumModal').classList.add('active');
    // 🐉 Sparky reacciona al abrir el álbum
    if (window.Sparky) Sparky.say('¡Aquí están tus héroes legendarios! 💎🐉', 3500);
    const grid = document.getElementById('dashboardHeroGrid');
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;">🪄 Abriendo tu cofre de tesoros...</div>';
    try {
        const snapshot = await db.collection("users").doc(user.uid).collection("heroes").orderBy("createdAt", "desc").get();
        if (snapshot.empty) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);"><div style="font-size: 3rem; margin-bottom: 1rem;">✨</div><p style="font-weight: 700; font-size: 1.1rem;">¡Tu álbum aún no tiene magia!</p><p>Ve al creador de cuentos, busca un personaje con "Magia" y pulsa la estrella ⭐ para guardarlo aquí.</p></div>`;
            return;
        }
        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const hero = doc.data();
            const card = document.createElement('div');
            card.className = 'option-card';
            card.style.cursor = 'default';
            card.innerHTML = `<div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; margin: 0 auto 0.8rem; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"><img src="${hero.url}" style="width: 100%; height: 100%; object-fit: cover;"></div><h4 style="font-size: 0.9rem; margin: 0; color: var(--text-main);">${hero.name}</h4>`;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error("Error cargando álbum:", e);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">Hubo un problema al abrir el baúl.</p>';
    }
}

function closeAlbumModal() {
    document.getElementById('albumModal').classList.remove('active');
}

async function changeAvatarSeed() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const name = user.displayName || user.email.split('@')[0];
    const randomSeed = Math.random().toString(36).substring(7);
    const newSeed = name + "_" + randomSeed;
    
    // Función auxiliar para obtener la URL
    const getAvatarUrl = (seed) => {
        const isGirl = name.toLowerCase().endsWith('a');
        let avatarOptions = "radius=25";
        if (isGirl) avatarOptions += "&backgroundColor=fbc3bc&top=bigHair";
        else avatarOptions += "&backgroundColor=a2d2ff&top=shortFlat";
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&${avatarOptions}`;
    };

    const newUrl = getAvatarUrl(newSeed);
    
    // Actualizar todas las instancias del avatar en el UI de forma inmediata
    const avatars = document.querySelectorAll('img[id*="Avatar"], img[src*="dicebear"]');
    avatars.forEach(img => {
        img.src = newUrl;
    });
    
    try {
        await db.collection("users").doc(user.uid).set({ 
            avatarSeed: newSeed,
            lastAvatarUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log("✨ Avatar guardado con éxito:", newSeed);
        if (typeof celebrate === 'function') celebrate();
    } catch (e) {
        console.error("Error guardando avatar:", e);
    }
}

async function loadBadges(userId) {
    try {
        const doc = await db.collection("users").doc(userId).get();
        if (doc.exists) {
            const userData = doc.data();
            const badges = userData.badges || [];
            badges.forEach(badgeId => {
                const badgeEl = document.getElementById(`badge-${badgeId}`);
                if (badgeEl) badgeEl.classList.add('active');
            });
            if (!badges.includes('explorer')) {
                const storiesSnapshot = await db.collection("stories").where("userId", "==", userId).get();
                if (storiesSnapshot.size >= 5) {
                    await db.collection("users").doc(userId).update({
                        badges: firebase.firestore.FieldValue.arrayUnion('explorer')
                    });
                    const explorerBadge = document.getElementById('badge-explorer');
                    if (explorerBadge) explorerBadge.classList.add('active');
                }
            }
        }
    } catch (e) {
        console.error("Error cargando medallas:", e);
    }
}

// --- ELIMINACIÓN ---
async function confirmDelete(storyId, storyTitle) {
    const isAdult = await triggerParentalGate();
    if (!isAdult) return;
    storyToDelete = storyId;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    storyToDelete = null;
}

async function executeDelete() {
    if (!storyToDelete) return;
    const deleteBtn = document.querySelector('.modal-btn-delete');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '⏳ Eliminando...';
    deleteBtn.disabled = true;
    try {
        if (!storyToDelete.startsWith('local_')) {
            try { await db.collection('stories').doc(storyToDelete).delete(); } catch (fbErr) { console.warn(fbErr); }
        }
        if (window.StoryDB) window.StoryDB.deleteStory(storyToDelete);
        closeDeleteModal();
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
        const user = firebase.auth().currentUser;
        if (user) loadStories(user.uid);
    } catch (error) {
        console.error(error);
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
        alert("Hubo un problema al eliminar el cuento.");
    }
}

// --- EXPORTAR PDF ---
async function exportToPDF(storyId) {
    try {
        const story = currentStoriesData.find(s => s.id === storyId);
        if (!story) return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const margin = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        let cursorY = 40;
        const imgUrl = story.coverImg || story.characterImg;
        try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imgUrl;
            await new Promise(resolve => img.onload = resolve);
            const imgSize = 80;
            pdf.addImage(img, 'JPEG', (pageWidth - imgSize)/2, cursorY, imgSize, imgSize);
            cursorY += imgSize + 20;
        } catch (imgErr) { console.warn(imgErr); }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(26);
        pdf.setTextColor(99, 102, 241);
        pdf.text(story.title, pageWidth/2, cursorY, { align: 'center' });
        cursorY += 15;
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(100, 146, 139);
        pdf.text(`Una aventura mágica de ${story.character} en ${story.place}`, pageWidth/2, cursorY, { align: 'center' });
        cursorY += 20;
        pdf.setDrawColor(99, 102, 241);
        pdf.setLineWidth(0.5);
        pdf.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 15;
        pdf.addPage();
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(14);
        const splitText = pdf.splitTextToSize(story.content, pageWidth - (margin * 2));
        pdf.text(splitText, margin, 30);
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(148, 163, 184);
            pdf.text("Creado con Story Creator Kids ✨", pageWidth/2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
        pdf.save(`${story.title.replace(/\s+/g, '_')}_Mágico.pdf`);
    } catch (error) {
        console.error(error);
        alert("Hubo un error al generar el PDF mágico.");
    }
}

// --- SISTEMA DE AUTOSIZE PARA EL EDITOR (V21.5) ---
function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
}

async function openEditModal(storyId) {
    const isAdult = await triggerParentalGate();
    if (!isAdult) return;
    storyToEdit = storyId;
    try {
        const docSnap = await db.collection('stories').doc(storyId).get();
        if (!docSnap.exists) return;
        const data = docSnap.data();
        document.getElementById('editStoryTitle').value = data.title;
        const textEl = document.getElementById('editStoryText');
        textEl.value = data.content;
        
        // Abrir modal y disparar autosize
        document.getElementById('editModal').classList.add('active');
        setTimeout(() => autoResizeTextarea(textEl), 100);
    } catch (error) { console.error(error); }
}

// Listener para redimensionar mientras se escribe
document.getElementById('editStoryText')?.addEventListener('input', function() {
    autoResizeTextarea(this);
});

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    storyToEdit = null;
}

async function regenerateStoryText() {
    const title = document.getElementById('editStoryTitle').value.trim();
    const currentContent = document.getElementById('editStoryText').value.trim();
    const textArea = document.getElementById('editStoryText');
    const btn = document.getElementById('regenerateBtn');
    if (!title && !currentContent) {
        alert("Por favor, ponle un título o contenido al cuento para poder mejorarlo.");
        return;
    }
    const originalText = textArea.value;
    textArea.value = "🪄 Las hadas están mejorando y alargando tu cuento...";
    textArea.disabled = true;
    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = "<span>⏳</span> Magia en proceso...";
    btn.disabled = true;
    try {
        const aiPrompt = `Actúa como un cuentacuentos experto para niños maravillosos. El título es "${title}". Alarga, mejora y añade detalles mágicos a este texto: "${currentContent}". Debe ser muy creativo, descriptivo, tener unos 4 o 5 párrafos y un final hermoso. Responde SÓLO con el cuento mejorado, sin notas adicionales.`;
        const response = await fetch(`https://gen.pollinations.ai/text/${encodeURIComponent(aiPrompt)}?model=mistral&key=pk_iOJLArs0DLNG7EGm`);
        if (!response.ok) throw new Error("API falló");
        let newStory = await response.text();
        newStory = newStory.replace(/^"|"$/g, '').trim();
        textArea.value = newStory;
    } catch (error) {
        console.error(error);
        alert("Uy, la magia se interrumpió de repente.");
        textArea.value = originalText;
    } finally {
        textArea.disabled = false;
        btn.innerHTML = originalBtnHTML;
        btn.disabled = false;
    }
}

async function saveEditedStory() {
    if (!storyToEdit) return;
    const newTitle = document.getElementById('editStoryTitle').value.trim();
    const newContent = document.getElementById('editStoryText').value.trim();
    if (!newTitle || !newContent) {
        alert("El título y el contenido no pueden estar vacíos.");
        return;
    }
    if (!checkSafetyAndAlert(newTitle) || !checkSafetyAndAlert(newContent)) return;
    try {
        await db.collection('stories').doc(storyToEdit).update({ title: newTitle, content: newContent });
        closeEditModal();
        const user = firebase.auth().currentUser;
        if (user) loadStories(user.uid);
    } catch (error) { console.error(error); alert("Hubo un error al guardar."); }
}

// --- GALLERÍA Y CAMBIO DE IMAGEN ---
const magicImages = [
    { url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400", tags: "aventura libro lectura bosque cuentos magia historia pajaro hoja papel leer escrito autor literatura" },
    { url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400", tags: "aventura castillo magia palacio fortaleza rey reina princesa principe caballero dragon torre medieval" },
    { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400", tags: "aventura montaña naturaleza aire libre pico nieve azul frio altura viaje excursion" },
    { url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=400", tags: "aventura selva jungla explorador verde plantas lianas safari bosque tropical amazonas" },
    { url: "https://images.unsplash.com/photo-1550747528-cdb45925b3f7?auto=format&fit=crop&q=80&w=400", tags: "animal unicornio blanco fantasia caballo cuerno magico brillo arcoiris mitologico" },
    { url: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=400", tags: "animal robot perro tecnologia cibernetico metal futuro juguete raro maquina androide" },
    { url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400", tags: "animal perro cachorro mascota can tierno peludo oido orejas fiel amigo guau" },
    { url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400", tags: "animal gato minino mascota felino orejas bigotes gatito miau ronroneo casa" },
    { url: "https://images.unsplash.com/photo-1516331438075-f3ad16d49f25?auto=format&fit=crop&q=80&w=400", tags: "fantasia estrellas brillante noche cielo luz polvo hadas centelleo universo" },
    { url: "https://images.unsplash.com/photo-1519074063912-214c5f66be0f?auto=format&fit=crop&q=80&w=400", tags: "fantasia hada bosque magia peque volando alas criatura bosque encantado" },
    { url: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&q=80&w=400", tags: "fantasia cristal castillo brillante diamante joya luz palacio reluciente" },
    { url: "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=400", tags: "fantasia mundo magico surrealista sueño arte colores imaginacion viaje" },
    { url: "https://images.unsplash.com/photo-1446776814953-b23d57bd21aa?auto=format&fit=crop&q=80&w=400", tags: "espacio tierra planeta nasa astronauta naves estrellas galaxia orbita mundo cohete" },
    { url: "https://images.unsplash.com/photo-1451487580459-43490279c0fa?auto=format&fit=crop&q=80&w=400", tags: "espacio galaxia azul cosmos estrellas infinito universo red sistema solar" },
    { url: "https://images.unsplash.com/photo-1447433589675-4aaa56a4010a?auto=format&fit=crop&q=80&w=400", tags: "espacio estrellas nebulosa polvo gas colores vacio profundo" },
    { url: "https://images.unsplash.com/photo-1614730321446-b6fa6a46bac4?auto=format&fit=crop&q=80&w=400", tags: "espacio luna noche crater astronauta bandera satelite blanco negro" },
    { url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400", tags: "paisaje bosque verde arboles bosque madera sol rayos luz pinos paz" },
    { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=400", tags: "paisaje rio agua montañas lago canoa paz reflejo naturaleza" },
    { url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=400", tags: "paisaje casa campo flores granja jardin verde cielo granero pradera" },
    { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400", tags: "paisaje playa mar arena oceano palmeras vacaciones sol azul verano olas" }
];

const masterDictionary = {
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
    'gato con botas': { en: 'Puss in Boots character from Shrek, wearing a large feathered hat, leather boots, and a small cape', cat: 'subject', sub: 'character' },
    'botas': { en: 'leather boots', cat: 'modifier' },
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
    'dinosaurio': { en: 'dinosaur', cat: 'subject' },
    'dragon': { en: 'dragon', cat: 'subject' },
    'dragón': { en: 'dragon', cat: 'subject' },
    'sapo': { en: 'frog', cat: 'subject', sub: 'animal' },
    'rana': { en: 'frog', cat: 'subject', sub: 'animal' },
    'sapito': { en: 'cute frog', cat: 'subject', sub: 'animal' },
    'superman': { en: 'Superman superhero', cat: 'subject', sub: 'hero' },
    'batman': { en: 'Batman superhero', cat: 'subject', sub: 'hero' },
    'spiderman': { en: 'Spider-man superhero', cat: 'subject', sub: 'hero' },
    'ironman': { en: 'Ironman superhero', cat: 'subject', sub: 'hero' },
    'hulk': { en: 'giant green muscular superhero hulk', cat: 'subject', sub: 'hero' },
    'thor': { en: 'Thor superhero', cat: 'subject', sub: 'hero' },
    'wonderwoman': { en: 'Wonder Woman superhero', cat: 'subject', sub: 'hero' },
    'robot': { en: 'friendly high-tech shiny robot', cat: 'subject', sub: 'robot' },
    'princesa': { en: 'fairytale princess', cat: 'subject' },
    'principe': { en: 'fairytale prince', cat: 'subject' },
    'hada': { en: 'magical glowing fairy', cat: 'subject' },
    'mago': { en: 'wise old wizard', cat: 'subject' },
    'pirata': { en: 'pirate', cat: 'subject' },
    'ninja': { en: 'ninja', cat: 'subject' },
    'caballero': { en: 'knight', cat: 'subject' },
    'astronauta': { en: 'astronaut', cat: 'subject' },
    'bosque': { en: 'enchanted forest', cat: 'landscape' },
    'playa': { en: 'tropical beach', cat: 'landscape' },
    'mar': { en: 'deep blue ocean', cat: 'landscape' },
    'espacio': { en: 'epic outer space', cat: 'landscape' },
    'castillo': { en: 'magical fairytale castle', cat: 'landscape' },
    'ciudad': { en: 'futuristic city', cat: 'landscape' }
};

const curatedImages = {
    'ironman': 'https://gen.pollinations.ai/image/Iron%20Man%20superhero?width=512&height=512&seed=42&nologo=true&model=flux',
    'spiderman': 'https://gen.pollinations.ai/image/Spider-Man%20superhero?width=512&height=512&seed=7&nologo=true&model=flux',
    'batman': 'https://gen.pollinations.ai/image/Batman%20superhero?width=512&height=512&seed=13&nologo=true&model=flux'
};

function openImageModal(storyId) {
    storyToUpdateImage = storyId;
    selectedImageUrl = null;
    
    // Clear search and reset UI
    const searchInput = document.getElementById('gallerySearch');
    if (searchInput) searchInput.value = '';
    
    const confirmBtn = document.getElementById('confirmImageBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
    }
    
    renderGallery(magicImages);
    document.getElementById('imageModal').classList.add('active');
}

function renderGallery(images) {
    const grid = document.getElementById('imageGalleryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (images.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">No encontramos esa magia...</p>';
        return;
    }
    images.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.position = 'relative';
        item.innerHTML = `
            <div class="magic-spinner" style="position:absolute; top:40%; left:45%; z-index:1; font-size:2.5rem; opacity:0.5;">🪄</div>
            <img src="${img.url}" alt="Opción Mágica" loading="lazy" style="z-index:2; opacity:0; transition:opacity 0.4s ease; width:100%; height:100%; object-fit:cover; position:relative;">
        `;
        item.onclick = function() { selectImage(this.querySelector('img').src, item); };
        
        const imgElement = item.querySelector('img');
        imgElement.onload = () => {
            item.classList.add('loaded');
            item.style.background = 'white';
            imgElement.style.opacity = '1';
        };
        imgElement.onerror = () => {
            item.innerHTML = '<div style="position:absolute; top:40%; left:10%; right:10%; text-align:center; color:#94a3b8; font-size:0.9rem;">No se pudo crear la magia 😔</div>';
        };
        grid.appendChild(item);
    });
}

let galleryDebounceTimer;
function liveGallerySearch() {
    clearTimeout(galleryDebounceTimer);
    galleryDebounceTimer = setTimeout(() => { filterGallery(); }, 300); // Reducir a 300ms para más velocidad
    toggleGalleryClearBtn();
}

async function filterGallery() {
    const queryInput = document.getElementById('gallerySearch');
    const query = queryInput.value.toLowerCase().trim();
    if (!query) { 
        renderGallery(magicImages); 
        document.getElementById('galleryLoader').style.display = 'none';
        return; 
    }
    
    if (!checkSafetyAndAlert(query)) return;
    
    const grid = document.getElementById('imageGalleryGrid');
    const loader = document.getElementById('galleryLoader');
    
    if (!grid) return;
    grid.innerHTML = '';
    if (loader) loader.style.display = 'block';

    const localResults = magicImages.filter(img => img.tags.toLowerCase().includes(query));
    
    // Búsqueda en diccionario maestro para mejorar prompts
    let translated = query;
    const sortedKeys = Object.keys(masterDictionary).sort((a,b) => b.length - a.length);
    for (let k of sortedKeys) {
        const regex = new RegExp(`\\b${k}\\b`, 'gi');
        if (regex.test(translated)) translated = translated.replace(regex, masterDictionary[k].en);
    }

    const aiResults = [];
    const cleanQuery = translated.replace(/[^a-zA-Z0-9 ]/g, '');
    // Prompt directo y ligero para reducir delay
    const prompt = `Clear illustration of ${cleanQuery}, storybook style, no text, vivid`;
    
    // Generar menos imágenes iniciales para que cargue más rápido (ej: 4 en lugar de 8)
    for (let i = 0; i < 4; i++) {
        const seed = Math.floor(Math.random() * 5000000);
        aiResults.push({ 
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`, 
            tags: query 
        });
    }

    if (loader) loader.style.display = 'none'; 
    const finalResults = [...localResults, ...aiResults];
    
    // Feedback de resultados
    const feedback = document.getElementById('searchFeedback');
    const countEl = document.getElementById('resultsCount');
    if (feedback && countEl) {
        countEl.innerText = finalResults.length;
        feedback.style.display = 'block';
    }
    
    renderGallery(finalResults); 
}

function toggleGalleryClearBtn() {
    const input = document.getElementById('gallerySearch');
    const btn = document.getElementById('clearGallerySearch');
    if (input.value.trim().length > 0) btn.style.display = 'flex';
    else btn.style.display = 'none';
}

function clearGallerySearch() {
    const input = document.getElementById('gallerySearch');
    input.value = '';
    toggleGalleryClearBtn();
    renderGallery(magicImages);
}

function selectImage(url, element) {
    selectedImageUrl = url;
    document.querySelectorAll('.gallery-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    const btn = document.getElementById('confirmImageBtn');
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.disabled = false;
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
    storyToUpdateImage = null;
    selectedImageUrl = null;
}

async function saveNewImage() {
    if (!storyToUpdateImage || !selectedImageUrl) return;
    const btn = document.getElementById('confirmImageBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '🪄 Hechizando...';
    btn.disabled = true;
    try {
        await db.collection('stories').doc(storyToUpdateImage).update({
            coverImg: selectedImageUrl,
            characterImg: selectedImageUrl,
            placeImg: selectedImageUrl
        });
        
        // Actualizar localmente para feedback inmediato
        const storyIndex = currentStoriesData.findIndex(s => s.id === storyToUpdateImage);
        if (storyIndex !== -1) {
            currentStoriesData[storyIndex].coverImg = selectedImageUrl;
        }
        
        celebrate();
        closeImageModal();
        renderStoriesFromData(currentStoriesData); // Re-renderizar para ver el cambio ya
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    } catch (error) { 
        console.error(error); 
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert("Hubo un problema al guardar la imagen.");
    }
}

// --- PWA & SERVICE WORKER ---
window.addEventListener('appinstalled', () => {
    const user = firebase.auth().currentUser;
    if (user) {
        db.collection("users").doc(user.uid).update({ pwaInstalled: true, installedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(e => console.log(e));
    }
});

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(e => console.log(e)); });
}

// --- MODO LUNA ---
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateThemeUI(isDark);
    
    if (isDark) celebrate();
}

function updateThemeUI(isDark) {
    const label = document.getElementById('theme-label');
    const icon = document.getElementById('theme-icon');
    const checkbox = document.getElementById('darkModeToggle');
    if (isDark) {
        if (label) label.innerText = "Modo Luna";
        if (icon) icon.innerText = "🌙";
        if (checkbox) checkbox.checked = true;
    } else {
        if (label) label.innerText = "Modo Día";
        if (icon) icon.innerText = "☀️";
        if (checkbox) checkbox.checked = false;
    }
}

if (localStorage.getItem('darkMode') === 'true') { 
    document.body.classList.add('dark-mode'); 
}

document.addEventListener('DOMContentLoaded', () => {
    updateThemeUI(document.body.classList.contains('dark-mode'));
});

// --- COMPARTIR ---
function shareStory(title, id) {
    const text = `¡Mira el cuento que creamos: "${title}"! ✨\nLéelo aquí: https://cuentos-infantiles-2026.web.app/story-reader.html?id=${id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function celebrate() {
    if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 100, origin: { y: 0.7 }, colors: ['#6366f1', '#a855f7', '#ec4899'] });
}

// --- ONLINE/OFFLINE ---
function updateOnlineStatus() {
    const banner = document.getElementById('offlineBanner');
    if (banner) banner.style.display = navigator.onLine ? 'none' : 'block';
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// --- SIDEBAR ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function handleSidebarNav(tab) {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.getElementById(`side-${tab}`);
    if (activeItem) activeItem.classList.add('active');
    
    switchDashboardTab(tab);
    
    // Auto-hide the sidebar after selecting an option
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const imodal = document.getElementById('imageModal');
        const sbar = document.getElementById('sidebar');
        const pmodal = document.getElementById('profileModal');
        if (pmodal && pmodal.classList.contains('active')) pmodal.classList.remove('active');
        if (imodal && imodal.classList.contains('active')) closeImageModal();
        if (sbar && sbar.classList.contains('active')) toggleSidebar();
    }
});

// --- NEW V20 INTERACTION: AVATAR MAGIC CLICK ---
function handleAvatarClick() {
    const toast = document.getElementById('magicRankToast');
    const rankText = document.getElementById('magicRankText')?.innerText || "Hechicero Aprendiz";
    
    // Trigger celebration (confetti)
    if (typeof celebrate === 'function') celebrate();
    else if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    // Update and show toast
    if (toast) {
        toast.innerText = `✨ ¡${rankText}!`;
        toast.classList.add('visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }
    
    console.log("✨ Magia invocada desde el Avatar!");
}

// --- ECONOMÍA MÁGICA (V22) ---
// Escuchar recompensas globales para actualizar la UI en tiempo real
window.addEventListener('magicDustEarned', (e) => {
    const amount = e.detail.amount;
    const dustEl = document.getElementById('magicDustDisplay');
    if (dustEl) {
        const current = parseInt(dustEl.innerText) || 0;
        dustEl.innerText = current + amount;
        
        // Animación pequeña
        dustEl.parentElement.style.transform = 'scale(1.2)';
        dustEl.parentElement.style.boxShadow = '0 0 15px #fbbf24';
        setTimeout(() => {
            dustEl.parentElement.style.transform = 'scale(1)';
            dustEl.parentElement.style.boxShadow = 'none';
        }, 300);
    }
});
