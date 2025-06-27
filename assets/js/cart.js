// Cart functions for localStorage management and UI updates
const CART_STORAGE_KEY = "edugh_cart";

// Get cart from localStorage
export function getCart() {
  const cart = localStorage.getItem(CART_STORAGE_KEY);
  return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
export function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartUI();
}

// Add product to cart
export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      quantity: quantity,
      featuredImage: product.featuredImage,
    });
  }

  saveCart(cart);
  showToast(`${product.name} added to cart successfully!`);
  return cart;
}

// Remove product from cart
export function removeFromCart(productId) {
  const cart = getCart();
  const updatedCart = cart.filter((item) => item.id !== productId);
  saveCart(updatedCart);
  return updatedCart;
}

// Update product quantity in cart
export function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((item) => item.id === productId);

  if (item) {
    item.quantity = Math.max(1, quantity); // Ensure quantity is at least 1
    saveCart(cart);
  }

  return cart;
}

// Clear entire cart
export function clearCart() {
  const cart = [];
  saveCart(cart);
  updateCartUI();
  // Also update the summary on cart/checkout page if present
  if (document.querySelector(".order-totals")) {
    // This is a bit of a workaround, ideally the checkout page would listen for cart changes
    window.location.reload();
  }
}

// Calculate cart total
export function calculateCartTotal(cart = getCart()) {
  return cart.reduce((total, item) => {
    const price =
      item.salePrice && item.salePrice < item.price
        ? item.salePrice
        : item.price;
    return total + price * item.quantity;
  }, 0);
}

// Format price with GHS currency
export function formatPrice(price) {
  return `GHS ${price.toFixed(2)}`;
}

// Show toast notification
export function showToast(message) {
  // You can customize this based on your UI library
  if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
    const toastHTML = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto">Cart Update</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">${message}</div>
                </div>
            </div>`;

    if (!document.querySelector(".toast-container")) {
      document.body.insertAdjacentHTML("beforeend", toastHTML);
    }

    const toastElement = document.querySelector(".toast");
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
  } else {
    alert(message); // Fallback if bootstrap is not available
  }
}

// Update cart UI
export function updateCartUI() {
  const cart = getCart();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = calculateCartTotal(cart);

  // Update cart count in header/navbar if it exists
  const cartCountElement = document.querySelector(".cart-count");
  if (cartCountElement) {
    cartCountElement.textContent = cartCount;
  }

  // Update cart badge if it exists
  const cartBadge = document.getElementById("cartTotal");
  if (cartBadge) {
    // Animate badge if value changes
    if (cartBadge.textContent !== String(cartCount)) {
      cartBadge.classList.remove("cart-badge-animate");
      // Force reflow to restart animation
      void cartBadge.offsetWidth;
      cartBadge.classList.add("cart-badge-animate");
    }
    cartBadge.textContent = cartCount;
    cartBadge.style.display = cartCount > 0 ? "inline-flex" : "none";
  }

  // Update sidebar cart if it exists
  const sidebarCart = document.getElementById("sidebar-cart");
  if (sidebarCart) {
    // Update cart title to show item count
    const cartTitle = sidebarCart.querySelector(".title-cart-block h6");
    if (cartTitle) {
      cartTitle.textContent = `Shopping Cart (${cartCount})`;
    }
    updateSidebarCart(cart, cartTotal);
  }
}

// Update sidebar cart content
function updateSidebarCart(cart, total) {
  const productList = document.querySelector("#sidebar-cart .product-list");
  const totalElement = document.querySelector("#sidebar-cart .price-total");

  if (productList) {
    productList.innerHTML = cart
      .map(
        (item) => `
            <li class="product-item mb-24" data-product-id="${item.id}">
                <div class="d-flex align-items-center gap-12">
                    <div class="item-image">
                        <img src="${item.featuredImage}" alt="${item.name}">
                    </div>
                    <div class="prod-title">
                        <a href="#" class="h6 medium-black font-sec fw-700 mb-8">${
                          item.name
                        }</a>
                        <p class="subtitle mb-4p">Quantity: ${item.quantity}</p>
                        <p class="subtitle">${formatPrice(
                          item.salePrice && item.salePrice < item.price
                            ? item.salePrice
                            : item.price
                        )}</p>
                    </div>
                </div>
                <div class="text-end">
                    <a href="javascript:;" class="cancel mb-12 remove-from-cart">
                        <i class="fa fa-trash text-danger"></i>
                    </a>
                    <div class="quantity quantity-wrap">
                        <div class="input-area quantity-wrap">
                            <input class="decrement" type="button" value="-">
                            <input type="text" name="quantity" value="${
                              item.quantity
                            }" maxlength="2" size="1" class="number">
                            <input class="increment" type="button" value="+">
                        </div>
                    </div>
                </div>
            </li>
        `
      )
      .join("");

    // Add event listeners for quantity buttons and remove buttons
    addCartItemEventListeners();
  }

  if (totalElement) {
    totalElement.innerHTML = `
            <span class="h6 fw-700 medium-black">SUBTOTAL</span>
            <span class="h6 fw-700 medium-black">${formatPrice(total)}</span>
        `;
  }
}

// Add event listeners for cart item interactions
function addCartItemEventListeners() {
  // Remove item buttons
  document.querySelectorAll(".remove-from-cart").forEach((button) => {
    button.onclick = (e) => {
      const productItem = e.target.closest(".product-item");
      const productId = productItem.dataset.productId;
      removeFromCart(productId);
    };
  });

  // Quantity buttons
  document.querySelectorAll(".quantity-wrap").forEach((wrap) => {
    const productItem = wrap.closest(".product-item");
    const productId = productItem?.dataset.productId;
    if (!productId) return;

    const decrementBtn = wrap.querySelector(".decrement");
    const incrementBtn = wrap.querySelector(".increment");
    const quantityInput = wrap.querySelector(".number");

    decrementBtn.onclick = () => {
      const currentValue = parseInt(quantityInput.value) || 1;
      if (currentValue > 1) {
        updateCartQuantity(productId, currentValue - 1);
      }
    };

    incrementBtn.onclick = () => {
      const currentValue = parseInt(quantityInput.value) || 1;
      updateCartQuantity(productId, currentValue + 1);
    };

    quantityInput.onchange = () => {
      const newValue = parseInt(quantityInput.value) || 1;
      updateCartQuantity(productId, newValue);
    };
  });
}

// Initialize cart when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
});
