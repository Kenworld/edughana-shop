import {
  db,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "./firebase-config.js";
import { addToCart, showToast, formatPrice } from "./cart.js";

const WISHLIST_STORAGE_KEY = "wishlist";

// Get wishlist product IDs from localStorage
function getWishlist() {
  const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
  return wishlist ? JSON.parse(wishlist) : [];
}

// Remove product ID from wishlist
function removeFromWishlist(productId) {
  let wishlist = getWishlist();
  wishlist = wishlist.filter((id) => id !== productId);
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  return wishlist;
}

// Fetch product details for all wishlist IDs
async function fetchWishlistProducts() {
  const wishlist = getWishlist();
  if (!wishlist.length) return [];

  let products = [];
  // Fetch each product by its document ID
  for (const productId of wishlist) {
    try {
      const docRef = doc(db, "products", productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        products.push({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
    }
  }
  return products;
}

// Render wishlist table
async function renderWishlistTable() {
  const tableBody = document.querySelector("#wishlist-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  console.log("Wishlist IDs from localStorage:", getWishlist());
  const products = await fetchWishlistProducts();
  console.log("Fetched products:", products);

  if (!products.length) {
    tableBody.innerHTML =
      "<tr><td colspan='5'>Your wishlist is empty.</td></tr>";
    return;
  }
  tableBody.innerHTML = products
    .map(
      (product) => `
      <tr data-product-id="${product.id}">
        <td class="py-3 ps-4">
          <div class="d-flex align-items-center gap-3">
            <img src="${product.featuredImage}" alt="${
        product.name
      }" class="rounded" style="width: 80px; height: 80px; object-fit: cover;">
            <div>
              <h6 class="mb-1">${product.name}</h6>
              <p class="text-muted mb-0">${product.description || ""}</p>
            </div>
          </div>
        </td>
        <td class="py-3">
          <div class="fw-semibold color-primary">${formatPrice(
            product.salePrice && product.salePrice < product.price
              ? product.salePrice
              : product.price
          )}</div>
        </td>
        <td class="py-3">
          <button class="cus-btn add-to-cart-btn">
            <span class="btn-text">Add to Cart</span>
            <span>Add to Cart</span>
          </button>
        </td>
        <td class="py-3 pe-4">
          <button class="btn btn-link text-danger remove-from-wishlist-btn">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `
    )
    .join("");
}

// Event delegation for add to cart and remove
function setupWishlistTableEvents() {
  const tableBody = document.querySelector("#wishlist-table tbody");
  if (!tableBody) return;
  tableBody.addEventListener("click", async (e) => {
    const row = e.target.closest("tr[data-product-id]");
    if (!row) return;
    const productId = row.getAttribute("data-product-id");
    if (e.target.closest(".add-to-cart-btn")) {
      // Fetch product details and add to cart
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          addToCart({ id: docSnap.id, ...docSnap.data() });
          showToast("Added to cart!");
          // Remove from wishlist and table
          removeFromWishlist(productId);
          row.remove();
          // If table is empty after removal, show empty message
          if (!getWishlist().length) {
            tableBody.innerHTML =
              "<tr><td colspan='5'>Your wishlist is empty.</td></tr>";
          }
        }
      } catch (error) {
        console.error(`Error adding product ${productId} to cart:`, error);
        showToast("Error adding to cart!");
      }
    } else if (e.target.closest(".remove-from-wishlist-btn")) {
      removeFromWishlist(productId);
      row.remove();
      showToast("Removed from wishlist!");
      // If table is empty after removal, show empty message
      if (!getWishlist().length) {
        tableBody.innerHTML =
          "<tr><td colspan='5'>Your wishlist is empty.</td></tr>";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderWishlistTable();
  setupWishlistTableEvents();
});
