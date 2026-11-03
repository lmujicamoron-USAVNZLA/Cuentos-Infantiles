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

        // Registro directo y blindado en Firebase Auth (previene scraping y errores de reglas privadas)
        auth.createUserWithEmailAndPassword(email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;

                // 1. Enviar correo de verificación (AUTOMÁTICO)
                try {
                    await user.sendEmailVerification();
                    console.log("Correo de verificación enviado a:", email);
                } catch (emailErr) {
                    console.warn("Aviso al enviar verificación de correo:", emailErr);
                }

                // 2. Guardar datos iniciales en Firestore
                await db.collection("users").doc(user.uid).set({
                    username: username,
                    email: email,
                    avatar: imagePreview.src || '',
                    status: (email === 'historycreatorkids@gmail.com' || email === 'lmujimoron@gmail.com') ? 'aprobado' : 'pendiente',
                    emailVerified: false,
                    magicDust: 50,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                localStorage.setItem('lastUser', username);
                alert("¡Cuenta creada con éxito! 📧 Te hemos enviado un correo de verificación. Por favor revisa tu bandeja de entrada.");
                window.location.href = 'verify-account.html';
            })
            .catch((error) => {
                console.error("Error en Firebase:", error);
                btn.innerHTML = originalContent;
                btn.style.opacity = '1';
                btn.disabled = false;

                if (error.code === 'auth/email-already-in-use') {
                    alert("¡Este correo ya está registrado en el reino! Por favor, inicia sesión.");
                    window.location.href = 'login.html';
                } else if (error.code === 'auth/weak-password') {
                    alert("La contraseña debe tener al menos 6 caracteres mágicos.");
                } else if (error.code === 'auth/invalid-email') {
                    alert("Por favor ingresa un correo electrónico válido.");
                } else {
                    alert("Hubo un problema al registrar la cuenta: " + error.message);
                }
            });
    });
});
