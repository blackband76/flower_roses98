/**
 * Flower Calendar Database Module
 * Uses Supabase for cloud database storage
 */

// Supabase configuration
const SUPABASE_URL = 'https://sljqtnfuyznmghbnafjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsanF0bmZ1eXpubWdoYm5hZmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDA4MTMsImV4cCI6MjA4MTU3NjgxM30.GOlFGOE90TJD4ECyiTtwl1IefwJb1Q8pSAcomTNN0fE';

class FlowerDatabase {
    constructor() {
        this.supabase = null;
    }

    /**
     * Initialize the Supabase client
     */
    async init() {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
        return this.supabase;
    }

    /**
     * Check if user is logged in
     */
    checkAuth() {
        const user = localStorage.getItem('flower_user');
        return user ? JSON.parse(user) : null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        const user = localStorage.getItem('flower_user');
        return user ? JSON.parse(user) : null;
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('flower_user');
        window.location.href = 'login.html';
    }

    /**
     * Convert JS camelCase to DB snake_case
     */
    toDbFormat(orderData) {
        return {
            shipping_date: orderData.shippingDate,
            customer_name: orderData.customerName,
            platform: orderData.platform || null,
            flower_count: orderData.flowerCount,
            flower_color: orderData.flowerColor,
            price: orderData.price || 0,
            shipping_cost: orderData.shippingCost || 0,
            deposit_amount: orderData.depositAmount || 0,
            remaining_balance: orderData.remainingBalance || 0,
            use_date: orderData.useDate || null,
            is_asap: orderData.isAsap || false,
            status: orderData.status || 'deposit',
            shipping_address: orderData.shippingAddress || null,
            notes: orderData.notes || null,
            alphabet_decorations: orderData.alphabetDecorations || null
        };
    }

    /**
     * Convert DB snake_case to JS camelCase
     */
    fromDbFormat(row) {
        return {
            id: row.id,
            shippingDate: row.shipping_date,
            customerName: row.customer_name,
            platform: row.platform,
            flowerCount: row.flower_count,
            flowerColor: row.flower_color,
            price: row.price,
            shippingCost: row.shipping_cost,
            depositAmount: row.deposit_amount,
            remainingBalance: row.remaining_balance,
            useDate: row.use_date,
            isAsap: row.is_asap,
            status: row.status,
            shippingAddress: row.shipping_address,
            notes: row.notes,
            alphabetDecorations: row.alphabet_decorations,
            createdAt: row.created_at
        };
    }

    /**
     * Add a new order
     */
    async addOrder(orderData) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const dbData = {
            ...this.toDbFormat(orderData),
            user_id: user.id
        };

        const { data, error } = await this.supabase
            .from('orders')
            .insert([dbData])
            .select()
            .single();

        if (error) {
            console.error('Error adding order:', error);
            throw error;
        }

        return this.fromDbFormat(data);
    }

    /**
     * Get a single order by ID
     */
    async getOrder(id) {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error getting order:', error);
            return null;
        }

        return this.fromDbFormat(data);
    }

    /**
     * Get all orders for current user
     */
    async getAllOrders() {
        const user = this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('shipping_date', { ascending: true });

        if (error) {
            console.error('Error getting orders:', error);
            return [];
        }

        return data.map(row => this.fromDbFormat(row));
    }

    /**
     * Get orders for a specific month
     */
    async getOrdersByMonth(year, month) {
        const user = this.getCurrentUser();
        if (!user) return [];

        // Use local date formatting to avoid timezone issues
        const startDay = new Date(year, month, 1);
        const endDay = new Date(year, month + 1, 0);

        const startDate = `${startDay.getFullYear()}-${String(startDay.getMonth() + 1).padStart(2, '0')}-${String(startDay.getDate()).padStart(2, '0')}`;
        const endDate = `${endDay.getFullYear()}-${String(endDay.getMonth() + 1).padStart(2, '0')}-${String(endDay.getDate()).padStart(2, '0')}`;

        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .gte('shipping_date', startDate)
            .lte('shipping_date', endDate)
            .order('shipping_date', { ascending: true });

        if (error) {
            console.error('Error getting orders by month:', error);
            return [];
        }

        return data.map(row => this.fromDbFormat(row));
    }

    /**
     * Get orders within a date range
     */
    async getOrdersByDateRange(startDate, endDate) {
        const user = this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .gte('shipping_date', startDate)
            .lte('shipping_date', endDate)
            .order('shipping_date', { ascending: true });

        if (error) {
            console.error('Error getting orders by date range:', error);
            return [];
        }

        return data.map(row => this.fromDbFormat(row));
    }

    /**
     * Update an existing order
     */
    async updateOrder(id, orderData) {
        const dbData = this.toDbFormat(orderData);

        const { data, error } = await this.supabase
            .from('orders')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating order:', error);
            throw error;
        }

        return this.fromDbFormat(data);
    }

    /**
     * Delete an order
     */
    async deleteOrder(id) {
        const { error } = await this.supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting order:', error);
            throw error;
        }

        return true;
    }

    // ========================================
    // Alphabet Stock Methods
    // ========================================

    /**
     * Get all alphabet stock for current user
     */
    async getAlphabetStock() {
        const user = this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase
            .from('alphabet_stock')
            .select('*')
            .eq('user_id', user.id)
            .order('character', { ascending: true });

        if (error) {
            console.error('Error getting alphabet stock:', error);
            return [];
        }

        return data.map(row => ({
            id: row.id,
            character: row.character,
            quantity: row.quantity,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }

    /**
     * Add a new alphabet item
     */
    async addAlphabetItem(character, quantity = 0) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await this.supabase
            .from('alphabet_stock')
            .insert([{
                user_id: user.id,
                character: character,
                quantity: quantity
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding alphabet item:', error);
            throw error;
        }

        return {
            id: data.id,
            character: data.character,
            quantity: data.quantity
        };
    }

    /**
     * Update alphabet item quantity
     */
    async updateAlphabetQuantity(id, quantity) {
        const { data, error } = await this.supabase
            .from('alphabet_stock')
            .update({ quantity: quantity, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating alphabet quantity:', error);
            throw error;
        }

        return {
            id: data.id,
            character: data.character,
            quantity: data.quantity
        };
    }

    /**
     * Delete an alphabet item
     */
    async deleteAlphabetItem(id) {
        const { error } = await this.supabase
            .from('alphabet_stock')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting alphabet item:', error);
            throw error;
        }

        return true;
    }

    /**
     * Deduct alphabet stock when order is saved
     * @param {Array} alphabetsUsed - Array of {character, quantity} objects
     */
    async deductAlphabetStock(alphabetsUsed) {
        if (!alphabetsUsed || alphabetsUsed.length === 0) return;

        const user = this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        // Get current stock
        const stock = await this.getAlphabetStock();
        const stockMap = new Map(stock.map(s => [s.character, s]));

        for (const item of alphabetsUsed) {
            const stockItem = stockMap.get(item.character);
            if (stockItem) {
                const newQuantity = Math.max(0, stockItem.quantity - item.quantity);
                await this.updateAlphabetQuantity(stockItem.id, newQuantity);
            }
        }
    }

    /**
     * Restore alphabet stock when order is deleted or edited
     * @param {Array} alphabetsUsed - Array of {character, quantity} objects
     */
    async restoreAlphabetStock(alphabetsUsed) {
        if (!alphabetsUsed || alphabetsUsed.length === 0) return;

        const user = this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        // Get current stock
        const stock = await this.getAlphabetStock();
        const stockMap = new Map(stock.map(s => [s.character, s]));

        for (const item of alphabetsUsed) {
            const stockItem = stockMap.get(item.character);
            if (stockItem) {
                const newQuantity = stockItem.quantity + item.quantity;
                await this.updateAlphabetQuantity(stockItem.id, newQuantity);
            }
        }
    }
}

// Export singleton instance
const flowerDB = new FlowerDatabase();
