import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { addToCart, showToast } from "./cart.js";

const firebaseConfig = {
  apiKey: "AIzaSyDc7xbG23UV8JN-KKpsJydorSeNw6gaOwM",
  authDomain: "edughana-570cf.firebaseapp.com",
  projectId: "edughana-570cf",
  storageBucket: "edughana-570cf.firebasestorage.app",
  messagingSenderId: "587349854173",
  appId: "1:587349854173:web:79ee3e4f72b3a7d03bd834",
  measurementId: "G-TKH2JVMRBK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to format price
function formatPrice(price) {
  return `GHS ${price.toFixed(2)}`;
}

// Function to create product card HTML
function createProductCard(product) {
  const hasSale = product.salePrice && product.salePrice < product.price;

  return `
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
              <a href="#" class="btn quick-view-btn" data-product-id="${
                product.id
              }" data-bs-toggle="modal" data-bs-target="#productQuickView">
                <i class="fa-regular fa-eye"></i>
              </a>
            </li>
          </ul>
        </div>
        <button class="cus-btn add-to-cart-btn" data-product-id="${product.id}">
          <span class="btn-text">Add Cart</span>
          <span>Go to Cart</span>
        </button>
      </div>
      <div class="product-desc">
        <div>
          <a href="product-detail.html?id=${
            product.id
          }" class="product-title h6 fw-700 mb-8">${product.name}</a>
          <div class="d-flex align-items-center gap-8 justify-content-center mb-8">
            <div class="rating-stars">
              ${Array(5)
                .fill()
                .map(
                  () => `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="13" viewBox="0 0 14 13" fill="none">
                  <path d="M6.42937 0.826541C6.60898 0.273755 7.39102 0.273757 7.57063 0.826543L8.6614 4.18359C8.74173 4.4308 8.9721 4.59818 9.23204 4.59818H12.7618C13.3431 4.59818 13.5847 5.34195 13.1145 5.68359L10.2588 7.75835C10.0485 7.91114 9.96055 8.18196 10.0409 8.42917L11.1316 11.7862C11.3113 12.339 10.6786 12.7987 10.2083 12.457L7.35267 10.3823C7.14238 10.2295 6.85762 10.2295 6.64733 10.3823L3.79166 12.457C3.32143 12.7987 2.68874 12.339 2.86835 11.7862L3.95912 8.42917C4.03945 8.18196 3.95145 7.91114 3.74116 7.75835L0.885485 5.68359C0.415257 5.34194 0.656924 4.59818 1.23816 4.59818H4.76796C5.0279 4.59818 5.25827 4.4308 5.3386 4.18359L6.42937 0.826541Z" fill="#E85F3E"/>
                </svg>
              `
                )
                .join("")}
            </div>
            <p class="fw-500">(${product.reviews?.length || 0})</p>
          </div>
          <h5 class="medium-black fw-700">${formatPrice(
            hasSale ? product.salePrice : product.price
          )}</h5>
        </div>
      </div>
    </div>
  `;
}

// Function to create quick view modal HTML
function createQuickViewModal() {
  const modalHTML = `
    <div class="modal fade" id="productQuickView" tabindex="-1" aria-labelledby="productQuickViewLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="productQuickViewLabel">Product Quick View</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <div class="quick-view-image">
                  <img src="" alt="" class="img-fluid" id="quickViewImage">
                </div>
              </div>
              <div class="col-md-6">
                <div class="quick-view-details">
                  <h3 class="product-title mb-3" id="quickViewTitle"></h3>
                  <div class="price mb-3">
                    <span class="current-price" id="quickViewPrice"></span>
                    <span class="old-price" id="quickViewSalePrice"></span>
                  </div>
                  <div class="description mb-4" id="quickViewDescription"></div>
                  <div class="quantity mb-4">
                    <label class="form-label">Quantity:</label>
                    <div class="quantity-input">
                      <button class="quantity-btn minus">-</button>
                      <input type="number" class="form-control" value="1" min="1" id="quickViewQuantity">
                      <button class="quantity-btn plus">+</button>
                    </div>
                  </div>
                  <button class="btn btn-primary add-to-cart-quick-view" id="quickViewAddToCart">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to body if it doesn't exist
  if (!document.getElementById("productQuickView")) {
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

// Function to update quick view modal with product details
function updateQuickView(product) {
  const modal = document.getElementById("productQuickView");
  if (!modal) return;

  const hasSale = product.salePrice && product.salePrice < product.price;

  // Update modal content
  document.getElementById("quickViewImage").src = product.featuredImage;
  document.getElementById("quickViewImage").alt = product.name;
  document.getElementById("quickViewTitle").textContent = product.name;
  document.getElementById("quickViewPrice").textContent = formatPrice(
    hasSale ? product.salePrice : product.price
  );

  const salePriceElement = document.getElementById("quickViewSalePrice");
  if (hasSale) {
    salePriceElement.textContent = formatPrice(product.price);
    salePriceElement.style.display = "inline-block";
    salePriceElement.style.textDecoration = "line-through";
    salePriceElement.style.marginLeft = "10px";
    salePriceElement.style.color = "#999";
  } else {
    salePriceElement.style.display = "none";
  }

  document.getElementById("quickViewDescription").innerHTML =
    product.shortDescription || "No description available";

  // Add event listener for add to cart button
  const addToCartBtn = document.getElementById("quickViewAddToCart");
  if (addToCartBtn) {
    addToCartBtn.onclick = () => {
      const quantity =
        parseInt(document.getElementById("quickViewQuantity").value) || 1;
      addToCart(product, quantity);
      showToast(`${product.name} added to cart successfully!`);

      // Close modal
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    };
  }

  // Add event listeners for quantity buttons
  const quantityInput = document.getElementById("quickViewQuantity");
  const minusBtn = modal.querySelector(".quantity-btn.minus");
  const plusBtn = modal.querySelector(".quantity-btn.plus");

  if (minusBtn && plusBtn && quantityInput) {
    minusBtn.onclick = () => {
      const currentValue = parseInt(quantityInput.value) || 1;
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    };

    plusBtn.onclick = () => {
      const currentValue = parseInt(quantityInput.value) || 1;
      quantityInput.value = currentValue + 1;
    };
  }
}

// Function to initialize lazy loading
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
    // Fallback for browsers that don't support IntersectionObserver
    lazyImages.forEach((img) => {
      img.src = img.dataset.src;
      img.classList.remove("lazy");
    });
  }
}

// Function to fetch featured products
async function fetchFeaturedProducts() {
  try {
    const productsQuery = query(
      collection(db, "products"),
      where("isActive", "==", true),
      where("isFeatured", "==", true),
      orderBy("createdAt", "desc"),
      limit(8)
    );

    const querySnapshot = await getDocs(productsQuery);
    const products = [];

    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    return products;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// Function to display featured products
async function displayFeaturedProducts() {
  try {
    const featuredProductsContainer = document.querySelector(
      ".featured-product-slider"
    );
    if (!featuredProductsContainer) return;

    // Create quick view modal
    createQuickViewModal();

    // Fetch featured products
    const products = await fetchFeaturedProducts();

    if (products.length === 0) {
      featuredProductsContainer.innerHTML =
        '<div class="text-center"><p>No featured products found</p></div>';
      return;
    }

    // Display products
    featuredProductsContainer.innerHTML = products
      .map(createProductCard)
      .join("");

    // Initialize lazy loading
    initLazyLoading();

    // Add event listeners for add to cart buttons
    document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const productId = e.currentTarget.dataset.productId;
        const product = products.find((p) => p.id === productId);
        if (product) {
          addToCart(product, 1);
          showToast(`${product.name} added to cart successfully!`);
        }
      });
    });

    // Add event listeners for quick view buttons
    document.querySelectorAll(".quick-view-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const productId = e.currentTarget.dataset.productId;
        const product = products.find((p) => p.id === productId);
        if (product) {
          updateQuickView(product);
        }
      });
    });

    // Initialize slick slider after a small delay to ensure DOM is ready
    setTimeout(() => {
      if (
        typeof jQuery !== "undefined" &&
        typeof jQuery.fn.slick !== "undefined"
      ) {
        // Destroy existing slider if it exists
        if (jQuery(".featured-product-slider").hasClass("slick-initialized")) {
          jQuery(".featured-product-slider").slick("unslick");
        }

        jQuery(".featured-product-slider").slick({
          slidesToShow: 4,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 3000,
          dots: false,
          arrows: false,
          centerPadding: "0",
          cssEase: "linear",
          responsive: [
            {
              breakpoint: 1200,
              settings: {
                slidesToShow: 3,
              },
            },
            {
              breakpoint: 821,
              settings: {
                slidesToShow: 2,
              },
            },
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 1,
              },
            },
          ],
        });
      }
    }, 100);
  } catch (error) {
    console.error("Error displaying featured products:", error);
    const featuredProductsContainer = document.querySelector(
      ".featured-product-slider"
    );
    if (featuredProductsContainer) {
      featuredProductsContainer.innerHTML =
        '<div class="text-center"><p>Error loading featured products</p></div>';
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Wait for jQuery and Slick to be loaded
  const checkDependencies = setInterval(() => {
    if (
      typeof jQuery !== "undefined" &&
      typeof jQuery.fn.slick !== "undefined"
    ) {
      clearInterval(checkDependencies);
      displayFeaturedProducts();
    }
  }, 100);

  // Clear interval after 5 seconds if dependencies don't load
  setTimeout(() => {
    clearInterval(checkDependencies);
  }, 5000);
});
