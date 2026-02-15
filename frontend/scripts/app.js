class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.currentSong = null;
        this.isPlaying = false;
        this.volume = 0.7;
        this.currentTab = 'dashboard';
        
        // Initialize
        this.initPlayer();
        this.initTabs();
        this.loadSongs();
        this.loadQueue();
        this.updateStats();
    }

    initPlayer() {
        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('loadedmetadata', () => this.updateSongInfo());
        
        // Button event listeners
        document.getElementById('play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('mini-play').addEventListener('click', () => this.togglePlay());
        document.getElementById('next-btn').addEventListener('click', () => this.playNext());
        document.getElementById('mini-next').addEventListener('click', () => this.playNext());
        document.getElementById('prev-btn').addEventListener('click', () => this.playPrev());
        document.getElementById('mini-prev').addEventListener('click', () => this.playPrev());
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shufflePlaylist());
        document.getElementById('add-to-queue').addEventListener('click', () => this.addCurrentToQueue());
        document.getElementById('favorite-btn').addEventListener('click', () => this.toggleFavorite());
        
        // Volume control
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.audio.volume = this.volume;
        });
        
        // Progress bar
        const progressBar = document.querySelector('.progress-bar');
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });
        
        // Search
        document.getElementById('search-input').addEventListener('input', (e) => this.searchSongs(e.target.value));
        document.querySelector('.search-btn').addEventListener('click', () => {
            const term = document.getElementById('search-input').value;
            this.searchSongs(term);
        });
        
        // Upload modal
        document.getElementById('upload-btn').addEventListener('click', () => this.showUploadModal());
        document.querySelector('.close-modal').addEventListener('click', () => this.hideUploadModal());
        document.getElementById('browse-btn').addEventListener('click', () => document.getElementById('file-input').click());
        
        // File upload
        const fileInput = document.getElementById('file-input');
        const dropArea = document.getElementById('drop-area');
        const uploadForm = document.getElementById('upload-form');
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.style.borderColor = '#8a2be2';
            dropArea.style.background = 'rgba(138, 43, 226, 0.05)';
        }
        
        function unhighlight() {
            dropArea.style.borderColor = 'rgba(138, 43, 226, 0.5)';
            dropArea.style.background = '';
        }
        
        dropArea.addEventListener('drop', (e) => this.handleDrop(e), false);
        uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
    }

    initTabs() {
        // Tab navigation
        document.querySelectorAll('.main-nav li').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Initialize tab-specific controls
        this.initDashboard();
        this.initLibrary();
        this.initPlaylists();
        this.initRecent();
        this.initFavorites();
        this.initGenres();
        this.initArtists();
        this.initAlbums();
        this.initStats();
        this.initUploadTab();

        // Load initial tab
        this.loadCurrentTab();
    }

    switchTab(tabName) {
        // Update active tab in sidebar
        document.querySelectorAll('.main-nav li').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        this.currentTab = tabName;

        // Load tab content
        this.loadCurrentTab();
    }

    loadCurrentTab() {
        switch (this.currentTab) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'library':
                this.loadLibrary();
                break;
            case 'playlists':
                this.loadPlaylists();
                break;
            case 'recent':
                this.loadRecent();
                break;
            case 'favorites':
                this.loadFavorites();
                break;
            case 'genres':
                this.loadGenres();
                break;
            case 'artists':
                this.loadArtists();
                break;
            case 'albums':
                this.loadAlbums();
                break;
            case 'stats':
                this.loadStats();
                break;
            case 'upload':
                // Upload tab is static
                break;
        }
    }

    // ==================== DASHBOARD ====================
    initDashboard() {
        // Already initialized in initPlayer
    }

    async loadDashboard() {
        await this.loadQuickStats();
        await this.loadRecentList();
        await this.loadTopGenres();
        await this.loadRecommended();
    }

    async loadQuickStats() {
        try {
            const response = await fetch('http://localhost:3000/api/stats');
            const stats = await response.json();
            
            const container = document.getElementById('quick-stats');
            container.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${stats.totalSongs || 0}</div>
                    <div class="stat-label">Total Songs</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.favoriteCount || 0}</div>
                    <div class="stat-label">Favorites</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.playlistCount || 0}</div>
                    <div class="stat-label">Playlists</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Math.round((stats.totalSize || 0) / (1024 * 1024))}</div>
                    <div class="stat-label">MB Total</div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    }

    async loadRecentList() {
        try {
            const response = await fetch('http://localhost:3000/api/recent');
            const recent = await response.json();
            
            const container = document.getElementById('recent-list');
            if (!recent || recent.length === 0) {
                container.innerHTML = '<div class="empty-state">No recently played songs</div>';
                return;
            }
            
            container.innerHTML = recent.slice(0, 5).map(song => `
                <div class="recent-item" data-id="${song.id}">
                    <div class="recent-cover">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="recent-info">
                        <div class="recent-title">${song.title}</div>
                        <div class="recent-artist">${song.artist}</div>
                    </div>
                    <button class="recent-play" data-id="${song.id}">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            `).join('');
            
            // Add click handlers
            container.querySelectorAll('.recent-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.recent-play')) {
                        const songId = parseInt(item.dataset.id);
                        const song = recent.find(s => s.id === songId);
                        if (song) this.playSong(song);
                    }
                });
            });
            
            container.querySelectorAll('.recent-play').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const songId = parseInt(btn.dataset.id);
                    const song = recent.find(s => s.id === songId);
                    if (song) this.playSong(song);
                });
            });
        } catch (error) {
            console.error('Error loading recent list:', error);
        }
    }

    async loadTopGenres() {
        try {
            const response = await fetch('http://localhost:3000/api/genres');
            const genres = await response.json();
            
            const container = document.getElementById('top-genres');
            if (!genres || genres.length === 0) {
                container.innerHTML = '<div class="empty-state">No genres found</div>';
                return;
            }
            
            const topGenres = genres.sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 6);
            
            container.innerHTML = topGenres.map(genre => `
                <div class="genre-tag" data-genre="${genre.name}">
                    <span>${genre.name}</span>
                    <span class="genre-count">${genre.count || 0}</span>
                </div>
            `).join('');
            
            // Add click handlers
            container.querySelectorAll('.genre-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    this.switchTab('genres');
                });
            });
        } catch (error) {
            console.error('Error loading top genres:', error);
        }
    }

    async loadRecommended() {
        try {
            const response = await fetch('http://localhost:3000/api/songs');
            const songs = await response.json();
            
            const container = document.getElementById('recommended-songs');
            if (!songs || songs.length === 0) {
                container.innerHTML = '<div class="empty-state">No songs available</div>';
                return;
            }
            
            // Simple recommendation: random 6 songs
            const recommended = [...songs].sort(() => 0.5 - Math.random()).slice(0, 6);
            this.displaySongsInContainer(recommended, container);
        } catch (error) {
            console.error('Error loading recommended:', error);
        }
    }

    // ==================== LIBRARY ====================
    initLibrary() {
        document.getElementById('refresh-library').addEventListener('click', () => this.loadLibrary());
        document.getElementById('sort-library').addEventListener('click', () => this.sortLibrary());
        document.getElementById('filter-library').addEventListener('change', (e) => this.filterLibrary(e.target.value));
        document.getElementById('library-search').addEventListener('input', (e) => this.searchLibrary(e.target.value));
    }

    async loadLibrary() {
        try {
            const response = await fetch('http://localhost:3000/api/songs');
            const songs = await response.json();
            this.displayLibrary(songs);
        } catch (error) {
            console.error('Error loading library:', error);
        }
    }

    displayLibrary(songs) {
        const container = document.getElementById('library-songs');
        
        if (!songs || songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music"></i>
                    <h3>No songs in library</h3>
                    <p>Upload some music to get started</p>
                    <button class="tab-btn primary" onclick="player.switchTab('upload')">
                        <i class="fas fa-upload"></i> Upload Music
                    </button>
                </div>
            `;
            return;
        }
        
        this.displaySongsInContainer(songs, container);
    }

    async sortLibrary() {
        try {
            const response = await fetch('http://localhost:3000/api/songs/sorted');
            const songs = await response.json();
            this.displayLibrary(songs);
        } catch (error) {
            console.error('Error sorting library:', error);
        }
    }

    async filterLibrary(filter) {
        try {
            let songs = [];
            
            switch (filter) {
                case 'favorites':
                    const favResponse = await fetch('http://localhost:3000/api/favorites');
                    songs = await favResponse.json();
                    break;
                default:
                    const response = await fetch('http://localhost:3000/api/songs');
                    songs = await response.json();
            }
            
            this.displayLibrary(songs);
        } catch (error) {
            console.error('Error filtering library:', error);
        }
    }

    async searchLibrary(term) {
        if (!term.trim()) {
            this.loadLibrary();
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/songs/search/${encodeURIComponent(term)}`);
            const songs = await response.json();
            this.displayLibrary(songs);
        } catch (error) {
            console.error('Error searching library:', error);
        }
    }

    // ==================== PLAYLISTS ====================
    initPlaylists() {
        document.getElementById('create-playlist-btn').addEventListener('click', () => this.showCreatePlaylistModal());
        
        // Create playlist modal
        const modal = document.getElementById('create-playlist-modal');
        const closeBtn = modal.querySelector('.close-modal');
        const form = document.getElementById('create-playlist-form');
        
        closeBtn.addEventListener('click', () => this.hideCreatePlaylistModal());
        form.addEventListener('submit', (e) => this.createPlaylist(e));
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideCreatePlaylistModal();
            }
        });
    }

    async loadPlaylists() {
        try {
            const response = await fetch('http://localhost:3000/api/playlists');
            const playlists = await response.json();
            this.displayPlaylists(playlists);
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
    }

    displayPlaylists(playlists) {
        const container = document.getElementById('playlists-container');
        
        if (!playlists || playlists.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-stream"></i>
                    <h3>No playlists yet</h3>
                    <p>Create your first playlist to organize your music</p>
                    <button class="tab-btn primary" id="create-first-playlist">
                        <i class="fas fa-plus"></i> Create Playlist
                    </button>
                </div>
            `;
            
            document.getElementById('create-first-playlist').addEventListener('click', () => {
                this.showCreatePlaylistModal();
            });
            return;
        }
        
        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-card" data-id="${playlist.id}" style="border-top: 5px solid ${playlist.coverColor || '#8a2be2'}">
                <div class="playlist-cover" style="background: ${playlist.coverColor || '#8a2be2'}">
                    <i class="fas fa-list-music"></i>
                </div>
                <div class="playlist-info">
                    <div class="playlist-name">${playlist.name}</div>
                    <div class="playlist-desc">${playlist.description || 'No description'}</div>
                </div>
                <div class="playlist-stats">
                    <span>${playlist.songs ? playlist.songs.length : 0} songs</span>
                    <span>Created ${new Date(playlist.created || Date.now()).toLocaleDateString()}</span>
                </div>
                <div class="playlist-actions">
                    <button class="card-btn play-playlist" data-id="${playlist.id}">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="card-btn edit-playlist" data-id="${playlist.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.playlist-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.playlist-actions')) {
                    const playlistId = parseInt(card.dataset.id);
                    this.viewPlaylist(playlistId);
                }
            });
        });
        
        container.querySelectorAll('.play-playlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = parseInt(btn.dataset.id);
                this.playPlaylist(playlistId);
            });
        });
        
        container.querySelectorAll('.edit-playlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = parseInt(btn.dataset.id);
                this.editPlaylist(playlistId);
            });
        });
    }

    showCreatePlaylistModal() {
        document.getElementById('create-playlist-modal').style.display = 'flex';
    }

    hideCreatePlaylistModal() {
        document.getElementById('create-playlist-modal').style.display = 'none';
        document.getElementById('playlist-name').value = '';
        document.getElementById('playlist-desc').value = '';
    }

    async createPlaylist(e) {
        e.preventDefault();
        
        const name = document.getElementById('playlist-name').value;
        const description = document.getElementById('playlist-desc').value;
        
        if (!name.trim()) {
            this.showNotification('Please enter a playlist name', 'error');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showNotification('Playlist created successfully');
                this.hideCreatePlaylistModal();
                this.loadPlaylists();
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
            this.showNotification('Error creating playlist', 'error');
        }
    }

    async viewPlaylist(playlistId) {
        try {
            const response = await fetch(`http://localhost:3000/api/playlists/${playlistId}`);
            const playlist = await response.json();
            
            // Show playlist detail view
            alert(`Viewing playlist: ${playlist.name}\nSongs: ${playlist.songs ? playlist.songs.length : 0}`);
        } catch (error) {
            console.error('Error viewing playlist:', error);
        }
    }

    async playPlaylist(playlistId) {
        try {
            const response = await fetch(`http://localhost:3000/api/playlists/${playlistId}`);
            const playlist = await response.json();
            
            // Get all songs
            const songsResponse = await fetch('http://localhost:3000/api/songs');
            const allSongs = await songsResponse.json();
            
            // Filter songs in playlist
            const playlistSongs = allSongs.filter(song => playlist.songs && playlist.songs.includes(song.id));
            
            if (playlistSongs.length > 0) {
                // Play first song in playlist
                await this.playSong(playlistSongs[0]);
                this.showNotification(`Playing playlist: ${playlist.name}`);
            }
        } catch (error) {
            console.error('Error playing playlist:', error);
        }
    }

    async editPlaylist(playlistId) {
        alert('Edit playlist functionality would go here');
    }

    // ==================== RECENT ====================
    initRecent() {
        document.getElementById('clear-recent').addEventListener('click', () => this.clearRecent());
    }

    async loadRecent() {
        try {
            const response = await fetch('http://localhost:3000/api/recent');
            const recent = await response.json();
            this.displayRecent(recent);
        } catch (error) {
            console.error('Error loading recent:', error);
        }
    }

    displayRecent(songs) {
        const container = document.getElementById('recent-songs');
        
        if (!songs || songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No recently played songs</h3>
                    <p>Start playing some music to see it here</p>
                </div>
            `;
            return;
        }
        
        this.displaySongsInContainer(songs, container);
    }

    async clearRecent() {
        if (confirm('Clear all recently played history?')) {
            this.showNotification('Recent history cleared');
            this.loadRecent();
        }
    }

    // ==================== FAVORITES ====================
    initFavorites() {
        document.getElementById('play-all-favorites').addEventListener('click', () => this.playAllFavorites());
    }

    async loadFavorites() {
        try {
            const response = await fetch('http://localhost:3000/api/favorites');
            const favorites = await response.json();
            this.displayFavorites(favorites);
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    displayFavorites(songs) {
        const container = document.getElementById('favorites-container');
        
        if (!songs || songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>No favorite songs yet</h3>
                    <p>Click the heart icon on any song to add it to favorites</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = songs.map(song => `
            <div class="favorite-song ${this.currentSong && song.id === this.currentSong.id ? 'playing' : ''}">
                <div class="favorite-icon">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="song-card-info">
                    <div class="song-card-title" title="${song.title}">${song.title}</div>
                    <div class="song-card-artist">${song.artist}</div>
                    <div class="song-card-genre">${song.genre}</div>
                </div>
                <div class="song-card-actions">
                    <button class="card-btn play" data-id="${song.id}">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="card-btn remove-favorite" data-id="${song.id}">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.play').forEach(btn => {
            btn.addEventListener('click', () => {
                const songId = parseInt(btn.dataset.id);
                const song = songs.find(s => s.id === songId);
                if (song) this.playSong(song);
            });
        });
        
        container.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', async () => {
                const songId = parseInt(btn.dataset.id);
                try {
                    const response = await fetch(`http://localhost:3000/api/favorites/${songId}`, {
                        method: 'POST'
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        this.showNotification('Removed from favorites');
                        this.loadFavorites();
                    }
                } catch (error) {
                    console.error('Error removing favorite:', error);
                }
            });
        });
    }

    async playAllFavorites() {
        try {
            const response = await fetch('http://localhost:3000/api/favorites');
            const favorites = await response.json();
            
            if (favorites && favorites.length > 0) {
                await this.playSong(favorites[0]);
                this.showNotification(`Playing ${favorites.length} favorite songs`);
            }
        } catch (error) {
            console.error('Error playing all favorites:', error);
        }
    }

    // ==================== GENRES ====================
    async loadGenres() {
        try {
            const response = await fetch('http://localhost:3000/api/genres');
            const genres = await response.json();
            this.displayGenres(genres);
        } catch (error) {
            console.error('Error loading genres:', error);
        }
    }

    displayGenres(genres) {
        const container = document.getElementById('genres-container');
        
        if (!genres || genres.length === 0) {
            container.innerHTML = '<div class="empty-state">No genres found</div>';
            return;
        }
        
        container.innerHTML = genres.map(genre => `
            <div class="genre-card" data-genre="${genre.name}">
                <div class="genre-icon" style="background: ${genre.color || '#8a2be2'}">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="genre-title">${genre.name}</div>
                <div class="genre-count">${genre.count || 0} songs</div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.genre-card').forEach(card => {
            card.addEventListener('click', () => {
                const genre = card.dataset.genre;
                this.viewGenre(genre);
            });
        });
    }

    async viewGenre(genreName) {
        try {
            const response = await fetch(`http://localhost:3000/api/genres/${genreName}`);
            const songs = await response.json();
            
            alert(`Showing ${songs ? songs.length : 0} songs in ${genreName}`);
        } catch (error) {
            console.error('Error viewing genre:', error);
        }
    }

    // ==================== ARTISTS ====================
    async loadArtists() {
        try {
            const response = await fetch('http://localhost:3000/api/artists');
            const artists = await response.json();
            this.displayArtists(artists);
        } catch (error) {
            console.error('Error loading artists:', error);
        }
    }

    displayArtists(artists) {
        const container = document.getElementById('artists-container');
        
        if (!artists || artists.length === 0) {
            container.innerHTML = '<div class="empty-state">No artists found</div>';
            return;
        }
        
        container.innerHTML = artists.map(artist => `
            <div class="artist-card" data-artist="${artist.name}">
                <div class="artist-avatar">
                    ${artist.name ? artist.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div class="artist-name">${artist.name}</div>
                <div class="artist-songs">${artist.count || 0} songs</div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.artist-card').forEach(card => {
            card.addEventListener('click', () => {
                const artist = card.dataset.artist;
                this.viewArtist(artist);
            });
        });
    }

    async viewArtist(artistName) {
        try {
            const response = await fetch(`http://localhost:3000/api/artists/${artistName}`);
            const songs = await response.json();
            
            alert(`Showing ${songs ? songs.length : 0} songs by ${artistName}`);
        } catch (error) {
            console.error('Error viewing artist:', error);
        }
    }

    // ==================== ALBUMS ====================
    async loadAlbums() {
        try {
            const response = await fetch('http://localhost:3000/api/albums');
            const albums = await response.json();
            this.displayAlbums(albums);
        } catch (error) {
            console.error('Error loading albums:', error);
        }
    }

    displayAlbums(albums) {
        const container = document.getElementById('albums-container');
        
        if (!albums || albums.length === 0) {
            container.innerHTML = '<div class="empty-state">No albums found</div>';
            return;
        }
        
        container.innerHTML = albums.map(album => `
            <div class="album-card" data-album="${album.name}">
                <div class="album-cover">
                    <div class="album-cover-color" style="background: ${album.coverColor || '#8a2be2'}">
                        <i class="fas fa-compact-disc"></i>
                    </div>
                </div>
                <div class="album-info">
                    <div class="album-title">${album.name}</div>
                    <div class="album-artist">${album.artist}</div>
                    <div class="album-year">${album.year}</div>
                </div>
                <div class="album-stats">
                    <span>${album.songs ? album.songs.length : 0} songs</span>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.album-card').forEach(card => {
            card.addEventListener('click', () => {
                const albumName = card.dataset.album;
                this.viewAlbum(albumName);
            });
        });
    }

    async viewAlbum(albumName) {
        try {
            const response = await fetch(`http://localhost:3000/api/albums`);
            const albums = await response.json();
            const album = albums.find(a => a.name === albumName);
            
            if (album) {
                alert(`Album: ${album.name}\nArtist: ${album.artist}\nSongs: ${album.songs ? album.songs.length : 0}`);
            }
        } catch (error) {
            console.error('Error viewing album:', error);
        }
    }

    // ==================== STATS ====================
    async loadStats() {
        try {
            const response = await fetch('http://localhost:3000/api/stats');
            const stats = await response.json();
            this.displayStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    displayStats(stats) {
        const overview = document.getElementById('stats-overview');
        if (!overview) return;
        
        overview.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalSongs || 0}</div>
                <div class="stat-label">Total Songs</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.favoriteCount || 0}</div>
                <div class="stat-label">Favorites</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round((stats.totalDuration || 0) / 60)}</div>
                <div class="stat-label">Minutes Total</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round((stats.totalSize || 0) / (1024 * 1024))}</div>
                <div class="stat-label">MB Storage</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.playlistCount || 0}</div>
                <div class="stat-label">Playlists</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Object.keys(stats.genres || {}).length}</div>
                <div class="stat-label">Genres</div>
            </div>
        `;
        
        // Create genre chart
        this.createGenreChart(stats.genres || {});
        
        // Create artist chart
        this.createArtistChart(stats.artists || {});
    }

    createGenreChart(genres) {
        const container = document.getElementById('genre-chart');
        if (!container) return;
        
        const topGenres = Object.entries(genres)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);
        
        if (topGenres.length === 0) {
            container.innerHTML = '<div class="empty-state">No genre data</div>';
            return;
        }
        
        const maxCount = Math.max(...topGenres.map(([,count]) => count));
        
        container.innerHTML = topGenres.map(([genre, count]) => {
            const height = (count / maxCount) * 100;
            return `
                <div class="chart-bar" style="height: ${height}%" title="${genre}: ${count} songs">
                    <div class="chart-label">${genre.substring(0, 6)}</div>
                </div>
            `;
        }).join('');
    }

    createArtistChart(artists) {
        const container = document.getElementById('artist-chart');
        if (!container) return;
        
        const topArtists = Object.entries(artists)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);
        
        if (topArtists.length === 0) {
            container.innerHTML = '<div class="empty-state">No artist data</div>';
            return;
        }
        
        const maxCount = Math.max(...topArtists.map(([,count]) => count));
        
        container.innerHTML = topArtists.map(([artist, count]) => {
            const height = (count / maxCount) * 100;
            return `
                <div class="chart-bar" style="height: ${height}%" title="${artist}: ${count} songs">
                    <div class="chart-label">${artist.substring(0, 6)}</div>
                </div>
            `;
        }).join('');
    }

    // ==================== UPLOAD TAB ====================
    initUploadTab() {
        const dropArea = document.getElementById('tab-drop-area');
        const fileInput = document.getElementById('tab-file-input');
        const browseBtn = document.getElementById('tab-browse-btn');
        const form = document.getElementById('tab-upload-form');
        
        if (browseBtn) {
            browseBtn.addEventListener('click', () => fileInput.click());
        }
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleTabFileSelect(e));
        }
        if (form) {
            form.addEventListener('submit', (e) => this.handleTabUpload(e));
        }
        
        if (dropArea) {
            // Drag and drop
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropArea.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropArea.style.borderColor = '#8a2be2';
                dropArea.style.background = 'rgba(138, 43, 226, 0.05)';
            }
            
            function unhighlight() {
                dropArea.style.borderColor = 'rgba(138, 43, 226, 0.5)';
                dropArea.style.background = '';
            }
            
            dropArea.addEventListener('drop', (e) => this.handleTabDrop(e), false);
        }
    }

    handleTabFileSelect(e) {
        const files = Array.from(e.target.files);
        this.displayTabSelectedFiles(files);
    }

    handleTabDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        this.displayTabSelectedFiles(files);
    }

    displayTabSelectedFiles(files) {
        const fileList = document.getElementById('tab-file-list');
        if (!fileList) return;
        
        fileList.innerHTML = '';
        
        const audioFiles = files.filter(file => 
            ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'].includes(file.type) ||
            file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
        );
        
        if (audioFiles.length === 0) {
            fileList.innerHTML = '<div class="file-item">No audio files selected</div>';
            return;
        }
        
        audioFiles.forEach(file => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `
                <span>${file.name}</span>
                <span>${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            `;
            fileList.appendChild(div);
        });
        
        // Store files for upload
        this.tabSelectedFiles = audioFiles;
    }

    async handleTabUpload(e) {
        e.preventDefault();
        
        if (!this.tabSelectedFiles || this.tabSelectedFiles.length === 0) {
            this.showNotification('Please select files to upload', 'error');
            return;
        }
        
        const artist = document.getElementById('tab-artist')?.value || 'Unknown Artist';
        const genre = document.getElementById('tab-genre')?.value || 'Unknown Genre';
        const album = document.getElementById('tab-album')?.value || 'Unknown Album';
        const year = document.getElementById('tab-year')?.value || new Date().getFullYear();
        
        const formData = new FormData();
        this.tabSelectedFiles.forEach(file => {
            formData.append('songs', file);
        });
        formData.append('artist', artist);
        formData.append('genre', genre);
        formData.append('album', album);
        formData.append('year', year);
        
        try {
            const response = await fetch('http://localhost:3000/api/songs/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Successfully uploaded ${result.songs.length} song(s)`);
                this.clearTabUploadForm();
                this.loadSongs();
                this.updateStats();
            } else {
                this.showNotification('Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Upload failed', 'error');
        }
    }

    clearTabUploadForm() {
        const fileList = document.getElementById('tab-file-list');
        if (fileList) fileList.innerHTML = '';
        
        const fileInput = document.getElementById('tab-file-input');
        if (fileInput) fileInput.value = '';
        
        const artistInput = document.getElementById('tab-artist');
        if (artistInput) artistInput.value = '';
        
        const genreInput = document.getElementById('tab-genre');
        if (genreInput) genreInput.value = '';
        
        const albumInput = document.getElementById('tab-album');
        if (albumInput) albumInput.value = '';
        
        const yearInput = document.getElementById('tab-year');
        if (yearInput) yearInput.value = '';
        
        this.tabSelectedFiles = null;
    }

    // ==================== CORE PLAYER FUNCTIONS ====================
    async loadSongs() {
        try {
            const response = await fetch('http://localhost:3000/api/songs');
            const songs = await response.json();
            this.displaySongs(songs);
            this.updateStats();
            
            // Play first song if none is playing
            if (!this.currentSong && songs && songs.length > 0) {
                this.currentSong = songs[0];
                this.updateCurrentSongDisplay();
            }
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    }

    displaySongs(songs) {
        const container = document.getElementById('songs-container');
        if (!container) return;
        
        this.displaySongsInContainer(songs, container);
    }

    displaySongsInContainer(songs, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!songs || songs.length === 0) {
            container.innerHTML = '<div class="empty-state">No songs found</div>';
            return;
        }
        
        songs.forEach(song => {
            const songCard = document.createElement('div');
            songCard.className = 'song-card';
            if (this.currentSong && song.id === this.currentSong.id) {
                songCard.classList.add('playing');
            }
            
            songCard.innerHTML = `
                <div class="song-cover">
                    <i class="fas fa-music"></i>
                </div>
                <div class="song-card-info">
                    <div class="song-card-title" title="${song.title}">${song.title}</div>
                    <div class="song-card-artist">${song.artist}</div>
                    <div class="song-card-genre">${song.genre}</div>
                </div>
                <div class="song-card-actions">
                    <button class="card-btn play" data-id="${song.id}">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="card-btn queue" data-id="${song.id}">
                        <i class="fas fa-plus"></i> Queue
                    </button>
                    <button class="card-btn favorite" data-id="${song.id}">
                        <i class="${song.favorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const playBtn = songCard.querySelector('.play');
            const queueBtn = songCard.querySelector('.queue');
            const favoriteBtn = songCard.querySelector('.favorite');
            
            playBtn.addEventListener('click', () => this.playSong(song));
            queueBtn.addEventListener('click', () => this.addToQueue(song.id));
            favoriteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    const response = await fetch(`http://localhost:3000/api/favorites/${song.id}`, {
                        method: 'POST'
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        song.favorite = result.favorite;
                        favoriteBtn.innerHTML = `<i class="${song.favorite ? 'fas' : 'far'} fa-heart"></i>`;
                        this.showNotification(song.favorite ? 'Added to favorites' : 'Removed from favorites');
                        this.updateFavoriteButton();
                        
                        // Refresh favorites tab if it's active
                        if (this.currentTab === 'favorites') {
                            this.loadFavorites();
                        }
                    }
                } catch (error) {
                    console.error('Error toggling favorite:', error);
                }
            });
            
            container.appendChild(songCard);
        });
    }

    async playSong(song) {
        try {
            this.currentSong = song;
            this.audio.src = `http://localhost:3000/songs/${song.filename}`;
            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayState();
            this.updateCurrentSongDisplay();
            this.updateFavoriteButton();
            
            // Update UI to show playing song
            document.querySelectorAll('.song-card').forEach(card => {
                card.classList.remove('playing');
            });
            
            const currentCard = Array.from(document.querySelectorAll('.song-card')).find(card => {
                return card.querySelector(`[data-id="${song.id}"]`);
            });
            
            if (currentCard) {
                currentCard.classList.add('playing');
            }
            
        } catch (error) {
            console.error('Error playing song:', error);
            this.showNotification('Error playing song', 'error');
        }
    }

    togglePlay() {
        if (!this.currentSong) {
            this.loadSongs().then(() => {
                if (!this.currentSong) return;
                this.playSong(this.currentSong);
            });
            return;
        }
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
        this.isPlaying = !this.isPlaying;
        this.updatePlayState();
    }

    updatePlayState() {
        const playBtn = document.getElementById('play-btn');
        const miniPlay = document.getElementById('mini-play');
        const playIcon = this.isPlaying ? 'fa-pause' : 'fa-play';
        
        if (playBtn) playBtn.innerHTML = `<i class="fas ${playIcon}"></i>`;
        if (miniPlay) miniPlay.innerHTML = `<i class="fas ${playIcon}"></i>`;
        
        // Add/remove playing class for animations
        const artDisc = document.querySelector('.art-disc');
        if (artDisc) {
            if (this.isPlaying) {
                artDisc.parentElement.parentElement.classList.add('playing');
            } else {
                artDisc.parentElement.parentElement.classList.remove('playing');
            }
        }
    }

    async playNext() {
        try {
            const response = await fetch('http://localhost:3000/api/queue/next');
            const nextSong = await response.json();
            
            if (nextSong) {
                await this.playSong(nextSong);
            } else {
                // Get next from playlist
                const response = await fetch('http://localhost:3000/api/songs/next');
                const nextSong = await response.json();
                if (nextSong) {
                    await this.playSong(nextSong);
                }
            }
            
            this.loadQueue();
        } catch (error) {
            console.error('Error playing next song:', error);
        }
    }

    async playPrev() {
        try {
            const response = await fetch('http://localhost:3000/api/songs/prev');
            const prevSong = await response.json();
            
            if (prevSong) {
                await this.playSong(prevSong);
            }
        } catch (error) {
            console.error('Error playing previous song:', error);
        }
    }

    async addToQueue(songId) {
        try {
            const response = await fetch('http://localhost:3000/api/queue/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songId })
            });
            
            if (response.ok) {
                this.loadQueue();
                this.showNotification('Song added to queue');
            }
        } catch (error) {
            console.error('Error adding to queue:', error);
        }
    }

    async addCurrentToQueue() {
        if (this.currentSong) {
            await this.addToQueue(this.currentSong.id);
        }
    }

    async toggleFavorite() {
        if (!this.currentSong) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/favorites/${this.currentSong.id}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            if (result.success) {
                this.currentSong.favorite = result.favorite;
                this.updateFavoriteButton();
                this.showNotification(result.favorite ? 'Added to favorites' : 'Removed from favorites');
                
                // Refresh favorites tab if it's active
                if (this.currentTab === 'favorites') {
                    this.loadFavorites();
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }

    updateFavoriteButton() {
        const btn = document.getElementById('favorite-btn');
        if (btn) {
            if (this.currentSong && this.currentSong.favorite) {
                btn.innerHTML = '<i class="fas fa-heart"></i>';
                btn.style.color = 'var(--danger)';
            } else {
                btn.innerHTML = '<i class="far fa-heart"></i>';
                btn.style.color = 'var(--light-text)';
            }
        }
    }

    async loadQueue() {
        try {
            const response = await fetch('http://localhost:3000/api/queue');
            const queue = await response.json();
            
            const queueList = document.getElementById('queue-list');
            if (!queueList) return;
            
            queueList.innerHTML = '';
            
            if (!queue || queue.length === 0) {
                queueList.innerHTML = '<li>Queue is empty</li>';
                return;
            }
            
            queue.forEach(song => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${song.title}</span>
                    <button class="remove-queue" data-id="${song.id}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                li.querySelector('.remove-queue').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFromQueue(song.id);
                });
                
                queueList.appendChild(li);
            });
            
            this.updateStats();
        } catch (error) {
            console.error('Error loading queue:', error);
        }
    }

    async removeFromQueue(songId) {
        try {
            const response = await fetch(`http://localhost:3000/api/queue/remove/${songId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.loadQueue();
                this.showNotification('Song removed from queue');
            }
        } catch (error) {
            console.error('Error removing from queue:', error);
        }
    }

    async shufflePlaylist() {
        try {
            const response = await fetch('http://localhost:3000/api/playlist/shuffle', {
                method: 'POST'
            });
            
            if (response.ok) {
                this.loadSongs();
                this.showNotification('Playlist shuffled');
            }
        } catch (error) {
            console.error('Error shuffling playlist:', error);
        }
    }

    updateProgress() {
        const progress = document.getElementById('song-progress');
        const currentTime = document.getElementById('current-time');
        const totalTime = document.getElementById('total-time');
        
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            if (progress) progress.style.width = `${percent}%`;
            
            if (currentTime) currentTime.textContent = this.formatTime(this.audio.currentTime);
            if (totalTime) totalTime.textContent = this.formatTime(this.audio.duration);
        }
    }

    updateSongInfo() {
        if (this.currentSong) {
            this.updateCurrentSongDisplay();
        }
    }

    updateCurrentSongDisplay() {
        if (!this.currentSong) return;
        
        const currentTitle = document.getElementById('current-title');
        const currentArtist = document.getElementById('current-artist');
        const currentGenre = document.getElementById('current-genre');
        const miniTitle = document.getElementById('mini-title');
        const miniArtist = document.getElementById('mini-artist');
        
        if (currentTitle) currentTitle.textContent = this.currentSong.title;
        if (currentArtist) currentArtist.textContent = this.currentSong.artist;
        if (currentGenre) currentGenre.textContent = this.currentSong.genre;
        if (miniTitle) miniTitle.textContent = this.currentSong.title;
        if (miniArtist) miniArtist.textContent = this.currentSong.artist;
    }

    async updateStats() {
        try {
            const songsResponse = await fetch('http://localhost:3000/api/songs');
            const songs = await songsResponse.json();
            
            const queueResponse = await fetch('http://localhost:3000/api/queue');
            const queue = await queueResponse.json();
            
            const songCount = document.getElementById('song-count');
            const queueCount = document.getElementById('queue-count');
            
            if (songCount) songCount.textContent = songs ? songs.length : 0;
            if (queueCount) queueCount.textContent = queue ? queue.length : 0;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async searchSongs(term) {
        if (!term.trim()) {
            this.loadSongs();
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/songs/search/${encodeURIComponent(term)}`);
            const songs = await response.json();
            this.displaySongs(songs);
        } catch (error) {
            console.error('Error searching songs:', error);
        }
    }

    showUploadModal() {
        document.getElementById('upload-modal').style.display = 'flex';
    }

    hideUploadModal() {
        document.getElementById('upload-modal').style.display = 'none';
        this.clearFileList();
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.displaySelectedFiles(files);
    }

    handleDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        this.displaySelectedFiles(files);
    }

    displaySelectedFiles(files) {
        const fileList = document.getElementById('file-list');
        if (!fileList) return;
        
        fileList.innerHTML = '';
        
        const audioFiles = files.filter(file => 
            ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'].includes(file.type) ||
            file.name.match(/\.(mp3|wav|ogg|m4a)$/i)
        );
        
        if (audioFiles.length === 0) {
            fileList.innerHTML = '<div class="file-item">No audio files selected</div>';
            return;
        }
        
        audioFiles.forEach(file => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `
                <span>${file.name}</span>
                <span>${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            `;
            fileList.appendChild(div);
        });
        
        // Store files for upload
        this.selectedFiles = audioFiles;
    }

    clearFileList() {
        const fileList = document.getElementById('file-list');
        if (fileList) fileList.innerHTML = '';
        
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        
        this.selectedFiles = null;
    }

    async handleUpload(e) {
        e.preventDefault();
        
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.showNotification('Please select files to upload', 'error');
            return;
        }
        
        const artist = document.getElementById('artist')?.value || 'Unknown Artist';
        const genre = document.getElementById('genre')?.value || 'Unknown Genre';
        const album = document.getElementById('album')?.value || 'Unknown Album';
        const year = document.getElementById('year')?.value || new Date().getFullYear();
        
        const formData = new FormData();
        this.selectedFiles.forEach(file => {
            formData.append('songs', file);
        });
        formData.append('artist', artist);
        formData.append('genre', genre);
        formData.append('album', album);
        formData.append('year', year);
        
        try {
            const response = await fetch('http://localhost:3000/api/songs/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Successfully uploaded ${result.songs.length} song(s)`);
                this.hideUploadModal();
                this.loadSongs();
                this.clearFileList();
                document.getElementById('artist').value = '';
                document.getElementById('genre').value = '';
                document.getElementById('album').value = '';
                document.getElementById('year').value = '';
            } else {
                this.showNotification('Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Upload failed', 'error');
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 56, 96, 0.1)'};
            color: ${type === 'success' ? '#00ff88' : '#ff3860'};
            padding: 15px 20px;
            border-radius: 10px;
            border: 1px solid ${type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 56, 96, 0.3)'};
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Add CSS animations if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.player = new MusicPlayer();
});