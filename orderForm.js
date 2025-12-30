/**
 * Order Form Module
 * Handles order creation and editing modal
 */

class OrderForm {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.form = this.modal.querySelector('#orderForm');
        this.currentOrderId = null;
        this.onSave = null;
        this.onDelete = null;
        this.alphabetStock = [];
        this.selectedAlphabets = []; // Store selected alphabets as array
        this.originalAlphabets = null; // Store original alphabets when editing
    }

    /**
     * Initialize form event listeners
     */
    init() {
        // Close button
        this.modal.querySelector('.close-btn').addEventListener('click', () => this.close());

        // Cancel button
        this.modal.querySelector('#cancelBtn').addEventListener('click', () => this.close());

        // Delete button
        this.modal.querySelector('#deleteBtn').addEventListener('click', () => this.handleDelete());

        // Form submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });

        // Calculate remaining balance on input change
        const priceInputs = ['#price', '#shippingCost', '#depositAmount'];
        priceInputs.forEach(selector => {
            this.form.querySelector(selector).addEventListener('input', () => this.updateRemainingBalance());
        });

        // ASAP checkbox - disable/enable use date field
        const asapCheckbox = this.form.querySelector('#asapCheckbox');
        const useDateInput = this.form.querySelector('#useDate');
        asapCheckbox.addEventListener('change', () => {
            useDateInput.disabled = asapCheckbox.checked;
            if (asapCheckbox.checked) {
                useDateInput.value = '';
            }
        });

        // Auto-add alphabet when dropdown changes
        document.getElementById('alphabetSelect').addEventListener('change', () => this.addSelectedAlphabet());
    }

    /**
     * Load alphabet stock from database
     */
    async loadAlphabetStock() {
        this.alphabetStock = await flowerDB.getAlphabetStock();
        this.updateAlphabetDropdown();
    }

    /**
     * Update the alphabet dropdown options
     */
    updateAlphabetDropdown() {
        const select = document.getElementById('alphabetSelect');

        // Calculate available stock considering already selected items
        const selectedMap = new Map();
        this.selectedAlphabets.forEach(item => {
            selectedMap.set(item.character, (selectedMap.get(item.character) || 0) + item.quantity);
        });

        const options = this.alphabetStock
            .map(s => {
                const used = selectedMap.get(s.character) || 0;
                const available = s.quantity - used;
                if (available <= 0) return null;
                return `<option value="${this.escapeHtml(s.character)}">${this.escapeHtml(s.character)} (${available})</option>`;
            })
            .filter(Boolean)
            .join('');

        select.innerHTML = `<option value="">Select...</option>${options}`;
    }

    /**
     * Add selected alphabet from dropdown
     */
    addSelectedAlphabet() {
        const select = document.getElementById('alphabetSelect');
        const qtyInput = document.getElementById('alphabetQty');

        const character = select.value;
        const quantity = parseInt(qtyInput.value) || 1;

        if (!character) {
            return;
        }

        // Check if there's enough stock
        const stockItem = this.alphabetStock.find(s => s.character === character);
        const alreadySelected = this.selectedAlphabets
            .filter(s => s.character === character)
            .reduce((sum, s) => sum + s.quantity, 0);

        if (stockItem && (alreadySelected + quantity) > stockItem.quantity) {
            alert(`Not enough stock for "${character}". Available: ${stockItem.quantity - alreadySelected}`);
            return;
        }

        // Check if already exists, if so add to quantity
        const existing = this.selectedAlphabets.find(s => s.character === character);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.selectedAlphabets.push({ character, quantity });
        }

        // Reset inputs
        select.value = '';
        qtyInput.value = '1';

        // Re-render
        this.renderAlphabetTags();
        this.updateAlphabetDropdown();
    }

    /**
     * Remove alphabet from selection
     */
    removeAlphabet(index) {
        this.selectedAlphabets.splice(index, 1);
        this.renderAlphabetTags();
        this.updateAlphabetDropdown();
    }

    /**
     * Render alphabet tags
     */
    renderAlphabetTags() {
        const container = document.getElementById('alphabetDecorations');

        if (this.selectedAlphabets.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.selectedAlphabets.map((item, index) => `
            <span class="alphabet-tag">
                <span class="tag-char">${this.escapeHtml(item.character)}</span>
                <span class="tag-qty">×${item.quantity}</span>
                <button type="button" class="tag-remove" data-index="${index}">×</button>
            </span>
        `).join('');

        // Add remove handlers
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.removeAlphabet(parseInt(btn.dataset.index));
            });
        });
    }

    /**
     * Get selected alphabets
     */
    getSelectedAlphabets() {
        return this.selectedAlphabets.length > 0 ? [...this.selectedAlphabets] : null;
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
     * Update remaining balance display
     */
    updateRemainingBalance() {
        const price = parseFloat(this.form.querySelector('#price').value) || 0;
        const deposit = parseFloat(this.form.querySelector('#depositAmount').value) || 0;

        // Remaining = Total Price - Deposit (shipping is a cost, not part of customer payment)
        const remaining = price - deposit;

        const remainingEl = document.getElementById('remainingBalance');
        remainingEl.textContent = `฿${remaining.toLocaleString('th-TH')}`;

        // Add visual indicator when fully paid (only when price > 0)
        if (price > 0 && remaining <= 0) {
            remainingEl.classList.add('paid');
            remainingEl.textContent = remaining === 0 ? '✓ Paid' : `฿${remaining.toLocaleString('th-TH')} (Overpaid)`;
        } else {
            remainingEl.classList.remove('paid');
        }
    }

    /**
     * Open modal for new order
     */
    async openNew(date) {
        this.currentOrderId = null;
        this.originalAlphabets = null;
        this.selectedAlphabets = [];
        this.form.reset();
        this.form.querySelector('#shippingDate').value = date;
        this.form.querySelector('#useDate').value = '';
        this.form.querySelector('#useDate').disabled = false;
        this.form.querySelector('#asapCheckbox').checked = false;
        this.form.querySelector('#depositAmount').value = '';
        this.modal.querySelector('.modal-title').textContent = 'New Order';
        this.modal.querySelector('#deleteBtn').style.display = 'none';
        this.updateRemainingBalance();

        // Load alphabet stock and render UI
        await this.loadAlphabetStock();
        this.renderAlphabetTags();
        document.getElementById('alphabetQty').value = '1';

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.form.querySelector('#customerName').focus();
    }

    /**
     * Open modal for editing existing order
     */
    async openEdit(orderId) {
        this.currentOrderId = orderId;
        const order = await flowerDB.getOrder(orderId);

        if (!order) {
            alert('Order not found');
            return;
        }

        this.form.querySelector('#shippingDate').value = order.shippingDate;
        this.form.querySelector('#customerName').value = order.customerName;
        this.form.querySelector('#platform').value = order.platform || '';
        this.form.querySelector('#flowerCount').value = order.flowerCount;
        this.form.querySelector('#flowerColor').value = order.flowerColor;
        this.form.querySelector('#price').value = order.price;
        this.form.querySelector('#shippingCost').value = order.shippingCost || '';
        this.form.querySelector('#depositAmount').value = order.depositAmount || '';
        this.form.querySelector('#status').value = order.status;
        this.form.querySelector('#shippingAddress').value = order.shippingAddress || '';
        this.form.querySelector('#notes').value = order.notes || '';

        // Handle useDate and ASAP
        this.form.querySelector('#useDate').value = order.useDate || '';
        this.form.querySelector('#asapCheckbox').checked = order.isAsap || false;
        this.form.querySelector('#useDate').disabled = order.isAsap || false;

        // Store original alphabets for stock restoration
        this.originalAlphabets = order.alphabetDecorations ? JSON.parse(JSON.stringify(order.alphabetDecorations)) : null;
        this.selectedAlphabets = order.alphabetDecorations ? [...order.alphabetDecorations] : [];

        // Load alphabet stock and render
        await this.loadAlphabetStock();
        this.renderAlphabetTags();
        document.getElementById('alphabetQty').value = '1';

        this.updateRemainingBalance();
        this.modal.querySelector('.modal-title').textContent = 'Edit Order';
        this.modal.querySelector('#deleteBtn').style.display = 'block';
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.form.reset();
        this.currentOrderId = null;
        this.originalAlphabets = null;
        this.selectedAlphabets = [];
        document.getElementById('alphabetDecorations').innerHTML = '';
    }

    /**
     * Get form data
     */
    getFormData() {
        const price = parseFloat(this.form.querySelector('#price').value) || 0;
        const shippingCost = parseFloat(this.form.querySelector('#shippingCost').value) || 0;
        const depositAmount = parseFloat(this.form.querySelector('#depositAmount').value) || 0;

        return {
            shippingDate: this.form.querySelector('#shippingDate').value,
            customerName: this.form.querySelector('#customerName').value,
            platform: this.form.querySelector('#platform').value || null,
            flowerCount: parseInt(this.form.querySelector('#flowerCount').value, 10),
            flowerColor: this.form.querySelector('#flowerColor').value,
            price: price,
            shippingCost: shippingCost,
            depositAmount: depositAmount,
            remainingBalance: price - depositAmount,
            useDate: this.form.querySelector('#useDate').value || null,
            isAsap: this.form.querySelector('#asapCheckbox').checked,
            status: this.form.querySelector('#status').value,
            shippingAddress: this.form.querySelector('#shippingAddress').value || null,
            notes: this.form.querySelector('#notes').value,
            alphabetDecorations: this.getSelectedAlphabets()
        };
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();

        const formData = this.getFormData();

        // Validate shipping cost is required when status is shipped (0 is allowed)
        if (formData.status === 'shipped' && (formData.shippingCost === undefined || formData.shippingCost === null || formData.shippingCost < 0)) {
            alert('Shipping cost is required when status is "Shipped" (0 is allowed for free shipping)');
            this.form.querySelector('#shippingCost').focus();
            return;
        }

        try {
            if (this.currentOrderId) {
                // Restore original alphabets first, then deduct new ones
                if (this.originalAlphabets) {
                    await flowerDB.restoreAlphabetStock(this.originalAlphabets);
                }
                await flowerDB.updateOrder(this.currentOrderId, formData);
            } else {
                await flowerDB.addOrder(formData);
            }

            // Deduct new alphabet stock
            if (formData.alphabetDecorations) {
                await flowerDB.deductAlphabetStock(formData.alphabetDecorations);
            }

            this.close();

            if (this.onSave) {
                this.onSave();
            }
        } catch (error) {
            console.error('Error saving order:', error);
            alert('Failed to save order. Please try again.');
        }
    }

    /**
     * Handle order deletion
     */
    async handleDelete() {
        if (!this.currentOrderId) return;

        const confirmed = confirm('Are you sure you want to delete this order?');
        if (!confirmed) return;

        try {
            // Restore alphabet stock before deleting
            if (this.originalAlphabets) {
                await flowerDB.restoreAlphabetStock(this.originalAlphabets);
            }

            await flowerDB.deleteOrder(this.currentOrderId);
            this.close();

            if (this.onDelete) {
                this.onDelete();
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order. Please try again.');
        }
    }
}
