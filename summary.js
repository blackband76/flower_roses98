/**
 * Summary Module
 * Handles revenue calculations and summary display
 */

class SummaryComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentView = 'month'; // 'week' or 'month'
        this.currentDate = new Date();
    }

    /**
     * Initialize the summary component
     */
    async init() {
        await this.render();
    }

    /**
     * Toggle between week and month view
     */
    async toggleView(view) {
        this.currentView = view;
        await this.render();
    }

    /**
     * Get week number of the year
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Get start and end of current week (Sunday to Saturday)
     */
    getWeekRange(date) {
        const current = new Date(date);
        const dayOfWeek = current.getDay();
        const start = new Date(current);
        start.setDate(current.getDate() - dayOfWeek);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    /**
     * Get start and end of current month
     */
    getMonthRange(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    /**
     * Calculate summary statistics
     */
    calculateStats(orders) {
        const stats = {
            totalOrders: orders.length,
            totalRevenue: 0,      // Total price from customers
            totalShipping: 0,     // Shipping cost (expense)
            netRevenue: 0,        // Revenue after shipping cost
            byStatus: {
                deposit: { count: 0, revenue: 0 },
                ready_to_ship: { count: 0, revenue: 0 },
                shipped: { count: 0, revenue: 0 }
            }
        };

        orders.forEach(order => {
            // Total revenue = sum of all prices
            stats.totalRevenue += order.price;

            // Only count shipping cost for shipped orders
            const shippingCost = order.status === 'shipped' ? order.shippingCost : 0;
            stats.totalShipping += shippingCost;

            // Net revenue = price - shipping cost (only for shipped)
            const netForOrder = order.price - shippingCost;
            stats.netRevenue += netForOrder;

            if (stats.byStatus[order.status]) {
                stats.byStatus[order.status].count++;
                stats.byStatus[order.status].revenue += netForOrder;
            }
        });

        return stats;
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format date range for display
     */
    formatDateRange(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const options = { month: 'short', day: 'numeric' };

        return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${endDate.getFullYear()}`;
    }

    /**
     * Get month name
     */
    getMonthName(date) {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    /**
     * Render the summary
     */
    async render() {
        let dateRange;
        let periodLabel;

        if (this.currentView === 'week') {
            dateRange = this.getWeekRange(this.currentDate);
            periodLabel = `Week ${this.getWeekNumber(this.currentDate)}: ${this.formatDateRange(dateRange.start, dateRange.end)}`;
        } else {
            dateRange = this.getMonthRange(this.currentDate);
            periodLabel = this.getMonthName(this.currentDate);
        }

        const orders = await flowerDB.getOrdersByDateRange(dateRange.start, dateRange.end);
        const stats = this.calculateStats(orders);

        this.container.innerHTML = `
            <div class="summary-header">
                <h3>Revenue Summary</h3>
                <div class="view-toggle">
                    <button class="toggle-btn ${this.currentView === 'week' ? 'active' : ''}" data-view="week">Weekly</button>
                    <button class="toggle-btn ${this.currentView === 'month' ? 'active' : ''}" data-view="month">Monthly</button>
                </div>
            </div>
            
            <div class="period-nav">
                <button class="period-nav-btn" id="summaryPrev">‹</button>
                <div class="period-label">${periodLabel}</div>
                <button class="period-nav-btn" id="summaryNext">›</button>
            </div>
            
            <div class="summary-stats">
                <div class="stat-card total">
                    <div class="stat-value">${this.formatCurrency(stats.netRevenue)}</div>
                    <div class="stat-label">Net Revenue</div>
                </div>
                <div class="stat-card orders">
                    <div class="stat-value">${stats.totalOrders}</div>
                    <div class="stat-label">Orders</div>
                </div>
            </div>

            <div class="summary-breakdown">
                <h4>Revenue Breakdown</h4>
                <div class="breakdown-row">
                    <span>Total Price</span>
                    <span>${this.formatCurrency(stats.totalRevenue)}</span>
                </div>
                <div class="breakdown-row" style="color: #c62828;">
                    <span>− Shipping Cost</span>
                    <span>-${this.formatCurrency(stats.totalShipping)}</span>
                </div>
                <div class="breakdown-row" style="font-weight: 700; border-top: 2px solid #e0e0e0; padding-top: 0.75rem;">
                    <span>Net Revenue</span>
                    <span>${this.formatCurrency(stats.netRevenue)}</span>
                </div>
            </div>

            <div class="summary-status">
                <h4>By Status</h4>
                <div class="status-row deposit">
                    <div class="status-info">
                        <span class="status-dot"></span>
                        <span>Deposit</span>
                    </div>
                    <div class="status-values">
                        <span class="count">${stats.byStatus.deposit.count} orders</span>
                        <span class="amount">${this.formatCurrency(stats.byStatus.deposit.revenue)}</span>
                    </div>
                </div>
                <div class="status-row ready">
                    <div class="status-info">
                        <span class="status-dot"></span>
                        <span>Ready to Ship</span>
                    </div>
                    <div class="status-values">
                        <span class="count">${stats.byStatus.ready_to_ship.count} orders</span>
                        <span class="amount">${this.formatCurrency(stats.byStatus.ready_to_ship.revenue)}</span>
                    </div>
                </div>
                <div class="status-row shipped">
                    <div class="status-info">
                        <span class="status-dot"></span>
                        <span>Shipped</span>
                    </div>
                    <div class="status-values">
                        <span class="count">${stats.byStatus.shipped.count} orders</span>
                        <span class="amount">${this.formatCurrency(stats.byStatus.shipped.revenue)}</span>
                    </div>
                </div>
            </div>
        `;

        this.attachListeners();
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        const toggleBtns = this.container.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.toggleView(view);
            });
        });

        // Navigation buttons
        const prevBtn = this.container.querySelector('#summaryPrev');
        const nextBtn = this.container.querySelector('#summaryNext');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPeriod());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPeriod());
        }
    }

    /**
     * Navigate to previous period
     */
    async previousPeriod() {
        if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        } else {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        }
        await this.render();
    }

    /**
     * Navigate to next period
     */
    async nextPeriod() {
        if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        } else {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        }
        await this.render();
    }

    /**
     * Refresh summary data
     */
    async refresh() {
        await this.render();
    }

    /**
     * Set current date (for syncing with calendar)
     */
    setDate(date) {
        this.currentDate = new Date(date);
    }
}
