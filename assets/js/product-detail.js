import { db, doc, getDoc } from "./firebase-config.js";
import { addToCart, showToast, updateCartBadge } from "./cart.js";

// Function to format price
function formatPrice(price) {
  return `GHS ${price.toFixed(2)}`;
}

// Function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  const results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Function to update product details in the UI
function updateProductDetails(product) {
  try {
    // Update product name
    const productNameElement = document.getElementById("productName");
    if (productNameElement) {
      productNameElement.textContent = product.name;
    }

    // Update price
    const priceElement = document.getElementById("price");
    const salePriceElement = document.getElementById("salePrice");

    if (priceElement) {
      if (product.salePrice && product.salePrice < product.price) {
        priceElement.textContent = formatPrice(product.salePrice);
        if (salePriceElement) {
          salePriceElement.textContent = formatPrice(product.price);
          salePriceElement.style.display = "block";
        }
      } else {
        priceElement.textContent = formatPrice(product.price);
        if (salePriceElement) {
          salePriceElement.style.display = "none";
        }
      }
    }

    // Update product code
    const productCodeElement = document.getElementById("productCode");
    if (productCodeElement) {
      productCodeElement.textContent = product.productCode;
    }

    // Update descriptions
    const shortDescriptionElement = document.getElementById("shortDescription");
    if (shortDescriptionElement) {
      shortDescriptionElement.innerHTML = product.shortDescription;
    }

    const longDescriptionElement = document.getElementById("longDescription");
    if (longDescriptionElement) {
      longDescriptionElement.innerHTML = product.longDescription;
    }

    // Update product images
    const mainSlider = document.querySelector(".product-detail-slider");
    const navSlider = document.querySelector(".product-slider-asnav");

    if (mainSlider && navSlider) {
      // Clear existing images
      mainSlider.innerHTML = "";
      navSlider.innerHTML = "";

      // Add featured image
      mainSlider.innerHTML += `
        <div class="detail-image">
          <img src="${product.featuredImage}" alt="${product.name}" loading="lazy">
        </div>
      `;
      navSlider.innerHTML += `
        <div class="nav-image">
          <img src="${product.featuredImage}" alt="${product.name}" loading="lazy">
        </div>
      `;

      // Add other images if they exist
      if (product.otherImages && product.otherImages.length > 0) {
        product.otherImages.forEach((image) => {
          mainSlider.innerHTML += `
            <div class="detail-image">
              <img src="${image}" alt="${product.name}" loading="lazy">
            </div>
          `;
          navSlider.innerHTML += `
            <div class="nav-image">
              <img src="${image}" alt="${product.name}" loading="lazy">
            </div>
          `;
        });
      }

      // Initialize sliders after updating content
      initializeSliders();
    }

    // Add event listeners for add to cart buttons
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const quantityInput = document.querySelector(".quantity .number");
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        addToCart(product, quantity);
        showToast(`${product.name} added to cart successfully!`);
      });
    });
  } catch (error) {
    console.error("Error updating product details:", error);
    showToast("Error loading product details. Please try again.", "error");
  }
}

// Function to initialize sliders
function initializeSliders() {
  // Check if jQuery and Slick are loaded
  if (typeof jQuery === "undefined" || typeof jQuery.fn.slick === "undefined") {
    console.warn("jQuery or Slick slider not loaded yet. Retrying in 500ms...");
    setTimeout(initializeSliders, 500);
    return;
  }

  try {
    // Destroy existing sliders if they exist
    if (jQuery(".product-detail-slider").hasClass("slick-initialized")) {
      jQuery(".product-detail-slider").slick("unslick");
    }
    if (jQuery(".product-slider-asnav").hasClass("slick-initialized")) {
      jQuery(".product-slider-asnav").slick("unslick");
    }

    // Initialize main slider
    jQuery(".product-detail-slider").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      fade: true,
      asNavFor: ".product-slider-asnav",
    });

    // Initialize navigation slider
    jQuery(".product-slider-asnav").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      asNavFor: ".product-detail-slider",
      dots: false,
      centerMode: false,
      focusOnSelect: true,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 576,
          settings: {
            slidesToShow: 2,
          },
        },
      ],
    });
  } catch (error) {
    console.error("Error initializing sliders:", error);
  }
}

// Function to load product details
async function loadProductDetails() {
  const productId = getUrlParameter("id");

  if (!productId) {
    console.error("No product ID provided");
    return;
  }

  try {
    const productDoc = await getDoc(doc(db, "products", productId));

    if (productDoc.exists()) {
      const product = { id: productDoc.id, ...productDoc.data() };
      updateProductDetails(product);
    } else {
      console.error("Product not found");
    }
  } catch (error) {
    console.error("Error loading product details:", error);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadProductDetails();
  updateCartBadge(); // Update cart badge on page load
});
