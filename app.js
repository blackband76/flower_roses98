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

        // Check authentication
        const user = flowerDB.checkAuth();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Display username
        document.getElementById('userEmail').textContent = user.username;

        // Setup user dropdown
        const userDropdown = document.getElementById('userDropdown');
        const dropdownTrigger = document.getElementById('userDropdownTrigger');

        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.remove('open');
        });

        // Setup logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            flowerDB.logout();
        });

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
        const originalPrevious = calendar.previous.bind(calendar);
        const originalNext = calendar.next.bind(calendar);
        const originalSetViewMode = calendar.setViewMode.bind(calendar);

        calendar.previous = async () => {
            await originalPrevious();
            summary.setDate(new Date(calendar.currentYear, calendar.currentMonth, 1));
            await summary.refresh();
        };

        calendar.next = async () => {
            await originalNext();
            summary.setDate(new Date(calendar.currentYear, calendar.currentMonth, 1));
            await summary.refresh();
        };

        calendar.setViewMode = async (mode) => {
            await originalSetViewMode(mode);
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
                <p><a href="login.html">Go to Login</a></p>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Version checker for update notifications
 */
const APP_VERSION_KEY = 'flower_app_version';
const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds

async function checkForUpdates() {
    try {
        // Add cache-busting query param
        const response = await fetch(`version.json?t=${Date.now()}`);
        if (!response.ok) return;

        const data = await response.json();
        const currentVersion = localStorage.getItem(APP_VERSION_KEY);

        if (!currentVersion) {
            // First time - save version
            localStorage.setItem(APP_VERSION_KEY, data.version);
        } else if (currentVersion !== data.version) {
            // New version available - show modal with changes
            document.getElementById('updateChanges').textContent = data.changes || 'Bug fixes and improvements';
            document.getElementById('updateModal').classList.add('show');
        }
    } catch (error) {
        console.log('Version check failed:', error);
    }
}

// Sync version on page load (after refresh, save new version)
async function syncVersion() {
    try {
        const response = await fetch(`version.json?t=${Date.now()}`);
        if (!response.ok) return;
        const data = await response.json();
        localStorage.setItem(APP_VERSION_KEY, data.version);
    } catch (error) {
        console.log('Version sync failed:', error);
    }
}

// Sync version immediately on page load
syncVersion();

// Check for updates periodically (starts after 60 seconds)
setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);
