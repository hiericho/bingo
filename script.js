// ============================
//      Bingo ReSpin JS
// ============================

// ---- Configuración general ----
const NUMEROS_BINGO = Array.from({length: 75}, (_, i) => i + 1);
const COLUMNAS = ['B', 'I', 'N', 'G', 'O'];
const NUM_COL = 5;
const NUM_FIL = 5;

// --- Referencias DOM ---
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playersList = document.getElementById('players-list');
const cartonesList = document.getElementById('cartones-list');
const sortearBtn = document.getElementById('sortear-btn');
const resetBtn = document.getElementById('reset-btn');
const tombolaCanvas = document.getElementById('tombola-canvas');
const numeroSorteadoDiv = document.getElementById('numero-sorteado');
const logoReSpin = document.getElementById("logo-respin");
const winnerBanner = document.getElementById("winner-banner");

// --- Estado global ---
let jugadores = [];
let cartones = [];
let numerosDisponibles = [];
let numerosSalidos = [];
let juegoFinalizado = false;
let giroInterval = null;
let currentGiro = 0;

// ================================
//    Función para agregar jugador
// ================================
playerForm.addEventListener('submit', e => {
    e.preventDefault();
    const nombre = playerNameInput.value.trim();
    if (!nombre || jugadores.includes(nombre)) return;
    jugadores.push(nombre);
    renderizarJugadores();
    generarCartones();
    playerNameInput.value = '';
    playerNameInput.focus();
});

function onRemovePlayer(idx) {
    jugadores.splice(idx, 1);
    renderizarJugadores();
    generarCartones();
}

// =====================================
//   Renderiza lista de jugadores (UX)
// =====================================
function renderizarJugadores() {
    playersList.innerHTML = '';
    jugadores.forEach((nombre, idx) => {
        const card = document.createElement('div');
        card.className = "player-card";
        card.innerHTML = `<span>${nombre}</span>`;
        const btn = document.createElement('button');
        btn.className = "remove-btn";
        btn.innerHTML = '✕';
        btn.title = 'Quitar jugador';
        btn.addEventListener('click', () => onRemovePlayer(idx));
        card.appendChild(btn);
        playersList.appendChild(card);
    });
}

// =====================================
//     Genera cartones de bingo
// =====================================
function generarCartones() {
    cartones = jugadores.map(generarCarton);
    renderizarCartones();
}

// =====================================
//   Genera un cartón individual único
// =====================================
function generarCarton(nombre) {
    const rangos = [
        [1, 15],    // B
        [16, 30],   // I
        [31, 45],   // N
        [46, 60],   // G
        [61, 75],   // O
    ];
    let carton = [];
    for (let col = 0; col < NUM_COL; col++) {
        let nums = [];
        while (nums.length < NUM_FIL) {
            let n = Math.floor(Math.random() * (rangos[col][1] - rangos[col][0] + 1)) + rangos[col][0];
            if (!nums.includes(n)) nums.push(n);
        }
        carton.push(nums);
    }
    carton[2][2] = '★';
    return {
        nombre,
        matriz: carton,
        marcados: Array.from({length: NUM_COL}, (_, c) => Array(NUM_FIL).fill(false)),
        ganador: false
    };
}

// ======================================
//    Renderiza todos los cartones UX
// ======================================
function renderizarCartones() {
    cartonesList.innerHTML = '';
    cartones.forEach(carton => {
        const div = document.createElement('div');
        div.className = 'carton-bingo';
        const h3 = document.createElement('h3');
        h3.textContent = carton.nombre;
        div.appendChild(h3);
        const table = document.createElement('table');
        table.className = 'tabla-bingo';
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        COLUMNAS.forEach(l => {
            const th = document.createElement('th');
            th.textContent = l;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        for (let f = 0; f < NUM_FIL; f++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < NUM_COL; c++) {
                const td = document.createElement('td');
                const valor = carton.matriz[c][f];
                td.textContent = valor;
                if (f === 2 && c === 2) {
                    td.classList.add('marcado');
                    carton.marcados[c][f] = true;
                }
                else if (numerosSalidos.includes(valor)) {
                    td.classList.add('marcado');
                    carton.marcados[c][f] = true;
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        div.appendChild(table);
        if (carton.ganador) {
            div.style.boxShadow = "0 0 30px 7px #e7bfff, 0 0 18px 5px #ab90b9";
            div.style.borderColor = "#d5c6dc";
            h3.textContent += " 🎉 ¡BINGO!";
        }
        cartonesList.appendChild(div);
    });
}

// ========================================
//      Tómbola giratoria (canvas + logo)
// ========================================
function dibujarTorbellinoCanvas(rot = 0) {
    const ctx = tombolaCanvas.getContext('2d');
    ctx.clearRect(0, 0, tombolaCanvas.width, tombolaCanvas.height);
    ctx.save();
    ctx.translate(115, 115);
    ctx.rotate(rot);
    let colores = [
        '#230443', '#3d0b60', '#ab90b9', '#572975', '#d5c6dc', '#2b064d'
    ];
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 100, i * Math.PI / 3, (i + 1) * Math.PI / 3);
        ctx.closePath();
        ctx.fillStyle = colores[i % colores.length];
        ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#ab90b9";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();
    if (logoReSpin) {
        logoReSpin.style.transform = `translate(-50%, -50%) rotate(${rot}rad)`;
    }
}

// ===============================
//    Girar y sacar un número
// ===============================
sortearBtn.addEventListener('click', () => {
    if (giroInterval || juegoFinalizado || numerosDisponibles.length === 0) return;
    // Animación: ruleta gira, número oculto, logo visible
    logoReSpin.classList.remove('oculto');
    numeroSorteadoDiv.classList.remove('mostrar');
    numeroSorteadoDiv.textContent = "—";
    let maxGiros = 36 + Math.floor(Math.random() * 18);
    let angulo = 0;
    currentGiro = 0;
    giroInterval = setInterval(() => {
        currentGiro++;
        angulo += 0.45 + (maxGiros - currentGiro) / 33;
        dibujarTorbellinoCanvas(angulo);
        if (currentGiro >= maxGiros) {
            clearInterval(giroInterval);
            giroInterval = null;
            dibujarTorbellinoCanvas(0);
            mostrarNumeroFinal();
        }
    }, 22);
});

function mostrarNumeroFinal() {
    if (numerosDisponibles.length === 0) return;
    // Saca número random disponible
    const idx = Math.floor(Math.random() * numerosDisponibles.length);
    const numero = numerosDisponibles.splice(idx, 1)[0];
    numerosSalidos.push(numero);
    logoReSpin.classList.add('oculto');
    numeroSorteadoDiv.textContent = numero;
    numeroSorteadoDiv.classList.add('mostrar');
    marcarNumeros(numero);
    chequearGanadores();
}

// ===============================
//    Marca los cartones visualmente
// ===============================
function marcarNumeros(numero) {
    cartones.forEach(carton => {
        for (let c = 0; c < NUM_COL; c++) {
            for (let f = 0; f < NUM_FIL; f++) {
                if (carton.matriz[c][f] === numero) {
                    carton.marcados[c][f] = true;
                }
            }
        }
    });
    renderizarCartones();
}

// ==========================================
//    Chequea si hay cartón ganador
// ==========================================
function chequearGanadores() {
    let hayGanador = false;
    let ganadores = [];
    cartones.forEach(carton => {
        let win = false;
        for (let i = 0; i < NUM_FIL; i++) {
            if (carton.marcados[i].every(x => x)) win = true;
            if (carton.marcados.map(f => f[i]).every(x => x)) win = true;
        }
        if ([0,1,2,3,4].every(i => carton.marcados[i][i])) win = true;
        if ([0,1,2,3,4].every(i => carton.marcados[i][4-i])) win = true;
        carton.ganador = win;
        if (win) {
            hayGanador = true;
            ganadores.push(carton.nombre);
        }
    });
    renderizarCartones();
    if (hayGanador) {
        mostrarGanador(ganadores);
        juegoFinalizado = true;
        sortearBtn.disabled = true;
    }
}

function mostrarGanador(ganadores) {
    winnerBanner.textContent = "¡BINGO! Ganador: " + ganadores.join(", ");
    winnerBanner.classList.add('mostrar');
    winnerBanner.classList.remove('oculto');
}

// ===============================
//   Resetear juego (todos los estados)
// ===============================
resetBtn.addEventListener('click', () => {
    jugadores = [...jugadores]; // no borra los jugadores
    cartones = [];
    numerosDisponibles = [...NUMEROS_BINGO];
    numerosSalidos = [];
    juegoFinalizado = false;
    winnerBanner.classList.remove('mostrar');
    winnerBanner.classList.add('oculto');
    sortearBtn.disabled = false;
    numeroSorteadoDiv.classList.remove('mostrar');
    logoReSpin.classList.remove('oculto');
    renderizarJugadores();
    generarCartones();
    dibujarTorbellinoCanvas(0);
    numeroSorteadoDiv.textContent = "—";
});

// ===============================
//   Inicialización visual
// ===============================
function iniciar() {
    numerosDisponibles = [...NUMEROS_BINGO];
    dibujarTorbellinoCanvas();
    numeroSorteadoDiv.textContent = "—";
    renderizarJugadores();
    generarCartones();
    winnerBanner.classList.add('oculto');
    sortearBtn.disabled = false;
    juegoFinalizado = false;
}
iniciar();
