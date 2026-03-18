/**
 * Safety & Moderation Module for Story Creator Kids
 * This script handles content filtering and parental gates.
 */

const SAFETY_BLACKLIST = [
    // Sexual content (Spanish)
    'sexo', 'sexual', 'porno', 'pornografía', 'erótico', 'erotica', 'pene', 'vagina', 'teta', 'pecho', 'culo', 'trasero',
    'prostituta', 'puta', 'puto', 'verga', 'pito', 'coito', 'masturbación', 'orgasmo', 'violar', 'violación',
    'fetiche', 'incesto', 'pedofilia', 'pornografia', 'penis', 'vagina', 'clitoris', 'espermatozoide',
    // Violence / Gore
    'sangre', 'matar', 'muerte', 'asesino', 'suicidio', 'tortura', 'terrorismo', 'bomba', 'armas', 'pistola', 'cuchillo',
    'escopeta', 'metralleta', 'desmembrar', 'cadáver', 'sangriento', 'masacre', 'guerra',
    // Drugs
    'droga', 'cocaína', 'heroína', 'marihuana', 'alcohol', 'borracho', 'anfetamina', 'éxtasis', ' LSD ',
    // Hate speech / Insults
    'odio', 'racista', 'nazi', 'estúpido', 'idiota', 'imbécil', 'maldito', 'hijo de puta', 'mierda', 'cabrón',
    // English equivalents
    'sex', 'porn', 'ebony', 'intercourse', 'vagina', 'penis', 'boobs', 'butt', 'ass', 'murder', 'kill', 'death', 'blood',
    'drugs', 'cocaine', 'weed', 'stupid', 'idiot', 'shit', 'fuck', 'bastard', 'nazi', 'hitler'
];

/**
 * Validates text against the blacklist.
 * @param {string} text - The text to check.
 * @returns {object} - { valid: boolean, word: string | null }
 */
function validateContent(text) {
    if (!text) return { valid: true, word: null };
    
    // Normalize text: lowercase and remove some common obfuscation
    const lowerText = text.toLowerCase();
    const normalizedText = lowerText.replace(/[\s\._\-]/g, ""); // Remove spaces, dots, underscores for substring check
    
    for (let forbidden of SAFETY_BLACKLIST) {
        // 1. Exact or substring match in original text
        if (lowerText.includes(forbidden.toLowerCase().trim())) {
            return { valid: false, word: forbidden.trim() };
        }
        
        // 2. Match in normalized text (prevents s e x o, s.e.x.o, etc)
        const cleanForbidden = forbidden.toLowerCase().trim().replace(/[\s\._\-]/g, "");
        if (cleanForbidden.length > 2 && normalizedText.includes(cleanForbidden)) {
            return { valid: false, word: forbidden.trim() };
        }
    }

    return { valid: true, word: null };
}

/**
 * Checks if a search query is safe and shows an alert if not.
 * @param {string} text - The search query.
 * @returns {boolean} - True if safe, false otherwise.
 */
function checkSafetyAndAlert(text) {
    const result = validateContent(text);
    if (!result.valid) {
        alert(`¡Cuidado! ✨ La palabra "${result.word}" no es adecuada para nuestro mundo mágico. Por favor, usa palabras más amigables.`);
        return false;
    }
    return true;
}

/**
 * Trigers a Parental Gate (Math Challenge)
 * @returns {Promise<boolean>} - True if solved correctly, false otherwise.
 */
async function triggerParentalGate() {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const answer = n1 + n2;
    
    // Create a custom modal for the parental gate
    const container = document.createElement('div');
    container.id = 'parentalGate';
    container.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(8px);
    `;
    
    container.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 1.5rem; text-align: center; max-width: 350px;">
            <h2 style="color: #4f46e5; margin-bottom: 1rem;">Solo para adultos ✨</h2>
            <p style="margin-bottom: 1.5rem; color: #64748b;">Por favor, resuelve este pequeño acertijo para continuar:</p>
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: #1e293b;">${n1} + ${n2} = ?</div>
            <input type="number" id="gateAnswer" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 1rem; text-align: center; font-size: 1.5rem; margin-bottom: 1.5rem;">
            <button id="gateSubmit" style="width: 100%; padding: 1rem; background: #6366f1; color: white; border: none; border-radius: 1rem; font-weight: 600; cursor: pointer;">Continuar</button>
            <button id="gateCancel" style="margin-top: 1rem; background: transparent; border: none; color: #94a3b8; font-size: 0.9rem; cursor: pointer;">Cancelar</button>
        </div>
    `;
    
    document.body.appendChild(container);
    document.getElementById('gateAnswer').focus();

    return new Promise((resolve) => {
        const input = document.getElementById('gateAnswer');
        const submit = document.getElementById('gateSubmit');
        const cancel = document.getElementById('gateCancel');

        const onKeyDown = (e) => {
            if (e.key === 'Escape') handleResult(false);
        };
        window.addEventListener('keydown', onKeyDown);

        const handleResult = (success) => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.removeChild(container);
            resolve(success);
        };

        submit.onclick = () => {
            if (parseInt(input.value) === answer) {
                handleResult(true);
            } else {
                alert("Uy, la magia no ha funcionado. Inténtalo de nuevo.");
                handleResult(false);
            }
        };

        input.onkeypress = (e) => {
            if (e.key === 'Enter') submit.onclick();
        };

        cancel.onclick = () => handleResult(false);
    });
}
