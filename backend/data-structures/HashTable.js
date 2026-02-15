class HashTable {
    constructor(size = 50) {
        this.size = size;
        this.buckets = Array(size).fill(null).map(() => []);
    }

    // Simple hash function
    hash(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash << 5) - hash + key.charCodeAt(i);
            hash |= 0; // Convert to 32-bit integer
        }
        return Math.abs(hash) % this.size;
    }

    // Store song by multiple keys
    set(key, song) {
        const index = this.hash(key);
        const bucket = this.buckets[index];
        
        // Check if song already exists with this key
        const existingIndex = bucket.findIndex(item => item.key === key && item.song.id === song.id);
        
        if (existingIndex >= 0) {
            bucket[existingIndex] = { key, song };
        } else {
            bucket.push({ key, song });
        }
    }

    // Get songs by key
    get(key) {
        const index = this.hash(key);
        const bucket = this.buckets[index];
        return bucket.filter(item => item.key === key).map(item => item.song);
    }

    // Remove song by key
    remove(key, songId) {
        const index = this.hash(key);
        const bucket = this.buckets[index];
        const initialLength = bucket.length;
        
        this.buckets[index] = bucket.filter(item => !(item.key === key && item.song.id === songId));
        return initialLength !== bucket.length;
    }

    // Get all unique songs
    getAllSongs() {
        const songMap = new Map();
        
        for (const bucket of this.buckets) {
            for (const item of bucket) {
                songMap.set(item.song.id, item.song);
            }
        }
        
        return Array.from(songMap.values());
    }

    // Clear all entries for a key
    clearKey(key) {
        const index = this.hash(key);
        const bucket = this.buckets[index];
        const initialLength = bucket.length;
        
        this.buckets[index] = bucket.filter(item => item.key !== key);
        return initialLength - bucket.length;
    }
}

module.exports = HashTable;