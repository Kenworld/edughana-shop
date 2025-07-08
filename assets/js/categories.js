// Category utilities for Edu Ghana Shop

/**
 * Build a categories object from a list of products.
 * @param {Array} products - Array of product objects.
 * @returns {Object} categories - { [category]: [subcategories] }
 */
export function buildCategoriesFromProducts(products) {
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

/**
 * Render a dropdown of all categories and subcategories.
 * @param {Object} categories - { [category]: [subcategories] }
 * @param {HTMLElement} dropdownElem - The container element for the dropdown.
 * @param {Object} filterState - The filter state object (with subcategories array).
 * @param {Function} onSubcategorySelect - Callback when a subcategory is selected.
 */
export function renderAllCategoriesDropdown(
  categories,
  dropdownElem,
  filterState,
  onSubcategorySelect
) {
  if (!dropdownElem) return;
  // Initial HTML: main categories list and a subcategory panel
  let html = `
    <div class="all-categories-dropdown-container">
      <ul class="main-categories-list">
        ${Object.keys(categories)
          .map(
            (cat, idx) => `
              <li class="main-category-item" data-category="${cat}" tabindex="0">
                <span class="category-title">${cat}</span>
              </li>
            `
          )
          .join("")}
      </ul>
      <div class="subcategories-panel"></div>
    </div>
  `;
  dropdownElem.innerHTML = html;

  const mainCategoryItems = dropdownElem.querySelectorAll(
    ".main-category-item"
  );
  const subcategoriesPanel = dropdownElem.querySelector(".subcategories-panel");

  // Helper to render subcategories for a given category
  function showSubcategories(category) {
    if (!categories[category]) {
      subcategoriesPanel.innerHTML = "";
      return;
    }
    let subcatHtml = `<ul class="subcategories-list">`;
    categories[category].forEach((subcat) => {
      const isActive =
        filterState.subcategories && filterState.subcategories.includes(subcat)
          ? "active"
          : "";
      subcatHtml += `<li class="subcategory-item ${isActive}" data-subcat="${subcat}">${subcat}</li>`;
    });
    subcatHtml += "</ul>";
    subcategoriesPanel.innerHTML = subcatHtml;

    // Add click handlers to subcategory items
    subcategoriesPanel.querySelectorAll(".subcategory-item").forEach((item) => {
      item.addEventListener("click", function (e) {
        e.stopPropagation();
        const subcat = this.getAttribute("data-subcat");
        if (typeof onSubcategorySelect === "function") {
          onSubcategorySelect(subcat);
        }
      });
    });
  }

  // Desktop: show subcategories on hover
  mainCategoryItems.forEach((item) => {
    item.addEventListener("mouseenter", function () {
      showSubcategories(this.getAttribute("data-category"));
    });
  });

  // Mobile: show subcategories on click
  mainCategoryItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      // Only trigger on click for touch devices
      if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
        e.preventDefault();
        showSubcategories(this.getAttribute("data-category"));
      }
    });
  });

  // Optionally, show the first category's subcategories by default (desktop)
  if (
    mainCategoryItems.length > 0 &&
    !window.matchMedia("(hover: none) and (pointer: coarse)").matches
  ) {
    showSubcategories(mainCategoryItems[0].getAttribute("data-category"));
  }
}
