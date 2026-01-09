// JavaScript extracted from index.html

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(item) {
  const existingItem = cart.find(i => i.name === item.name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({...item, quantity: 1});
  }
  saveCart();
  showNotification(`${item.name} added to cart`);
  renderCart();
}

function removeFromCart(itemName) {
  cart = cart.filter(i => i.name !== itemName);
  saveCart();
  renderCart();
}

function renderCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  cartItemsContainer.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.name} x ${item.quantity}</span>
      <button onclick="removeFromCart('${item.name}')">Remove</button>
    `;
    cartItemsContainer.appendChild(div);
  });
  document.getElementById('cartCount').textContent = cart.length;
}

function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 2000);
}

// Order functionality
function placeOrder() {
  if (cart.length === 0) {
    showNotification('Cart is empty!');
    return;
  }
  const orderDetails = cart.map(item => `${item.name} x ${item.quantity}`).join(', ');
  alert(`Order placed: ${orderDetails}`);
  cart = [];
  saveCart();
  renderCart();
}

// Search functionality
function searchMenu() {
  const input = document.getElementById('searchInput').value.toLowerCase();
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    const name = item.querySelector('span').textContent.toLowerCase();
    if (name.includes(input)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Canteen selection functionality
function selectCanteen() {
  const canteen = document.getElementById('canteenSelect').value;
  const menuSections = document.querySelectorAll('.menu-section');
  menuSections.forEach(section => {
    if (section.id === canteen) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
}

// Modal functionality
function openModal() {
  document.getElementById('orderModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('orderModal').style.display = 'none';
}

// Initialize
document.getElementById('canteenSelect').addEventListener('change', selectCanteen);
document.getElementById('searchInput').addEventListener('input', searchMenu);
document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
document.getElementById('closeModal').addEventListener('click', closeModal);
window.addEventListener('click', function(event) {
  const modal = document.getElementById('orderModal');
  if (event.target === modal) {
    closeModal();
  }
});

// Initial render
selectCanteen();
renderCart();
