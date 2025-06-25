import {
  getCart,
  formatPrice,
  calculateCartTotal as calculateCartSubtotal,
  clearCart,
} from "./cart.js";
import { db, auth } from "./authentication.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // Check login status and redirect if necessary
  const placeOrderBtn = document.querySelector(".checkoutBtn");
  const loginPromptModal = new bootstrap.Modal(
    document.getElementById("loginPromptModal")
  );

  placeOrderBtn.addEventListener("click", (event) => {
    if (!auth.currentUser) {
      event.preventDefault(); // Stop form submission
      loginPromptModal.show(); // Show the login prompt
    }
  });

  // Form validation and submission
  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    form.classList.add("was-validated");

    // Show processing state on button
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Placing Order...
        `;

    try {
      const { subtotal, shipping, total } = getCheckoutTotals();
      const orderDetails = {
        userId: auth.currentUser.uid,
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

      // Save order to Firestore
      const docRef = await addDoc(collection(db, "orders"), orderDetails);
      console.log("Order placed with ID: ", docRef.id);

      // Clear the cart
      clearCart();

      // Redirect to a confirmation page (or show success message)
      window.location.href = `order-confirmation.html?id=${docRef.id}`;
    } catch (error) {
      console.error("Error placing order: ", error);
      alert("There was an error placing your order. Please try again.");
      // Re-enable button
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = `
                <span class="btn-text">Place Order</span>
                <span>Place Order</span>
            `;
    }
  });

  // Payment method toggle
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

// Initial Render
document.addEventListener("DOMContentLoaded", renderOrderSummary);

// Note: The WhatsApp checkout logic is kept in checkout.html as it has its own dependency set
// and doesn't depend on Firebase auth state.
