// Firebase Configuration for Cuentos Infantiles
const firebaseConfig = {
    apiKey: "AIzaSyCbqTjvMwQ6NPkdmXnODLIOM-hbZKkfKks",
    authDomain: "storycreator2024.firebaseapp.com",
    projectId: "storycreator2024",
    storageBucket: "storycreator2024.appspot.com",
    messagingSenderId: "882256272683",
    appId: "1:882256272683:web:ea287fc61291282ace396e",
    measurementId: "G-CGD4STB077"
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
