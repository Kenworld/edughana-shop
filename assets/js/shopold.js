import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "./firebase-config.js";
// import { addToCart, showToast, updateCartBadge } from "./cart.js";
import { addToCart, showToast, updateCartUI } from "./cart.js";

// Constants
const PRODUCTS_PER_PAGE = 20;
let lastVisible = null;
let isLastPage = false;
let allProducts = []; // To cache all products for searching and filtering
let currentPage = 1;
const pageCursors = { 1: null }; // Store cursor for each page

window.productsList = []; // For cart functionality

// DOM Elements
const productsList = document.getElementById("productsList");
const paginationContainer = document.getElementById("pagination");

// Function to format price
function formatPrice(price) {
  return `GHS ${price.toFixed(2)}`;
}

// Function to create product card HTML
function createProductCard(product) {
  const hasSale = product.salePrice && product.salePrice < product.price;

  return `
    <div class="col-lg-4 col-md-6 col-sm-6 wow fadeInUp animated animated" data-wow-delay="400ms">
      <div class="latest-product-card">
        <div class="image-box mb-16">
          ${
            hasSale
              ? '<span class="sale-label subtitle fw-400 white">Sale</span>'
              : ""
          }
          <a href="product-detail.html?id=${product.id}" class="image">
            <div class="image-wrapper" style="position: relative; width: 100%; padding-top: 100%;">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                data-src="${product.featuredImage}" 
                class="product-image lazy" 
                alt="${product.name}"
                loading="lazy"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                onerror="this.onerror=null; this.src='assets/media/placeholder.jpg';"
              >
            </div>
          </a>
          <div class="side-icons">
            <ul class="list-unstyled">
              <li>
                <a href="wishlist.html">
                  <i class="fa-light fa-heart"></i>
                </a>
              </li>
              <li>
                <a href="#" class="btn" data-bs-toggle="modal" data-bs-target="#productQuickView">
                  <i class="fa-regular fa-eye"></i>
                </a>
              </li>
            </ul>
          </div>
          <button class="cus-btn add-to-cart-btn" data-product-id="${
            product.id
          }">
            <span class="btn-text">Add Cart</span>
            <span>Go to Cart</span>
          </button>
        </div>
        <div class="product-desc">
          <div>
            <a href="product-detail.html?id=${
              product.id
            }" class="product-title h6 fw-700 mb-8">
              ${product.name}
            </a>
            <div class="d-flex align-items-center gap-8 justify-content-center mb-8">
              <div class="rating-stars">
                ${Array(5)
                  .fill(
                    `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="13" viewBox="0 0 14 13" fill="none">
                      <path d="M6.42937 0.826541C6.60898 0.273755 7.39102 0.273757 7.57063 0.826543L8.6614 4.18359C8.74173 4.4308 8.9721 4.59818 9.23204 4.59818H12.7618C13.3431 4.59818 13.5847 5.34195 13.1145 5.68359L10.2588 7.75835C10.0485 7.91114 9.96055 8.18196 10.0409 8.42917L11.1316 11.7862C11.3113 12.339 10.6786 12.7987 10.2083 12.457L7.35267 10.3823C7.14238 10.2295 6.85762 10.2295 6.64733 10.3823L3.79166 12.457C3.32143 12.7987 2.68874 12.339 2.86835 11.7862L3.95912 8.42917C4.03945 8.18196 3.95145 7.91114 3.74116 7.75835L0.885485 5.68359C0.415257 5.34194 0.656924 4.59818 1.23816 4.59818H4.76796C5.0279 4.59818 5.25827 4.4308 5.3386 4.18359L6.42937 0.826541Z" fill="#E85F3E"/>
                    </svg>
                  `
                  )
                  .join("")}
              </div>
              <p class="fw-500">(246)</p>
            </div>
            <div class="row">
              <h5 class="medium-black fw-700 col-md-6">
                ${formatPrice(hasSale ? product.salePrice : product.price)}
              </h5>
              ${
                hasSale
                  ? `
                <span class="text-decoration-line-through col-md-6">
                  ${formatPrice(product.price)}
                </span>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initLazyLoading() {
  const lazyImages = document.querySelectorAll("img.lazy");
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach((img) => imageObserver.observe(img));
  } else {
    lazyImages.forEach((img) => {
      img.src = img.dataset.src;
      img.classList.remove("lazy");
    });
  }
}

function renderProducts(productsToRender) {
  productsList.innerHTML = "";
  window.productsList = productsToRender;
  productsToRender.forEach((product) => {
    productsList.innerHTML += createProductCard(product);
  });
  initLazyLoading();
}

async function fetchAllProducts() {
  if (allProducts.length > 0) return allProducts;
  try {
    const productsQuery = query(
      collection(db, "products"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(productsQuery);
    querySnapshot.forEach((doc) =>
      allProducts.push({ id: doc.id, ...doc.data() })
    );
    return allProducts;
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}

async function displaySearchResults(searchTerm) {
  console.log("Shop Page - Search Term Received:", searchTerm);
  const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
  const allFetchedProducts = await fetchAllProducts();
  console.log("Shop Page - All Products Fetched:", allFetchedProducts);

  const filteredProducts = allFetchedProducts.filter((p) => {
    // Handle potential trailing space in the Firestore field name
    const name = p.lowercase_name || p["lowercase_name "];
    return (
      name &&
      typeof name === "string" &&
      name.trim().includes(lowerCaseSearchTerm)
    );
  });
  console.log("Shop Page - Filtered Products:", filteredProducts);

  if (filteredProducts.length > 0) {
    renderProducts(filteredProducts);
  } else {
    productsList.innerHTML = "<p>No products found for your search.</p>";
  }
}

async function fetchPaginatedProducts(startAfterDoc = null) {
  try {
    let q = query(
      collection(db, "products"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(PRODUCTS_PER_PAGE)
    );
    if (startAfterDoc) {
      q = query(
        collection(db, "products"),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        startAfter(startAfterDoc),
        limit(PRODUCTS_PER_PAGE)
      );
    }
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) =>
      products.push({ id: doc.id, ...doc.data() })
    );
    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    pageCursors[currentPage + 1] = lastVisible;
    isLastPage = querySnapshot.docs.length < PRODUCTS_PER_PAGE;
    return products;
  } catch (error) {
    console.error("Error fetching paginated products:", error);
    return [];
  }
}

async function displayPaginatedProducts(page = 1) {
  currentPage = page;
  const startAfterDoc = pageCursors[page];

  const products = await fetchPaginatedProducts(startAfterDoc);
  renderProducts(products);
  renderPagination();
}

function renderPagination() {
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";

  const prevButton = document.createElement("button");
  prevButton.innerHTML = "&laquo; Previous";
  prevButton.className = "page-link";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      displayPaginatedProducts(currentPage - 1);
    }
  });

  const nextButton = document.createElement("button");
  nextButton.innerHTML = "Next &raquo;";
  nextButton.className = "page-link";
  nextButton.disabled = isLastPage;
  nextButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isLastPage) {
      displayPaginatedProducts(currentPage + 1);
    }
  });

  const paginationUl = document.createElement("ul");
  paginationUl.className = "pagination-list";

  const prevLi = document.createElement("li");
  prevLi.appendChild(prevButton);

  const nextLi = document.createElement("li");
  nextLi.appendChild(nextButton);

  paginationUl.appendChild(prevLi);
  paginationUl.appendChild(nextLi);

  paginationContainer.appendChild(paginationUl);
}

function handleAddToCart(e) {
  const button = e.target.closest(".add-to-cart-btn");
  if (!button) return;

  const productId = button.dataset.productId;
  // Use window.productsList which is updated by both search and pagination logic
  const product = window.productsList.find((p) => p.id === productId);

  if (product) {
    addToCart(product);
    showToast(`${product.name} added to cart successfully!`);
  }
}

async function initShopPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchTerm = urlParams.get("search");
  console.log(
    "Shop Page - Initializing with search term from URL:",
    searchTerm
  );

  if (searchTerm) {
    document.getElementById("search").value = searchTerm;
    if (paginationContainer) paginationContainer.style.display = "none";
    await displaySearchResults(searchTerm);
  } else {
    if (paginationContainer) paginationContainer.style.display = "block";
    await displayPaginatedProducts(1);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initShopPage();
  updateCartUI();
  productsList.addEventListener("click", handleAddToCart);
  // Any other event listeners for filters, etc., would go here.
});
