import {
  getCart,
  formatPrice,
  calculateCartTotal as calculateCartSubtotal,
  clearCart,
} from "./cart.js";
import {
  db,
  auth,
  collection,
  addDoc,
  serverTimestamp,
  signInWithEmailAndPassword,
} from "./firebase-config.js";

let isGuestCheckout = false;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkout-form");
  const placeOrderBtn = document.getElementById("checkoutBtn");
  const loginPromptModalEl = document.getElementById("loginPromptModal");
  if (!loginPromptModalEl) {
    console.error("Login prompt modal element not found.");
    return;
  }
  const loginPromptModal = new bootstrap.Modal(loginPromptModalEl);

  // New modal elements
  const guestCheckoutBtn = document.getElementById("guest-checkout-btn");
  const modalLoginForm = document.getElementById("modal-login-form");
  const modalLoginError = document.getElementById("modal-login-error");

  if (!form || !placeOrderBtn) {
    console.error("A required element for checkout was not found.");
    return;
  }

  // All checkout-related logic will now be handled by the form's submit event.
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    // 1. Check if user is logged in or proceeding as guest
    if (!auth.currentUser && !isGuestCheckout) {
      loginPromptModal.show();
      return;
    }

    // 2. Validate the form
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    form.classList.add("was-validated");

    // 3. Process the order
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Placing Order...
    `;

    try {
      const { subtotal, shipping, total } = getCheckoutTotals();
      const isGuest = !auth.currentUser;
      const orderDetails = {
        userId: isGuest ? "guest" : auth.currentUser.uid,
        customerInfo: {
          firstName: document.getElementById("firstName").value,
          lastName: document.getElementById("lastName").value,
          email: document.getElementById("email").value,
          phone: document.getElementById("phone").value,
          address: `${document.getElementById("address").value}, ${
            document.getElementById("address2").value || ""
          }`,
          city: document.getElementById("city").value,
          region: document.getElementById("region").value,
          orderNote: document.getElementById("deliverNote").value,
        },
        items: getCart(),
        paymentMethod: document.querySelector(
          'input[name="paymentMethod"]:checked'
        ).id,
        totals: {
          subtotal: subtotal,
          shipping: shipping,
          total: total,
        },
        status: "Pending",
        createdAt: serverTimestamp(),
      };

      const collectionName = isGuest ? "guestOrders" : "orders";
      const docRef = await addDoc(collection(db, collectionName), orderDetails);
      console.log(`Order placed in ${collectionName} with ID: `, docRef.id);

      clearCart();
      window.location.href = `order-confirmation.html?id=${docRef.id}&guest=${isGuest}`;
    } catch (error) {
      console.error("Error placing order: ", error);
      alert("There was an error placing your order. Please try again.");
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = `
        <span class="btn-text">Place Order</span>
        <span>Place Order</span>
      `;
    }
  });

  // Guest checkout flow
  if (guestCheckoutBtn) {
    guestCheckoutBtn.addEventListener("click", () => {
      isGuestCheckout = true;
      loginPromptModal.hide();
      // Use requestSubmit for better form submission handling, including validation
      form.requestSubmit();
    });
  }

  // Modal login flow
  if (modalLoginForm) {
    modalLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("modal-email").value;
      const password = document.getElementById("modal-password").value;
      const loginButton = modalLoginForm.querySelector('button[type="submit"]');

      // Disable button
      loginButton.disabled = true;
      modalLoginError.classList.add("d-none");

      try {
        await signInWithEmailAndPassword(auth, email, password);
        loginPromptModal.hide();
        form.requestSubmit(); // Resubmit the main form, now user is logged in
      } catch (error) {
        console.error("Modal login failed:", error);
        modalLoginError.textContent =
          "Login failed. Please check your credentials and try again.";
        modalLoginError.classList.remove("d-none");
      } finally {
        // Re-enable button
        loginButton.disabled = false;
      }
    });
  }

  // Payment method toggle logic
  const momoFields = document.getElementById("momoFields");
  const cardFields = document.getElementById("cardFields");
  const cashFields = document.getElementById("cashFields");
  const paymentMethods = document.querySelectorAll(
    'input[name="paymentMethod"]'
  );

  paymentMethods.forEach((method) => {
    method.addEventListener("change", function () {
      momoFields.classList.add("d-none");
      cardFields.classList.add("d-none");
      cashFields.classList.add("d-none");

      if (this.id === "momo") {
        momoFields.classList.remove("d-none");
      } else if (this.id === "card") {
        cardFields.classList.remove("d-none");
      } else if (this.id === "cash") {
        cashFields.classList.remove("d-none");
      }
    });
  });

  // Initial Render of the order summary
  renderOrderSummary();
});

// Calculates all totals for the checkout page
function getCheckoutTotals() {
  const cart = getCart();
  const subtotal = calculateCartSubtotal(cart);
  // Standard GHS 20 shipping
  const shipping = cart.length > 0 ? 20 : 0;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function renderOrderSummary() {
  const cart = getCart();
  const orderItemsDiv = document.querySelector(".order-items");
  if (!orderItemsDiv) return;

  if (cart.length === 0) {
    orderItemsDiv.innerHTML = `<div class="text-center py-4">Your cart is empty. <a href="shop.html">Continue shopping</a>.</div>`;
    // Disable checkout buttons if cart is empty
    document.querySelector(
      '#checkout-form button[type="submit"]'
    ).disabled = true;
    document.getElementById("whatsapp-checkout-btn").style.pointerEvents =
      "none";
    document.getElementById("whatsapp-checkout-btn").style.opacity = "0.6";

    updateOrderTotals();
    return;
  }

  orderItemsDiv.innerHTML = cart
    .map(
      (item) => `
    <div class="d-flex align-items-center gap-3 mb-3">
        <img src="${item.featuredImage}" alt="${
        item.name
      }" class="rounded" style="width: 60px; height: 60px; object-fit: cover;">
        <div class="flex-grow-1">
            <h6 class="mb-1">${item.name}</h6>
            <p class="mb-0 text-muted">Quantity: ${item.quantity}</p>
        </div>
        <div class="fw-semibold">${formatPrice(
          (item.salePrice && item.salePrice < item.price
            ? item.salePrice
            : item.price) * item.quantity
        )}</div>
    </div>
`
    )
    .join("");

  updateOrderTotals();
}

function updateOrderTotals() {
  const { subtotal, shipping, total } = getCheckoutTotals();

  // Update summary elements
  const orderTotalsDiv = document.querySelector(".order-totals");
  if (orderTotalsDiv) {
    orderTotalsDiv.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <span>Subtotal</span>
            <span class="fw-semibold subtotal-amount">${formatPrice(
              subtotal
            )}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
            <span>Shipping</span>
            <span class="fw-semibold shipping-amount">${formatPrice(
              shipping
            )}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between mb-4">
            <span class="fw-bold">Total</span>
            <span class="fw-bold color-primary total-amount">${formatPrice(
              total
            )}</span>
        </div>
    `;
  }
}

// Note: The WhatsApp checkout logic is kept in checkout.html as it has its own dependency set
// and doesn't depend on Firebase auth state.
