/**
 * Flower Calendar Database Module
 * Uses IndexedDB for persistent local storage
 */

const DB_NAME = 'FlowerCalendarDB';
const DB_VERSION = 1;
const STORE_NAME = 'orders';

class FlowerDatabase {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize the database connection
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('shippingDate', 'shippingDate', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                }
            };
        });
    }

    /**
     * Generate a unique ID for orders
     */
    generateId() {
        return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add a new order
     */
    async addOrder(orderData) {
        const order = {
            id: this.generateId(),
            ...orderData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(order);

            request.onsuccess = () => resolve(order);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a single order by ID
     */
    async getOrder(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all orders
     */
    async getAllOrders() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get orders for a specific month
     */
    async getOrdersByMonth(year, month) {
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const allOrders = await this.getAllOrders();
        return allOrders.filter(order => {
            const orderDate = order.shippingDate;
            return orderDate >= startDate && orderDate <= endDate;
        });
    }

    /**
     * Get orders within a date range
     */
    async getOrdersByDateRange(startDate, endDate) {
        const allOrders = await this.getAllOrders();
        return allOrders.filter(order => {
            const orderDate = order.shippingDate;
            return orderDate >= startDate && orderDate <= endDate;
        });
    }

    /**
     * Update an existing order
     */
    async updateOrder(id, orderData) {
        const existingOrder = await this.getOrder(id);
        if (!existingOrder) {
            throw new Error('Order not found');
        }

        const updatedOrder = {
            ...existingOrder,
            ...orderData,
            id: existingOrder.id,
            createdAt: existingOrder.createdAt,
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(updatedOrder);

            request.onsuccess = () => resolve(updatedOrder);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete an order
     */
    async deleteOrder(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

// Export singleton instance
const flowerDB = new FlowerDatabase();
