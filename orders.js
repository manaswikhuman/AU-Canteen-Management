// Constants
const ORDERS_STORAGE_KEY = 'canteenOrders';
const MAX_ORDERS = 1000;
const TOKEN_PREFIX = 'T';

// Order state
let orders = [];

// Input validation
function validateOrder(itemName, itemPrice, quantity) {
    if (!itemName || typeof itemName !== 'string') {
        throw new Error('Invalid item name');
    }
    if (!itemPrice || typeof itemPrice !== 'number' || itemPrice <= 0) {
        throw new Error('Invalid item price');
    }
    if (!quantity || typeof quantity !== 'number' || quantity <= 0 || quantity > 99) {
        throw new Error('Invalid quantity');
    }
}

// Generate unique token number
function generateTokenNumber() {
    try {
        const date = new Date();
        const timestamp = date.getTime().toString().slice(-4);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${TOKEN_PREFIX}${timestamp}${random}`;
    } catch (error) {
        console.error('Error generating token number:', error);
        // Fallback to timestamp-based token
        return `${TOKEN_PREFIX}${Date.now().toString().slice(-7)}`;
    }
}

// Place order for a single item
function placeOrder(itemName, itemPrice, quantity = 1) {
    try {
        validateOrder(itemName, itemPrice, quantity);

        // Limit number of stored orders
        if (orders.length >= MAX_ORDERS) {
            orders = orders.slice(-MAX_ORDERS + 1); // Keep only the most recent orders
        }

        const order = {
            id: Date.now(),
            tokenNumber: generateTokenNumber(),
            item: itemName,
            price: itemPrice,
            quantity: quantity,
            status: 'pending',
            timestamp: new Date()
        };

        orders.push(order);
        saveOrdersToLocalStorage();
        
        // Add notification about order
        window.notificationFunctions?.addNotification(
            'Order Placed Successfully!', 
            `Your order for ${quantity}x ${itemName} has been placed. Token: ${order.tokenNumber}`,
            'success'
        );

        return order;
    } catch (error) {
        console.error('Error placing order:', error);
        window.notificationFunctions?.showToastNotification(
            'Error',
            error.message || 'Failed to place order',
            'error'
        );
        return null;
    }
}

// Place order for all items in cart
function placeCartOrder() {
    try {
        if (!window.cartFunctions?.cart || window.cartFunctions.cart.length === 0) {
            throw new Error('Your cart is empty');
        }

        const tokenNumber = generateTokenNumber();
        const timestamp = new Date();
        const cartItems = window.cartFunctions.cart;

        // Create an order for each cart item
        cartItems.forEach(item => {
            validateOrder(item.name, item.price, item.quantity);

            const order = {
                id: Date.now() + Math.random(),
                tokenNumber: tokenNumber, // Same token for all items in cart
                item: item.name,
                price: item.price,
                quantity: item.quantity,
                status: 'pending',
                timestamp: timestamp
            };
            orders.push(order);
        });

        // Limit number of stored orders
        if (orders.length > MAX_ORDERS) {
            orders = orders.slice(-MAX_ORDERS);
        }

        // Save orders
        saveOrdersToLocalStorage();

        // Add notification
        window.notificationFunctions?.addNotification(
            'Cart Order Placed Successfully!',
            `Your order has been placed. Token: ${tokenNumber}`,
            'success'
        );

        // Clear cart
        window.cartFunctions?.cart = [];
        window.cartFunctions?.updateCartDisplay();
        window.cartFunctions?.saveCartToLocalStorage();
        window.cartFunctions?.hideCart();

        return tokenNumber;
    } catch (error) {
        console.error('Error placing cart order:', error);
        window.notificationFunctions?.showToastNotification(
            'Error',
            error.message || 'Failed to place cart order',
            'error'
        );
        return null;
    }
}

// Save orders to localStorage
function saveOrdersToLocalStorage() {
    try {
        if (!Array.isArray(orders)) {
            throw new Error('Invalid orders state');
        }
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
        console.error('Error saving orders to localStorage:', error);
        window.notificationFunctions?.showToastNotification(
            'Error',
            'Failed to save orders',
            'error'
        );
    }
}

// Load orders from localStorage
function loadOrdersFromLocalStorage() {
    try {
        const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (savedOrders) {
            const parsedOrders = JSON.parse(savedOrders);
            if (Array.isArray(parsedOrders)) {
                orders = parsedOrders.map(order => ({
                    ...order,
                    timestamp: new Date(order.timestamp)
                }));
            } else {
                throw new Error('Invalid orders data format');
            }
        }
    } catch (error) {
        console.error('Error loading orders from localStorage:', error);
        orders = []; // Reset to empty array on error
        window.notificationFunctions?.showToastNotification(
            'Error',
            'Failed to load orders',
            'error'
        );
    }
}

// Get order by token number
function getOrderByToken(tokenNumber) {
    try {
        if (!tokenNumber || typeof tokenNumber !== 'string') {
            throw new Error('Invalid token number');
        }
        return orders.filter(order => order.tokenNumber === tokenNumber);
    } catch (error) {
        console.error('Error getting order by token:', error);
        return [];
    }
}

// Update order status
function updateOrderStatus(tokenNumber, newStatus) {
    try {
        if (!['pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(newStatus)) {
            throw new Error('Invalid order status');
        }

        const orderItems = getOrderByToken(tokenNumber);
        if (orderItems.length === 0) {
            throw new Error('Order not found');
        }

        orderItems.forEach(order => {
            order.status = newStatus;
        });

        saveOrdersToLocalStorage();
        return true;
    } catch (error) {
        console.error('Error updating order status:', error);
        window.notificationFunctions?.showToastNotification(
            'Error',
            error.message || 'Failed to update order status',
            'error'
        );
        return false;
    }
}

// Initialize orders
function initializeOrders() {
    loadOrdersFromLocalStorage();
}

// Export functions for use in other files
window.orderFunctions = {
    placeOrder,
    placeCartOrder,
    getOrderByToken,
    updateOrderStatus,
    initializeOrders
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOrders); 