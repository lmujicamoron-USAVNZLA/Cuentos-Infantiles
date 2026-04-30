// Firebase Configuration for Cuentos Infantiles
const firebaseConfig = {
    apiKey: "AIzaSyA7vi4r6ahe-sZf8bFW0u1zCB54JkHPDFw",
    authDomain: "cuentos-infantiles-2026.firebaseapp.com",
    projectId: "cuentos-infantiles-2026",
    storageBucket: "cuentos-infantiles-2026.firebasestorage.app",
    messagingSenderId: "454293856709",
    appId: "1:454293856709:web:6b40a7fa1788e3681c6bac",
    measurementId: "G-GSLT5XHTPV"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Global utility for local mode logging
if (window.location.protocol === 'file:') {
    console.log("🚀 Modo Local Mágico Activado (Firebase Init)");
}

// --- ECONOMÍA MÁGICA GLOBAL (V22) ---
async function rewardMagicDust(amount) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        const userRef = db.collection("users").doc(user.uid);
        await userRef.update({
            magicDust: firebase.firestore.FieldValue.increment(amount)
        });
        
        console.log(`✨ ¡Recompensa concedida!: ${amount} Polvo de Hada`);
        
        // Si estamos en el Dashboard, la UI se actualiza automáticamente por el listener o podemos disparar un evento
        window.dispatchEvent(new CustomEvent('magicDustEarned', { detail: { amount } }));

        // Notificación de Sparky si está disponible
        if (window.Sparky) {
            Sparky.say(`¡Increíble! Ganaste ${amount} ✨ de Polvo de Hada.`, 4000);
        }
    } catch (e) {
        console.error("Error al recompensar con polvo de hada:", e);
    }
}
