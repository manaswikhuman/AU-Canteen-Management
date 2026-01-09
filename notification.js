// Constants
const NOTIFICATION_STORAGE_KEY = 'canteenNotifications';
const MAX_NOTIFICATIONS = 100;
const TOAST_DURATION = 5000;
const ANIMATION_DURATION = 300;

// Notification state
let notifications = [];
let unreadCount = 0;

// Input validation
function validateNotification(title, message, type) {
    if (!title || typeof title !== 'string') {
        throw new Error('Invalid notification title');
    }
    if (!message || typeof message !== 'string') {
        throw new Error('Invalid notification message');
    }
    if (!['success', 'error', 'warning', 'info'].includes(type)) {
        throw new Error('Invalid notification type');
    }
}

// Add notification
function addNotification(title, message, type = 'info') {
    try {
        validateNotification(title, message, type);

        // Limit number of stored notifications
        if (notifications.length >= MAX_NOTIFICATIONS) {
            notifications.pop(); // Remove oldest notification
        }

        const notification = {
            id: Date.now(),
            title: title,
            message: message,
            type: type,
            time: new Date(),
            read: false
        };
        
        notifications.unshift(notification);
        unreadCount++;
        saveNotificationsToLocalStorage();
        updateNotificationBadge();
        updateNotificationList();
        
        // Show toast notification
        showToastNotification(title, message, type);
    } catch (error) {
        console.error('Error adding notification:', error);
        // Fallback to basic notification if validation fails
        showBasicNotification(message);
    }
}

// Show basic notification (fallback)
function showBasicNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), TOAST_DURATION);
}

// Show toast notification
function showToastNotification(title, message, type = 'success') {
    try {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        
        toast.innerHTML = `
            <div class="notification-toast-header">
                <i class="fas ${getIconForType(type)}" aria-hidden="true"></i>
                <span class="notification-toast-title">${escapeHtml(title)}</span>
                <button class="close-toast" aria-label="Close notification">×</button>
            </div>
            <div class="notification-toast-body">
                ${escapeHtml(message)}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Add close button handler
        const closeButton = toast.querySelector('.close-toast');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeToast(toast);
            });
        }
        
        // Auto remove after duration
        setTimeout(() => {
            if (document.body.contains(toast)) {
                closeToast(toast);
            }
        }, TOAST_DURATION);
    } catch (error) {
        console.error('Error showing toast notification:', error);
        showBasicNotification(message);
    }
}

// Close toast with animation
function closeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.remove();
        }
    }, ANIMATION_DURATION);
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Get icon for notification type
function getIconForType(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Update notification badge
function updateNotificationBadge() {
    try {
        const badge = document.getElementById('notification-count');
        if (badge) {
            badge.textContent = unreadCount.toString();
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
            badge.setAttribute('aria-label', `${unreadCount} unread notifications`);
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}

// Update notification list
function updateNotificationList() {
    try {
        const list = document.getElementById('notification-list');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="empty-notifications" role="status">
                    <i class="fas fa-bell-slash" aria-hidden="true"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        list.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
                 role="listitem"
                 data-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas ${getIconForType(notification.type)}" aria-hidden="true"></i>
                </div>
                <div class="notification-content">
                    <h4>${escapeHtml(notification.title)}</h4>
                    <p>${escapeHtml(notification.message)}</p>
                    <span class="notification-time">${formatTime(notification.time)}</span>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? `
                        <button class="mark-read" aria-label="Mark as read">
                            <i class="fas fa-check" aria-hidden="true"></i>
                        </button>
                    ` : ''}
                    <button class="delete-notification" aria-label="Delete notification">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        list.querySelectorAll('.notification-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            
            // Mark as read
            const markReadBtn = item.querySelector('.mark-read');
            if (markReadBtn) {
                markReadBtn.addEventListener('click', () => markAsRead(id));
            }
            
            // Delete notification
            const deleteBtn = item.querySelector('.delete-notification');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => deleteNotification(id));
            }
            
            // Show details
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-actions')) {
                    showNotificationDetails(id);
                }
            });
        });
    } catch (error) {
        console.error('Error updating notification list:', error);
    }
}

// Show notification details
function showNotificationDetails(id) {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    
    // Mark as read
    markAsRead(id);
    
    // Create details modal
    const modal = document.createElement('div');
    modal.className = 'notification-details-modal';
    modal.innerHTML = `
        <div class="notification-details-content">
            <div class="notification-details-header">
                <div class="notification-details-title">
                    <i class="fas ${getIconForType(notification.type)}"></i>
                    <h3>${notification.title}</h3>
                </div>
                <button class="close-details">×</button>
            </div>
            <div class="notification-details-body">
                <div class="notification-details-time">
                    <i class="fas fa-clock"></i>
                    <span>${formatTime(notification.time)}</span>
                </div>
                <div class="notification-details-message">
                    ${notification.message}
                </div>
            </div>
            <div class="notification-details-footer">
                <button class="btn-delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Show with animation
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-details');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    const deleteBtn = modal.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', () => {
        deleteNotification(id);
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });
}

// Mark notification as read
function markAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
        notification.read = true;
        unreadCount = Math.max(0, unreadCount - 1);
        saveNotificationsToLocalStorage();
        updateNotificationBadge();
        updateNotificationList();
    }
}

// Delete notification
function deleteNotification(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        if (!notifications[index].read) {
            unreadCount = Math.max(0, unreadCount - 1);
        }
        notifications.splice(index, 1);
        saveNotificationsToLocalStorage();
        updateNotificationBadge();
        updateNotificationList();
        
        // Show feedback
        showToastNotification('Notification Deleted', 'The notification has been removed', 'info');
    }
}

// Clear all notifications
function clearAllNotifications() {
    if (notifications.length === 0) {
        showToastNotification('No Notifications', 'There are no notifications to clear', 'info');
        return;
    }
    
    notifications = [];
    unreadCount = 0;
    saveNotificationsToLocalStorage();
    updateNotificationBadge();
    updateNotificationList();
    
    // Show feedback
    showToastNotification('Notifications Cleared', 'All notifications have been cleared', 'success');
    
    // Close the panel
    hideNotificationPanel();
}

// Format time for notifications
function formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
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
        return new Date(date).toLocaleDateString();
    }
}

// Save notifications to localStorage
function saveNotificationsToLocalStorage() {
    try {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
        showToastNotification('Error', 'Failed to save notifications', 'error');
    }
}

// Load notifications from localStorage
function loadNotificationsFromLocalStorage() {
    try {
        const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                notifications = parsed;
                unreadCount = notifications.filter(n => !n.read).length;
                updateNotificationBadge();
                updateNotificationList();
            }
        }
    } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
        notifications = [];
        unreadCount = 0;
    }
}

// Show notification panel
function showNotificationPanel() {
    const panel = document.getElementById('notification-dropdown');
    const overlay = document.querySelector('.overlay');
    
    if (!panel || !overlay) return;
    
    // Hide cart if open
    const cartSection = document.querySelector('.cart-section');
    if (cartSection && cartSection.classList.contains('active')) {
        hideCart();
    }
    
    panel.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Hide notification panel
function hideNotificationPanel() {
    const panel = document.getElementById('notification-dropdown');
    const overlay = document.querySelector('.overlay');
    
    if (!panel || !overlay) return;
    
    panel.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Toggle notification panel
function toggleNotificationPanel() {
    const panel = document.getElementById('notification-dropdown');
    
    if (!panel) return;
    
    if (panel.classList.contains('active')) {
        hideNotificationPanel();
    } else {
        showNotificationPanel();
    }
}

// Initialize notifications
function initializeNotifications() {
    loadNotificationsFromLocalStorage();
    updateNotificationBadge();
    updateNotificationList();
}

// Export functions for use in other files
window.notificationFunctions = {
    addNotification,
    showToastNotification,
    initializeNotifications
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeNotifications); 