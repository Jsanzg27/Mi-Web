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
// --- 4. FUNCIÓN PARA REPRODUCIR LA CANCIÓN (VERSIÓN FINAL CON FIREBASE STORAGE) ---
async function playSong(listItem) {
    // 1. Lectura de la URL COMPLETA de la base de datos (Ej: https://drive.google.com/uc?id=...)
    const fullDriveUrl = listItem.getAttribute('data-storage-ref'); 
    const title = listItem.getAttribute('data-title');
    
    // --- Extracción del ID (la lógica que ya funciona) ---
    let fileId = '';
    const pattern = 'uc?id=';
    const startIndex = fullDriveUrl.indexOf(pattern);
    
    if (startIndex !== -1) {
        fileId = fullDriveUrl.substring(startIndex + pattern.length);
        const ampIndex = fileId.indexOf('&');
        if (ampIndex !== -1) {
            fileId = fileId.substring(0, ampIndex);
        }
    }
    
    if (!fileId) {
        console.error("Error: ID de archivo no pudo ser extraído de la URL.");
        alert("La URL no tiene el formato esperado (uc?id=).");
        return; 
    }
    
    // 2. CONSTRUIR LA RUTA DE FIREBASE STORAGE (CRÍTICO)
    // Asumimos que la carpeta es 'musica/' y el archivo es el ID + la extensión
    const storageRefPath = `musica/${fileId}.mp3`; 

    // 3. Obtener la URL de streaming desde Firebase Storage
    try {
        const fileRef = storage.ref(storageRefPath);
        const url = await fileRef.getDownloadURL(); // ¡Esta URL sí funciona para streaming!
        
        // 4. Reproducción
        window.playerElement.src = url;
        await window.playerElement.play(); 
        
        // 5. Actualizar la interfaz
        document.getElementById('current-track').textContent = `Reproduciendo: ${title}`;
        document.querySelectorAll('#song-list li').forEach(li => li.classList.remove('active'));
        listItem.classList.add('active');

    } catch (error) {
        console.error("Error con Firebase Storage:", error);
        alert("Fallo al obtener la URL. Revise los permisos de Storage y la ruta 'musica/[ID].mp3'.");
    }
}
// ---------------------------------------------------------------------------------