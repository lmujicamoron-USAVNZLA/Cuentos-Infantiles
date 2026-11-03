# 📜 POLÍTICA DE PRIVACIDAD Y SOLICITUD DE BORRADO DE DATOS
## APLICACIÓN: SISTEMA GALÁCTICO (GALACTICSYS)
**Última Actualización:** 2026  
**Responsable y Desarrollador:** Luis A. Mujica M.  
**Correo Electrónico de Contacto Oficial:** `admingalactic@gmail.com`  
**Aplicación:** Sistema Galáctico / GalacticSys (`com.galactic.app`)  

---

### 1. COMPROMISO Y FILOSOFÍA DE PRIVACIDAD
El **Sistema Galáctico** es una plataforma educativa, científica y de divulgación astronómica concebida con el principio fundamental de **Privacidad desde el Diseño (Privacy by Design)**.
* **NO vendemos, alquilamos ni comercializamos datos de los usuarios.**
* **NO utilizamos rastreadores publicitarios, anuncios invasivos ni tecnologías de perfilado de marketing.**
* Cumplimos estrictamente con las regulaciones internacionales de protección de datos:
  - **GDPR** (Reglamento General de Protección de Datos de la Unión Europea).
  - **COPPA** (Children's Online Privacy Protection Act de EE.UU.).
  - Políticas de Privacidad y Requisitos de Seguridad de Datos de **Google Play Store**.

---

### 2. DATOS QUE RECOPILAMOS Y FINALIDAD
Para el funcionamiento técnico de las telecomunicaciones galácticas y la cartografía estelar, la aplicación trata únicamente los siguientes datos:

1. **Identificador de Estación y Cuenta:**
   - Nombre de estación de radio (ej. `Alpha-01`, `Estación Orión`).
   - Correo electrónico para autenticación segura mediante Firebase Authentication.
   - Avatar seleccionado de la biblioteca local o fotografía voluntaria de perfil.
2. **Telemetría y Estado de Enlace:**
   - Frecuencia sintonizada (ej. `1420.405 MHz`).
   - Marca de tiempo del último latido de presencia (*heartbeat*) para reflejar el estado activo en el Mapa Estelar.
3. **Contenido de las Transmisiones:**
   - Matrices de dibujo de 128x32 bits y notas de voz transmitidas únicamente a las estaciones de destino autorizadas por el usuario.
   - Las notas de voz se transfieren con el consentimiento expreso del usuario al pulsar el botón de emisión.

---

### 3. PROTECCIÓN ESPECIAL A MENORES DE EDAD (COPPA)
Dado el carácter didáctico y formativo de la aplicación:
* **Tolerancia Cero al Acoso o Contenido Inapropiado:** La aplicación incluye un **Filtro Preventivo de Respeto** en el dispositivo que analiza el lenguaje y detiene emisiones vulgares u ofensivas antes de que salgan a la red.
* **Sin Recopilación de Ubicación Física GPS:** El Mapa Estelar es una representación cósmica simulada; en ningún momento se accede al sensor GPS ni se geolocaliza a ningún usuario en el mundo físico.

---

### 4. ALMACENAMIENTO, SEGURIDAD Y PERMISOS DE DISPOSITIVO

#### Permisos de Hardware en la Aplicación Android:
* **Micrófono (`RECORD_AUDIO`):** Utilizado exclusivamente cuando el operador mantiene pulsado el botón de grabación en el módulo de transmisión de voz (PTT). El audio solo se captura con la acción voluntaria del usuario.
* **Almacenamiento / Sistema de Archivos (`READ/WRITE_EXTERNAL_STORAGE` / Capacitor Filesystem):** Utilizado exclusivamente para que el usuario pueda guardar y exportar en su dispositivo sus grabaciones de voz (`.webm`), imágenes SSTV o archivos binarios `.bin`.

#### Seguridad:
* Toda la comunicación entre estaciones y la base de datos se realiza bajo cifrado de extremo a extremo en tránsito mediante **HTTPS / TLS 1.3**.
* Las reglas de seguridad de Firestore impiden que estaciones ajenas lean o modifiquen transmisiones no autorizadas.

---

### 5. DERECHOS DEL USUARIO: SOLICITUD DE BORRADO DE CUENTA Y DATOS
*(Instrucciones de Eliminación para Usuarios de Google Play)*

Cualquier operador o usuario de **GalacticSys** puede solicitar la eliminación total o parcial de su cuenta y sus datos en cualquier momento siguiendo estos pasos:

1. **Procedimiento de Solicitud de Borrado:**
   * Envíe un correo electrónico a la dirección oficial: **`admingalactic@gmail.com`**
   * Indique en el asunto: `Solicitud de Borrado de Cuenta GalacticSys`
   * En el mensaje, indique el correo electrónico asociado a su estación espacial.
2. **Plazo de Procesamiento:**
   * Su solicitud será procesada en un plazo máximo de 24 a 48 horas laborables.
3. **Datos que se Eliminan Definitivamente:**
   * Registro de cuenta y credenciales en Firebase Authentication.
   * Perfil de la estación en la base de datos (nombre de operador, avatar, configuración).
   * Mensajes y transmisiones directas emitidas por la estación.
4. **Datos Retenidos:**
   * No se retiene ningún dato personal una vez completada la supresión.
5. **Limpieza Local Inmediata:**
   * El usuario puede además borrar su caché local, archivos guardados y cerrar sesión en cualquier momento directamente desde el menú de opciones de la aplicación.

---

### 6. CONTACTO OFICIAL
Para cualquier duda, consulta sobre privacidad o ejercicio de sus derechos ARCO/GDPR:  
**Director de Misión:** Luis A. Mujica M.  
**Correo:** `admingalactic@gmail.com`  

