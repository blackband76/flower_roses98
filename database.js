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
     * Convert JS camelCase to DB snake_case
     */
    toDbFormat(orderData) {
        return {
            shipping_date: orderData.shippingDate,
            customer_name: orderData.customerName,
            flower_count: orderData.flowerCount,
            flower_color: orderData.flowerColor,
            price: orderData.price || 0,
            shipping_cost: orderData.shippingCost || 0,
            deposit_amount: orderData.depositAmount || 0,
            remaining_balance: orderData.remainingBalance || 0,
            use_date: orderData.useDate || null,
            is_asap: orderData.isAsap || false,
            status: orderData.status || 'deposit',
            notes: orderData.notes || null
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
            flowerCount: row.flower_count,
            flowerColor: row.flower_color,
            price: row.price,
            shippingCost: row.shipping_cost,
            depositAmount: row.deposit_amount,
            remainingBalance: row.remaining_balance,
            useDate: row.use_date,
            isAsap: row.is_asap,
            status: row.status,
            notes: row.notes,
            createdAt: row.created_at
        };
    }

    /**
     * Add a new order
     */
    async addOrder(orderData) {
        const dbData = this.toDbFormat(orderData);

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
     * Get all orders
     */
    async getAllOrders() {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
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
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
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
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
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
}

// Export singleton instance
const flowerDB = new FlowerDatabase();
