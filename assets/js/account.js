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
});
