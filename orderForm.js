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
    openNew(date) {
        this.currentOrderId = null;
        this.form.reset();
        this.form.querySelector('#shippingDate').value = date;
        this.form.querySelector('#depositAmount').value = 0;
        this.modal.querySelector('.modal-title').textContent = 'New Order';
        this.modal.querySelector('#deleteBtn').style.display = 'none';
        this.updateRemainingBalance();
        this.modal.classList.add('active');
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
        this.form.querySelector('#flowerCount').value = order.flowerCount;
        this.form.querySelector('#flowerColor').value = order.flowerColor;
        this.form.querySelector('#price').value = order.price;
        this.form.querySelector('#shippingCost').value = order.shippingCost;
        this.form.querySelector('#depositAmount').value = order.depositAmount || 0;
        this.form.querySelector('#status').value = order.status;
        this.form.querySelector('#notes').value = order.notes || '';

        this.updateRemainingBalance();
        this.modal.querySelector('.modal-title').textContent = 'Edit Order';
        this.modal.querySelector('#deleteBtn').style.display = 'block';
        this.modal.classList.add('active');
    }

    /**
     * Close modal
     */
    close() {
        this.modal.classList.remove('active');
        this.form.reset();
        this.currentOrderId = null;
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
            flowerCount: parseInt(this.form.querySelector('#flowerCount').value, 10),
            flowerColor: this.form.querySelector('#flowerColor').value,
            price: price,
            shippingCost: shippingCost,
            depositAmount: depositAmount,
            remainingBalance: price - depositAmount,
            status: this.form.querySelector('#status').value,
            notes: this.form.querySelector('#notes').value
        };
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();

        const formData = this.getFormData();

        // Validate shipping cost is required when status is shipped
        if (formData.status === 'shipped' && (!formData.shippingCost || formData.shippingCost <= 0)) {
            alert('Shipping cost is required when status is "Shipped"');
            this.form.querySelector('#shippingCost').focus();
            return;
        }

        try {
            if (this.currentOrderId) {
                await flowerDB.updateOrder(this.currentOrderId, formData);
            } else {
                await flowerDB.addOrder(formData);
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
