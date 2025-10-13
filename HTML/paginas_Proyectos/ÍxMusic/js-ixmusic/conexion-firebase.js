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
// --- 4. FUNCIÓN PARA REPRODUCIR LA CANCIÓN (VERSIÓN FINAL Y OPTIMIZADA) ---
async function playSong(listItem) {
    // 1. Lectura de la RUTA DE STORAGE (Ej: 'musica/nombre_del_archivo.mp3')
    const storageRefPath = listItem.getAttribute('data-storage-ref'); 
    const title = listItem.getAttribute('data-title');
    
    // Verificación de la ruta
    if (!storageRefPath) {
        console.error("Error: La ruta de Storage (data-storage-ref) está vacía.");
        alert("Fallo al obtener la ruta del archivo de la lista.");
        return; 
    }
    
    // 2. Obtener la URL de streaming desde Firebase Storage
    try {
        // La ruta ya está completa y lista para usarse
        const fileRef = storage.refFromURL(storageRefPath);
        const url = await fileRef.getDownloadURL(); // ¡Obteniendo la URL de streaming!
        
        // 3. Reproducción
        window.playerElement.src = url;
        await window.playerElement.play(); 
        
        // 4. Actualizar la interfaz
        document.getElementById('current-track').textContent = `Reproduciendo: ${title}`;
        document.querySelectorAll('#song-list li').forEach(li => li.classList.remove('active'));
        listItem.classList.add('active');

    } catch (error) {
        console.error("Error con Firebase Storage:", error);
        alert("Fallo al obtener la URL. Revise las reglas de Storage y asegúrese de que la ruta del archivo sea correcta.");
    }
}
// ---------------------------------------------------------------------------------