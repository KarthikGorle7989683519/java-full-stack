// Global variables
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on and initialize accordingly
    const path = window.location.pathname.split('/').pop();
    
    if (path === 'index.html' || path === '') {
        initLoginPage();
    } else if (path === 'register.html') {
        initRegisterPage();
    } else if (path === 'user.html') {
        initUserPage();
    } else if (path === 'cart.html') {
        initCartPage();
    } else if (path === 'checkout.html') {
        initCheckoutPage();
    } else if (path === 'order-Confirmation.html') {
        initOrderConfirmationPage();
    } else if (path === 'admin.html') {
        initAdminPage();
    }
    
    // Update cart count in header if applicable
    updateCartCount();
});

// Initialize Login Page
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const loginId = document.getElementById('loginId').value;
            const password = document.getElementById('password').value;
            
            loginUser(loginId, password);
        });
    }
}

// Initialize Register Page
function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userData = {
                username: document.getElementById('newUsername').value,
                email: document.getElementById('email').value,
                phoneNum: document.getElementById('phone').value,
                password: document.getElementById('newPassword').value,
                role: 'USER'
            };
            
            registerUser(userData);
        });
    }
}

// Initialize User Page
function initUserPage() {
    // Check if user is logged in
    checkAuth();
    
    // Load products
    loadAllProducts();
    
    // Display username
    const usernameElement = document.getElementById('username');
    if (usernameElement && currentUser) {
        usernameElement.textContent = currentUser.username || 'User';
    }
}

// Initialize Cart Page
function initCartPage() {
    checkAuth();
    renderCartItems();
    updateCartSummary();
}

// Initialize Checkout Page
function initCheckoutPage() {
    checkAuth();
    renderOrderSummary();
    setupPaymentMethodToggle();
    setupCheckoutForm();
}

// Initialize Order Confirmation Page
function initOrderConfirmationPage() {
    checkAuth();
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    if (orderId) {
        loadOrderConfirmation(orderId);
    } else {
        // Redirect if no order ID
        window.location.href = 'user.html';
    }
}

// Initialize Admin Page
function initAdminPage() {
    checkAdminAuth();
    
    // Set up product form
    const addForm = document.getElementById('addForm');
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProductFormSubmit();
        });
    }
    
    // Load initial data
    loadProducts();
    showTab('products');
    loadOrders();
    
    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showTab(tabId);
        });
    });
}

// Authentication Functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
        return;
    }
    
    // Set current user (simplified - in a real app you might fetch user details)
    currentUser = {
        id: userId,
        username: localStorage.getItem('username') || 'User',
        role: localStorage.getItem('role') || 'USER'
    };
}

function checkAdminAuth() {
    checkAuth();
    if (currentUser.role !== 'ADMIN') {
        window.location.href = 'user.html';
    }
}

function loginUser(loginId, password) {
    fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            email: loginId,  // Make sure this matches your backend expectation
            password: password 
        }),
        credentials: 'include'  // Important for cookies/sessions if you use them
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('role', data.role);
        
        // Redirect based on role
        if (data.role === 'ADMIN') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'user.html';
        }
    })
    .catch(error => {
        showNotification('Login failed: ' + error.message, 'error');
        console.error('Login error:', error);
    });
}

function registerUser(userData) {
    fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        showNotification('Registration successful! Please login.', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    })
    .catch(error => {
        showNotification('Registration failed: ' + error.message, 'error');
        console.error('Registration error:', error);
    });
}

function logout() {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    
    // Redirect to login
    window.location.href = 'index.html';
}

// Product Functions
function loadAllProducts() {
    fetch('http://localhost:8080/api/products')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load products');
            return response.json();
        })
        .then(data => {
            products = data;
            renderProducts(data);
            document.getElementById('productCount').textContent = `${data.length} products available`;
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showNotification('Failed to load products', 'error');
        });
}

function renderProducts(products) {
    const container = document.getElementById('productCards');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col';
        productCard.innerHTML = `
            <div class="card h-100">
                <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description || 'No description available'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-primary fw-bold">₹${product.cost.toFixed(2)}</span>
                        <div class="rating">
                            ${renderRatingStars(product.rating)}
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-outline-primary w-100" onclick="addToCart(${product.id})">
                        <i class="bi bi-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
}

function renderRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="bi bi-star-fill text-warning"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="bi bi-star-half text-warning"></i>';
        } else {
            stars += '<i class="bi bi-star text-warning"></i>';
        }
    }
    
    return stars;
}

function searchProducts() {
    const searchInput = document.getElementById('searchInput') || document.getElementById('productSearch');
    const searchTerm = searchInput.value.toLowerCase();
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.description.toLowerCase().includes(searchTerm)
    );
    
    if (document.getElementById('productCards')) {
        renderProducts(filteredProducts);
    } else if (document.getElementById('productList')) {
        renderAdminProducts(filteredProducts);
    }
}

// Cart Functions
async function addToCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('You must be logged in to add items to the cart', false);
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Product not found');

        const product = await response.json();

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            if (existingItem.quantity < product.quantity) {
                existingItem.quantity++;
            } else {
                showNotification('No more stock available for this product', false);
                return;
            }
        } else {
            if (product.quantity > 0) {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.cost,
                    imageUrl: product.imageUrl,
                    quantity: 1
                });
            } else {
                showNotification('This product is out of stock', false);
                return;
            }
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`${product.name} added to cart`, true);

    } catch (error) {
        console.error('Add to cart error:', error);
        showNotification('Failed to add to cart: ' + error.message, false);
    }
}


function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartItems();
    updateCartSummary();
    updateCartCount();
}

function updateCartItemQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = item.quantity + delta;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > product.quantity) {
        showNotification('Not enough stock available', 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    saveCart();
    renderCartItems();
    updateCartSummary();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        document.getElementById('checkoutBtn').disabled = true;
        return;
    }
    
    container.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.imageUrl || 'https://via.placeholder.com/80'}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h5>${item.name}</h5>
                <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                <i class="bi bi-trash"></i>
            </button>
        `;
        container.appendChild(cartItem);
    });
    
    document.getElementById('checkoutBtn').disabled = false;
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 1000 ? 0 : 50;
    const total = subtotal + shipping;
    
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('shipping').textContent = shipping.toFixed(2);
    document.getElementById('totalCost').textContent = total.toFixed(2);
}

function updateCartCount() {
    const countElements = document.querySelectorAll('#cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    countElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'block' : 'none';
    });
}

// Checkout Functions
function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'warning');
        return;
    }
    
    window.location.href = 'checkout.html';
}

function renderOrderSummary() {
    const container = document.getElementById('orderSummary');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty</p>';
        return;
    }
    
    let html = '<div class="order-items">';
    
    cart.forEach(item => {
        html += `
            <div class="order-item">
                <div class="order-item-image">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/60'}" alt="${item.name}">
                </div>
                <div class="order-item-details">
                    <h5>${item.name}</h5>
                    <div>₹${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="order-item-total">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 1000 ? 0 : 50;
    const total = subtotal + shipping;
    
    html += `</div>
        <div class="order-totals">
            <div class="order-total-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="order-total-row">
                <span>Shipping:</span>
                <span>₹${shipping.toFixed(2)}</span>
            </div>
            <div class="order-total-row grand-total">
                <span>Total:</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
        </div>
        <!-- Hidden elements for JS logic -->
     <div style="display: none;">
      <span id="subtotal">${subtotal.toFixed(2)}</span>
      <span id="shipping">${shipping.toFixed(2)}</span>
      <span id="totalCost">${total.toFixed(2)}</span>
    </div>
    `;
    
    container.innerHTML = html;
}

function setupPaymentMethodToggle() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            // Hide all payment details
            document.querySelectorAll('.payment-details').forEach(details => {
                details.style.display = 'none';
            });
            
            // Show selected payment details
            const detailsId = this.id + 'Details';
            const detailsElement = document.getElementById(detailsId);
            if (detailsElement) {
                detailsElement.style.display = 'block';
            }
        });
    });
}

function setupCheckoutForm() {
    const form = document.getElementById('shippingForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const orderData = {
            items: cart,
            subtotal: parseFloat(document.getElementById('subtotal').textContent),
            shipping: parseFloat(document.getElementById('shipping').textContent),
            total: parseFloat(document.getElementById('totalCost').textContent),
            status: 'Pending',
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            shippingInfo: {
                name: document.getElementById('fullName').value,
                phoneNum: document.getElementById('phoneNumber').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value,
                country: document.getElementById('country').value
            }
        };
        
        placeOrder(orderData);
    });
}

// In setupCheckoutForm function
function setupCheckoutForm() {
  const form = document.getElementById('shippingForm');
  if (!form) {
    console.log("Form not found!");
    return;
  }
  console.log("Form found. Setting up submit listener.");
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
     console.log("Form submitted");
     const paymentInput = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentInput) {
      alert("Please select a payment method");
      return;
    }
    const orderData = {
      items: cart,
       subtotal: parseFloat(document.getElementById('subtotal').textContent.replace(/[^\d.]/g, '')) || 0,
      total: parseFloat(document.getElementById('totalCost').textContent.replace(/[^\d.]/g, '')) || 0,
      paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
      shippingInfo: {
        name: document.getElementById('fullName').value,
        phoneNum: document.getElementById('phoneNumber').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zipCode: document.getElementById('zipCode').value,
        country: document.getElementById('country').value
      }
    };
    console.log("Order Data: ", orderData);
    
    placeOrder(orderData);
  });
}

// In placeOrder function
function placeOrder(orderData) {
    const token = localStorage.getItem('token');
    
    // Transform cart items to match backend structure
    const items = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity
    }));

    const transformedOrderData = {
        items: items,
        paymentMethod: orderData.paymentMethod,
        shippingInfo: orderData.shippingInfo
    };

    fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transformedOrderData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(order => {
        // Clear cart and redirect
        cart = [];
        saveCart();
        updateCartCount();
        window.location.href = `order-Confirmation.html?orderId=${order.orderId}`;
    })
    .catch(error => {
        showNotification('Order failed: ' + error.message, 'error');
        console.error('Order error:', error);
    });
}

// Order Confirmation Functions
function loadOrderConfirmation(orderId) {
    fetch(`http://localhost:8080/api/orders/${orderId}/confirmation`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load order');
        return response.json();
    })
    .then(order => {
        renderOrderConfirmation(order);
    })
    .catch(error => {
        console.error('Error loading order:', error);
        showNotification('Failed to load order details', 'error');
        window.location.href = 'user.html';
    });
}

function renderOrderConfirmation(order) {
    document.getElementById('orderId').textContent = order.id;
    
    // Render order items
    const itemsContainer = document.getElementById('orderItems');
    let itemsHtml = '';
    
    order.items.forEach(item => {
        itemsHtml += `
            <div class="order-item">
                <div class="order-item-image">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/60'}" alt="${item.name}">
                </div>
                <div class="order-item-details">
                    <h5>${item.name}</h5>
                    <div>₹${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="order-item-total">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });
    
    itemsContainer.innerHTML = itemsHtml;
    
    // Render totals
    document.getElementById('orderSubtotal').textContent = order.subtotal.toFixed(2);
    document.getElementById('orderShipping').textContent = order.shipping.toFixed(2);
    document.getElementById('orderTotal').textContent = order.total.toFixed(2);
    
    // Render shipping info
    const shippingContainer = document.getElementById('shippingDetails');
    if (order.shippingInfo) {
        shippingContainer.innerHTML = `
            <p><strong>Name:</strong> ${order.shippingInfo.name}</p>
            <p><strong>Phone:</strong> ${order.shippingInfo.phoneNum}</p>
            <p><strong>Address:</strong> ${order.shippingInfo.address}</p>
            <p><strong>City:</strong> ${order.shippingInfo.city}</p>
            <p><strong>State:</strong> ${order.shippingInfo.state}</p>
            <p><strong>ZIP:</strong> ${order.shippingInfo.zipCode}</p>
            <p><strong>Country:</strong> ${order.shippingInfo.country}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        `;
    }
}

// Admin Functions
function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Show selected tab content
    const tabContent = document.getElementById(`${tabId}Tab`);
    if (tabContent) {
        tabContent.style.display = 'block';
    }
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function loadProducts() {
    fetch('http://localhost:8080/api/products')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load products');
            return response.json();
        })
        .then(data => {
            renderAdminProducts(data);
            showNotification('Products loaded successfully', 'success');
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showNotification('Failed to load products', 'error');
        });
}

function renderAdminProducts(products) {
    const container = document.getElementById('productList');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.name}">
            </div>
            <div class="product-details">
                <h4>${product.name}</h4>
                <p>${product.description || 'No description'}</p>
                <div class="product-meta">
                    <span>₹${product.cost.toFixed(2)}</span>
                    <span>${product.rating}★</span>
                    <span>Qty: ${product.quantity}</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
                <button class="btn btn-sm btn-warning" onclick="editProduct(${product.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
            </div>
        `;
        container.appendChild(productCard);
    });
}

function handleProductFormSubmit() {
    const formTitle = document.getElementById('formTitle');
    const productId = formTitle ? formTitle.getAttribute('data-product-id') : null;
    
    const productData = {
        name: document.getElementById('name').value,
        imageUrl: document.getElementById('imageUrl').value,
        description: document.getElementById('description').value,
        cost: parseFloat(document.getElementById('cost').value),
        rating: parseFloat(document.getElementById('rating').value),
        quantity: parseInt(document.getElementById('quantity').value || 0) // Default to 0 if null
    };
    
    if (productId) {
        updateProduct(productId, productData);
    } else {
        addProduct(productData);
    }
}

function addProduct(productData) {
    fetch('http://localhost:8080/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to add product');
        return response.json();
    })
    .then(() => {
        showNotification('Product added successfully', 'success');
        resetProductForm();
        loadProducts();
    })
    .catch(error => {
        showNotification('Failed to add product: ' + error.message, 'error');
        console.error('Add product error:', error);
    });
}

function editProduct(productId) {
    fetch(`http://localhost:8080/api/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch product');
        return response.json();
    })
        .then(product => {
            document.getElementById('name').value = product.name;
            document.getElementById('imageUrl').value = product.imageUrl;
            document.getElementById('description').value = product.description;
            document.getElementById('cost').value = product.cost;
            document.getElementById('rating').value = product.rating;
            document.getElementById('quantity').value = product.quantity;
            
            document.getElementById('formTitle').textContent = 'Edit Product';
            document.getElementById('formTitle').setAttribute('data-product-id', productId);
            document.getElementById('submitBtn').innerHTML = '<i class="bi bi-save"></i> Update Product';
            
            // Scroll to form
            document.querySelector('.admin-form-container').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            showNotification('Failed to fetch product: ' + error.message, 'error');
            console.error('Edit product error:', error);
        });
}

function updateProduct(productId, productData) {
    fetch(`http://localhost:8080/api/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update product');
        return response.json();
    })
    .then(() => {
        showNotification('Product updated successfully', 'success');
        resetProductForm();
        loadProducts();
    })
    .catch(error => {
        showNotification('Failed to update product: ' + error.message, 'error');
        console.error('Update product error:', error);
    });
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    fetch(`http://localhost:8080/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to delete product');
        return response.text();
    })
    .then(() => {
        showNotification('Product deleted successfully', 'success');
        loadProducts();
    })
    .catch(error => {
        showNotification('Failed to delete product: ' + error.message, 'error');
        console.error('Delete product error:', error);
    });
}

function resetProductForm() {
    document.getElementById('addForm').reset();
    document.getElementById('formTitle').textContent = 'Add New Product';
    document.getElementById('formTitle').removeAttribute('data-product-id');
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle"></i> Add Product';
}

function loadOrders() {
    fetch('http://localhost:8080/api/orders/admin', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load orders');
        return response.json();
    })
    .then(orders => {
        renderOrders(orders);
        showNotification('Orders loaded successfully', 'success');
    })
    .catch(error => {
        console.error('Error loading orders:', error);
        showNotification('Failed to load orders', 'error');
    });
}

function renderOrders(orders) {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td>${order.shippingInfo?.name || 'N/A'}</td>
            <td>${order.items.length} items</td>
            <td>₹${order.total.toFixed(2)}</td>
            <td>
                <select class="form-select status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>${order.shippingInfo?.address?.substring(0, 20) || 'N/A'}...</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewOrderDetails(${order.id})">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
        container.appendChild(row);
    });
}

function updateOrderStatus(orderId, newStatus) {
    fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update status');
        return response.json();
    })
    .then(() => {
        showNotification('Order status updated', 'success');
    })
    .catch(error => {
        showNotification('Failed to update status: ' + error.message, 'error');
        console.error('Status update error:', error);
    });
}

function viewOrderDetails(orderId) {
    // In a real app, you might show a modal with detailed order info
    alert(`Viewing details for order #${orderId}`);
}

function searchOrders() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#ordersContainer tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}