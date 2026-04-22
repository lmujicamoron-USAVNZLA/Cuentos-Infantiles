/**
 * Sparky the Dragon - V19.5 LEGENDARY TURBO EDITION
 * Majestic dragon design with sharp features, bat-like wings and dorsal ridges.
 * Optimized for performance and visual magic.
 */

const Mascot = {
    element: null,
    bubble: null,
    sayTimeout: null,
    
    init: function() {
        if (document.getElementById('mascot-container')) return;
        
        const container = document.createElement('div');
        container.id = 'mascot-container';
        container.className = 'mascot-container';
        
        container.innerHTML = `
            <div class="mascot-wrapper" onclick="Sparky.onClick()">
                <div class="mascot-bubble" id="mascot-bubble">¡Soy un Dragón Legendario! 🐉</div>
                <div class="mascot-svg">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <!-- Cola Larga y Espinada -->
                        <path d="M60,110 Q20,150 10,180 L0,200 L30,170 Q40,140 60,110" fill="#4f46e5" />
                        <path d="M15,165 L5,175 M25,145 L15,155 M35,125 L25,135" stroke="#ec4899" stroke-width="3" />

                        <!-- Alas de Batalla (Angular) -->
                        <g class="mascot-wing left">
                            <path d="M70,80 L20,30 L50,70 L25,90 L70,100" fill="#4338ca" stroke="#818cf8" stroke-width="2" />
                            <circle cx="20" cy="30" r="3" fill="#818cf8" /> <!-- Garra ala -->
                        </g>
                        <g class="mascot-wing right">
                            <path d="M130,80 L180,30 L150,70 L175,90 L130,100" fill="#4338ca" stroke="#818cf8" stroke-width="2" />
                            <circle cx="180" cy="30" r="3" fill="#818cf8" /> <!-- Garra ala -->
                        </g>
                        
                        <!-- Cuerpo Robusto con Cresta -->
                        <path d="M60,110 Q100,160 140,110 Q140,70 100,60 Q60,70 60,110" fill="#6366f1" stroke="#4338ca" stroke-width="2" />
                        <!-- Cresta Dorsal -->
                        <path d="M80,65 L100,45 L120,65 Z" fill="#4338ca" />
                        <path d="M90,55 L110,35 L130,55 Z" fill="#4338ca" opacity="0.5" />
                        
                        <path d="M85,120 Q100,135 115,120" fill="none" stroke="white" stroke-width="1" opacity="0.3" /> <!-- Escamas -->

                        <!-- Cabeza Alargada de Dragón -->
                        <path d="M70,70 L100,40 L130,70 L140,95 L120,105 L100,100 L80,105 L60,95 Z" fill="#6366f1" stroke="#4338ca" stroke-width="2" />
                        
                        <!-- Cuernos Legendarios -->
                        <path d="M85,45 Q75,5 65,25" fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" />
                        <path d="M115,45 Q125,5 135,25" fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" />
                        
                        <!-- Hocico y Narinas (Estilo Reptil) -->
                        <path d="M85,90 L115,90 L120,100 L80,100 Z" fill="#4338ca" />
                        <circle cx="95" cy="95" r="2.5" fill="#1e1b4b" />
                        <circle cx="105" cy="95" r="2.5" fill="#1e1b4b" />
                        
                        <!-- Ojos Brillantes -->
                        <circle cx="88" cy="65" r="8" fill="white" />
                        <circle cx="112" cy="65" r="8" fill="white" />
                        <circle cx="88" cy="65" r="4.5" fill="#1e1b4b" class="mascot-eye" />
                        <circle cx="112" cy="65" r="4.5" fill="#1e1b4b" class="mascot-eye" />
                        
                        <!-- Llamas de Energía -->
                        <g class="mascot-fire">
                           <path d="M100,105 Q100,140 120,120 T100,165" fill="#f59e0b" opacity="0.9" />
                        </g>
                    </svg>
                </div>
            </div>
            <style>
                .mascot-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                    pointer-events: none;
                    animation: mascotFloat 5s ease-in-out infinite;
                }
                .mascot-wrapper {
                    position: relative;
                    width: 145px;
                    height: 145px;
                    pointer-events: auto;
                    cursor: pointer;
                    filter: drop-shadow(0 15px 30px rgba(99,102,241,0.4));
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .mascot-wrapper:active { transform: scale(0.9); }
                
                .mascot-bubble {
                    position: absolute;
                    top: -70px;
                    right: 110px;
                    background: white;
                    padding: 12px 22px;
                    border-radius: 20px;
                    font-size: 0.95rem;
                    font-weight: 900;
                    color: #4f46e5;
                    box-shadow: 0 10px 35px rgba(0,0,0,0.2);
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                    white-space: nowrap;
                    border: 3px solid #818cf8;
                    z-index: 10000;
                }
                .mascot-bubble.show { opacity: 1; transform: translateY(0); }
                .mascot-wing { transform-origin: center; animation: wingHeavy 2s ease-in-out infinite alternate; }
                .mascot-fire { animation: pulseFire 0.6s infinite alternate; }
                
                @keyframes mascotFloat {
                    0%, 100% { transform: translateY(0) rotate(-1deg); }
                    50% { transform: translateY(-22px) rotate(1deg); }
                }
                @keyframes wingHeavy { from { transform: rotate(-10deg); } to { transform: rotate(15deg); } }
                @keyframes pulseFire { from { opacity: 0.6; transform: scale(1); } to { opacity: 1; transform: scale(1.15); } }
                
                @media (max-width: 768px) { 
                    .mascot-container { 
                        bottom: 80px; 
                        right: 12px; 
                    }
                    .mascot-wrapper { width: 90px; height: 90px; } 
                    .mascot-bubble { font-size: 0.75rem; top: -50px; right: 70px; border-radius: 15px 15px 0 15px; }
                }
            </style>
        `;
        
        document.body.appendChild(container);
        this.element = container;
        this.bubble = document.getElementById('mascot-bubble');
        
        // Mensaje inicial Turbo
        setTimeout(() => this.say("¡Soy Sparky el Legendario! 🏰✨"), 1500);
    },
    
    onClick: function() {
        const phrases = [
            "¡Mi aliento es pura magia! 🔥",
            "¡Tus cuentos son épicos! 📜",
            "¡Grrr! ¡Alas a volar! 🐉",
            "¡Protejo tu biblioteca real! 🏰",
            "¡Siente la velocidad del rayo! ⚡"
        ];
        this.say(phrases[Math.floor(Math.random() * phrases.length)]);
    },

    react: function(action) {
        if (action === 'save') {
            this.say("¡Guardándolo en el libro eterno! 📗✨", 4000);
        } else if (action === 'magic') {
            this.say("¡Siento una explosión de magia! 🪄✨", 3000);
        }
    },

    say: function(text, duration = 3500) {
        if (!this.bubble) return;
        this.bubble.innerText = text;
        this.bubble.classList.add('show');
        if (this.sayTimeout) clearTimeout(this.sayTimeout);
        this.sayTimeout = setTimeout(() => this.bubble.classList.remove('show'), duration);
    }
};

window.Sparky = Mascot;
if (typeof document !== 'undefined') {
    document.readyState === 'loading' ? window.addEventListener('DOMContentLoaded', () => Mascot.init()) : Mascot.init();
}
