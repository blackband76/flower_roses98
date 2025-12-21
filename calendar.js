/**
 * Calendar Component Module
 * Handles calendar rendering and navigation with month/week views
 */

class CalendarComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.currentYear = this.currentDate.getFullYear();
        this.currentMonth = this.currentDate.getMonth();
        this.currentWeekStart = this.getWeekStart(this.currentDate);
        this.viewMode = 'month'; // 'month' or 'week'
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
     * Get start of week (Sunday)
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Get end of week (Saturday)
     */
    getWeekEnd(date) {
        const d = new Date(this.getWeekStart(date));
        d.setDate(d.getDate() + 6);
        return d;
    }

    /**
     * Load orders for current view
     */
    async loadOrders() {
        if (this.viewMode === 'month') {
            this.orders = await flowerDB.getOrdersByMonth(this.currentYear, this.currentMonth);
        } else {
            const startDate = this.currentWeekStart.toISOString().split('T')[0];
            const endDate = this.getWeekEnd(this.currentWeekStart).toISOString().split('T')[0];
            this.orders = await flowerDB.getOrdersByDateRange(startDate, endDate);
        }
        this.renderDays();
    }

    /**
     * Switch view mode
     */
    async setViewMode(mode) {
        this.viewMode = mode;
        if (mode === 'week') {
            // Switch to current week
            this.currentWeekStart = this.getWeekStart(new Date());
            // Update year/month to match current week
            this.currentYear = this.currentWeekStart.getFullYear();
            this.currentMonth = this.currentWeekStart.getMonth();
        }
        this.render();
        await this.loadOrders();
    }

    /**
     * Navigate to previous period
     */
    async previous() {
        if (this.viewMode === 'month') {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
        } else {
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
            this.currentYear = this.currentWeekStart.getFullYear();
            this.currentMonth = this.currentWeekStart.getMonth();
        }
        this.render();
        await this.loadOrders();
    }

    /**
     * Navigate to next period
     */
    async next() {
        if (this.viewMode === 'month') {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
        } else {
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
            this.currentYear = this.currentWeekStart.getFullYear();
            this.currentMonth = this.currentWeekStart.getMonth();
        }
        this.render();
        await this.loadOrders();
    }

    // Keep backward compatible methods
    async previousMonth() { await this.previous(); }
    async nextMonth() { await this.next(); }

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
     * Get short month name
     */
    getShortMonthName(month) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
     * Format date string
     */
    formatDateStr(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    /**
     * Get header title based on view mode
     */
    getHeaderTitle() {
        if (this.viewMode === 'month') {
            return `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;
        } else {
            const weekEnd = this.getWeekEnd(this.currentWeekStart);
            const startMonth = this.getShortMonthName(this.currentWeekStart.getMonth());
            const endMonth = this.getShortMonthName(weekEnd.getMonth());
            const startDay = this.currentWeekStart.getDate();
            const endDay = weekEnd.getDate();

            if (startMonth === endMonth) {
                return `${startMonth} ${startDay} - ${endDay}, ${this.currentWeekStart.getFullYear()}`;
            } else {
                return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${weekEnd.getFullYear()}`;
            }
        }
    }

    /**
     * Render the calendar header
     */
    renderHeader() {
        return `
            <div class="calendar-header">
                <button class="nav-btn" id="prevPeriod">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <div class="calendar-header-center">
                    <h2 class="calendar-title">${this.getHeaderTitle()}</h2>
                    <div class="calendar-view-toggle">
                        <button class="view-btn ${this.viewMode === 'month' ? 'active' : ''}" data-view="month">Month</button>
                        <button class="view-btn ${this.viewMode === 'week' ? 'active' : ''}" data-view="week">Week</button>
                    </div>
                </div>
                <button class="nav-btn" id="nextPeriod">
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
     * Render calendar days for month view
     */
    renderMonthDays() {
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

            let ordersHTML = this.renderOrderBadges(dayOrders, 3);

            daysHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    <div class="day-orders">${ordersHTML}</div>
                </div>
            `;
        }

        return daysHTML;
    }

    /**
     * Render calendar days for week view
     */
    renderWeekDays() {
        const today = new Date();
        let daysHTML = '';

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(this.currentWeekStart);
            currentDay.setDate(this.currentWeekStart.getDate() + i);

            const dateStr = this.formatDateStr(currentDay);
            const dayOrders = this.getOrdersForDate(dateStr);
            const isToday = currentDay.toDateString() === today.toDateString();
            const dayNum = currentDay.getDate();
            const monthName = this.getShortMonthName(currentDay.getMonth());

            let ordersHTML = this.renderOrderBadges(dayOrders, 10); // Show more orders in week view

            daysHTML += `
                <div class="calendar-day week-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="week-day-header">
                        <span class="day-number">${dayNum}</span>
                        <span class="day-month">${monthName}</span>
                    </div>
                    <div class="day-orders">${ordersHTML}</div>
                </div>
            `;
        }

        return daysHTML;
    }

    /**
     * Render order badges (month view) or detailed cards (week view)
     */
    renderOrderBadges(orders, maxShow) {
        if (orders.length === 0) return '';

        let html;

        if (this.viewMode === 'week') {
            // Detailed cards for week view with tooltip
            html = orders.slice(0, maxShow).map(order => `
                <div class="order-card ${this.getStatusClass(order.status)}" data-order-id="${order.id}">
                    <div class="order-card-header">
                        <span class="order-customer">${this.truncate(order.customerName, 15)}</span>
                        <span class="order-status-icon">${this.getStatusIcon(order.status)}</span>
                    </div>
                    <div class="order-card-details">
                        <div class="order-detail">
                            <span class="detail-label">🌸</span>
                            <span>${order.flowerCount} ${this.truncate(order.flowerColor, 10)}</span>
                        </div>
                        <div class="order-detail">
                            <span class="detail-label">💰</span>
                            <span>฿${order.price.toLocaleString()}</span>
                        </div>
                        <div class="order-detail remaining ${order.remainingBalance <= 0 ? 'paid' : ''}">
                            <span class="detail-label">📋</span>
                            <span>${order.remainingBalance <= 0 ? 'Paid' : '฿' + (order.remainingBalance || order.price).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="order-tooltip">
                        <div class="tooltip-row"><strong>👤 Customer:</strong> ${order.customerName}</div>
                        <div class="tooltip-row"><strong>🌸 Flowers:</strong> ${order.flowerCount} ${order.flowerColor}</div>
                        <div class="tooltip-row"><strong>📅 Ship Date:</strong> ${order.shippingDate}</div>
                        <div class="tooltip-row"><strong>💰 Price:</strong> ฿${order.price.toLocaleString()}</div>
                        <div class="tooltip-row"><strong>💳 Deposit:</strong> ฿${(order.depositAmount || 0).toLocaleString()}</div>
                        <div class="tooltip-row"><strong>📋 Remaining:</strong> ${order.remainingBalance <= 0 ? '✓ Paid' : '฿' + (order.remainingBalance || order.price).toLocaleString()}</div>
                        <div class="tooltip-row"><strong>🚚 Shipping:</strong> ${order.shippingCost ? '฿' + order.shippingCost.toLocaleString() : '-'}</div>
                        <div class="tooltip-row"><strong>${this.getStatusIcon(order.status)} Status:</strong> ${this.getStatusLabel(order.status)}</div>
                        ${order.notes ? `<div class="tooltip-row"><strong>📝 Notes:</strong> ${order.notes}</div>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            // Enhanced badges for month view with tooltip on hover
            html = orders.slice(0, maxShow).map(order => `
                <div class="order-badge ${this.getStatusClass(order.status)}" data-order-id="${order.id}">
                    <div class="badge-row-1">
                        <span class="badge-name">${this.truncate(order.customerName, 8)}</span>
                        <span class="badge-flowers">🌸${order.flowerCount}</span>
                        <span class="badge-color">${this.truncate(order.flowerColor, 8)}</span>
                    </div>
                    <div class="badge-row-2">
                        <span class="badge-status">${this.getStatusIcon(order.status)}</span>
                        <span class="badge-notes">${order.notes ? this.truncate(order.notes, 15) : '-'}</span>
                    </div>
                    <div class="order-tooltip">
                        <div class="tooltip-row"><strong>👤 Customer:</strong> ${order.customerName}</div>
                        <div class="tooltip-row"><strong>🌸 Flowers:</strong> ${order.flowerCount} ${order.flowerColor}</div>
                        <div class="tooltip-row"><strong>📅 Ship Date:</strong> ${order.shippingDate}</div>
                        <div class="tooltip-row"><strong>💰 Price:</strong> ฿${order.price.toLocaleString()}</div>
                        <div class="tooltip-row"><strong>💳 Deposit:</strong> ฿${(order.depositAmount || 0).toLocaleString()}</div>
                        <div class="tooltip-row"><strong>📋 Remaining:</strong> ${order.remainingBalance <= 0 ? '✓ Paid' : '฿' + (order.remainingBalance || order.price).toLocaleString()}</div>
                        <div class="tooltip-row"><strong>🚚 Shipping:</strong> ${order.shippingCost ? '฿' + order.shippingCost.toLocaleString() : '-'}</div>
                        <div class="tooltip-row"><strong>${this.getStatusIcon(order.status)} Status:</strong> ${this.getStatusLabel(order.status)}</div>
                        ${order.notes ? `<div class="tooltip-row"><strong>📝 Notes:</strong> ${order.notes}</div>` : ''}
                    </div>
                </div>
            `).join('');
        }

        if (orders.length > maxShow) {
            const dateStr = orders[0].shippingDate;
            html += `<div class="more-orders" data-date="${dateStr}">+${orders.length - maxShow} more</div>`;
        }

        return html;
    }

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            'deposit': '💰',
            'ready_to_ship': '📦',
            'shipped': '✅'
        };
        return icons[status] || '';
    }

    /**
     * Get status label text
     */
    getStatusLabel(status) {
        const labels = {
            'deposit': 'Deposit Received',
            'ready_to_ship': 'Ready to Ship',
            'shipped': 'Shipped'
        };
        return labels[status] || status;
    }

    /**
     * Render calendar days
     */
    renderDays() {
        const daysContainer = this.container.querySelector('.calendar-days');
        if (!daysContainer) return;

        if (this.viewMode === 'month') {
            daysContainer.className = 'calendar-days';
            daysContainer.innerHTML = this.renderMonthDays();
        } else {
            daysContainer.className = 'calendar-days week-view';
            daysContainer.innerHTML = this.renderWeekDays();
        }

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
     * Format number in compact form (e.g., 1500 -> 1.5k)
     */
    formatCompactNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return num.toString();
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
        const prevBtn = this.container.querySelector('#prevPeriod');
        const nextBtn = this.container.querySelector('#nextPeriod');

        prevBtn.addEventListener('click', () => this.previous());
        nextBtn.addEventListener('click', () => this.next());

        // View toggle buttons
        const viewBtns = this.container.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view !== this.viewMode) {
                    this.setViewMode(view);
                }
            });
        });
    }

    /**
     * Attach day click listeners
     */
    attachDayListeners() {
        const days = this.container.querySelectorAll('.calendar-day:not(.empty)');
        days.forEach(day => {
            day.addEventListener('click', (e) => {
                // Check if clicking on "more orders" indicator
                const moreElement = e.target.closest('.more-orders');
                if (moreElement && this.viewMode === 'month') {
                    e.stopPropagation();
                    const date = moreElement.dataset.date;
                    this.goToWeekWithDate(date);
                    return;
                }

                // Check if clicking on an order badge or order card
                const orderElement = e.target.closest('.order-badge, .order-card');
                if (orderElement && this.onOrderClick) {
                    e.stopPropagation();
                    const orderId = orderElement.dataset.orderId;
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
     * Go to week view for a specific date
     */
    async goToWeekWithDate(dateStr) {
        const date = new Date(dateStr);
        this.currentWeekStart = this.getWeekStart(date);
        this.currentYear = this.currentWeekStart.getFullYear();
        this.currentMonth = this.currentWeekStart.getMonth();
        this.viewMode = 'week';
        this.render();
        await this.loadOrders();
    }

    /**
     * Refresh calendar data
     */
    async refresh() {
        await this.loadOrders();
    }
}
