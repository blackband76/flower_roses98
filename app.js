/**
 * Main Application Entry Point
 * Initializes and connects all components
 */

// Component instances
let calendar;
let orderForm;
let summary;

/**
 * Initialize the application
 */
async function initApp() {
    try {
        // Initialize database
        await flowerDB.init();
        console.log('Database initialized');

        // Initialize calendar
        calendar = new CalendarComponent('calendar');
        calendar.onDateClick = (date) => {
            orderForm.openNew(date);
        };
        calendar.onOrderClick = (orderId) => {
            orderForm.openEdit(orderId);
        };
        await calendar.init();
        console.log('Calendar initialized');

        // Initialize order form
        orderForm = new OrderForm('orderModal');
        orderForm.onSave = async () => {
            await calendar.refresh();
            await summary.refresh();
        };
        orderForm.onDelete = async () => {
            await calendar.refresh();
            await summary.refresh();
        };
        orderForm.init();
        console.log('Order form initialized');

        // Initialize summary
        summary = new SummaryComponent('summary');
        await summary.init();
        console.log('Summary initialized');

        // Sync summary with calendar navigation
        const originalPrevMonth = calendar.previousMonth.bind(calendar);
        const originalNextMonth = calendar.nextMonth.bind(calendar);

        calendar.previousMonth = async () => {
            await originalPrevMonth();
            summary.setDate(new Date(calendar.currentYear, calendar.currentMonth, 1));
            await summary.refresh();
        };

        calendar.nextMonth = async () => {
            await originalNextMonth();
            summary.setDate(new Date(calendar.currentYear, calendar.currentMonth, 1));
            await summary.refresh();
        };

        console.log('🌸 Flower Calendar App initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2>Error Loading Application</h2>
                <p>${error.message}</p>
                <p>Please ensure your browser supports IndexedDB.</p>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
