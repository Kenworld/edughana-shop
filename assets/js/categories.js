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
          .map((cat, idx) => {
            const subcats = categories[cat];
            const hasRealSubcats =
              subcats.length > 1 ||
              (subcats.length === 1 && subcats[0] !== "Other");
            return `
                <li class="main-category-item${
                  hasRealSubcats ? "" : " no-subcat"
                }" data-category="${cat}" tabindex="0">
                  <span class="category-title">${cat}</span>
                </li>
              `;
          })
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
    const subcats = categories[category];
    // Only show panel if there are real subcategories
    if (
      !subcats ||
      subcats.length === 0 ||
      (subcats.length === 1 && subcats[0] === "Other")
    ) {
      subcategoriesPanel.innerHTML = "";
      return;
    }
    let subcatHtml = `<ul class="subcategories-list">`;
    subcats.forEach((subcat) => {
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
          onSubcategorySelect(subcat, false); // false = subcategory
        }
      });
    });
  }

  // Desktop: show subcategories on hover (only for categories with real subcats)
  mainCategoryItems.forEach((item) => {
    const cat = item.getAttribute("data-category");
    const subcats = categories[cat];
    const hasRealSubcats =
      subcats.length > 1 || (subcats.length === 1 && subcats[0] !== "Other");
    if (hasRealSubcats) {
      item.addEventListener("mouseenter", function () {
        showSubcategories(cat);
      });
    }
  });

  // Mobile: show subcategories on click (only for categories with real subcats)
  mainCategoryItems.forEach((item) => {
    const cat = item.getAttribute("data-category");
    const subcats = categories[cat];
    const hasRealSubcats =
      subcats.length > 1 || (subcats.length === 1 && subcats[0] !== "Other");
    if (hasRealSubcats) {
      item.addEventListener("click", function (e) {
        if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
          e.preventDefault();
          showSubcategories(cat);
        }
      });
    } else {
      // For categories with no real subcats, clicking triggers the callback directly
      item.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof onSubcategorySelect === "function") {
          onSubcategorySelect(cat, true); // true = main category
        }
      });
    }
  });

  // Optionally, show the first category's subcategories by default (desktop)
  const firstCat = mainCategoryItems[0]?.getAttribute("data-category");
  const firstSubcats = firstCat ? categories[firstCat] : [];
  const firstHasRealSubcats =
    firstSubcats &&
    (firstSubcats.length > 1 ||
      (firstSubcats.length === 1 && firstSubcats[0] !== "Other"));
  if (
    mainCategoryItems.length > 0 &&
    !window.matchMedia("(hover: none) and (pointer: coarse)").matches &&
    firstHasRealSubcats
  ) {
    showSubcategories(firstCat);
  } else {
    subcategoriesPanel.innerHTML = "";
  }
}
