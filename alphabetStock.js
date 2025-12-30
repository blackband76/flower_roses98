/**
 * Alphabet Stock Management Module
 * Handles alphabet/symbol inventory for order decorations
 */

class AlphabetStockManager {
    constructor() {
        this.stockGrid = document.getElementById('stockGrid');
        this.addModal = document.getElementById('addModal');
        this.addForm = document.getElementById('addForm');
        this.stock = [];
    }

    /**
     * Initialize the page
     */
    async init() {
        // Check authentication
        const user = flowerDB.checkAuth();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Initialize database
        await flowerDB.init();

        // Display username
        document.getElementById('userEmail').textContent = user.username;

        // Setup logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            flowerDB.logout();
        });

        // Setup event listeners
        this.setupEventListeners();

        // Render quick add buttons
        this.renderQuickAddButtons();

        // Load and render stock
        await this.loadStock();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Open modal
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Close on outside click
        this.addModal.addEventListener('click', (e) => {
            if (e.target === this.addModal) {
                this.closeModal();
            }
        });

        // Form submit
        this.addForm.addEventListener('submit', (e) => this.handleAddSubmit(e));

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.addModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    /**
     * Render quick add buttons
     */
    renderQuickAddButtons() {
        const quickAddContainer = document.getElementById('quickAddButtons');
        const quickItems = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
            'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            '❤', '♠', '♣', '♥', '♦', '★', '☆', '♪', '♫', '✿', '❀', '☀', '☁', '✓', '&'
        ];

        quickAddContainer.innerHTML = quickItems.map(char => `
            <button type="button" class="quick-add-btn" data-char="${char}">${char}</button>
        `).join('');

        // Add click handlers
        quickAddContainer.querySelectorAll('.quick-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('characterInput').value = btn.dataset.char;
            });
        });
    }

    /**
     * Open add modal
     */
    openModal() {
        this.addModal.classList.add('active');
        document.getElementById('characterInput').value = '';
        document.getElementById('quantityInput').value = '0';
        document.getElementById('characterInput').focus();
    }

    /**
     * Close add modal
     */
    closeModal() {
        this.addModal.classList.remove('active');
    }

    /**
     * Handle add form submit
     */
    async handleAddSubmit(e) {
        e.preventDefault();

        const character = document.getElementById('characterInput').value.trim();
        const quantity = parseInt(document.getElementById('quantityInput').value) || 0;

        if (!character) {
            alert('Please enter a character');
            return;
        }

        // Check if character already exists
        const exists = this.stock.find(s => s.character === character);
        if (exists) {
            alert(`"${character}" already exists in your stock. Use the +/- buttons to adjust quantity.`);
            return;
        }

        try {
            await flowerDB.addAlphabetItem(character, quantity);
            this.closeModal();
            await this.loadStock();
        } catch (error) {
            console.error('Error adding character:', error);
            alert('Failed to add character. Please try again.');
        }
    }

    /**
     * Load stock from database
     */
    async loadStock() {
        this.stock = await flowerDB.getAlphabetStock();
        this.renderStock();
    }

    /**
     * Render stock grid
     */
    renderStock() {
        if (this.stock.length === 0) {
            this.stockGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📦</div>
                    <h3>No Characters Yet</h3>
                    <p>Click "Add Character" to start building your alphabet inventory.</p>
                </div>
            `;
            return;
        }

        this.stockGrid.innerHTML = this.stock.map(item => `
            <div class="stock-item" data-id="${item.id}">
                <button class="delete-btn" title="Delete" onclick="stockManager.deleteItem('${item.id}')">×</button>
                <div class="stock-character">${this.escapeHtml(item.character)}</div>
                <div class="stock-quantity">
                    <button class="qty-btn" onclick="stockManager.adjustQuantity('${item.id}', -1)">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="stockManager.adjustQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Adjust quantity of an item
     */
    async adjustQuantity(id, delta) {
        const item = this.stock.find(s => s.id === id);
        if (!item) return;

        const newQuantity = Math.max(0, item.quantity + delta);

        try {
            await flowerDB.updateAlphabetQuantity(id, newQuantity);
            item.quantity = newQuantity;
            this.renderStock();
        } catch (error) {
            console.error('Error updating quantity:', error);
            alert('Failed to update quantity. Please try again.');
        }
    }

    /**
     * Delete an item
     */
    async deleteItem(id) {
        const item = this.stock.find(s => s.id === id);
        if (!item) return;

        const confirmed = confirm(`Delete "${item.character}" from your inventory?`);
        if (!confirmed) return;

        try {
            await flowerDB.deleteAlphabetItem(id);
            await this.loadStock();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    }
}

// Initialize when DOM is ready
let stockManager;
document.addEventListener('DOMContentLoaded', async () => {
    stockManager = new AlphabetStockManager();
    await stockManager.init();
});
