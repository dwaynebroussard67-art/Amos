(() => {
  const INVENTORY_KEY = "amos_inventory_v1";
  const HERO_KEY = "amos_hero_image_v1";
  const QUOTE_KEY = "amos_quote_requests_v1";
  const defaults = [
    { id: "rainbow-rush", category: "Inflatables", name: "Rainbow Rush Combo", description: "Bounce, climb, and slide in one bright setup.", price: "From $325", image: "assets/images/colorful-inflatable-bounce-house-water-s-1.jpg", badge: "Big favorite" },
    { id: "block-party", category: "Inflatables", name: "Block Party Castle", description: "A classic jump for birthdays and neighborhood days.", price: "From $250", image: "assets/images/colorful-inflatable-bounce-house-water-s-2.jpg", badge: "Classic" },
    { id: "tropical-run", category: "Water slides", name: "Tropical Splash Run", description: "A colorful wet-and-wild lane for hot Louisiana afternoons.", price: "From $375", image: "assets/images/colorful-inflatable-bounce-house-water-s-1.jpg", badge: "Wet or dry" },
    { id: "double-lane", category: "Water slides", name: "Double Lane Rush", description: "Two lanes means more races and less waiting around.", price: "From $425", image: "assets/images/colorful-inflatable-bounce-house-water-s-2.jpg", badge: "New" },
    { id: "dunk-tank", category: "Games & splash", name: "Dunk Tank", description: "The one everybody says they will try once.", price: "From $275", image: "assets/images/colorful-inflatable-bounce-house-water-s-2.jpg", badge: "Crowd pleaser" },
    { id: "water-day", category: "Games & splash", name: "Water Day Setup", description: "A flexible splash zone built around your space and party.", price: "Call for quote", image: "assets/images/colorful-inflatable-bounce-house-water-s-1.jpg", badge: "Custom" }
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  const toast = (message) => {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(window.__adminToast);
    window.__adminToast = setTimeout(() => node.classList.remove("show"), 4200);
  };
  const cloneDefaults = () => defaults.map((item) => ({ ...item }));
  const categoryAliases = {
    "Bounce houses": "Inflatables",
    "Slides": "Water slides",
    "Splash & games": "Games & splash"
  };
  const normalizeInventory = (items) => items.map((item) => ({
    ...item,
    category: categoryAliases[item.category] || item.category
  }));
  const readInventory = () => {
    try {
      const value = JSON.parse(localStorage.getItem(INVENTORY_KEY));
      return Array.isArray(value) && value.length ? normalizeInventory(value) : cloneDefaults();
    } catch (_) { return cloneDefaults(); }
  };
  let inventory = readInventory();
  let draggedId = null;
  let editingId = null;

  const saveInventory = () => {
    try {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
      return true;
    } catch (_) {
      toast("That upload is too large for browser-only storage. Use a smaller image or connect cloud storage.");
      return false;
    }
  };
  const updateStats = () => {
    $("#mediaCount").textContent = inventory.length;
    $("#categoryCount").textContent = new Set(inventory.map((item) => item.category)).size;
    try { $("#requestCount").textContent = JSON.parse(localStorage.getItem(QUOTE_KEY) || "[]").length; } catch (_) { $("#requestCount").textContent = "0"; }
  };
  const filteredInventory = () => {
    const query = ($("#mediaSearch")?.value || "").trim().toLowerCase();
    return inventory.filter((item) => !query || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query));
  };
  const setFeatured = (id) => {
    const item = inventory.find((entry) => entry.id === id);
    if (!item) return;
    try {
      localStorage.setItem(HERO_KEY, item.image);
      toast(`${item.name} is now the public landing image.`);
    } catch (_) {
      toast("That image could not be saved as the landing image. Try a smaller file.");
    }
  };
  const renderMedia = () => {
    const grid = $("#mediaGrid");
    if (!grid) return;
    const visible = filteredInventory();
    grid.innerHTML = visible.length ? visible.map((item) => `
      <article class="media-card" draggable="true" data-id="${item.id}">
        <div class="media-card-image"><span class="drag-grip" title="Drag to reorder">⠿</span><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" /></div>
        <div class="media-card-body"><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml(item.description)}</p><div class="media-card-meta"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.price)}</strong></div><div class="card-actions"><button type="button" data-feature="${escapeHtml(item.id)}">Use on landing</button><button type="button" data-edit="${escapeHtml(item.id)}">Edit</button><button class="delete-item" type="button" data-delete="${escapeHtml(item.id)}">Remove</button></div></div>
      </article>
    `).join("") : `<div class="empty-state">No inventory matches that search.</div>`;
    $$(".media-card", grid).forEach((card) => {
      card.addEventListener("dragstart", (event) => { draggedId = card.dataset.id; card.classList.add("dragging"); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", draggedId); });
      card.addEventListener("dragend", () => { draggedId = null; card.classList.remove("dragging"); $$(".media-card").forEach((item) => item.classList.remove("drag-over")); });
      card.addEventListener("dragover", (event) => { event.preventDefault(); if (card.dataset.id !== draggedId) card.classList.add("drag-over"); });
      card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        card.classList.remove("drag-over");
        const fromId = event.dataTransfer.getData("text/plain") || draggedId;
        const toId = card.dataset.id;
        if (!fromId || fromId === toId) return;
        const fromIndex = inventory.findIndex((item) => item.id === fromId);
        const toIndex = inventory.findIndex((item) => item.id === toId);
        if (fromIndex < 0 || toIndex < 0) return;
        const [moved] = inventory.splice(fromIndex, 1);
        inventory.splice(toIndex, 0, moved);
        saveInventory(); renderMedia(); toast("Lineup order saved. The public gallery will follow it.");
      });
    });
    $$('[data-feature]', grid).forEach((button) => button.addEventListener("click", () => setFeatured(button.dataset.feature)));
    $$('[data-edit]', grid).forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.edit)));
    $$('[data-delete]', grid).forEach((button) => button.addEventListener("click", () => removeItem(button.dataset.delete)));
    updateStats();
  };

  const editModal = $("#editModal");
  const editForm = $("#editForm");
  const openEditor = (id = null) => {
    editingId = id;
    const item = inventory.find((entry) => entry.id === id);
    if (!editForm || !editModal) return;
    editForm.elements.id.value = item?.id || "";
    editForm.elements.name.value = item?.name || "New inventory item";
    editForm.elements.price.value = item?.price || "Call for quote";
    editForm.elements.category.value = item?.category || "Inflatables";
    editForm.elements.description.value = item?.description || "Add a short description for customers.";
    editForm.elements.badge.value = item?.badge || "Available";
    editModal.hidden = false;
    editForm.elements.name.focus();
  };
  const closeEditor = () => { if (editModal) editModal.hidden = true; };
  const removeItem = (id) => {
    const item = inventory.find((entry) => entry.id === id);
    if (!item || !window.confirm(`Remove ${item.name} from the public gallery?`)) return;
    inventory = inventory.filter((entry) => entry.id !== id);
    saveInventory(); renderMedia(); toast(`${item.name} removed from the lineup.`);
  };
  $$('[data-close-edit]').forEach((element) => element.addEventListener("click", closeEditor));
  editForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(editForm).entries());
    if (editingId) {
      const item = inventory.find((entry) => entry.id === editingId);
      if (item) Object.assign(item, values);
    } else {
      inventory.push({ ...values, id: `item-${Date.now()}`, image: "assets/images/colorful-inflatable-bounce-house-water-s-1.jpg" });
    }
    saveInventory(); renderMedia(); closeEditor(); toast("Inventory item saved.");
  });

  // Upload photos from the drop zone, with a browser-only preview for this prototype.
  const fileInput = $("#fileInput");
  const dropZone = $("#dropZone");
  const handleFiles = (files) => {
    const category = $("#uploadCategory").value;
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return toast("Choose a JPG, PNG, or WEBP image to add it to the gallery.");
    let loaded = 0;
    imageFiles.forEach((file) => {
      if (file.size > 4 * 1024 * 1024) { toast(`${file.name} is over 4MB. Try a smaller image.`); loaded += 1; return; }
      const reader = new FileReader();
      reader.onload = () => {
        inventory.push({ id: `upload-${Date.now()}-${loaded}`, category, name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "), description: "New photo — add details with Edit.", price: "Call for quote", image: reader.result, badge: "New photo" });
        loaded += 1;
        if (loaded === imageFiles.length) { saveInventory(); renderMedia(); toast(`${imageFiles.length} photo${imageFiles.length === 1 ? "" : "s"} added to ${category}.`); }
      };
      reader.onerror = () => { loaded += 1; };
      reader.readAsDataURL(file);
    });
    fileInput.value = "";
  };
  fileInput?.addEventListener("change", (event) => handleFiles(event.target.files));
  ["dragenter", "dragover"].forEach((name) => dropZone?.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((name) => dropZone?.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove("is-over"); }));
  dropZone?.addEventListener("drop", (event) => handleFiles(event.dataTransfer.files));
  $("#mediaSearch")?.addEventListener("input", renderMedia);
  $("#addItemButton")?.addEventListener("click", () => openEditor());
  $("#restoreDefaults")?.addEventListener("click", () => {
    if (!window.confirm("Restore the sample lineup? Uploaded photos will be removed from this browser.")) return;
    inventory = cloneDefaults(); saveInventory(); renderMedia(); toast("Sample lineup restored.");
  });

  const renderRequests = () => {
    const list = $("#requestsList");
    if (!list) return;
    let requests = [];
    try { requests = JSON.parse(localStorage.getItem(QUOTE_KEY) || "[]"); } catch (_) { requests = []; }
    list.innerHTML = requests.length ? requests.slice().reverse().map((request) => `
      <article class="request-row"><div><strong>${request.name || "Unnamed guest"}</strong><small>${request.occasion || "Event"} · ${request.date || "Date pending"}</small></div><div><strong>${request.email || "No email"}</strong><small>${request.phone || "No phone"}</small></div><span class="request-estimate">$${Number(request.estimate || 0).toLocaleString()}</span><small>${new Date(request.createdAt || Date.now()).toLocaleDateString()}</small></article>
    `).join("") : `<div class="empty-state">No quote requests saved yet. They will appear here when someone submits the limo form.</div>`;
  };
  $("#clearRequests")?.addEventListener("click", () => {
    if (!window.confirm("Clear saved quote requests from this browser?")) return;
    localStorage.removeItem(QUOTE_KEY); renderRequests(); updateStats(); toast("Quote requests cleared.");
  });
  renderMedia();
  renderRequests();
})();
