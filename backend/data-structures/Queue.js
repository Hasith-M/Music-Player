class QueueNode {
    constructor(song) {
        this.song = song;
        this.next = null;
    }
}

class Queue {
    constructor() {
        this.front = null;
        this.rear = null;
        this.size = 0;
    }

    // Add song to queue
    enqueue(song) {
        const newNode = new QueueNode(song);
        
        if (!this.rear) {
            this.front = newNode;
            this.rear = newNode;
        } else {
            this.rear.next = newNode;
            this.rear = newNode;
        }
        this.size++;
        return song;
    }

    // Remove song from queue
    dequeue() {
        if (!this.front) return null;
        
        const removed = this.front;
        this.front = this.front.next;
        
        if (!this.front) {
            this.rear = null;
        }
        
        this.size--;
        return removed.song;
    }

    // Peek at next song in queue
    peek() {
        return this.front ? this.front.song : null;
    }

    // Check if queue is empty
    isEmpty() {
        return this.size === 0;
    }

    // Get all songs in queue
    getAll() {
        const songs = [];
        let current = this.front;
        
        while (current) {
            songs.push(current.song);
            current = current.next;
        }
        return songs;
    }

    // Clear the queue
    clear() {
        this.front = null;
        this.rear = null;
        this.size = 0;
    }

    // Remove specific song from queue
    remove(songId) {
        if (!this.front) return false;
        
        // If song is at the front
        if (this.front.song.id === songId) {
            this.dequeue();
            return true;
        }
        
        let current = this.front;
        let prev = null;
        
        while (current && current.song.id !== songId) {
            prev = current;
            current = current.next;
        }
        
        if (!current) return false;
        
        prev.next = current.next;
        
        // If removing the last node
        if (current === this.rear) {
            this.rear = prev;
        }
        
        this.size--;
        return true;
    }
}

module.exports = Queue;