import { auth, db } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "./firebase-config.js";
import { addToCart, showToast, updateCartUI } from "./cart.js";
const storedUser = localStorage.getItem("userData");

//Get elements refernce
const username = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const logoutbtn = document.getElementById("logoutbtn");
const loader = document.getElementById("loader");

const accFname = document.getElementById("accFname");
const accLname = document.getElementById("accLname");
const accEmail = document.getElementById("accEmail");
const accPhone = document.getElementById("accPhone");
const accLocation = document.getElementById("accLocation");
loader.style.display = "none";

//Password  rest
const oldPassword = document.getElementById("oldPassword").value;
const newPassword = document.getElementById("newPassword").value;
const confirmPassword = document.getElementById("confirmPassword").value;
const updatePasswordBtn = document.getElementById("updatePasswordBtn").value;

async function getUserDetails() {
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    username.textContent = ` ${userData.firstName} ${userData.lastName} `;
    userEmail.textContent = ` ${userData.email} `;
    accFname.value = ` ${userData.firstName} `;
    accLname.value = ` ${userData.lastName} `;
    accEmail.value = ` ${userData.email} `;
    accPhone.value = ` ${userData.phone} `;
    if (userData.location === "") {
      accLocation.placeholder = "Update your location";
    } else {
      accLocation.value = ` ${userData.location} `;
    }
  }
}
getUserDetails();

logoutbtn.addEventListener("click", () => {
  loader.style.display = "block";
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      localStorage.removeItem("userData");
      window.location.href = "index.html";
    })
    .catch((error) => {
      // An error happened.
      console.log(error);
    });
});

async function updateUserProfile() {
  try {
    // Show loading state
    const saveButton = document.querySelector('button[type="submit"]');
    const originalButtonText = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveButton.disabled = true;

    // Get form values
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const updateProfileBtn = document.getElementById("updateProfileBtn").value;

    // Get current user
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No user is currently signed in");
    }

    // Update user profile in Firebase Auth
    await updateUserProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Update user data in Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        firstName,
        lastName,
        email,
        phone,
        address,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ); // Use merge to only update these fields

    // Update localStorage
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const updatedUserData = {
      ...userData,
      firstName,
      lastName,
      email,
      phone,
      address,
    };
    localStorage.setItem("userData", JSON.stringify(updatedUserData));

    // Show success message
    showNotification("Profile updated successfully!", "success");

    // Reset button state
    saveButton.innerHTML = originalButtonText;
    saveButton.disabled = false;

    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    showNotification(`Error: ${error.message}`, "error");

    // Reset button state
    const saveButton = document.querySelector('button[type="submit"]');
    saveButton.innerHTML = "Save Changes";
    saveButton.disabled = false;

    return false;
  }
}

async function resetPassword() {
  try {
    // Show loading state
    const saveButton = document.querySelector(
      '#security button[type="submit"]'
    );
    const originalButtonText = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    saveButton.disabled = true;

    // Get form values
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validate passwords
    if (newPassword !== confirmPassword) {
      throw new Error("New passwords do not match");
    }

    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }

    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is currently signed in");
    }

    // For security, we need to reauthenticate the user before changing password
    // This requires the user to enter their current password
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    // Show success message
    showNotification("Password updated successfully!", "success");

    // Clear form
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    // Reset button state
    saveButton.innerHTML = originalButtonText;
    saveButton.disabled = false;

    return true;
  } catch (error) {
    console.error("Error updating password:", error);

    // Show appropriate error message
    if (error.code === "auth/wrong-password") {
      showNotification("Current password is incorrect", "error");
    } else {
      showNotification(`Error: ${error.message}`, "error");
    }

    // Reset button state
    const saveButton = document.querySelector(
      '#security button[type="submit"]'
    );
    saveButton.innerHTML = "Update Password";
    saveButton.disabled = false;

    return false;
  }
}

// Helper function to show notifications
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `alert alert-${
    type === "success" ? "success" : "danger"
  } notification`;
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.zIndex = "9999";
  notification.style.minWidth = "300px";
  notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
  notification.innerHTML = message;

  // Add to document
  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 5000);
}

// Add event listener to the form
document.addEventListener("DOMContentLoaded", function () {
  const profileForm = document.querySelector("#account-details form");
  if (profileForm) {
    profileForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await updateProfile();
    });
  }
});

// Add event listener to the security form
document.addEventListener("DOMContentLoaded", function () {
  const securityForm = document.querySelector("#security form");
  if (securityForm) {
    securityForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await resetPassword();
    });
  }
  updateCartUI();
});

// Fetch and display user orders
async function fetchAndDisplayOrders() {
  const ordersList = document.getElementById("ordersList");
  ordersList.innerHTML = '<div class="text-center">Loading orders...</div>';
  let userId = null;
  if (auth.currentUser) {
    userId = auth.currentUser.uid;
  } else if (storedUser) {
    try {
      userId = JSON.parse(storedUser).uid;
    } catch (e) {}
  }
  if (!userId) {
    ordersList.innerHTML =
      '<div class="text-center">Please log in to view your orders.</div>';
    return;
  }
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      ordersList.innerHTML = '<div class="text-center">No orders found.</div>';
      return;
    }
    let html = "";
    querySnapshot.forEach((doc) => {
      const order = doc.data();
      const orderId = doc.id;
      const date =
        order.createdAt && order.createdAt.toDate
          ? order.createdAt.toDate().toLocaleDateString()
          : "-";
      const total =
        order.totals && order.totals.total
          ? `GHS ${order.totals.total.toLocaleString()}`
          : "-";
      const status = order.status || "-";
      let statusClass = "status-processing";
      if (status.toLowerCase() === "delivered")
        statusClass = "status-delivered";
      else if (status.toLowerCase() === "cancelled")
        statusClass = "status-cancelled";
      html += `
        <div class="card order-card mb-3">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-3">
                <p class="text-muted mb-1">Order ID</p>
                <p class="fw-bold mb-md-0">#${orderId}</p>
              </div>
              <div class="col-md-3">
                <p class="text-muted mb-1">Date</p>
                <p class="mb-md-0">${date}</p>
              </div>
              <div class="col-md-3">
                <p class="text-muted mb-1">Total</p>
                <p class="fw-bold mb-md-0">${total}</p>
              </div>
              <div class="col-md-3 text-md-end">
                <span class="status-badge ${statusClass}">${status}</span>
                <button class="btn btn-sm btn-outline-primary ms-2 view-order-details" data-order-id="${orderId}">View Details</button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    ordersList.innerHTML = html;
    attachOrderDetailsListeners(querySnapshot);
  } catch (error) {
    ordersList.innerHTML =
      '<div class="text-center text-danger">Failed to load orders.</div>';
    console.error("Error fetching orders:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  onAuthStateChanged(auth, function (user) {
    if (user) {
      fetchAndDisplayOrders();
    } else {
      // Clear orders if logged out
      const ordersList = document.getElementById("ordersList");
      if (ordersList)
        ordersList.innerHTML =
          '<div class="text-center">Please log in to view your orders.</div>';
    }
  });
});

// Attach event listeners to 'View Details' buttons and show modal
function attachOrderDetailsListeners(querySnapshot) {
  const ordersMap = {};
  querySnapshot.forEach((doc) => {
    ordersMap[doc.id] = doc.data();
  });
  document.querySelectorAll(".view-order-details").forEach((btn) => {
    btn.addEventListener("click", function () {
      const orderId = this.getAttribute("data-order-id");
      showOrderDetailsModal(orderId, ordersMap[orderId]);
    });
  });
}

// Create and show the order details modal
function showOrderDetailsModal(orderId, order) {
  let modal = document.getElementById("orderDetailsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "orderDetailsModal";
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Order Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="orderDetailsBody"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  // Populate modal body
  const body = modal.querySelector("#orderDetailsBody");
  body.innerHTML = renderOrderDetails(orderId, order);
  // Show modal (Bootstrap 5)
  if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();
  } else {
    modal.style.display = "block";
  }
}

// Render order details HTML
function renderOrderDetails(orderId, order) {
  let itemsHtml = "";
  if (order.items && Array.isArray(order.items)) {
    itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td>${item.name || ""}</td>
        <td>${item.quantity || 1}</td>
        <td>${item.price ? "GHS " + item.price.toLocaleString() : "-"}</td>
        <td>${
          item.salePrice && item.salePrice < item.price
            ? "GHS " + item.salePrice.toLocaleString()
            : "-"
        }</td>
      </tr>
    `
      )
      .join("");
  }
  return `
    <div class="mb-3">
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Date:</strong> ${
        order.createdAt && order.createdAt.toDate
          ? order.createdAt.toDate().toLocaleString()
          : "-"
      }<br>
      <strong>Status:</strong> ${order.status || "-"}<br>
      <strong>Total:</strong> ${
        order.totals && order.totals.total
          ? "GHS " + order.totals.total.toLocaleString()
          : "-"
      }<br>
    </div>
    <div class="mb-3">
      <strong>Customer Info:</strong><br>
      Name: ${
        order.customerInfo
          ? (order.customerInfo.firstName || "") +
            " " +
            (order.customerInfo.lastName || "")
          : "-"
      }<br>
      Email: ${order.customerInfo ? order.customerInfo.email : "-"}<br>
      Phone: ${order.customerInfo ? order.customerInfo.phone : "-"}<br>
      Address: ${order.customerInfo ? order.customerInfo.address : "-"}<br>
    </div>
    <div class="mb-3">
      <strong>Items:</strong>
      <div class="table-responsive">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Sale Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
    </div>
    <div class="mb-3">
      <strong>Totals:</strong><br>
      Subtotal: ${
        order.totals && order.totals.subtotal
          ? "GHS " + order.totals.subtotal.toLocaleString()
          : "-"
      }<br>
      Shipping: ${
        order.totals && order.totals.shipping
          ? "GHS " + order.totals.shipping.toLocaleString()
          : "-"
      }<br>
      <strong>Total: ${
        order.totals && order.totals.total
          ? "GHS " + order.totals.total.toLocaleString()
          : "-"
      }</strong><br>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", function () {
  // Check if the URL has a hash (like #orders, #security, etc.)
  const hash = window.location.hash;
  if (hash) {
    // Remove 'active' and 'show' from all tab panes
    document.querySelectorAll(".tab-pane").forEach((tab) => {
      tab.classList.remove("show", "active");
    });

    // Remove 'active' from all tab menu links (if any)
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    // Show the tab corresponding to the hash
    const targetTab = document.querySelector(hash);
    if (targetTab) {
      targetTab.classList.add("show", "active");
    }
  }
});
