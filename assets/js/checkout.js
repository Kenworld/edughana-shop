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

  // Email Checkout Button Handler
  const emailCheckoutBtn = document.getElementById("email-checkout-btn");
  if (emailCheckoutBtn) {
    emailCheckoutBtn.addEventListener("click", () => {
      const cart = getCart();
      if (!cart.length) return;
      let orderSummary = cart
        .map(
          (item) =>
            `- ${item.name} (x${item.quantity}): ${formatPrice(
              (item.salePrice && item.salePrice < item.price
                ? item.salePrice
                : item.price) * item.quantity
            )}`
        )
        .join("%0D%0A");
      const totals = getCheckoutTotals();
      orderSummary += `%0D%0A%0D%0ASubtotal: ${formatPrice(totals.subtotal)}`;
      orderSummary += `%0D%0AShipping: ${formatPrice(totals.shipping)}`;
      orderSummary += `%0D%0ATotal: ${formatPrice(totals.total)}`;
      const subject = encodeURIComponent("New Order from Edu Ghana Shop");
      const body = encodeURIComponent(
        `Hello,%0D%0A%0D%0AI would like to place the following order:%0D%0A%0D%0A${orderSummary}%0D%0A%0D%0AName: [Your Name Here]%0D%0AEmail: [Your Email Here]%0D%0APhone: [Your Phone Here]%0D%0AAddress: [Your Address Here]%0D%0A`
      );
      window.location.href = `mailto:sales@edu-gh.net?subject=${subject}&body=${body}`;
    });
  }

  // WhatsApp Checkout Button Handler
  const whatsappCheckoutBtn = document.getElementById("whatsapp-checkout-btn");
  if (whatsappCheckoutBtn) {
    whatsappCheckoutBtn.addEventListener("click", checkoutViaWhatsApp);
  }

  // Show info modal if cart is empty
  const cart = getCart();
  if (!cart.length) {
    const emptyCartModal = document.getElementById("emptyCartModal");
    if (emptyCartModal && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      const modalInstance = new bootstrap.Modal(emptyCartModal, {
        backdrop: "static",
        keyboard: false,
      });
      modalInstance.show();
    }
  }

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

  // Get all checkout-related buttons
  const placeOrderBtn = document.getElementById("checkoutBtn");
  const whatsappBtn = document.getElementById("whatsapp-checkout-btn");
  const emailBtn = document.getElementById("email-checkout-btn"); // For future use

  if (cart.length === 0) {
    orderItemsDiv.innerHTML = `<div class="text-center py-4">Your cart is empty. <a href="shop.html">Continue shopping</a>.</div>`;
    // Disable all checkout buttons if cart is empty
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    if (whatsappBtn) {
      whatsappBtn.disabled = true;
      whatsappBtn.style.pointerEvents = "none";
      whatsappBtn.style.opacity = "0.6";
    }
    if (emailBtn) {
      emailBtn.disabled = true;
      emailBtn.style.pointerEvents = "none";
      emailBtn.style.opacity = "0.6";
    }
    updateOrderTotals();
    return;
  }

  // Enable all checkout buttons if cart is not empty
  if (placeOrderBtn) placeOrderBtn.disabled = false;
  if (whatsappBtn) {
    whatsappBtn.disabled = false;
    whatsappBtn.style.pointerEvents = "auto";
    whatsappBtn.style.opacity = "1";
  }
  if (emailBtn) {
    emailBtn.disabled = false;
    emailBtn.style.pointerEvents = "auto";
    emailBtn.style.opacity = "1";
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

function checkoutViaWhatsApp() {
  const cart = getCart();
  if (!cart.length) return;
  let orderSummary = cart
    .map(
      (item) =>
        `- ${item.name} (x${item.quantity}): ${formatPrice(
          (item.salePrice && item.salePrice < item.price
            ? item.salePrice
            : item.price) * item.quantity
        )}`
    )
    .join("\n");
  const totals = getCheckoutTotals();

  // Get customer details from form
  const firstName = document.getElementById("firstName")?.value || "";
  const lastName = document.getElementById("lastName")?.value || "";
  const email = document.getElementById("email")?.value || "";
  const phone = document.getElementById("phone")?.value || "";
  const address = document.getElementById("address")?.value || "";
  const address2 = document.getElementById("address2")?.value || "";
  const city = document.getElementById("city")?.value || "";
  const region = document.getElementById("region")?.value || "";
  const fullAddress = `${address}${
    address2 ? ", " + address2 : ""
  }, ${city}, ${region}`;

  const message = [
    "Hello,",
    "",
    "I'd like to place an order:",
    "",
    "Order Summary:",
    orderSummary,
    "",
    `Subtotal: ${formatPrice(totals.subtotal)}`,
    `Shipping: ${formatPrice(totals.shipping)}`,
    `Total: ${formatPrice(totals.total)}`,
    "",
    "Customer Details:",
    `Name: ${firstName} ${lastName}`.trim(),
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Address: ${fullAddress}`,
  ].join("\n");
  const whatsappNumber = "233572423472";
  window.open(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}
