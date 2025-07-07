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
let totalPages = 1;

window.productsList = []; // For cart functionality

// DOM Elements
const productsList = document.getElementById("productsList");
const paginationContainer = document.getElementById("pagination");

// --- FILTER STATE ---
const filterState = {
  subcategories: [],
  priceMin: null,
  priceMax: null,
  ageGroups: [],
  materials: [],
  useCases: [],
};

function getPriceInputs() {
  return {
    minInput: document.querySelector(".input-min"),
    maxInput: document.querySelector(".input-max"),
    minRange: document.querySelector(".range-min"),
    maxRange: document.querySelector(".range-max"),
  };
}

function filterProducts(products, state) {
  let filtered = products;
  // Subcategory filter
  if (state.subcategories && state.subcategories.length) {
    filtered = filtered.filter((p) =>
      state.subcategories.includes(p.subcategory)
    );
  }
  // Price filter
  if (state.priceMin !== null && state.priceMax !== null) {
    filtered = filtered.filter((p) => {
      const price =
        p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
      return price >= state.priceMin && price <= state.priceMax;
    });
  }
  // Age Group filter
  if (state.ageGroups && state.ageGroups.length) {
    filtered = filtered.filter((p) => state.ageGroups.includes(p.ageGroup));
  }
  // Material filter
  if (state.materials && state.materials.length) {
    filtered = filtered.filter((p) => state.materials.includes(p.material));
  }
  // Use Case filter
  if (state.useCases && state.useCases.length) {
    filtered = filtered.filter((p) => state.useCases.includes(p.useCase));
  }
  return filtered;
}

function updateProductListWithFilters(allProducts) {
  const filtered = filterProducts(allProducts, filterState);
  if (filtered.length > 0) {
    renderProducts(filtered);
  } else {
    productsList.innerHTML =
      "<p>No products found for the selected filters.</p>";
  }
}

function setupPriceFilterListeners(allProducts) {
  const { minInput, maxInput, minRange, maxRange } = getPriceInputs();
  if (!minInput || !maxInput || !minRange || !maxRange) return;

  function syncInputs() {
    let min = parseInt(minInput.value) || 0;
    let max = parseInt(maxInput.value) || 10000;
    if (min > max) min = max;
    minInput.value = min;
    maxInput.value = max;
    minRange.value = min;
    maxRange.value = max;
    filterState.priceMin = min;
    filterState.priceMax = max;
    updateProductListWithFilters(allProducts);
  }

  minInput.addEventListener("input", syncInputs);
  maxInput.addEventListener("input", syncInputs);
  minRange.addEventListener("input", (e) => {
    minInput.value = e.target.value;
    syncInputs();
  });
  maxRange.addEventListener("input", (e) => {
    maxInput.value = e.target.value;
    syncInputs();
  });

  // Initialize state
  syncInputs();
}

function setupCategoryFilterListeners(allProducts) {
  const placeholder = document.getElementById("category-accordion-placeholder");
  if (!placeholder) return;
  placeholder.addEventListener("change", (e) => {
    if (e.target.classList.contains("category-filter")) {
      // Get all checked subcategory checkboxes
      const checked = Array.from(
        placeholder.querySelectorAll("input.category-filter:checked")
      );
      filterState.subcategories = checked.map((cb) => cb.value);
      updateProductListWithFilters(allProducts);
    }
  });
}

function setupOtherFilterListeners(allProducts) {
  // Age Group
  const ageGroupList = document.getElementById("ageGroupList");
  if (ageGroupList) {
    ageGroupList.addEventListener("change", () => {
      const checked = Array.from(
        ageGroupList.querySelectorAll('input[type="checkbox"]:checked')
      );
      filterState.ageGroups = checked.map((cb) => cb.value);
      updateProductListWithFilters(allProducts);
    });
  }
  // Material
  const materialList = document.getElementById("materialList");
  if (materialList) {
    materialList.addEventListener("change", () => {
      const checked = Array.from(
        materialList.querySelectorAll('input[type="checkbox"]:checked')
      );
      filterState.materials = checked.map((cb) => cb.value);
      updateProductListWithFilters(allProducts);
    });
  }
  // Use Case
  const useCaseList = document.getElementById("useCaseList");
  if (useCaseList) {
    useCaseList.addEventListener("change", () => {
      const checked = Array.from(
        useCaseList.querySelectorAll('input[type="checkbox"]:checked')
      );
      filterState.useCases = checked.map((cb) => cb.value);
      updateProductListWithFilters(allProducts);
    });
  }
}

// Function to format price
function formatPrice(price) {
  return `GHS ${price.toFixed(2)}`;
}

// Function to create product card HTML
function createProductCard(product) {
  const hasSale = product.salePrice && product.salePrice < product.price;
  // Check if product is in wishlist
  let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  const inWishlist = wishlist.includes(product.id);

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
                <a href="wishlist.html" class="wishlist-btn">
                  <i class="${
                    inWishlist ? "fa-solid" : "fa-light"
                  } fa-heart"></i>
                </a>
              </li>
              <li>
                <a href="#" class="btn" data-bs-toggle="modal" data-bs-target="#productQuickView">
                  <i class="fa-regular fa-eye"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="product-desc d-flex flex-column align-items-center justify-content-between">
          <a href="product-detail.html?id=${
            product.id
          }" class="product-title h6 fw-700 mb-8 text-center product-title-truncate">
            ${product.name}
          </a>
          <div class="d-flex align-items-center gap-8 justify-content-center mb-8">
            <div class="rating-stars">
              ${Array(5)
                .fill(
                  `
                  <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"13\" viewBox=\"0 0 14 13\" fill=\"none\">
                    <path d=\"M6.42937 0.826541C6.60898 0.273755 7.39102 0.273757 7.57063 0.826543L8.6614 4.18359C8.74173 4.4308 8.9721 4.59818 9.23204 4.59818H12.7618C13.3431 4.59818 13.5847 5.34195 13.1145 5.68359L10.2588 7.75835C10.0485 7.91114 9.96055 8.18196 10.0409 8.42917L11.1316 11.7862C11.3113 12.339 10.6786 12.7987 10.2083 12.457L7.35267 10.3823C7.14238 10.2295 6.85762 10.2295 6.64733 10.3823L3.79166 12.457C3.32143 12.7987 2.68874 12.339 2.86835 11.7862L3.95912 8.42917C4.03945 8.18196 3.95145 7.91114 3.74116 7.75835L0.885485 5.68359C0.415257 5.34194 0.656924 4.59818 1.23816 4.59818H4.76796C5.0279 4.59818 5.25827 4.4308 5.3386 4.18359L6.42937 0.826541Z" fill=\"#E85F3E\"/>
                  </svg>
                `
                )
                .join("")}
            </div>
            <p class="fw-500">(246)</p>
          </div>
          <div class="d-flex align-items-center gap-8 justify-content-center mb-2">
            <h5 class="medium-black fw-700 mb-0">${formatPrice(
              hasSale ? product.salePrice : product.price
            )}</h5>
            ${
              hasSale
                ? `<span class=\"text-decoration-line-through ms-2\">${formatPrice(
                    product.price
                  )}</span>`
                : ""
            }
          </div>
          <button class="cus-btn add-to-cart-btn w-100 mt-auto" data-product-id="${
            product.id
          }" style="background-color:#04d2e4; color:#fff;">Add to Cart</button>
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
    totalPages = Math.max(1, Math.ceil(allProducts.length / PRODUCTS_PER_PAGE));
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

  const paginationUl = document.createElement("ul");
  paginationUl.id = "border-pagination";

  // Previous button
  if (currentPage > 1) {
    const prevLi = document.createElement("li");
    const prevA = document.createElement("a");
    prevA.href = "#";
    prevA.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    prevA.dataset.page = currentPage - 1;
    prevLi.appendChild(prevA);
    paginationUl.appendChild(prevLi);
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    const pageA = document.createElement("a");
    pageA.href = "#";
    pageA.textContent = i;
    pageA.dataset.page = i;
    pageLi.appendChild(pageA);
    paginationUl.appendChild(pageLi);
  }

  // Next button
  if (currentPage < totalPages) {
    const nextLi = document.createElement("li");
    const nextA = document.createElement("a");
    nextA.href = "#";
    nextA.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    nextA.dataset.page = currentPage + 1;
    nextLi.appendChild(nextA);
    paginationUl.appendChild(nextLi);
  }

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

// Build categories object from products
function buildCategoriesFromProducts(products) {
  const categories = {};
  products.forEach((product) => {
    const cat = product.category || "Uncategorized";
    const subcat = product.subcategory || "Other";
    if (!categories[cat]) categories[cat] = new Set();
    categories[cat].add(subcat);
  });
  // Convert sets to arrays
  Object.keys(categories).forEach((cat) => {
    categories[cat] = Array.from(categories[cat]);
  });
  return categories;
}

// Render the category accordion dynamically
function renderCategoryAccordion(
  categories,
  selected = { category: [], subcategory: [] }
) {
  const placeholder = document.getElementById("category-accordion-placeholder");
  if (!placeholder) return;
  let menuHTML = '<div class="side-category-menu"><ul class="main-categories">';
  for (const category in categories) {
    menuHTML += `
      <li class="main-category-item">
        <a href="#">
          <span>${category}</span>
          <i class="fa fa-chevron-right"></i>
        </a>
        <div class="sub-category-panel">
          <h6 class="fw-600 font-sec medium-black">${category}</h6>
          <hr>
          <div class="sub-category-columns">
            ${categories[category]
              .map((subcategory) => {
                const subcategoryId = subcategory
                  .replace(/[^a-zA-Z0-9]/g, "-")
                  .toLowerCase();
                const checked = selected.subcategory.includes(subcategory)
                  ? "checked"
                  : "";
                return `
                <div class="cus-checkBox mb-12">
                    <input type="checkbox" id="cat-${subcategoryId}" class="inp-cbx category-filter" name="subcategory" value="${subcategory}" ${checked}>
                    <label for="cat-${subcategoryId}" class="cbx">${subcategory}</label>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
      </li>
    `;
  }
  menuHTML += "</ul></div>";
  placeholder.innerHTML = menuHTML;
}

function renderAllCategoriesDropdown(categories) {
  console.log("Dropdown categories:", categories); // Debug
  const dropdown = document.getElementById("allCategoriesDropdown");
  if (!dropdown) return;
  let html = '<ul class="all-categories-list">';
  for (const category in categories) {
    html += `<li class="dropdown-category">
      <span class="category-title">${category}</span>
      <ul class="subcategories-list">`;
    categories[category].forEach((subcat) => {
      const isActive = filterState.subcategories.includes(subcat)
        ? "active"
        : "";
      html += `<li class="subcategory-item ${isActive}" data-subcat="${subcat}">${subcat}</li>`;
    });
    html += "</ul></li>";
  }
  html += "</ul>";
  dropdown.innerHTML = html;
  console.log("Dropdown HTML:", dropdown.innerHTML); // Debug

  // Add click handlers to subcategory items
  dropdown.querySelectorAll(".subcategory-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.stopPropagation();
      const subcat = this.getAttribute("data-subcat");
      // Toggle subcategory filter
      if (filterState.subcategories.includes(subcat)) {
        filterState.subcategories = filterState.subcategories.filter(
          (s) => s !== subcat
        );
      } else {
        filterState.subcategories = [subcat]; // Only one at a time for dropdown
      }
      updateProductListWithFilters(allProducts);
      // Re-render dropdown to update active state
      renderAllCategoriesDropdown(categories);
      // Hide dropdown after selection
      dropdown.style.display = "none";
    });
  });
}

async function initShopPage() {
  const allFetchedProducts = await fetchAllProducts();
  const categories = buildCategoriesFromProducts(allFetchedProducts);
  renderCategoryAccordion(categories);
  renderAllCategoriesDropdown(categories);
  setupCategoryFilterListeners(allFetchedProducts);
  setupPriceFilterListeners(allFetchedProducts);
  setupOtherFilterListeners(allFetchedProducts);
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
  // No JS for dropdown show/hide; CSS :hover will handle it

  // Wishlist functionality
  productsList.addEventListener("click", function (e) {
    const heartIcon = e.target.closest(".fa-heart");
    if (heartIcon) {
      e.preventDefault();
      const productCard = heartIcon.closest(".latest-product-card");
      if (!productCard) return;
      // Find the product ID from the product detail link
      const detailLink = productCard.querySelector("a.image");
      if (!detailLink) return;
      const url = new URL(detailLink.href, window.location.origin);
      const productId = url.searchParams.get("id");
      if (!productId) return;
      // Get wishlist from localStorage
      let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        showToast("Added to wishlist!");
        // Update heart icon to filled
        heartIcon.classList.remove("fa-light");
        heartIcon.classList.add("fa-solid");
      } else {
        showToast("Already in wishlist!");
      }
    }
  });
});
