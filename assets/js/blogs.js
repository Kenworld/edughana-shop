import { db, collection, getDocs, orderBy, query } from "./firebase-config.js";

const BLOGS_PER_PAGE = 6;
let allBlogs = [];
let currentPage = 1;

function createBlogCard(blog, docId) {
  const {
    author = "Unknown",
    content = "",
    createdAt = null,
    featuredImage = "",
    otherImages = [],
    tags = [],
    title = "",
  } = blog;

  let dateStr = "";
  if (createdAt && createdAt.toDate) {
    const date = createdAt.toDate();
    dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Blog detail link with id
  const detailUrl = `blog-detail.html?id=${encodeURIComponent(docId)}`;

  return `
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-6 wow fadeInUp animated" style="min-height: 100%; display: flex;">
      <div class="blog-card" style="display: flex; flex-direction: column; height: 100%;">
        <a href="${detailUrl}" class="blog-image mb-8 blog-detail-link" data-id="${docId}">
          <img src="${
            featuredImage || "assets/media/collections/main-col-1.png"
          }" alt="${title}">
        </a>
        <div class="blog-text" style="flex: 1 1 auto; display: flex; flex-direction: column;">
          <p class="mb-16 fw-500 subtitle light-gray">${dateStr} • ${author}</p>
          <a href="${detailUrl}" class="fw-700 h5 font-sec mb-8 blog-detail-link" data-id="${docId}">${title}</a>
          <p class="mb-24">${
            content.length > 100 ? content.slice(0, 100) + "..." : content
          }</p>
          <a href="${detailUrl}" class="medium-black font-sec fw-600 text-decoration-underline mt-auto blog-detail-link" data-id="${docId}">Read More</a>
        </div>
      </div>
    </div>
  `;
}

function renderPagination(totalBlogs, currentPage) {
  const paginations = document.getElementById("paginations");
  if (!paginations) return;
  const totalPages = Math.ceil(totalBlogs / BLOGS_PER_PAGE);
  if (totalPages <= 1) {
    paginations.innerHTML = "";
    return;
  }
  let html = '<ul id="border-pagination" class="mb-0">';
  for (let i = 1; i <= totalPages; i++) {
    html += `<li><a href="#" class="${
      i === currentPage ? "active" : ""
    }" data-page="${i}">${i.toString().padStart(2, "0")}</a></li>`;
  }
  html += "</ul>";
  paginations.innerHTML = html;

  // Add click listeners
  paginations.querySelectorAll("a[data-page]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const page = parseInt(a.getAttribute("data-page"));
      if (page !== currentPage) {
        renderBlogsPage(page);
      }
    });
  });
}

function renderBlogsPage(page) {
  const blogList = document.getElementById("blogList");
  if (!blogList) return;
  currentPage = page;
  const start = (page - 1) * BLOGS_PER_PAGE;
  const end = start + BLOGS_PER_PAGE;
  const blogsToShow = allBlogs.slice(start, end);
  if (blogsToShow.length === 0) {
    blogList.innerHTML =
      '<div style="width:100%;text-align:center;">No blogs found.</div>';
  } else {
    // Pass docId to createBlogCard
    blogList.innerHTML = blogsToShow
      .map((blog, i) =>
        createBlogCard(
          blog,
          blog.__docId ||
            blog.id ||
            (allBlogs[start + i] && allBlogs[start + i].__docId) ||
            "unknown"
        )
      )
      .join("");
  }
  renderPagination(allBlogs.length, currentPage);

  // Add click listeners to store blog id in localStorage
  blogList.querySelectorAll(".blog-detail-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      const id = this.getAttribute("data-id");
      if (id) localStorage.setItem("selectedBlogId", id);
    });
  });
}

async function renderBlogs() {
  const blogList = document.getElementById("blogList");
  if (!blogList) return;
  blogList.innerHTML =
    '<div style="width:100%;text-align:center;">Loading...</div>';

  try {
    const blogsRef = collection(db, "blogs");
    const q = query(blogsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    // Store docId for each blog
    allBlogs = snapshot.docs.map((doc) => ({ ...doc.data(), __docId: doc.id }));
    renderBlogsPage(1);
  } catch (err) {
    blogList.innerHTML = `<div style='color:red;text-align:center;'>Failed to load blogs: ${err.message}</div>`;
    const paginations = document.getElementById("paginations");
    if (paginations) paginations.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", renderBlogs);
