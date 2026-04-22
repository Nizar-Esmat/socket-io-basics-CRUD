const socket = io("http://localhost:3000");

// ── Connection state ───────────────────────────────────────────────────────────

socket.on("connect", () => {
  $("#conn-dot").removeClass("bg-red-500").addClass("bg-green-400");
  $("#conn-label").text("Connected");
  socket.emit("getPosts");
});

socket.on("disconnect", () => {
  $("#conn-dot").removeClass("bg-green-400").addClass("bg-red-500");
  $("#conn-label").text("Disconnected");
});

// ── Toast helper ───────────────────────────────────────────────────────────────

const TOAST_COLORS = {
  info:    "bg-indigo-600",
  success: "bg-green-600",
  warning: "bg-yellow-500 text-slate-900",
  danger:  "bg-red-600",
};

function showToast(msg, type = "info") {
  const $toast = $(`
    <div class="toast-enter pointer-events-auto ${TOAST_COLORS[type]} text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
      <span>${msg}</span>
    </div>`);

  $("#toasts").append($toast);
  setTimeout(() => $toast.fadeOut(300, () => $toast.remove()), 3000);
}

// ── Post card builder ──────────────────────────────────────────────────────────

function buildCard(post) {
  const safeTitle   = $("<div>").text(post.title).html();
  const safeContent = $("<div>").text(post.content).html();

  return $(`
    <div class="card-enter bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-600 transition"
         data-id="${post._id}">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold text-sm leading-snug line-clamp-2">${safeTitle}</h3>
        <span class="text-slate-600 text-xs shrink-0 mt-0.5">#${post._id.slice(-4)}</span>
      </div>
      <p class="text-slate-400 text-xs leading-relaxed line-clamp-3">${safeContent}</p>
      <div class="flex gap-2 mt-auto pt-2 border-t border-slate-800">
        <button class="edit-btn flex-1 text-xs py-1.5 rounded-lg bg-slate-800 hover:bg-yellow-500 hover:text-slate-900 transition font-medium">
          Edit
        </button>
        <button class="delete-btn flex-1 text-xs py-1.5 rounded-lg bg-slate-800 hover:bg-red-600 transition font-medium">
          Delete
        </button>
      </div>
    </div>`);
}

// ── Render posts grid ──────────────────────────────────────────────────────────

function renderPosts(posts) {
  $("#loader").hide();
  const $grid = $("#posts-grid").empty();

  if (!posts || posts.length === 0) {
    $("#empty-state").show();
    return;
  }

  $("#empty-state").hide();
  posts.forEach(post => $grid.append(buildCard(post)));
}

// ── Socket: receive posts ──────────────────────────────────────────────────────

socket.on("posts", (posts) => renderPosts(posts));

socket.on("searchResults", (posts) => renderPosts(posts));

// ── Socket: real-time broadcasts ──────────────────────────────────────────────

socket.on("postCreated", ({ post }) => {
  $("#empty-state").hide();
  $("#loader").hide();
  $("#posts-grid").prepend(buildCard(post));
  showToast("✨ New post created", "success");
});

socket.on("postDeleted", ({ postId }) => {
  const $card = $(`[data-id="${postId}"]`);
  $card.addClass("card-leave");

  setTimeout(() => {
    $card.remove();
    if ($("#posts-grid").children().length === 0) $("#empty-state").show();
  }, 200);

  showToast("🗑️ Post deleted", "danger");
});

socket.on("postUpdated", ({ postId, title, content }) => {
  const $card = $(`[data-id="${postId}"]`);
  $card.find("h3").text(title);
  $card.find("p").text(content);
  showToast("✏️ Post updated", "warning");
});

// ── Create post ────────────────────────────────────────────────────────────────

$("#create-form").on("submit", function (e) {
  e.preventDefault();
  const title   = $("#new-title").val().trim();
  const content = $("#new-content").val().trim();

  if (!title || !content) {
    showToast("Title and content are required", "danger");
    return;
  }

  socket.emit("createPost", { title, content });
  $("#new-title").val("");
  $("#new-content").val("");
});

// ── Delete post ────────────────────────────────────────────────────────────────

$("#posts-grid").on("click", ".delete-btn", function () {
  const postId = $(this).closest("[data-id]").data("id");
  if (!confirm("Delete this post?")) return;
  socket.emit("deletePost", postId);
});

// ── Edit modal: open ───────────────────────────────────────────────────────────

$("#posts-grid").on("click", ".edit-btn", function () {
  const $card   = $(this).closest("[data-id]");
  const postId  = $card.data("id");
  const title   = $card.find("h3").text();
  const content = $card.find("p").text();

  $("#edit-id").val(postId);
  $("#edit-title").val(title);
  $("#edit-content").val(content);
  $("#edit-modal").removeClass("hidden");
});

// ── Edit modal: close ──────────────────────────────────────────────────────────

$("#cancel-edit, #edit-modal").on("click", function (e) {
  if (e.target === this) $("#edit-modal").addClass("hidden");
});

// ── Edit post: submit ──────────────────────────────────────────────────────────

$("#edit-form").on("submit", function (e) {
  e.preventDefault();
  const postId  = $("#edit-id").val();
  const title   = $("#edit-title").val().trim();
  const content = $("#edit-content").val().trim();

  if (!title || !content) {
    showToast("Title and content are required", "danger");
    return;
  }

  socket.emit("updatePost", { postId, title, content });
  $("#edit-modal").addClass("hidden");
});

// ── Search (debounced 300ms) ───────────────────────────────────────────────────

let searchTimer;

$("#search-input").on("input", function () {
  clearTimeout(searchTimer);
  const term = $(this).val().trim();

  searchTimer = setTimeout(() => {
    if (term === "") {
      socket.emit("getPosts");
    } else {
      socket.emit("searchPosts", term);
    }
  }, 300);
});
