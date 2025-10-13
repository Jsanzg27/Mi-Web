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

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // O firebase.database()
const storage = firebase.storage();
// -----------------------------------------------------
// --- 2. CARGAR LISTA DE CANCIONES ---
async function loadSongs() {
  const container = document.getElementById('app-container');
  try {
    const songsSnapshot = await db.collection('catalogo').get();
    const songs = [];
    
    songsSnapshot.forEach(doc => {
      songs.push({ id: doc.id, ...doc.data() });
    });
    
    // Una vez cargadas, renderizar el reproductor y la lista
    renderMusicPlayer(songs); 

  } catch (error) {
    console.error("Error al cargar canciones:", error);
    container.innerHTML = '<h1>Error al cargar la música. Revise la consola.</h1>';
  }
}

// Llamar a la función al cargar la página
loadSongs();
// -----------------------------------------------------
// --- 3. RENDERIZADO Y LÓGICA DEL REPRODUCTOR ---

const audioPlayer = new Audio(); // Objeto nativo de audio

function renderMusicPlayer(songs) {
    const container = document.getElementById('app-container');
    container.innerHTML = `
        <section class="music-player-area">
            <h2>Reproduciendo Ahora</h2>
            <div id="current-track">Selecciona una canción</div>
            <audio id="player" controls style="width: 100%; margin-top: 15px;"></audio>
        </section>

        <section class="song-list-area">
            <h2>Tu Biblioteca ÍxMusic</h2>
            <ul id="song-list">
                ${songs.map(song => `
                    <li data-storage-ref="${song.id}" 
                        data-title="${song.nombre}"
                        onclick="playSong(this)">
                        ${song.nombre} - ${song.autor}
                    </li>
                `).join('')}
            </ul>
        </section>
    `;

    // Inicializar el objeto de audio una vez que la estructura está en el DOM
    window.playerElement = document.getElementById('player');
}
// -----------------------------------------------------
// --- 4. FUNCIÓN PARA REPRODUCIR LA CANCIÓN (VERSIÓN FINAL CON EXTRACCIÓN DE ID) ---
async function playSong(listItem) {
    // 1. Lectura de la URL COMPLETA
    // Ejemplo de valor en fullDriveUrl: "https://drive.google.com/uc?id=1RcwKF4V-F-loHmyMm4lPoK5znsPXnbj5"
    const fullDriveUrl = listItem.getAttribute('data-storage-ref'); 
    const title = listItem.getAttribute('data-title');
    
    // 2. Extracción del ID del archivo (Todo después de 'uc?id=')
    let driveFileId = '';
    
    // Buscamos la posición del patrón "uc?id="
    const pattern = 'uc?id=';
    const startIndex = fullDriveUrl.indexOf(pattern);
    
    if (startIndex !== -1) {
        // Si lo encontramos, extraemos la subcadena que comienza después de este patrón
        driveFileId = fullDriveUrl.substring(startIndex + pattern.length);
        
        // Opcional: Si hubiera otros parámetros después del ID (&...), los cortamos.
        const ampIndex = driveFileId.indexOf('&');
        if (ampIndex !== -1) {
            driveFileId = driveFileId.substring(0, ampIndex);
        }
    }

    // 3. Verificación y Construcción de la URL de Streaming
    if (!driveFileId || driveFileId.trim() === '') {
        console.error("Error: El ID de archivo no pudo ser extraído de la URL.");
        alert("La URL de Drive no tiene el formato esperado (uc?id=).");
        return; 
    }

    // Usamos el ID extraído para construir la URL de streaming más compatible
    const url = `https://drive.google.com/open?id=${driveFileId}&usp=sharing`; // o usar la URL original si prefiere: `https://drive.google.com/uc?export=download&id=${driveFileId}`

    // 4. Establecer la fuente y reproducir
    try {
        window.playerElement.src = url;
        await window.playerElement.play(); 
        
        document.getElementById('current-track').textContent = `Reproduciendo: ${title}`;
        document.querySelectorAll('#song-list li').forEach(li => li.classList.remove('active'));
        listItem.classList.add('active');

    } catch (error) {
        // NotSupportedError: El navegador no puede reproducir la fuente
        console.error("Error al reproducir el audio de Google Drive:", error);
        alert("No se pudo iniciar la reproducción. La fuente de Drive está siendo rechazada (permisos o formato).");
    }
}
// ---------------------------------------------------------------------------------