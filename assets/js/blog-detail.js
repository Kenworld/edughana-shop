import {
  db,
  doc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
} from "./firebase-config.js";

function getBlogId() {
  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get("id");
  if (!id) {
    id = localStorage.getItem("selectedBlogId");
  }
  return id;
}

function formatDate(ts) {
  if (!ts) return "";
  if (ts.toDate) {
    const date = ts.toDate();
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return "";
}

async function renderLatestPosts(currentBlogId) {
  const latestPosts = document.getElementById("latestPosts");
  if (!latestPosts) return;
  latestPosts.innerHTML =
    '<div style="width:100%;text-align:center;">Loading...</div>';
  try {
    const blogsRef = collection(db, "blogs");
    const q = query(blogsRef, orderBy("createdAt", "desc"), limit(6)); // Fetch more than 3 in case current is in top 3
    const snapshot = await getDocs(q);
    const blogs = snapshot.docs
      .filter((doc) => doc.id !== currentBlogId)
      .slice(0, 3)
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          featuredImage:
            data.featuredImage || "assets/media/collections/main-col-1.png",
          createdAt: data.createdAt,
        };
      });
    if (blogs.length === 0) {
      latestPosts.innerHTML =
        '<div style="width:100%;text-align:center;">No recent blogs.</div>';
      return;
    }
    latestPosts.innerHTML = blogs
      .map(
        (blog) => `
      <a href="blog-detail.html?id=${encodeURIComponent(
        blog.id
      )}" class="recent-blogs d-flex gap-12 align-items-center mb-16" data-id="${
          blog.id
        }">
        <div class="image-box d-flex flex-shrink-0">
          <img src="${blog.featuredImage}" alt="${blog.title}" class="br-5">
        </div>
        <div>
          <p class="text mb-8">${blog.title}</p>
          <p class="subtitle fw-500 light-gray">${formatDate(
            blog.createdAt
          )}</p>
        </div>
      </a>
    `
      )
      .join("");
    // Store blog id in localStorage on click for detail navigation
    latestPosts.querySelectorAll("a[data-id]").forEach((link) => {
      link.addEventListener("click", function () {
        localStorage.setItem("selectedBlogId", this.getAttribute("data-id"));
      });
    });
  } catch (err) {
    latestPosts.innerHTML = `<div style='color:red;text-align:center;'>Failed to load latest blogs: ${err.message}</div>`;
  }
}

async function renderBlogDetail() {
  const blogDetails = document.getElementById("blogDetails");
  if (!blogDetails) return;
  blogDetails.innerHTML =
    '<div style="width:100%;text-align:center;">Loading...</div>';

  const blogId = getBlogId();
  if (!blogId) {
    blogDetails.innerHTML =
      '<div style="color:red;text-align:center;">No blog selected.</div>';
    return;
  }

  try {
    const blogRef = doc(db, "blogs", blogId);
    const blogSnap = await getDoc(blogRef);
    if (!blogSnap.exists()) {
      blogDetails.innerHTML =
        '<div style="color:red;text-align:center;">Blog not found.</div>';
      return;
    }
    let {
      featuredImage = "assets/media/collections/main-col-1.png",
      title = "",
      content = "",
      author = "Unknown",
      createdAt = null,
      otherImages = [],
      tags = [],
    } = blogSnap.data();
    if (!Array.isArray(tags)) tags = tags ? [tags] : [];
    if (!Array.isArray(otherImages))
      otherImages = otherImages ? [otherImages] : [];
    const dateStr = formatDate(createdAt);
    blogDetails.innerHTML = `
      <div class="main-image mb-24">
        <img src="${featuredImage}" alt="${title}" class="w-100 br-10" id="featuredimage">
      </div>
      <h1 class="fw-500 medium-black text-sm-start text-center">${title}</h1>
      <p class="mb-12 subtitle light-gray">${dateStr} • ${author}</p>
      <div class="mb-12">${content.replace(/\n/g, "<br>")}</div>
      ${
        tags.length
          ? `<div class=\"mb-12\"><strong>Tags:</strong> ${tags
              .map((t) => `<span class='badge bg-secondary mx-1'>${t}</span>`)
              .join("")}</div>`
          : ""
      }
      ${
        otherImages.length
          ? `<div class=\"mb-12\"><strong>Gallery:</strong><div class='d-flex flex-wrap gap-2 mt-2'>${otherImages
              .map(
                (img) =>
                  `<img src='${img}' alt='Other image' style='max-width:120px;max-height:80px;border-radius:6px;'>`
              )
              .join("")}</div></div>`
          : ""
      }
    `;
    // Render latest posts in sidebar
    renderLatestPosts(blogId);
  } catch (err) {
    blogDetails.innerHTML = `<div style='color:red;text-align:center;'>Failed to load blog: ${err.message}</div>`;
    const latestPosts = document.getElementById("latestPosts");
    if (latestPosts) latestPosts.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", renderBlogDetail);
