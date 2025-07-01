import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "./firebase-config.js";
import { addToCart, showToast } from "./cart.js";

// Function to format price
function formatPrice(price) {
  return `GHS ${price.toFixed(2)}`;
}

// Function to create product card HTML
function createProductCard(product) {
  const hasSale = product.salePrice && product.salePrice < product.price;
  const currentPrice = hasSale ? product.salePrice : product.price;
  const reviewCount = product.reviews?.length || 0;
  const rating = product.rating || 0;

  return `
    <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
      <div class="product-card shadow-sm rounded-3 p-2 h-100 d-flex flex-column bg-white">
        <div class="position-relative">
          <a href="product-detail.html?id=${product.id}" class="image">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" data-src="${
            product.featuredImage
          }" class="img-fluid rounded-3 product-image lazy w-100" alt="${
    product.name
  }" style="aspect-ratio:1/1;object-fit:cover;">
          ${
            hasSale
              ? '<span class="badge bg-danger position-absolute top-0 start-0 m-2">Sale</span>'
              : ""
          }
          <button class="btn btn-light position-absolute top-0 end-0 m-2 quick-view-btn" data-product-id="${
            product.id
          }" title="Quick View">
            <i class="fa-regular fa-eye"></i>
          </button>
          <button class="btn btn-light position-absolute bottom-0 end-0 m-2 wishlist-btn" title="Add to Wishlist">
            <i class="fa-light fa-heart"></i>
          </button>
        </div>
        <div class="mt-3 flex-grow-1 d-flex flex-column">
          <h6 class="fw-bold text-truncate mb-1" title="${product.name}">${
    product.name
  }</h6>
          <div class="mb-1">
            <span class="fw-bold text-danger me-2">${formatPrice(
              currentPrice
            )}</span>
            ${
              hasSale
                ? `<span class="text-muted text-decoration-line-through">${formatPrice(
                    product.price
                  )}</span>`
                : ""
            }
          </div>
          <div class="mb-2 small text-warning">
            ${"★".repeat(Math.round(rating))}${"☆".repeat(
    5 - Math.round(rating)
  )} <span class="text-muted">(${reviewCount})</span>
          </div>
          <button class="btn  w-100 mt-auto add-to-cart-btn" data-product-id="${
            product.id
          }" style="background-color:#04d2e4">Add to Cart</button>
        </div>
        </a>
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
  const currentPrice = hasSale ? product.salePrice : product.price;

  // Update modal content
  document.getElementById("quickViewImage").src = product.featuredImage;
  document.getElementById("quickViewImage").alt = product.name;
  document.getElementById("quickViewTitle").textContent = product.name;
  document.getElementById("quickViewPrice").textContent =
    formatPrice(currentPrice);

  const reviewsElement = document.getElementById("quickViewReviews");
  if (reviewsElement) {
    reviewsElement.textContent = `(${
      product.reviews?.length || 0
    } Customer Reviews)`;
  }

  const salePriceElement = document.getElementById("quickViewSalePrice");
  if (hasSale) {
    salePriceElement.textContent = formatPrice(product.price);
    salePriceElement.style.display = "inline-block";
  } else {
    salePriceElement.style.display = "none";
  }

  document.getElementById("quickViewDescription").innerHTML =
    product.shortDescription || "No description available";
  document.getElementById("quickViewStock").textContent =
    product.stockQuantity > 0
      ? `${product.stockQuantity} in stock, ready to ship`
      : "Out of stock";

  // Reset quantity to 1
  const quantityInput = document.getElementById("quickViewQuantity");
  if (quantityInput) {
    quantityInput.value = 1;
    updateQuickViewSubtotal(currentPrice, 1);
  }

  // Add event listener for add to cart button
  const addToCartBtn = document.getElementById("quickViewAddToCart");
  if (addToCartBtn) {
    // Remove any existing event listeners
    const newAddToCartBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);

    newAddToCartBtn.onclick = () => {
      const quantity =
        parseInt(document.getElementById("quickViewQuantity").value) || 1;
      addToCart(product, quantity);

      // Close modal
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    };
  }

  // Add event listeners for quantity buttons
  const minusBtn = modal.querySelector(".quantity-btn.minus");
  const plusBtn = modal.querySelector(".quantity-btn.plus");

  if (minusBtn && plusBtn && quantityInput) {
    // Remove any existing event listeners
    const newMinusBtn = minusBtn.cloneNode(true);
    const newPlusBtn = plusBtn.cloneNode(true);
    minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);
    plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);

    newMinusBtn.onclick = () => {
      const currentValue = parseInt(quantityInput.value) || 1;
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
        updateQuickViewSubtotal(currentPrice, currentValue - 1);
      }
    };

    newPlusBtn.onclick = () => {
      const currentValue = parseInt(quantityInput.value) || 1;
      quantityInput.value = currentValue + 1;
      updateQuickViewSubtotal(currentPrice, currentValue + 1);
    };

    // Add event listener for direct quantity input
    quantityInput.addEventListener("change", () => {
      const currentValue = parseInt(quantityInput.value) || 1;
      updateQuickViewSubtotal(currentPrice, currentValue);
    });
  }
}

// Helper function to update subtotal in quick view
function updateQuickViewSubtotal(price, quantity) {
  const subtotalElement = document.getElementById("quickViewSubtotal");
  if (subtotalElement) {
    subtotalElement.textContent = formatPrice(price * quantity);
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
async function OnSaleProducts() {
  try {
    const productsQuery = query(
      collection(db, "products"),
      where("isActive", "==", true),
      where("salePrice", ">", 0),
      orderBy("createdAt", "desc"),
      limit(8)
    );

    const querySnapshot = await getDocs(productsQuery);
    const products = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.salePrice && data.salePrice < data.price) {
        products.push({ id: doc.id, ...data });
      }
    });

    return products;
  } catch (error) {
    console.error("Error fetching Onsales products:", error);
    return [];
  }
}

// Function to display featured products
async function displayFeaturedProducts() {
  try {
    const featuredProductsContainer = document.querySelector(
      ".onSaleProductsContainer"
    );
    if (!featuredProductsContainer) return;

    // Create quick view modal
    createQuickViewModal();

    // Fetch On sale products
    const products = await OnSaleProducts();

    if (products.length === 0) {
      featuredProductsContainer.innerHTML =
        '<div class="text-center"><p>No sale products found</p></div>';
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
        e.preventDefault(); // Prevent form submission if button is in a form
        const productId = e.currentTarget.dataset.productId;
        const product = products.find((p) => p.id === productId);
        if (product) {
          addToCart(product, 1);
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
          const modal = new bootstrap.Modal(
            document.getElementById("productQuickView")
          );
          modal.show();
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
    console.error("Error displaying sale products:", error);
    const container = document.querySelector(".onSaleProductsContainer");
    if (container) {
      container.innerHTML =
        '<div class="text-center"><p>Error loading sale products</p></div>';
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
