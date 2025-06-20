// Cart utility functions
const CART_STORAGE_KEY = "edughana_cart";

// Get cart from localStorage
export function getCart() {
  const cart = localStorage.getItem(CART_STORAGE_KEY);
  return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
export function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Add item to cart
export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingItemIndex = cart.findIndex((item) => item.id === product.id);

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    cart[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cart.push({
      id: product.id,
      name: product.name,
      price:
        product.salePrice && product.salePrice < product.price
          ? product.salePrice
          : product.price,
      image: product.featuredImage,
      quantity: quantity,
    });
  }

  saveCart(cart);
  updateCartBadge();
  return cart;
}

// Remove item from cart
export function removeFromCart(productId) {
  const cart = getCart();
  const updatedCart = cart.filter((item) => item.id !== productId);
  saveCart(updatedCart);
  updateCartBadge();
  return updatedCart;
}

// Update item quantity
export function updateCartItemQuantity(productId, quantity) {
  const cart = getCart();
  const itemIndex = cart.findIndex((item) => item.id === productId);

  if (itemIndex > -1) {
    if (quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = quantity;
    }
    saveCart(cart);
    updateCartBadge();
  }

  return cart;
}

// Get cart total items
export function getCartTotalItems() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

// Get cart total price
export function getCartTotalPrice() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Update cart badge
export function updateCartBadge() {
  const cartBadge = document.getElementById("cartTotal");
  if (cartBadge) {
    cartBadge.textContent = getCartTotalItems();
  }
}

// Show toast message
export function showToast(message, type = "success") {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  // Remove toast after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}
