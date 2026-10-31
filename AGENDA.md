# 📅 Agenda de Trabajo - Proyecto Mágico (Cuentos Infantiles)

## 📌 Puntos para la siguiente sesión:

### 1. Flujo de Registro y Verificación de Correo
- **Problema detectado:**
  1. El correo de verificación enviado por la app (`user.sendEmailVerification()`) no llegó a la bandeja del usuario (posible spam, configuración de remitente o plantilla en la consola de Firebase).
  2. El usuario pudo acceder directamente a la aplicación sin necesidad de haber verificado su correo previamente ni esperar aprobación.
- **Causas identificadas para revisar con el Admin:**
  - `createUserWithEmailAndPassword` deja la sesión iniciada automáticamente en Firebase Auth tras el registro.
  - Las pantallas interiores (`dashboard.html`, `dashboard-logic.js`, `logic-v22.js`) solo verifican si el usuario está autenticado (`if (user)`), pero no restringen el paso si `!user.emailVerified` o si `status !== 'aprobado'`.
  - Los correos de superusuario cuentan con bypass intencional en `login.html`.
- **Propuesta de solución a consultar y aprobar con el Admin antes de tocar código:**
  - Cerrar sesión (`auth.signOut()`) inmediatamente después del registro hasta que el correo sea confirmado.
  - Blindar el guardián de rutas en `dashboard.html` para que redirija a `verify-account.html` si el correo no está verificado.
  - Revisar la plantilla y remitente de Firebase Authentication Console.

---
*Nota: Siguiendo las directrices del proyecto, no se modificará ningún archivo de código hasta contar con la aprobación explícita del administrador.*
