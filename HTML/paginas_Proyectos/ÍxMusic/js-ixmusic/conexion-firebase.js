// --- 1. CONFIGURACIÓN DE FIREBASE (en funciones.js) ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD3SA3BQS6lHgCJmvxjsxi_S_T_IA_co34",
    authDomain: "music-1c06a.firebaseapp.com",
    projectId: "music-1c06a",
    storageBucket: "music-1c06a.firebasestorage.app",
    messagingSenderId: "373423387246",
    appId: "1:373423387246:web:a976ecb199e639c3cfec7f",
    measurementId: "G-03PC0VRPFC"
};

// -----------------------------------------------------
// --- INICIALIZACIÓN DE FIREBASE ---
// -----------------------------------------------------
// ¡IMPORTANTE! Asegúrate de que 'firebaseConfig' esté definido en una etiqueta <script> en tu HTML 
// antes de este archivo.
const app = firebase.initializeApp(firebaseConfig); 


// -----------------------------------------------------
// --- VARIABLES DE ESTADO Y REFERENCIAS DEL DOM ---
// -----------------------------------------------------

// Referencias a los servicios de Firebase
const db = firebase.firestore(); 
const storage = firebase.storage();

// Variables de estado del reproductor
let songs = []; // Almacenará la lista completa de canciones
let currentSongIndex = -1;
let isPlaying = false;

// Referencias a los elementos del reproductor fijo (#player-bar)
const audioPlayerElement = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seekBar = document.getElementById('seek-bar');
const titleSpan = document.querySelector('.player-title');
const artistSpan = document.querySelector('.player-artist');
const timeCurrentSpan = document.querySelector('.time-current');
const timeTotalSpan = document.querySelector('.time-total');
const playerCover = document.querySelector('.player-cover');
const songListContainer = document.getElementById('app-container');


// -----------------------------------------------------
// --- 1. CARGAR LISTA DE CANCIONES DESDE FIRESTORE ---
// -----------------------------------------------------

async function loadSongs() {
    try {
        // Consulta la colección 'catalogo'
        const songsSnapshot = await db.collection('catalogo').get();
        
        songsSnapshot.forEach(doc => {
            // Se asume que doc.data() contiene: nombre, autor, y storageRef (ruta de Storage)
            songs.push({ id: doc.id, ...doc.data() });
        });
        
        if (songs.length > 0) {
            renderSongList(); // Muestra la lista en el DOM
            setupPlayerControls(); // Configura los listeners para la barra fija
        } else {
            songListContainer.innerHTML = '<p>No se encontraron canciones en el catálogo.</p>';
        }

    } catch (error) {
        console.error("Error al cargar canciones:", error);
        if (songListContainer) {
            songListContainer.innerHTML = '<h2>Error al cargar la música. Revise la consola.</h2>';
        }
    }
}

// Llama a la función al cargar el script
loadSongs();

// -----------------------------------------------------
// --- 2. RENDERIZADO DE LA LISTA EN EL #song-list-container ---
// -----------------------------------------------------

// -----------------------------------------------------
// --- 2. RENDERIZADO DE LA LISTA EN EL #app-container ---
// -----------------------------------------------------

function renderSongList() {
     if (!songListContainer) return;

    // 💡 CAMBIO: Generamos el título y el nuevo contenedor con scroll
    const listHTML = `
        <h2>Catálogo de Canciones</h2>
        
        <div id="song-scroll-container" class="song-scroll-wrapper"> 
            <div id="song-grid" class="song-grid-container">
                ${songs.map((song, index) => {
                    // Mantenemos la lógica de la tarjeta de canción intacta
                    const coverUrl = song.portada || '../../../recursos/imagenes/ÍxMusic/logo.png';
                    const artist = song.autor || 'Artista Desconocido';
                    
                    return `
                        <div class="song-card" 
                            data-index="${index}" 
                            onclick="handleSongClick(${index})">
                            
                            <div class="card-cover-wrapper">
                                <img src="${coverUrl}" alt="Portada de ${song.nombre}" class="card-cover">
                                <span class="card-play-icon">▶</span>
                            </div>
                            
                            <div class="card-info">
                                <p class="card-title">${song.nombre}</p>
                                <p class="card-artist">${artist}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    // Sobreescribe el placeholder
    songListContainer.innerHTML = listHTML;
}


// -----------------------------------------------------
// --- 3. LÓGICA DE REPRODUCCIÓN ---
// -----------------------------------------------------

// Función global llamada al hacer click en un elemento de la lista
window.handleSongClick = async function(index) {
    if (index === currentSongIndex) {
        togglePlayPause(); // Si es la misma, solo cambia Play/Pause
        return;
    }
    
    currentSongIndex = index;
    await playSong(songs[currentSongIndex]);
};

async function playSong(song) {
    const storageRefPath = song.id; // Asume que la propiedad es 'storageRef'
    
    if (!storageRefPath) {
        console.error("Error: storageRefPath está vacío para la canción:", song);
        return; 
    }
    
    try {
        // 1. Obtener la URL de streaming desde Firebase Storage
        const fileRef = storage.refFromURL(storageRefPath);
        const url = await fileRef.getDownloadURL(); 
        
        // 2. Cargar la URL en el elemento de audio fijo
        audioPlayerElement.src = url;
        audioPlayerElement.load();
        
        // 3. Reproducir y actualizar estado
        await audioPlayerElement.play(); 
        isPlaying = true;
        updatePlayerUI(song);
        updateSongListHighlight();
        
    } catch (error) {
        console.error("Error al obtener la URL o reproducir:", error);
        alert("Fallo al cargar el archivo. Verifique la ruta de Storage.");
        isPlaying = false;
        updatePlayPauseButton();
    }
}

function togglePlayPause() {
    if (!audioPlayerElement.src) {
        // Si no hay canción cargada, intenta reproducir la primera si existe
        if (songs.length > 0 && currentSongIndex === -1) {
            currentSongIndex = 0;
            handleSongClick(currentSongIndex);
        }
        return;
    }

    if (isPlaying) {
        audioPlayerElement.pause();
    } else {
        audioPlayerElement.play();
    }
    isPlaying = !isPlaying;
    updatePlayPauseButton();
}

// -----------------------------------------------------
// --- 4. CONTROLADORES DE LA INTERFAZ FIJA ---
// -----------------------------------------------------

function updatePlayerUI(song) {
    titleSpan.textContent = song.nombre;
    artistSpan.textContent = song.autor || 'Artista Desconocido';
    
    // Usar la portada por defecto si no hay una url de portada en los datos
    const coverUrl = song.portada || '../../../recursos/imagenes/ÍxMusic/logo.png'; 
    playerCover.src = coverUrl;
    
    updatePlayPauseButton();
}

function updatePlayPauseButton() {
    // Cambia el icono del botón ▶ (Play) o ⏸ (Pause)
    playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
}

function updateSongListHighlight() {
    // 💡 CAMBIO: Busca ahora las nuevas tarjetas con la clase .song-card
    document.querySelectorAll('.song-card').forEach(card => {
        card.classList.remove('active');
        // El ícono flotante se maneja automáticamente con el hover, pero podemos controlarlo:
        card.querySelector('.card-play-icon').textContent = '▶'; 
    });
    
    // 💡 CAMBIO: Busca la tarjeta activa
    const activeItem = document.querySelector(`.song-card[data-index="${currentSongIndex}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        // Si está activa y reproduciendo, muestra el icono de pausa
        activeItem.querySelector('.card-play-icon').textContent = isPlaying ? '⏸' : '▶';
    }
}

// -----------------------------------------------------
// --- 5. MANEJO DE EVENTOS DEL REPRODUCTOR FIJO ---
// -----------------------------------------------------

function setupPlayerControls() {
    // Evento Principal: Play/Pause
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Evento de Navegación: Siguiente
    nextBtn.addEventListener('click', () => {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    });

    // Evento de Navegación: Anterior
    prevBtn.addEventListener('click', () => {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    });

    // Evento: Audio cargado (para establecer el tiempo total)
    audioPlayerElement.addEventListener('loadedmetadata', () => {
        const totalMinutes = Math.floor(audioPlayerElement.duration / 60);
        const totalSeconds = Math.floor(audioPlayerElement.duration % 60).toString().padStart(2, '0');
        timeTotalSpan.textContent = `${totalMinutes}:${totalSeconds}`;
        seekBar.max = audioPlayerElement.duration;
    });

    // Evento: Actualizar tiempo y barra de progreso
    audioPlayerElement.addEventListener('timeupdate', () => {
        if (!isNaN(audioPlayerElement.duration)) {
            seekBar.value = audioPlayerElement.currentTime;
            const currentMinutes = Math.floor(audioPlayerElement.currentTime / 60);
            const currentSeconds = Math.floor(audioPlayerElement.currentTime % 60).toString().padStart(2, '0');
            timeCurrentSpan.textContent = `${currentMinutes}:${currentSeconds}`;
        }
    });

    // Evento: Seek Bar (el usuario mueve el slider)
    seekBar.addEventListener('input', () => {
        audioPlayerElement.currentTime = seekBar.value;
    });

    // Evento: Final de la canción (reproducir la siguiente)
    audioPlayerElement.addEventListener('ended', () => {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playSong(songs[currentSongIndex]);
        } else {
            isPlaying = false;
            updatePlayPauseButton();
            updateSongListHighlight();
        }
    });

    // Eventos para mantener el estado visual sincronizado
    audioPlayerElement.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
        updateSongListHighlight();
    });
    audioPlayerElement.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
        updateSongListHighlight();
    });
}
