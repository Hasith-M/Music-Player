class BSTNode {
    constructor(song) {
        this.song = song;
        this.left = null;
        this.right = null;
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
    }

    // Insert song sorted by title
    insert(song) {
        const newNode = new BSTNode(song);
        
        if (!this.root) {
            this.root = newNode;
            return;
        }
        
        let current = this.root;
        while (true) {
            if (song.title.toLowerCase() < current.song.title.toLowerCase()) {
                if (!current.left) {
                    current.left = newNode;
                    break;
                }
                current = current.left;
            } else {
                if (!current.right) {
                    current.right = newNode;
                    break;
                }
                current = current.right;
            }
        }
    }

    // Search songs by title (partial match)
    search(searchTerm) {
        const results = [];
        this._searchHelper(this.root, searchTerm.toLowerCase(), results);
        return results;
    }

    _searchHelper(node, searchTerm, results) {
        if (!node) return;
        
        if (node.song.title.toLowerCase().includes(searchTerm)) {
            results.push(node.song);
        }
        
        // Continue search in both subtrees for partial matches
        this._searchHelper(node.left, searchTerm, results);
        this._searchHelper(node.right, searchTerm, results);
    }

    // Get all songs in sorted order
    getAllInOrder() {
        const songs = [];
        this._inOrder(this.root, songs);
        return songs;
    }

    _inOrder(node, songs) {
        if (!node) return;
        
        this._inOrder(node.left, songs);
        songs.push(node.song);
        this._inOrder(node.right, songs);
    }

    // Get songs by range (A-M, N-Z, etc.)
    getByRange(startChar, endChar) {
        const songs = [];
        this._rangeHelper(this.root, startChar.toLowerCase(), endChar.toLowerCase(), songs);
        return songs;
    }

    _rangeHelper(node, start, end, songs) {
        if (!node) return;
        
        const firstChar = node.song.title.charAt(0).toLowerCase();
        
        if (firstChar >= start && firstChar <= end) {
            songs.push(node.song);
        }
        
        if (firstChar >= start) {
            this._rangeHelper(node.left, start, end, songs);
        }
        
        if (firstChar <= end) {
            this._rangeHelper(node.right, start, end, songs);
        }
    }
}

module.exports = BinarySearchTree;