// This file will handle the product search functionality.
import {
  db,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search");
  const searchForm = searchInput.closest("form");
  const searchResultsContainer = document.createElement("div");
  searchResultsContainer.classList.add("search-results-dropdown");
  searchInput.parentElement.appendChild(searchResultsContainer);

  let searchTimeout;

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm.length > 2) {
      searchTimeout = setTimeout(() => {
        fetchProducts(searchTerm);
      }, 300);
    } else {
      clearResults();
    }
  });

  async function fetchProducts(searchTerm) {
    try {
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("isActive", "==", true),
        where("lowercase_name", ">=", searchTerm),
        where("lowercase_name", "<=", searchTerm + "\uf8ff"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });

      const filteredProducts = products.filter((p) => {
        // Handle potential trailing space in the Firestore field name
        const name = p.lowercase_name || p["lowercase_name "];
        return (
          name && typeof name === "string" && name.trim().includes(searchTerm)
        );
      });

      displayResults(filteredProducts);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }

  function displayResults(products) {
    clearResults();
    if (products.length > 0) {
      const list = document.createElement("ul");
      products.forEach((product) => {
        const listItem = document.createElement("li");
        const link = document.createElement("a");
        link.href = `product-detail.html?id=${product.id}`;

        const img = document.createElement("img");
        img.src = product.featuredImage || "assets/media/placeholder.jpg";
        img.alt = product.name;
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.marginRight = "10px";

        link.appendChild(img);

        const text = document.createElement("span");
        text.textContent = product.name;
        link.appendChild(text);

        listItem.appendChild(link);
        list.appendChild(listItem);
      });
      searchResultsContainer.appendChild(list);
      searchResultsContainer.style.display = "block";
    } else {
      const noResults = document.createElement("p");
      noResults.textContent = "No products found.";
      searchResultsContainer.appendChild(noResults);
      searchResultsContainer.style.display = "block";
    }
  }

  function clearResults() {
    searchResultsContainer.innerHTML = "";
    searchResultsContainer.style.display = "none";
  }

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      window.location.href = `shop.html?search=${encodeURIComponent(
        searchTerm
      )}`;
    }
  });

  document.addEventListener("click", function (e) {
    if (!searchInput.contains(e.target)) {
      clearResults();
    }
  });
});
