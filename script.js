// =============================
// BINGO RESPIN - SCRIPT COMPLETO
// =============================

// ---- VARIABLES GLOBALES ----
let jugadores = [];
let cartones = {};
let numerosDisponibles = Array.from({ length: 75 }, (_, i) => i + 1);
let numerosSorteados = [];
let juegoTerminado = false;

// ---- ELEMENTOS DOM ----
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playersListDiv = document.getElementById('players-list');
const cartonesListDiv = document.getElementById('cartones-list');
const sortearBtn = document.getElementById('sortear-btn');
const resetBtn = document.getElementById('reset-btn');
const numeroSorteadoDiv = document.getElementById('numero-sorteado');
const logoRespin = document.getElementById('logo-respin');
const tombolaCanvas = document.getElementById('tombola-canvas');
const winnerBanner = document.getElementById('winner-banner');

// ---- UTILIDADES ----

// Genera un cartón de bingo ordenado por columnas (B, I, N, G, O)
function generarCarton() {
    const rango = [
        Array.from({ length: 15 }, (_, i) => i + 1),      // B: 1-15
        Array.from({ length: 15 }, (_, i) => i + 16),     // I: 16-30
        Array.from({ length: 15 }, (_, i) => i + 31),     // N: 31-45
        Array.from({ length: 15 }, (_, i) => i + 46),     // G: 46-60
        Array.from({ length: 15 }, (_, i) => i + 61)      // O: 61-75
    ];
    let carton = [];
    for (let c = 0; c < 5; c++) {
        let col = [...rango[c]];
        let nums = [];
        for (let r = 0; r < 5; r++) {
            let idx = Math.floor(Math.random() * col.length);
            nums.push(col.splice(idx, 1)[0]);
        }
        carton.push(nums);
    }
    // Set center to free space
    carton[2][2] = '★';
    // Transpose to get rows
    let filas = [];
    for (let i = 0; i < 5; i++) {
        filas[i] = carton.map(col => col[i]);
    }
    return filas;
}

// Dibuja todos los cartones en filas
function renderCartones() {
    cartonesListDiv.innerHTML = '';
    if (jugadores.length === 0) {
        cartonesListDiv.innerHTML = '<p style="color:var(--respin-light2);font-size:1.2em;text-align:center;">Agrega jugadores para crear los cartones</p>';
        return;
    }
    jugadores.forEach(j => {
        const carton = cartones[j];
        const div = document.createElement('div');
        div.className = 'carton-bingo';
        div.innerHTML = `<h3>${j}</h3><table class="tabla-bingo">
            <thead>
                <tr><th>B</th><th>I</th><th>N</th><th>G</th><th>O</th></tr>
            </thead>
            <tbody>
                ${carton.map((fila, idx) =>
                    `<tr>${fila.map((n, col) => {
                        // Resaltar el número si ya fue sorteado o es "★"
                        let marcado = (n === '★') ||
                            (typeof n === 'number' && numerosSorteados.includes(n));
                        return `<td class="${marcado ? 'marcado' : ''}">${n}</td>`;
                    }).join('')}</tr>`
                ).join('')}
            </tbody>
        </table>`;
        cartonesListDiv.appendChild(div);
    });
}

// Dibuja la lista de jugadores
function renderJugadores() {
    playersListDiv.innerHTML = '';
    jugadores.forEach(j => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `<span>${j}</span>
            <button class="remove-btn" aria-label="Quitar" title="Eliminar"><span aria-hidden="true">&times;</span></button>`;
        // Quitar jugador
        card.querySelector('.remove-btn').addEventListener('click', () => {
            if (jugadores.length === 1) {
                alert("Debe haber al menos un jugador.");
                return;
            }
            jugadores = jugadores.filter(x => x !== j);
            delete cartones[j];
            renderJugadores();
            renderCartones();
        });
        playersListDiv.appendChild(card);
    });
}

// Inicializa los cartones al agregar jugador
function sincronizarCartones() {
    jugadores.forEach(j => {
        if (!cartones[j]) cartones[j] = generarCarton();
    });
    // Si se elimina un jugador
    Object.keys(cartones).forEach(j => {
        if (!jugadores.includes(j)) delete cartones[j];
    });
}

// =====================
// TÓMBOLA (ANIMACIÓN)
// =====================
let ruletaGirando = false;
let ruletaAngle = 0;

function girarTombolaYSacarNumero() {
    if (ruletaGirando || juegoTerminado) return;
    if (numerosDisponibles.length === 0) return;
    ruletaGirando = true;
    sortearBtn.disabled = true;

    // Número final a mostrar:
    let chosenNumber = numerosDisponibles[Math.floor(Math.random() * numerosDisponibles.length)];

    // Animación de giro:
    let frames = 36 + Math.floor(Math.random() * 12); // Total de cuadros
    let angle = ruletaAngle;
    let anglePerFrame = (Math.PI * 3 + Math.random() * Math.PI) / frames; // 1.5 a 2 vueltas
    let frame = 0;

    numeroSorteadoDiv.classList.remove('mostrar');
    logoRespin.classList.remove('oculto');

    function animate() {
        angle += anglePerFrame;
        drawTombola(angle);
        frame++;
        if (frame < frames) {
            requestAnimationFrame(animate);
        } else {
            ruletaAngle = angle % (2 * Math.PI);
            mostrarNumero(chosenNumber);
        }
    }
    animate();
}

function mostrarNumero(numero) {
    numerosSorteados.push(numero);
    numerosDisponibles = numerosDisponibles.filter(n => n !== numero);

    numeroSorteadoDiv.textContent = numero;
    numeroSorteadoDiv.classList.add('mostrar');
    logoRespin.classList.add('oculto');
    renderCartones();
    ruletaGirando = false;
    sortearBtn.disabled = false;
    verificarGanador();
}

// Dibuja la rueda y rota el logo sincronizado
function drawTombola(rotate = 0) {
    const ctx = tombolaCanvas.getContext('2d');
    ctx.clearRect(0, 0, tombolaCanvas.width, tombolaCanvas.height);
    const colors = [
        '#ab90b9', '#d5c6dc', '#572975', '#815c97', '#3d0b60'
    ];
    let cx = tombolaCanvas.width / 2;
    let cy = tombolaCanvas.height / 2;
    let r = tombolaCanvas.width / 2 - 8;

    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, rotate + (i * Math.PI / 3), rotate + ((i + 1) * Math.PI / 3));
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.82;
        ctx.fill();
    }
    // Borde externo
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "#d5c6dc";
    ctx.lineWidth = 5;
    ctx.globalAlpha = 1;
    ctx.stroke();

    // Círculo blanco central
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.38, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.97;
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 22;
    ctx.fill();
    ctx.restore();

    // Borde interior suave
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.38, 0, 2 * Math.PI);
    ctx.strokeStyle = "#d5c6dc";
    ctx.lineWidth = 2.1;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ---- ROTAR LOGO ----
    logoRespin.style.transform = `translate(-50%, -50%) rotate(${rotate}rad)`;
}

// =======================
// GANADOR Y VERIFICACIÓN
// =======================
function verificarGanador() {
    if (juegoTerminado) return;
    let ganador = null;
    for (let j of jugadores) {
        let carton = cartones[j];
        // Chequear filas, columnas y diagonales
        let win = false;
        // Filas
        for (let fila of carton) {
            if (fila.every(n => n === '★' || numerosSorteados.includes(n))) win = true;
        }
        // Columnas
        for (let c = 0; c < 5; c++) {
            let col = [];
            for (let r = 0; r < 5; r++) col.push(carton[r][c]);
            if (col.every(n => n === '★' || numerosSorteados.includes(n))) win = true;
        }
        // Diagonales
        let diag1 = [], diag2 = [];
        for (let i = 0; i < 5; i++) {
            diag1.push(carton[i][i]);
            diag2.push(carton[i][4 - i]);
        }
        if (diag1.every(n => n === '★' || numerosSorteados.includes(n))) win = true;
        if (diag2.every(n => n === '★' || numerosSorteados.includes(n))) win = true;

        if (win) {
            ganador = j;
            break;
        }
    }
    if (ganador) {
        juegoTerminado = true;
        sortearBtn.disabled = true;
        winnerBanner.textContent = `¡Ganador: ${ganador}!`;
        winnerBanner.classList.add('mostrar');
        setTimeout(() => {
            winnerBanner.classList.remove('mostrar');
            showWinnerPopup(ganador);
        }, 1600);
    }
}

// ---- AGREGAR / ELIMINAR JUGADORES ----
playerForm.addEventListener('submit', e => {
    e.preventDefault();
    let name = playerNameInput.value.trim();
    if (!name || jugadores.includes(name)) return;
    jugadores.push(name);
    sincronizarCartones();
    renderJugadores();
    renderCartones();
    playerNameInput.value = '';
    playerNameInput.focus();
});

// ---- RESET ----
resetBtn.addEventListener('click', () => {
    if (!confirm("¿Seguro que deseas reiniciar el juego y borrar todo?")) return;
    jugadores = [];
    cartones = {};
    numerosDisponibles = Array.from({ length: 75 }, (_, i) => i + 1);
    numerosSorteados = [];
    juegoTerminado = false;
    sortearBtn.disabled = false;
    numeroSorteadoDiv.classList.remove('mostrar');
    winnerBanner.classList.remove('mostrar');
    logoRespin.classList.remove('oculto');
    renderJugadores();
    renderCartones();
    ruletaAngle = 0;
    drawTombola(ruletaAngle);
});

// ---- INICIO ----
function init() {
    drawTombola(ruletaAngle);
    renderJugadores();
    renderCartones();
    numeroSorteadoDiv.classList.remove('mostrar');
    logoRespin.classList.remove('oculto');
}
init();

// ---- EVENTOS ----
sortearBtn.addEventListener('click', girarTombolaYSacarNumero);
window.addEventListener('resize', () => {
    drawTombola(ruletaAngle);
});

// ========================
// MODAL GANADOR Y CONFETTI
// ========================

function showWinnerPopup(winnerName) {
    document.getElementById('winner-modal-name').textContent = `${winnerName} ha ganado el Bingo 🎉`;
    document.getElementById('winner-modal').classList.remove('oculto');
    startConfetti();
}
document.getElementById('winner-modal-close').addEventListener('click', function() {
    document.getElementById('winner-modal').classList.add('oculto');
    stopConfetti();
});

const confettiCanvas = document.getElementById('confetti-canvas');
let confettiParticles = [];
let confettiActive = false;

function startConfetti() {
    confettiCanvas.classList.remove('oculto');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiParticles = [];
    confettiActive = true;
    for (let i = 0; i < 110; i++) {
        confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * -confettiCanvas.height,
            r: 7 + Math.random() * 9,
            d: 4 + Math.random() * 4,
            color: randomConfettiColor(),
            tilt: Math.random() * 15 - 7,
            tiltAngle: Math.random() * Math.PI,
        });
    }
    confettiLoop();
}
function confettiLoop() {
    if (!confettiActive) return;
    let ctx = confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let p of confettiParticles) {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.35, p.tiltAngle, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
    }
    updateConfetti();
    requestAnimationFrame(confettiLoop);
}
function updateConfetti() {
    for (let p of confettiParticles) {
        p.y += p.d;
        p.x += Math.sin(p.tiltAngle) * 2;
        p.tiltAngle += 0.05 + Math.random() * 0.04;
        if (p.y > confettiCanvas.height) {
            p.y = -20;
            p.x = Math.random() * confettiCanvas.width;
        }
    }
}
function stopConfetti() {
    confettiActive = false;
    confettiCanvas.classList.add('oculto');
}
function randomConfettiColor() {
    const palette = [
        '#ab90b9', '#572975', '#3d0b60', '#d5c6dc', '#815c97', '#fff'
    ];
    return palette[Math.floor(Math.random() * palette.length)];
}
window.addEventListener('resize', () => {
    if (confettiActive) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
});