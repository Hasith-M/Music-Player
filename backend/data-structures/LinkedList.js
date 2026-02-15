class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
        this.prev = null;
    }
}

class DoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
        this.current = null;
    }

    // Add song to playlist
    append(song) {
        const newNode = new Node(song);
        
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
            this.current = newNode;
        } else {
            newNode.prev = this.tail;
            this.tail.next = newNode;
            this.tail = newNode;
        }
        this.length++;
        return newNode;
    }

    // Remove song from playlist
    remove(songId) {
        let current = this.head;
        
        while (current) {
            if (current.data.id === songId) {
                if (current.prev) current.prev.next = current.next;
                if (current.next) current.next.prev = current.prev;
                if (current === this.head) this.head = current.next;
                if (current === this.tail) this.tail = current.prev;
                this.length--;
                return true;
            }
            current = current.next;
        }
        return false;
    }

    // Get next song
    getNext() {
        if (!this.current || !this.current.next) {
            this.current = this.head;
            return this.current ? this.current.data : null;
        }
        this.current = this.current.next;
        return this.current.data;
    }

    // Get previous song
    getPrev() {
        if (!this.current || !this.current.prev) {
            this.current = this.tail;
            return this.current ? this.current.data : null;
        }
        this.current = this.current.prev;
        return this.current.data;
    }

    // Get current song
    getCurrent() {
        return this.current ? this.current.data : null;
    }

    // Get all songs
    getAll() {
        const songs = [];
        let current = this.head;
        
        while (current) {
            songs.push(current.data);
            current = current.next;
        }
        return songs;
    }

    // Shuffle playlist
    shuffle() {
        const songs = this.getAll();
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        
        // Rebuild linked list
        this.head = null;
        this.tail = null;
        this.length = 0;
        
        songs.forEach(song => this.append(song));
    }
}

module.exports = DoublyLinkedList;