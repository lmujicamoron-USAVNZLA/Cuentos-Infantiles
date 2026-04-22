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
