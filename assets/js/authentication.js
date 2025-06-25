import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDc7xbG23UV8JN-KKpsJydorSeNw6gaOwM",
  authDomain: "edughana-570cf.firebaseapp.com",
  projectId: "edughana-570cf",
  storageBucket: "edughana-570cf.firebasestorage.app",
  messagingSenderId: "587349854173",
  appId: "1:587349854173:web:79ee3e4f72b3a7d03bd834",
  measurementId: "G-TKH2JVMRBK",
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore();

const provider = new GoogleAuthProvider();

async function fetchAndStoreUserData(user) {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const userData = docSnap.data();
    localStorage.setItem("userData", JSON.stringify(userData));
    console.log("✅ User data stored in localStorage");
  } else {
    console.log("⚠️ User document not found in Firestore.");
  }
}
//Allow user to sign in with email and password
if (window.location.pathname === "/login.html") {
  const loader = document.getElementById("loader");
  loader.style.display = "none";

  //Get a reference to the elements
  const signInButton = document.getElementById("loginBtn");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  // Google Login button
  const googleLoginBtn = document.getElementById("googleLogin");
  // Google Sign Up button

  signInButton.addEventListener("click", () => {
    loader.style.display = "block";
    if (validateEmail() && validatePassword()) {
      const emailVal = email.value.trim();
      const passwordVal = password.value;

      if (emailVal !== "" && passwordVal !== "") {
        signInWithEmailAndPassword(auth, emailVal, passwordVal)
          .then((userCredential) => {
            const user = userCredential.user;
            fetchAndStoreUserData(user); // Store the data
            window.location.href = "index.html";
          })
          .catch((error) => {
            alert("Authentication failed: " + error.message);
          });
      }
    }
  });
  //Sign in with Google button
  googleLoginBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log("Signed in with Google:", user.displayName);
        fetchAndStoreUserData(user); // Store the data
        // Redirect after successful login
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Google sign-in error:", error.message);
        alert("Google sign-in failed: " + error.message);
      });
  });

  function validatePassword() {
    if (password.value.length < 6) {
      alert("Password must be at least 6 characters long");
      password.value = "";
      password.focus();
      return false;
    }
    return true;
  }

  function validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value.trim())) {
      alert("Please enter a valid email address");
      email.value = "";
      email.focus();
      return false;
    }
    return true;
  }
}
if (window.location.pathname === "/signup.html") {
  const loader = document.getElementById("loader");
  loader.style.display = "none";
  const createAccountWithGoogleBtn = document.getElementById(
    "createAccountWithGoogleBtn"
  );
  // Form elements
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const s_email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const s_password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const terms = document.getElementById("terms");
  const feedback = document.getElementById("invalid-feedback");
  const createAccountbtn = document.getElementById("createAccountbtn");
  const form = document.querySelector("form");
  //Sign up logic for google authentication
  createAccountWithGoogleBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // New user, save basic info to Firestore
        await setDoc(userRef, {
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ")[1] || "",
          email: user.email,
          phone: user.phoneNumber || "",
          createdAt: new Date().toISOString(),
        });
      }

      // Redirect to dashboard
      window.location.href = "index.html";
    } catch (error) {
      console.error("Google sign-up error:", error.message);
      alert("Google sign-up failed: " + error.message);
    }
  });
  // Utility to show error
  function showError(message) {
    feedback.textContent = message;
    feedback.style.display = "block";
  }
  //Manual sign up logic
  createAccountbtn.addEventListener("click", async () => {
    // Clear previous feedback
    feedback.textContent = "";
    feedback.style.display = "none";
    createAccountbtn.disabled = true;
    loader.style.display = "block";
    //basic validation
    if (
      !firstName.value ||
      !lastName.value ||
      !s_email.value ||
      !s_password.value ||
      !confirmPassword.value
    ) {
      return showError("Please fill in all required fields.");
    }
    if (!terms.checked) {
      return showError("Please accept terms and conditions.");
    }
    if (s_password.value !== confirmPassword.value) {
      return showError("Passwords do not match.");
    }
    if (s_password.value.length < 6) {
      return showError("Password must be at least 6 characters long.");
    }

    try {
      // Sign up with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        s_email.value,
        s_password.value
      );

      // Get user data
      const user = userCredential.user;
      await updateProfile(user, {
        displayName: `${firstName.value} ${lastName.value}`,
      });
      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        phone: phone.value,
        location: "", // we will collect location later or update it separately
        createdAt: new Date().toISOString(),
      });
      window.location.href = "index.html";
    } catch (error) {
      console.error("Sign-up error:", error.message);
      if (error.code === "auth/email-already-in-use") {
        showError("This email is already registered.");
      } else {
        showError("An error occurred. Please try again.");
      }
    }
  });
}

if (
  window.location.pathname !== "/login.html" &&
  window.location.pathname !== "/signup.html"
) {
  const userNamePlaceholder = document.getElementById("userNamePlaceholder");
  const loginLink = document.getElementById("accountLink");
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const displayName = user.displayName || user.email.split("@")[0];
      userNamePlaceholder.textContent = `Welcome back, ${displayName}`;
      loginLink.setAttribute("href", "account.html");
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        localStorage.setItem("userData", JSON.stringify(docSnap.data()));
        console.log("🔁 Refreshed user data in localStorage");
      }
      console.log("✅ User is logged in.");
    } else {
      userNamePlaceholder.textContent = "Login / Sign Up";
      loginLink.setAttribute("href", "login.html");
      console.log("🚫 No user is logged in.");
    }
  });
}

export { auth, db };
