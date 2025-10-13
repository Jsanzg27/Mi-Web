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
// --- 4. FUNCIÓN PARA REPRODUCIR LA CANCIÓN (VERSIÓN FINAL PARA GOOGLE DRIVE) ---
async function playSong(listItem) {
    // 1. Lectura de atributos de datos
    // 'data-storage-ref' ahora contiene el ID del archivo de Google Drive
    const driveFileId = listItem.getAttribute('data-storage-ref'); 
    const title = listItem.getAttribute('data-title');
    
    // 2. Verificación y Construcción de la URL de Streaming
    if (!driveFileId || driveFileId.trim() === '') {
        console.error("Error: El ID del archivo de Google Drive está vacío.");
        alert("ID de archivo no definido para la canción.");
        return; 
    }

    // CONSTRUCCIÓN DE LA URL DE GOOGLE DRIVE PARA STREAMING
    // Este endpoint de Drive permite que el <audio> tag lo reproduzca.
    const url = `https://drive.google.com/uc?export=download&id=${driveFileId}`;

    // 3. Establecer la fuente y reproducir
    try {
        // La línea 95 (donde estaba el error de Storage) ha sido ELIMINADA.
        
        window.playerElement.src = url;
        await window.playerElement.play(); 
        
        // 4. Actualizar la interfaz
        document.getElementById('current-track').textContent = `Reproduciendo: ${title}`;
        
        // Opcional: Resaltar la canción activa
        document.querySelectorAll('#song-list li').forEach(li => li.classList.remove('active'));
        listItem.classList.add('active');

    } catch (error) {
        // Si hay un error aquí, es probable que sea por permisos de Autoplay o Drive.
        console.error("Error al reproducir el audio de Google Drive:", error);
        alert("No se pudo iniciar la reproducción. Revise permisos de Drive (el archivo debe ser público).");
    }
}
// -----------------------------------------------------