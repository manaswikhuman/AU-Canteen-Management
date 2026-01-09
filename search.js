// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchableItems = [];

    // Collect all searchable items from the page
    function collectSearchableItems() {
        const items = [];

        // Add canteen options
        document.querySelectorAll('.canteen-option').forEach(option => {
            items.push({
                type: 'canteen',
                name: option.querySelector('h3').textContent,
                description: option.querySelector('.canteen-description').textContent,
                element: option,
                id: option.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || ''
            });
        });

        // Add menu items from both canteens
        document.querySelectorAll('.menu-item').forEach(item => {
            const menuSection = item.closest('.menu-section');
            const canteenType = menuSection ? 
                (menuSection.id.includes('common') ? 'Common Canteen' : 'Parking Canteen') : '';
            const itemNumber = item.querySelector('.item-number')?.textContent || '';
            
            items.push({
                type: 'menu-item',
                name: item.querySelector('h4').textContent,
                description: item.querySelector('.item-description')?.textContent || '',
                price: item.querySelector('.price').textContent,
                canteen: canteenType,
                itemNumber: itemNumber,
                element: item
            });
        });

        // Add notifications if available
        if (window.notifications) {
            window.notifications.forEach(notification => {
                items.push({
                    type: 'notification',
                    name: notification.title,
                    description: notification.message,
                    time: notification.time,
                    read: notification.read,
                    id: notification.id
                });
            });
        }

        // Add orders if available
        if (window.orders) {
            window.orders.forEach(order => {
                items.push({
                    type: 'order',
                    name: `Order #${order.tokenNumber}`,
                    description: `${order.item} - Quantity: ${order.quantity}`,
                    price: order.price,
                    status: order.status,
                    time: order.timestamp,
                    id: order.id
                });
            });
        }

        return items;
    }

    // Highlight matching text
    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Format time for display
    function formatTime(date) {
        const now = new Date();
        const time = new Date(date);
        const diff = now - time;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) {
            return minutes === 0 ? 'Just now' : `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return time.toLocaleDateString();
        }
    }

    // Show search results
    function showSearchResults(query) {
        if (!query) {
            searchResults.classList.remove('active');
            return;
        }

        const results = searchableItems.filter(item => {
            const searchText = `${item.name} ${item.description} ${item.itemNumber || ''} ${item.price || ''} ${item.canteen || ''} ${item.status || ''}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        if (results.length > 0) {
            const groupedResults = {
                canteen: results.filter(item => item.type === 'canteen'),
                'menu-item': results.filter(item => item.type === 'menu-item'),
                notification: results.filter(item => item.type === 'notification'),
                order: results.filter(item => item.type === 'order')
            };

            let html = '';

            // Add canteen results
            if (groupedResults.canteen.length > 0) {
                html += '<div class="search-category">Canteens</div>';
                html += groupedResults.canteen.map(item => `
                    <div class="search-result-item" data-type="canteen" data-id="${item.id}">
                        <div class="search-result-icon">
                            <i class="fas fa-store"></i>
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-title">${highlightText(item.name, query)}</div>
                            <div class="search-result-description">${highlightText(item.description, query)}</div>
                        </div>
                    </div>
                `).join('');
            }

            // Add menu item results
            if (groupedResults['menu-item'].length > 0) {
                html += '<div class="search-category">Menu Items</div>';
                html += groupedResults['menu-item'].map(item => `
                    <div class="search-result-item" data-type="menu-item" data-canteen="${item.canteen}">
                        <div class="search-result-icon">
                            <i class="fas fa-utensils"></i>
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-title">
                                ${highlightText(item.name, query)}
                                ${item.itemNumber ? `<span class="item-number">${highlightText(item.itemNumber, query)}</span>` : ''}
                            </div>
                            ${item.description ? `<div class="search-result-description">${highlightText(item.description, query)}</div>` : ''}
                            <div class="search-result-meta">
                                <span class="search-result-price">${item.price}</span>
                                <span class="search-result-canteen">${item.canteen}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            // Add notification results
            if (groupedResults.notification.length > 0) {
                html += '<div class="search-category">Notifications</div>';
                html += groupedResults.notification.map(item => `
                    <div class="search-result-item ${!item.read ? 'unread' : ''}" data-type="notification" data-id="${item.id}">
                        <div class="search-result-icon">
                            <i class="fas fa-bell"></i>
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-title">${highlightText(item.name, query)}</div>
                            <div class="search-result-description">${highlightText(item.description, query)}</div>
                            <div class="search-result-meta">
                                <span class="search-result-time">${formatTime(item.time)}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            // Add order results
            if (groupedResults.order.length > 0) {
                html += '<div class="search-category">Orders</div>';
                html += groupedResults.order.map(item => `
                    <div class="search-result-item" data-type="order" data-id="${item.id}">
                        <div class="search-result-icon">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-title">${highlightText(item.name, query)}</div>
                            <div class="search-result-description">${highlightText(item.description, query)}</div>
                            <div class="search-result-meta">
                                <span class="search-result-price">${item.price}</span>
                                <span class="search-result-status ${item.status}">${item.status}</span>
                                <span class="search-result-time">${formatTime(item.time)}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            searchResults.innerHTML = html;
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = `
                <div class="search-result-item empty">
                    <div class="search-result-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">No results found</div>
                        <div class="search-result-description">Try different keywords or check spelling</div>
                    </div>
                </div>
            `;
            searchResults.classList.add('active');
        }
    }

    // Navigate to result
    function navigateToResult(resultItem) {
        const type = resultItem.dataset.type;
        const id = resultItem.dataset.id;
        
        switch (type) {
            case 'canteen':
                showMenu(id);
                break;
            
            case 'menu-item':
                const canteenName = resultItem.dataset.canteen;
                const canteenId = canteenName.toLowerCase().includes('common') ? 'common' : 'parking';
                showMenu(canteenId);
                
                setTimeout(() => {
                    const menuItem = Array.from(document.querySelectorAll('.menu-item')).find(item => 
                        item.querySelector('h4').textContent === resultItem.querySelector('.search-result-title').textContent.trim()
                    );
                    
                    if (menuItem) {
                        menuItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        menuItem.classList.add('highlight-item');
                        setTimeout(() => menuItem.classList.remove('highlight-item'), 2000);
                    }
                }, 300);
                break;
            
            case 'notification':
                // Show notification panel and scroll to notification
                const notificationPanel = document.getElementById('notification-dropdown');
                if (notificationPanel) {
                    notificationPanel.classList.add('active');
                    document.querySelector('.overlay').classList.add('active');
                    
                    setTimeout(() => {
                        const notification = document.querySelector(`.notification-item[data-id="${id}"]`);
                        if (notification) {
                            notification.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            notification.classList.add('highlight-item');
                            setTimeout(() => notification.classList.remove('highlight-item'), 2000);
                        }
                    }, 300);
                }
                break;
            
            case 'order':
                // Show order details (you can implement this based on your order system)
                if (typeof showOrderDetails === 'function') {
                    showOrderDetails(id);
                }
                break;
        }

        // Clear search
        searchInput.value = '';
        searchResults.classList.remove('active');
    }

    // Initialize search functionality
    if (searchInput && searchResults) {
        // Collect searchable items
        searchableItems = collectSearchableItems();

        // Add input handler
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            showSearchResults(query);
        });

        // Add click handler for results
        searchResults.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item');
            if (resultItem && !resultItem.classList.contains('empty')) {
                navigateToResult(resultItem);
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.remove('active');
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchResults.classList.remove('active');
                searchInput.blur();
            }
        });

        // Focus search on / key
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                searchInput.focus();
            }
        });

        // Update searchable items when notifications or orders change
        window.addEventListener('notificationsUpdated', () => {
            searchableItems = collectSearchableItems();
        });

        window.addEventListener('ordersUpdated', () => {
            searchableItems = collectSearchableItems();
        });
    }
}); 