/**
 * Calendar Component Module
 * Handles calendar rendering and navigation
 */

class CalendarComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.currentYear = this.currentDate.getFullYear();
        this.currentMonth = this.currentDate.getMonth();
        this.orders = [];
        this.onDateClick = null;
        this.onOrderClick = null;
    }

    /**
     * Initialize the calendar
     */
    async init() {
        this.render();
        await this.loadOrders();
    }

    /**
     * Load orders for current month
     */
    async loadOrders() {
        this.orders = await flowerDB.getOrdersByMonth(this.currentYear, this.currentMonth);
        this.renderDays();
    }

    /**
     * Navigate to previous month
     */
    async previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
        await this.loadOrders();
    }

    /**
     * Navigate to next month
     */
    async nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
        await this.loadOrders();
    }

    /**
     * Get month name
     */
    getMonthName(month) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month];
    }

    /**
     * Get number of days in month
     */
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    /**
     * Get first day of month (0 = Sunday)
     */
    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }

    /**
     * Get orders for a specific date
     */
    getOrdersForDate(dateStr) {
        return this.orders.filter(order => order.shippingDate === dateStr);
    }

    /**
     * Get status badge class
     */
    getStatusClass(status) {
        const classes = {
            'deposit': 'status-deposit',
            'ready_to_ship': 'status-ready',
            'shipped': 'status-shipped'
        };
        return classes[status] || '';
    }

    /**
     * Render the calendar header
     */
    renderHeader() {
        return `
            <div class="calendar-header">
                <button class="nav-btn" id="prevMonth">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <h2 class="calendar-title">${this.getMonthName(this.currentMonth)} ${this.currentYear}</h2>
                <button class="nav-btn" id="nextMonth">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        `;
    }

    /**
     * Render weekday headers
     */
    renderWeekdays() {
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `
            <div class="calendar-weekdays">
                ${weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
            </div>
        `;
    }

    /**
     * Render calendar days
     */
    renderDays() {
        const daysContainer = this.container.querySelector('.calendar-days');
        if (!daysContainer) return;

        const daysInMonth = this.getDaysInMonth(this.currentYear, this.currentMonth);
        const firstDay = this.getFirstDayOfMonth(this.currentYear, this.currentMonth);
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth;

        let daysHTML = '';

        // Empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            daysHTML += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOrders = this.getOrdersForDate(dateStr);
            const isToday = isCurrentMonth && today.getDate() === day;

            let ordersHTML = '';
            if (dayOrders.length > 0) {
                ordersHTML = dayOrders.slice(0, 3).map(order => `
                    <div class="order-badge ${this.getStatusClass(order.status)}" data-order-id="${order.id}">
                        <span class="order-customer">${this.truncate(order.customerName, 12)}</span>
                    </div>
                `).join('');

                if (dayOrders.length > 3) {
                    ordersHTML += `<div class="more-orders">+${dayOrders.length - 3} more</div>`;
                }
            }

            daysHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    <div class="day-orders">${ordersHTML}</div>
                </div>
            `;
        }

        daysContainer.innerHTML = daysHTML;
        this.attachDayListeners();
    }

    /**
     * Truncate text to max length
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength - 1) + '…';
    }

    /**
     * Main render function
     */
    render() {
        this.container.innerHTML = `
            ${this.renderHeader()}
            ${this.renderWeekdays()}
            <div class="calendar-days"></div>
        `;
        this.attachNavListeners();
        this.renderDays();
    }

    /**
     * Attach navigation button listeners
     */
    attachNavListeners() {
        const prevBtn = this.container.querySelector('#prevMonth');
        const nextBtn = this.container.querySelector('#nextMonth');

        prevBtn.addEventListener('click', () => this.previousMonth());
        nextBtn.addEventListener('click', () => this.nextMonth());
    }

    /**
     * Attach day click listeners
     */
    attachDayListeners() {
        const days = this.container.querySelectorAll('.calendar-day:not(.empty)');
        days.forEach(day => {
            day.addEventListener('click', (e) => {
                // Check if clicking on an order badge
                const orderBadge = e.target.closest('.order-badge');
                if (orderBadge && this.onOrderClick) {
                    e.stopPropagation();
                    const orderId = orderBadge.dataset.orderId;
                    this.onOrderClick(orderId);
                    return;
                }

                // Otherwise, trigger new order
                if (this.onDateClick) {
                    const date = day.dataset.date;
                    this.onDateClick(date);
                }
            });
        });
    }

    /**
     * Refresh calendar data
     */
    async refresh() {
        await this.loadOrders();
    }
}
