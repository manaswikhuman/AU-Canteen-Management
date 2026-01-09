// Cart state management
let cart = [];

// Constants
const CART_STORAGE_KEY = 'canteenCart';
const MAX_QUANTITY = 99;
const MIN_QUANTITY = 1;

// Input validation
function validateCartItem(itemName, itemPrice) {
    if (!itemName || typeof itemName !== 'string') {
        throw new Error('Invalid item name');
    }
    if (!itemPrice || typeof itemPrice !== 'number' || itemPrice <= 0) {
        throw new Error('Invalid item price');
    }
}

// Load cart from localStorage on page load
function loadCartFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            // Validate parsed cart data
            if (Array.isArray(parsedCart)) {
                cart = parsedCart;
                updateCartDisplay();
            } else {
                throw new Error('Invalid cart data format');
            }
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        showNotification('Failed to load cart data. Starting with empty cart.', 'error');
        cart = []; // Reset to empty cart on error
    }
}

// Save cart to localStorage
function saveCartToLocalStorage() {
    try {
        if (!Array.isArray(cart)) {
            throw new Error('Invalid cart state');
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
        showNotification('Failed to save cart data', 'error');
    }
}

// Add item to cart
function addToCart(itemName, itemPrice) {
    try {
        validateCartItem(itemName, itemPrice);

        // Check if item already exists in cart
        const existingItem = cart.find(item => item.name === itemName);

        if (existingItem) {
            // If item exists, increment quantity if below max
            if (existingItem.quantity < MAX_QUANTITY) {
                existingItem.quantity += 1;
                showNotification(`${itemName} quantity updated in cart`, 'success');
            } else {
                showNotification(`Maximum quantity (${MAX_QUANTITY}) reached for ${itemName}`, 'warning');
            }
        } else {
            // If item doesn't exist, add new item with quantity 1
            cart.push({
                name: itemName,
                price: itemPrice,
                quantity: 1
            });
            showNotification(`${itemName} added to cart`, 'success');
        }

        updateCartDisplay();
        saveCartToLocalStorage();
        showCart(); // Show cart when item is added
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification(error.message || 'Failed to add item to cart', 'error');
    }
}

// Update quantity of item in cart
function updateQuantity(index, change) {
    try {
        if (index < 0 || index >= cart.length) {
            throw new Error('Invalid item index');
        }

        const newQuantity = cart[index].quantity + change;
        
        if (newQuantity > MAX_QUANTITY) {
            showNotification(`Maximum quantity (${MAX_QUANTITY}) reached`, 'warning');
            return;
        }

        if (newQuantity >= MIN_QUANTITY) {
            cart[index].quantity = newQuantity;
            updateCartDisplay();
            saveCartToLocalStorage();
            showNotification('Cart quantity updated', 'success');
        } else {
            removeFromCart(index);
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification(error.message || 'Failed to update quantity', 'error');
    }
}

// Remove item from cart
function removeFromCart(index) {
    try {
        if (index < 0 || index >= cart.length) {
            throw new Error('Invalid item index');
        }

        const removedItem = cart[index];
        cart.splice(index, 1);
        updateCartDisplay();
        saveCartToLocalStorage();
        showNotification(`${removedItem.name} removed from cart`, 'success');
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification(error.message || 'Failed to remove item from cart', 'error');
    }
}

// Update cart display
function updateCartDisplay() {
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    const cartBadge = document.getElementById('cart-count');

    if (!cartContainer || !totalElement) {
        console.warn('Cart display elements not found');
        return;
    }

    try {
        // Update cart badge
        if (cartBadge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
        }

        // Clear existing cart items
        cartContainer.innerHTML = '';

        // Calculate total
        let total = 0;

        // Add each item to the display
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    <div class="cart-item-details">
                        <span class="price">₹${item.price.toFixed(2)}</span>
                        <div class="quantity-controls">
                            <button onclick="updateQuantity(${index}, -1)" class="quantity-btn">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button onclick="updateQuantity(${index}, 1)" class="quantity-btn">+</button>
                        </div>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" class="remove-item">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartContainer.appendChild(itemElement);
        });

        // Update total
        totalElement.textContent = `₹${total.toFixed(2)}`;

        // Show/hide empty cart message
        const emptyCartMessage = document.getElementById('empty-cart-message');
        if (emptyCartMessage) {
            emptyCartMessage.style.display = cart.length === 0 ? 'block' : 'none';
        }

    } catch (error) {
        console.error('Error updating cart display:', error);
        showNotification('Failed to update cart display', 'error');
    }
}

// Show cart
function showCart() {
    const cartSection = document.querySelector('.cart-section');
    if (cartSection) {
        cartSection.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Hide cart
function hideCart() {
    const cartSection = document.querySelector('.cart-section');
    if (cartSection) {
        cartSection.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize cart
function initializeCart() {
    loadCartFromLocalStorage();
    updateCartDisplay();
}

// Export functions for use in other files
window.cartFunctions = {
    addToCart,
    updateQuantity,
    removeFromCart,
    showCart,
    hideCart,
    initializeCart
};

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCart); 