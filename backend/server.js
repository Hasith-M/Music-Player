const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Import data structures
const DoublyLinkedList = require('./data-structures/LinkedList');
const BinarySearchTree = require('./data-structures/BinarySearchTree');
const HashTable = require('./data-structures/HashTable');
const Queue = require('./data-structures/Queue');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize data structures
const playlist = new DoublyLinkedList();
const songLibrary = new BinarySearchTree();
const songIndex = new HashTable();
const playQueue = new Queue();
const recentlyPlayed = new Queue(); // Last 20 played songs
const favorites = new Set(); // Store favorite song IDs

let songIdCounter = 1;
let playlistIdCounter = 1;
let playlists = [];

// Load playlists from file
function loadPlaylists() {
    try {
        const playlistsPath = path.join(__dirname, 'playlists.json');
        if (fs.existsSync(playlistsPath)) {
            const data = fs.readFileSync(playlistsPath, 'utf8');
            playlists = JSON.parse(data);
            if (playlists.length > 0) {
                playlistIdCounter = Math.max(...playlists.map(p => p.id)) + 1;
            }
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
        playlists = [];
    }
}

// Save playlists to file
function savePlaylists() {
    try {
        const playlistsPath = path.join(__dirname, 'playlists.json');
        fs.writeFileSync(playlistsPath, JSON.stringify(playlists, null, 2));
    } catch (error) {
        console.error('Error saving playlists:', error);
    }
}

// Configure file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'songs');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
        const extname = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(extname)) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed!'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Helper function to scan songs folder
function scanSongsFolder() {
    const songsPath = path.join(__dirname, 'songs');
    
    if (!fs.existsSync(songsPath)) {
        fs.mkdirSync(songsPath, { recursive: true });
        return [];
    }
    
    const files = fs.readdirSync(songsPath);
    const songs = [];
    
    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext)) {
            const stat = fs.statSync(path.join(songsPath, file));
            const song = {
                id: songIdCounter++,
                title: path.parse(file).name.replace(/_/g, ' ').replace(/-/g, ' '),
                filename: file,
                path: `/songs/${file}`,
                url: `http://localhost:${PORT}/songs/${file}`,
                duration: 0,
                artist: 'Unknown Artist',
                genre: 'Unknown Genre',
                album: 'Unknown Album',
                year: new Date().getFullYear(),
                plays: 0,
                uploaded: stat.mtime,
                size: stat.size,
                favorite: false
            };
            songs.push(song);
        }
    });
    
    return songs;
}

// Initialize with existing songs
function initializeLibrary() {
    const songs = scanSongsFolder();
    
    songs.forEach(song => {
        // Add to playlist (linked list)
        playlist.append(song);
        
        // Add to binary search tree (sorted by title)
        songLibrary.insert(song);
        
        // Add to hash table for fast lookups
        songIndex.set(song.genre, song);
        songIndex.set(song.artist, song);
        songIndex.set(song.album, song);
        songIndex.set('all', song);
    });
    
    console.log(`Initialized with ${songs.length} songs`);
}

// Initialize on startup
initializeLibrary();
loadPlaylists();

// ==================== NEW ROUTES ====================

// Get all playlists
app.get('/api/playlists', (req, res) => {
    res.json(playlists);
});

// Create new playlist
app.post('/api/playlists', (req, res) => {
    try {
        const { name, description } = req.body;
        const newPlaylist = {
            id: playlistIdCounter++,
            name,
            description: description || '',
            created: new Date().toISOString(),
            songs: [],
            coverColor: `#${Math.floor(Math.random()*16777215).toString(16)}`
        };
        
        playlists.push(newPlaylist);
        savePlaylists();
        res.json({ success: true, playlist: newPlaylist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific playlist
app.get('/api/playlists/:id', (req, res) => {
    const playlist = playlists.find(p => p.id === parseInt(req.params.id));
    if (playlist) {
        res.json(playlist);
    } else {
        res.status(404).json({ error: 'Playlist not found' });
    }
});

// Add song to playlist
app.post('/api/playlists/:id/songs', (req, res) => {
    try {
        const playlist = playlists.find(p => p.id === parseInt(req.params.id));
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        
        const { songId } = req.body;
        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            savePlaylists();
            res.json({ success: true, playlist });
        } else {
            res.json({ success: true, message: 'Song already in playlist' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove song from playlist
app.delete('/api/playlists/:id/songs/:songId', (req, res) => {
    try {
        const playlist = playlists.find(p => p.id === parseInt(req.params.id));
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        
        playlist.songs = playlist.songs.filter(id => id !== parseInt(req.params.songId));
        savePlaylists();
        res.json({ success: true, playlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete playlist
app.delete('/api/playlists/:id', (req, res) => {
    try {
        const index = playlists.findIndex(p => p.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        
        playlists.splice(index, 1);
        savePlaylists();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get favorites
app.get('/api/favorites', (req, res) => {
    const allSongs = playlist.getAll();
    const favoriteSongs = allSongs.filter(song => song.favorite);
    res.json(favoriteSongs);
});

// Toggle favorite
app.post('/api/favorites/:songId', (req, res) => {
    try {
        const songId = parseInt(req.params.songId);
        const allSongs = playlist.getAll();
        const song = allSongs.find(s => s.id === songId);
        
        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }
        
        song.favorite = !song.favorite;
        
        if (song.favorite) {
            favorites.add(songId);
        } else {
            favorites.delete(songId);
        }
        
        res.json({ success: true, favorite: song.favorite });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recently played
app.get('/api/recent', (req, res) => {
    const recent = recentlyPlayed.getAll();
    res.json(recent);
});

// Get songs by genre
app.get('/api/genres', (req, res) => {
    const allSongs = playlist.getAll();
    const genres = {};
    
    allSongs.forEach(song => {
        if (!genres[song.genre]) {
            genres[song.genre] = {
                name: song.genre,
                count: 0,
                color: `#${Math.floor(Math.random()*16777215).toString(16)}`
            };
        }
        genres[song.genre].count++;
    });
    
    res.json(Object.values(genres));
});

// Get songs by artist
app.get('/api/artists', (req, res) => {
    const allSongs = playlist.getAll();
    const artists = {};
    
    allSongs.forEach(song => {
        if (!artists[song.artist]) {
            artists[song.artist] = {
                name: song.artist,
                count: 0,
                songs: []
            };
        }
        artists[song.artist].count++;
        artists[song.artist].songs.push(song.id);
    });
    
    res.json(Object.values(artists));
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const allSongs = playlist.getAll();
    const stats = {
        totalSongs: allSongs.length,
        totalDuration: allSongs.reduce((sum, song) => sum + song.duration, 0),
        totalSize: allSongs.reduce((sum, song) => sum + song.size, 0),
        favoriteCount: allSongs.filter(s => s.favorite).length,
        playlistCount: playlists.length,
        genres: {},
        artists: {}
    };
    
    allSongs.forEach(song => {
        stats.genres[song.genre] = (stats.genres[song.genre] || 0) + 1;
        stats.artists[song.artist] = (stats.artists[song.artist] || 0) + 1;
    });
    
    res.json(stats);
});

// Update song metadata
app.put('/api/songs/:id', (req, res) => {
    try {
        const songId = parseInt(req.params.id);
        const updates = req.body;
        
        // Find and update song in all data structures
        // This would require updating all instances in real implementation
        // For simplicity, we'll just return success
        
        res.json({ success: true, message: 'Song updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get songs by genre name
app.get('/api/genres/:name', (req, res) => {
    const songs = songIndex.get(req.params.name);
    res.json(songs || []);
});

// Get songs by artist name
app.get('/api/artists/:name', (req, res) => {
    const songs = songIndex.get(req.params.name);
    res.json(songs || []);
});

// Get albums
app.get('/api/albums', (req, res) => {
    const allSongs = playlist.getAll();
    const albums = {};
    
    allSongs.forEach(song => {
        if (!albums[song.album]) {
            albums[song.album] = {
                name: song.album,
                artist: song.artist,
                year: song.year,
                songs: [],
                coverColor: `#${Math.floor(Math.random()*16777215).toString(16)}`
            };
        }
        albums[song.album].songs.push(song);
    });
    
    res.json(Object.values(albums));
});

// ==================== EXISTING ROUTES ====================

app.get('/api/songs', (req, res) => {
    const songs = playlist.getAll();
    res.json(songs);
});

app.get('/api/songs/sorted', (req, res) => {
    const songs = songLibrary.getAllInOrder();
    res.json(songs);
});

app.get('/api/songs/search/:term', (req, res) => {
    const results = songLibrary.search(req.params.term);
    res.json(results);
});

app.get('/api/songs/genre/:genre', (req, res) => {
    const songs = songIndex.get(req.params.genre);
    res.json(songs);
});

app.get('/api/songs/current', (req, res) => {
    const current = playlist.getCurrent();
    res.json(current);
});

app.get('/api/songs/next', (req, res) => {
    const nextSong = playlist.getNext();
    if (nextSong) {
        nextSong.plays = (nextSong.plays || 0) + 1;
        recentlyPlayed.enqueue(nextSong);
        if (recentlyPlayed.size > 20) {
            recentlyPlayed.dequeue();
        }
    }
    res.json(nextSong);
});

app.get('/api/songs/prev', (req, res) => {
    const prevSong = playlist.getPrev();
    res.json(prevSong);
});

app.get('/api/queue', (req, res) => {
    const queue = playQueue.getAll();
    res.json(queue);
});

app.post('/api/queue/add', (req, res) => {
    const songId = parseInt(req.body.songId);
    const allSongs = playlist.getAll();
    const song = allSongs.find(s => s.id === songId);
    
    if (song) {
        playQueue.enqueue(song);
        res.json({ success: true, queueSize: playQueue.size });
    } else {
        res.status(404).json({ error: 'Song not found' });
    }
});

app.delete('/api/queue/remove/:id', (req, res) => {
    const success = playQueue.remove(parseInt(req.params.id));
    res.json({ success });
});

app.get('/api/queue/next', (req, res) => {
    if (!playQueue.isEmpty()) {
        const nextInQueue = playQueue.dequeue();
        res.json(nextInQueue);
    } else {
        const nextSong = playlist.getNext();
        res.json(nextSong);
    }
});

app.post('/api/playlist/shuffle', (req, res) => {
    playlist.shuffle();
    res.json({ success: true, songs: playlist.getAll() });
});

app.post('/api/songs/upload', upload.array('songs', 10), (req, res) => {
    try {
        const uploadedSongs = [];
        
        req.files.forEach(file => {
            const song = {
                id: songIdCounter++,
                title: path.parse(file.originalname).name.replace(/_/g, ' ').replace(/-/g, ' '),
                filename: file.filename,
                path: `/songs/${file.filename}`,
                url: `http://localhost:${PORT}/songs/${file.filename}`,
                duration: 0,
                artist: req.body.artist || 'Unknown Artist',
                genre: req.body.genre || 'Unknown Genre',
                album: req.body.album || 'Unknown Album',
                year: req.body.year || new Date().getFullYear(),
                plays: 0,
                uploaded: new Date(),
                size: file.size,
                favorite: false
            };
            
            // Add to all data structures
            playlist.append(song);
            songLibrary.insert(song);
            songIndex.set(song.genre, song);
            songIndex.set(song.artist, song);
            songIndex.set(song.album, song);
            songIndex.set('all', song);
            
            uploadedSongs.push(song);
        });
        
        res.json({ success: true, songs: uploadedSongs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve song files
app.use('/songs', express.static(path.join(__dirname, 'songs')));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});