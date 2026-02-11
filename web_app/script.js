document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const avatarInput = document.getElementById('avatarInput');
    const imagePreview = document.getElementById('imagePreview');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Handle Avatar Preview
    avatarInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    // Form Submission and Validation
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validation Logic (replicating FlutterFlow model)
        if (!username) {
            alert('El nombre de usuario es requerido');
            return;
        }

        if (!email) {
            alert('El correo electrónico es requerido');
            return;
        }

        // Simple Email Regex (matching kTextValidatorEmailRegex logic)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Por favor, ingresa un correo electrónico válido');
            return;
        }

        if (!password) {
            alert('La contraseña es requerida');
            return;
        }

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        // --- REGISTRO REAL CON FIREBASE ---
        const auth = firebase.auth();
        const db = firebase.firestore();

        const btn = registerForm.querySelector('.submit-btn');
        const originalContent = btn.innerHTML;

        btn.innerHTML = '<span>🚀 Creando cuenta mágica...</span>';
        btn.style.opacity = '0.7';
        btn.disabled = true;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // 1. Enviar correo de verificación (AUTOMÁTICO)
                return user.sendEmailVerification().then(() => {
                    alert("¡Correo enviado! Revisa tu bandeja de entrada para activar tu cuenta.");
                    // 2. Guardar datos adicionales en Firestore
                    return db.collection("users").doc(user.uid).set({
                        username: username,
                        email: email,
                        avatar: imagePreview.src || '',
                        status: 'pendiente',
                        emailVerified: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
            })
            .then(() => {
                localStorage.setItem('lastUser', username);
                window.location.href = 'verify-account.html';
            })
            .catch((error) => {
                console.error("Error en Firebase:", error);
                btn.innerHTML = originalContent;
                btn.style.opacity = '1';
                btn.disabled = false;
                alert("Hubo un error: " + error.message);
            });
    });
});
