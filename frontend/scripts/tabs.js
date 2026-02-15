class TabsManager {
    constructor(player) {
        this.player = player;
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        // Tab navigation
        document.querySelectorAll('.main-nav li').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Initialize each tab
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
        document.getElementById('favorite-btn').addEventListener('click', () => this.toggleFavorite());
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
                    <div class="stat-value">${stats.totalSongs}</div>
                    <div class="stat-label">Total Songs</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.favoriteCount}</div>
                    <div class="stat-label">Favorites</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.playlistCount}</div>
                    <div class="stat-label">Playlists</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Math.round(stats.totalSize / (1024 * 1024))}</div>
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
            if (recent.length === 0) {
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
                        if (song) this.player.playSong(song);
                    }
                });
            });
            
            container.querySelectorAll('.recent-play').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const songId = parseInt(btn.dataset.id);
                    const song = recent.find(s => s.id === songId);
                    if (song) this.player.playSong(song);
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
            const topGenres = genres.sort((a, b) => b.count - a.count).slice(0, 6);
            
            if (topGenres.length === 0) {
                container.innerHTML = '<div class="empty-state">No genres found</div>';
                return;
            }
            
            container.innerHTML = topGenres.map(genre => `
                <div class="genre-tag" data-genre="${genre.name}">
                    <span>${genre.name}</span>
                    <span class="genre-count">${genre.count}</span>
                </div>
            `).join('');
            
            // Add click handlers
            container.querySelectorAll('.genre-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    this.switchTab('genres');
                    // Could filter genres tab here
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
            // Simple recommendation: random 6 songs
            const recommended = [...songs].sort(() => 0.5 - Math.random()).slice(0, 6);
            
            this.player.displaySongsInContainer(recommended, container);
        } catch (error) {
            console.error('Error loading recommended:', error);
        }
    }

    async toggleFavorite() {
        if (!this.player.currentSong) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/favorites/${this.player.currentSong.id}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            if (result.success) {
                this.player.currentSong.favorite = result.favorite;
                this.updateFavoriteButton();
                this.player.showNotification(result.favorite ? 'Added to favorites' : 'Removed from favorites');
                
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
        if (this.player.currentSong && this.player.currentSong.favorite) {
            btn.innerHTML = '<i class="fas fa-heart"></i>';
            btn.style.color = 'var(--danger)';
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
            btn.style.color = 'var(--light-text)';
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
        
        if (songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music"></i>
                    <h3>No songs in library</h3>
                    <p>Upload some music to get started</p>
                    <button class="tab-btn primary" onclick="tabsManager.switchTab('upload')">
                        <i class="fas fa-upload"></i> Upload Music
                    </button>
                </div>
            `;
            return;
        }
        
        this.player.displaySongsInContainer(songs, container);
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
                case 'genre':
                    // Would need genre selection UI
                    this.loadLibrary();
                    return;
                case 'artist':
                    // Would need artist selection UI
                    this.loadLibrary();
                    return;
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
        
        if (playlists.length === 0) {
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
            <div class="playlist-card" data-id="${playlist.id}" style="border-top: 5px solid ${playlist.coverColor}">
                <div class="playlist-cover" style="background: ${playlist.coverColor}">
                    <i class="fas fa-list-music"></i>
                </div>
                <div class="playlist-info">
                    <div class="playlist-name">${playlist.name}</div>
                    <div class="playlist-desc">${playlist.description || 'No description'}</div>
                </div>
                <div class="playlist-stats">
                    <span>${playlist.songs.length} songs</span>
                    <span>Created ${new Date(playlist.created).toLocaleDateString()}</span>
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
            this.player.showNotification('Please enter a playlist name', 'error');
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
                this.player.showNotification('Playlist created successfully');
                this.hideCreatePlaylistModal();
                this.loadPlaylists();
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
            this.player.showNotification('Error creating playlist', 'error');
        }
    }

    async viewPlaylist(playlistId) {
        try {
            const response = await fetch(`http://localhost:3000/api/playlists/${playlistId}`);
            const playlist = await response.json();
            
            // Show playlist detail view
            alert(`Viewing playlist: ${playlist.name}\nSongs: ${playlist.songs.length}`);
            // In a full implementation, you would show a modal or navigate to a detail view
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
            const playlistSongs = allSongs.filter(song => playlist.songs.includes(song.id));
            
            if (playlistSongs.length > 0) {
                // Play first song in playlist
                await this.player.playSong(playlistSongs[0]);
                
                // Clear queue and add remaining songs
                // This would require additional endpoints
                this.player.showNotification(`Playing playlist: ${playlist.name}`);
            }
        } catch (error) {
            console.error('Error playing playlist:', error);
        }
    }

    async editPlaylist(playlistId) {
        // Implement playlist editing
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
        
        if (songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No recently played songs</h3>
                    <p>Start playing some music to see it here</p>
                </div>
            `;
            return;
        }
        
        this.player.displaySongsInContainer(songs, container);
    }

    async clearRecent() {
        if (confirm('Clear all recently played history?')) {
            // This would require a backend endpoint
            this.player.showNotification('Recent history cleared');
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
        
        if (songs.length === 0) {
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
            <div class="favorite-song ${this.player.currentSong && song.id === this.player.currentSong.id ? 'playing' : ''}">
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
                if (song) this.player.playSong(song);
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
                        this.player.showNotification('Removed from favorites');
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
            
            if (favorites.length > 0) {
                await this.player.playSong(favorites[0]);
                this.player.showNotification(`Playing ${favorites.length} favorite songs`);
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
        
        if (genres.length === 0) {
            container.innerHTML = '<div class="empty-state">No genres found</div>';
            return;
        }
        
        container.innerHTML = genres.map(genre => `
            <div class="genre-card" data-genre="${genre.name}">
                <div class="genre-icon" style="background: ${genre.color}">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="genre-title">${genre.name}</div>
                <div class="genre-count">${genre.count} songs</div>
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
            
            // Show songs in this genre
            alert(`Showing ${songs.length} songs in ${genreName}`);
            // In a full implementation, you would filter the library view
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
        
        if (artists.length === 0) {
            container.innerHTML = '<div class="empty-state">No artists found</div>';
            return;
        }
        
        container.innerHTML = artists.map(artist => `
            <div class="artist-card" data-artist="${artist.name}">
                <div class="artist-avatar">
                    ${artist.name.charAt(0).toUpperCase()}
                </div>
                <div class="artist-name">${artist.name}</div>
                <div class="artist-songs">${artist.count} songs</div>
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
            
            // Show songs by this artist
            alert(`Showing ${songs.length} songs by ${artistName}`);
            // In a full implementation, you would filter the library view
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
        
        if (albums.length === 0) {
            container.innerHTML = '<div class="empty-state">No albums found</div>';
            return;
        }
        
        container.innerHTML = albums.map(album => `
            <div class="album-card" data-album="${album.name}">
                <div class="album-cover">
                    <div class="album-cover-color" style="background: ${album.coverColor}">
                        <i class="fas fa-compact-disc"></i>
                    </div>
                </div>
                <div class="album-info">
                    <div class="album-title">${album.name}</div>
                    <div class="album-artist">${album.artist}</div>
                    <div class="album-year">${album.year}</div>
                </div>
                <div class="album-stats">
                    <span>${album.songs.length} songs</span>
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
                // Show album detail
                alert(`Album: ${album.name}\nArtist: ${album.artist}\nSongs: ${album.songs.length}`);
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
        overview.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalSongs}</div>
                <div class="stat-label">Total Songs</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.favoriteCount}</div>
                <div class="stat-label">Favorites</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(stats.totalDuration / 60)}</div>
                <div class="stat-label">Minutes Total</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(stats.totalSize / (1024 * 1024))}</div>
                <div class="stat-label">MB Storage</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.playlistCount}</div>
                <div class="stat-label">Playlists</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Object.keys(stats.genres).length}</div>
                <div class="stat-label">Genres</div>
            </div>
        `;
        
        // Create genre chart
        this.createGenreChart(stats.genres);
        
        // Create artist chart
        this.createArtistChart(stats.artists);
    }

    createGenreChart(genres) {
        const container = document.getElementById('genre-chart');
        const topGenres = Object.entries(genres)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);
        
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
        const topArtists = Object.entries(artists)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);
        
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
        
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleTabFileSelect(e));
        form.addEventListener('submit', (e) => this.handleTabUpload(e));
        
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
            this.player.showNotification('Please select files to upload', 'error');
            return;
        }
        
        const artist = document.getElementById('tab-artist').value || 'Unknown Artist';
        const genre = document.getElementById('tab-genre').value || 'Unknown Genre';
        const album = document.getElementById('tab-album').value || 'Unknown Album';
        const year = document.getElementById('tab-year').value || new Date().getFullYear();
        
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
                this.player.showNotification(`Successfully uploaded ${result.songs.length} song(s)`);
                this.clearTabUploadForm();
                this.player.loadSongs();
                this.player.updateStats();
            } else {
                this.player.showNotification('Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.player.showNotification('Upload failed', 'error');
        }
    }

    clearTabUploadForm() {
        document.getElementById('tab-file-list').innerHTML = '';
        document.getElementById('tab-file-input').value = '';
        document.getElementById('tab-artist').value = '';
        document.getElementById('tab-genre').value = '';
        document.getElementById('tab-album').value = '';
        document.getElementById('tab-year').value = '';
        this.tabSelectedFiles = null;
    }
}

// Add helper method to MusicPlayer class
MusicPlayer.prototype.displaySongsInContainer = function(songs, container) {
    container.innerHTML = '';
    
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
                    
                    // Update favorite button if this is the current song
                    if (this.currentSong && this.currentSong.id === song.id) {
                        window.tabsManager.updateFavoriteButton();
                    }
                    
                    // Refresh favorites tab if it's active
                    if (window.tabsManager.currentTab === 'favorites') {
                        window.tabsManager.loadFavorites();
                    }
                }
            } catch (error) {
                console.error('Error toggling favorite:', error);
            }
        });
        
        container.appendChild(songCard);
    });
};

// Initialize tabs when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.player = new MusicPlayer();
    window.tabsManager = new TabsManager(window.player);
});