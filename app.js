/* Amos Badeaux — small, framework-free interactions for the static launch site. */
(() => {
  const INVENTORY_KEY = "amos_inventory_v1";
  const HERO_KEY = "amos_hero_image_v1";
  const QUOTE_KEY = "amos_quote_requests_v1";
  const defaultInventory = [
    { id: "rainbow-rush", category: "Inflatables", name: "Rainbow Rush Combo", description: "Bounce, climb, and slide in one bright setup.", price: "From $325", image: "assets/images/colorful-inflatable-bounce-house-water-s-1.jpg", badge: "Big favorite" },
    { id: "block-party", category: "Inflatables", name: "Block Party Castle", description: "A classic jump for birthdays and neighborhood days.", price: "From $250", image: "assets/images/colorful-inflatable-bounce-house-water-s-2.jpg", badge: "Classic" },
    { id: "tropical-run", category: "Water slides", name: "Tropical Splash Run", description: "A colorful wet-and-wild lane for hot Louisiana afternoons.", price: "From $375", image: "assets/images/colorful-inflatable-bounce-house-water-s-1.jpg", badge: "Wet or dry" },
    { id: "double-lane", category: "Water slides", name: "Double Lane Rush", description: "Two lanes means more races and less waiting around.", price: "From $425", image: "assets/images/colorful-inflatable-bounce-house-water-s-2.jpg", badge: "New" },
    { id: "dunk-tank", category: "Games & splash", name: "Dunk Tank", description: "The one everybody says they will try once.", price: "From $275", image: "assets/images/colorful-inflatable-bounce-house-water-s-2.jpg", badge: "Crowd pleaser" },
    { id: "water-day", category: "Games & splash", name: "Water Day Setup", description: "A flexible splash zone built around your space and party.", price: "Call for quote", image: "assets/images/colorful-inflatable-bounce-house-water-s-1.jpg", badge: "Custom" }
  ];
  const events = [
    { month: "june", day: "13", monthLabel: "Jun", title: "Summer inventory preview", description: "See the newest fireworks arrivals before the big weekends.", kind: "Inventory drop" },
    { month: "june", day: "27", monthLabel: "Jun", title: "Fireworks season kickoff", description: "The season starts here — retail tents and event bookings open.", kind: "Season" },
    { month: "july", day: "03", monthLabel: "Jul", title: "Fourth of July weekend", description: "Last call for fireworks packages and party rentals.", kind: "Holiday" },
    { month: "july", day: "04", monthLabel: "Jul", title: "Independence Day finale", description: "The sky gets loud. Reserve early for the best selection.", kind: "Holiday" },
    { month: "august", day: "15", monthLabel: "Aug", title: "Back-to-school bash", description: "Close the summer with a jump, splash, or last big night out.", kind: "Party" }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  const categoryAliases = {
    "Bounce houses": "Inflatables",
    "Slides": "Water slides",
    "Splash & games": "Games & splash"
  };
  const normalizeInventory = (items) => items.map((item) => ({
    ...item,
    category: categoryAliases[item.category] || item.category
  }));
  const inventoryFromStorage = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(INVENTORY_KEY));
      return Array.isArray(stored) && stored.length ? normalizeInventory(stored) : defaultInventory;
    } catch (_) { return defaultInventory; }
  };
  const toast = (message) => {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(window.__amosToast);
    window.__amosToast = setTimeout(() => node.classList.remove("show"), 4200);
  };

  // Mobile navigation
  const menuToggle = $(".menu-toggle");
  const siteNav = $("#siteNav");
  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    $$("a", siteNav).forEach((link) => link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }));
  }

  // Let the approved photo selected in the media manager lead the landing page.
  // The bundled fireworks image remains a safe fallback for a fresh browser.
  const heroImage = $("#heroImage");
  if (heroImage) {
    try {
      const featuredImage = localStorage.getItem(HERO_KEY);
      if (featuredImage) heroImage.src = featuredImage;
    } catch (_) { /* Browser storage can be unavailable in private previews. */ }
    heroImage.addEventListener("error", () => {
      const fallback = heroImage.dataset.fallback;
      if (fallback && heroImage.src !== new URL(fallback, window.location.href).href) heroImage.src = fallback;
    });
  }

  // Dynamic year and lightweight season status.
  const year = $("#copyrightYear");
  if (year) year.textContent = new Date().getFullYear();
  const seasonStatus = $("#seasonStatus");
  if (seasonStatus) {
    const month = new Date().getMonth();
    seasonStatus.textContent = month >= 5 && month <= 7 ? "Live now" : "Next season planning";
  }

  // Calendar filters
  const eventsList = $("#eventsList");
  const renderEvents = (filter = "all") => {
    if (!eventsList) return;
    const visible = filter === "all" ? events : events.filter((item) => item.month === filter);
    eventsList.innerHTML = visible.length ? visible.map((event) => `
      <article class="event-card">
        <div class="event-date"><strong>${escapeHtml(event.day)}</strong><span>${escapeHtml(event.monthLabel)}</span></div>
        <div><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.description)}</p></div>
        <span class="event-kind">${escapeHtml(event.kind)}</span>
      </article>
    `).join("") : `<div class="event-empty">Nothing is posted for this month yet. Check back soon.</div>`;
  };
  if (eventsList) {
    renderEvents();
    $$(".month-tab").forEach((button) => button.addEventListener("click", () => {
      $$(".month-tab").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      renderEvents(button.dataset.month);
    }));
  }

  // Jump N Splash inventory and category gallery.
  const jumpGrid = $("#jumpGrid");
  const categoryTabs = $("#categoryTabs");
  const inventoryCount = $("#inventoryCount");
  const carouselDots = $("#carouselDots");
  let inventory = inventoryFromStorage();
  let activeCategory = "All inventory";
  let galleryItems = [];
  let galleryIndex = 0;

  const categoryList = () => ["All inventory", ...new Set(inventory.map((item) => item.category).filter(Boolean))];
  const renderCategories = () => {
    if (!categoryTabs) return;
    categoryTabs.innerHTML = categoryList().map((category) => {
      const count = category === "All inventory" ? inventory.length : inventory.filter((item) => item.category === category).length;
      return `<button class="category-tab${category === activeCategory ? " active" : ""}" type="button" role="tab" aria-selected="${category === activeCategory}" data-category="${escapeHtml(category)}">${escapeHtml(category)} <span>${String(count).padStart(2, "0")}</span></button>`;
    }).join("");
    $$(".category-tab", categoryTabs).forEach((button) => button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderCategories();
      renderInventory();
    }));
  };
  const visibleInventory = () => activeCategory === "All inventory" ? inventory : inventory.filter((item) => item.category === activeCategory);
  const renderInventory = () => {
    if (!jumpGrid) return;
    galleryItems = visibleInventory();
    if (inventoryCount) inventoryCount.textContent = `Showing ${galleryItems.length} ${activeCategory.toLowerCase()}`;
    jumpGrid.innerHTML = galleryItems.map((item, index) => `
      <button class="jump-card" type="button" data-index="${index}" aria-label="Open ${escapeHtml(item.name)} gallery">
        <div class="jump-card-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" /><span class="jump-card-badge">${escapeHtml(item.badge || "Available")}</span></div>
        <div class="jump-card-body"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><span class="jump-card-price">${escapeHtml(item.price)}</span></div>
      </button>
    `).join("");
    $$(".jump-card", jumpGrid).forEach((card) => card.addEventListener("click", () => openGallery(Number(card.dataset.index))));
    if (carouselDots) {
      carouselDots.innerHTML = galleryItems.map((_, index) => `<span class="${index === 0 ? "active" : ""}"></span>`).join("");
      carouselDots.style.display = galleryItems.length > 1 ? "flex" : "none";
    }
  };
  if (jumpGrid) {
    renderCategories();
    renderInventory();
    // Keep the mobile card row swipeable without needing a carousel dependency.
    let downX = 0;
    let downScroll = 0;
    jumpGrid.addEventListener("pointerdown", (event) => {
      if (window.innerWidth > 560) return;
      downX = event.clientX;
      downScroll = jumpGrid.scrollLeft;
      jumpGrid.classList.add("is-dragging");
      jumpGrid.setPointerCapture?.(event.pointerId);
    });
    jumpGrid.addEventListener("pointermove", (event) => {
      if (!jumpGrid.classList.contains("is-dragging")) return;
      jumpGrid.scrollLeft = downScroll - (event.clientX - downX);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((name) => jumpGrid.addEventListener(name, () => jumpGrid.classList.remove("is-dragging")));
  }

  // Amos's real booth banner photos — the ones he actually runs at the market.
  const boothItems = [
    { image: "assets/images/amos/amos-hero-banner.jpg", title: "Call Amos Badeaux", tag: "The man himself", note: "Amos on his own banner — inflatable rentals, car washes, and fireworks. One call, 337-517-3287." },
    { image: "assets/images/amos/amos-banner-limo.jpg", title: "Ride in Style", tag: "Limo service", note: "Badeaux's Limo Service — weddings, proms, birthdays, concerts, corporate events, and special occasions." },
    { image: "assets/images/amos/amos-banner-fireworks.jpg", title: "Light Up the Night", tag: "Fireworks", note: "Badeaux's Fireworks — seasonal retail and event support." },
    { image: "assets/images/amos/amos-banner-inflatables.jpg", title: "Bounce. Slide. Splash!", tag: "Inflatables", note: "Jump N Splash inflatables — bounce houses, water slides, mechanical bulls, and dunk tanks." },
    { image: "assets/images/amos/amos-banner-jumpsplash.jpg", title: "Jump N Splash", tag: "Jump N Splash", note: "The official Jump N Splash banner — bounce houses, mechanical bulls, waterslides, dunk tank, and more." },
    { image: "assets/images/amos/amos-banner-rent-from-us.jpg", title: "Rent From Us", tag: "Rent from us", note: "The splash zone at the booth — ready to rent for your date." },
    { image: "assets/images/amos/amos-banner-autocare.jpg", title: "We Keep You Looking Good", tag: "Auto care", note: "Badeaux's Auto Care — hand washing and window tinting." },
    { image: "assets/images/amos/amos-banner-autocare-wide.jpg", title: "The Auto Care Booth", tag: "The booth", note: "The full Auto Care banner strung up at the tent." }
  ];

  // Gallery modal: click a category, then previous/next or swipe.
  const modal = $("#galleryModal");
  const modalImage = $("#modalImage");
  const modalTitle = $("#modalTitle");
  const modalDescription = $("#modalDescription");
  const modalCategory = $("#modalCategory");
  const modalPrice = $("#modalPrice");
  const modalEyebrow = $("#modalEyebrow");
  const modalMedia = $(".modal-media");
  let gallerySource = "inventory";
  const updateGallery = () => {
    const item = galleryItems[galleryIndex];
    if (!item || !modal) return;
    modalImage.src = item.image;
    modalImage.alt = item.title || item.name || "";
    modalTitle.textContent = item.title || item.name || "";
    modalDescription.textContent = item.note || item.description || "";
    modalCategory.textContent = item.tag || item.category || "";
    modalPrice.textContent = item.price || "";
    if (modalEyebrow) modalEyebrow.lastChild.textContent = gallerySource === "booth" ? " Straight from the booth" : " Jump N Splash";
    if (gallerySource === "inventory") $$(".carousel-dots span").forEach((dot, index) => dot.classList.toggle("active", index === galleryIndex));
  };
  const openGallery = (index) => {
    if (!modal || !galleryItems.length) return;
    gallerySource = "inventory";
    galleryIndex = index;
    updateGallery();
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $(".modal-close", modal)?.focus();
  };
  const openBoothGallery = (index) => {
    if (!modal) return;
    gallerySource = "booth";
    galleryItems = boothItems;
    galleryIndex = Math.max(0, Math.min(index, boothItems.length - 1));
    updateGallery();
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $(".modal-close", modal)?.focus();
  };
  $$("[data-booth-index]").forEach((trigger) => trigger.addEventListener("click", () => openBoothGallery(Number(trigger.dataset.boothIndex) || 0)));
  const closeGallery = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };
  const moveGallery = (direction) => {
    if (!galleryItems.length) return;
    galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
    updateGallery();
  };
  if (modal) {
    $$("[data-close-modal]", modal).forEach((element) => element.addEventListener("click", closeGallery));
    $(".modal-prev", modal)?.addEventListener("click", () => moveGallery(-1));
    $(".modal-next", modal)?.addEventListener("click", () => moveGallery(1));
    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowLeft") moveGallery(-1);
      if (event.key === "ArrowRight") moveGallery(1);
    });
    let touchStart = 0;
    modalMedia?.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].screenX; }, { passive: true });
    modalMedia?.addEventListener("touchend", (event) => {
      const distance = event.changedTouches[0].screenX - touchStart;
      if (Math.abs(distance) > 45) moveGallery(distance > 0 ? -1 : 1);
    }, { passive: true });
  }

  // Limousine gallery thumbnails.
  const limoImage = $(".limo-main-image img");
  $$(".limo-thumb").forEach((thumb) => thumb.addEventListener("click", () => {
    if (!limoImage) return;
    limoImage.src = thumb.dataset.image;
    limoImage.alt = thumb.dataset.alt;
    $$(".limo-thumb").forEach((item) => item.classList.toggle("active", item === thumb));
  }));

  // Quote calculator. This deliberately stops at a request: payment needs a real payment processor and confirmed availability.
  const quoteForm = $("#limoQuoteForm");
  const quoteTotal = $("#quoteTotal");
  const calculateQuote = () => {
    if (!quoteForm || !quoteTotal) return 0;
    const hours = Number(new FormData(quoteForm).get("hours") || 2);
    const guests = String(new FormData(quoteForm).get("guests") || "1-8");
    const base = { 2: 600, 3: 900, 4: 1200, 5: 1450 }[hours] || 600;
    const guestFee = guests === "17-24" ? 150 : guests === "9-16" ? 75 : 0;
    const extras = $$('input[name="addon"]:checked', quoteForm).reduce((sum, input) => sum + Number(input.value), 0);
    const total = base + guestFee + extras;
    quoteTotal.textContent = `$${total.toLocaleString()}`;
    return total;
  };
  if (quoteForm) {
    const today = new Date().toISOString().split("T")[0];
    const dateInput = $("input[name=date]", quoteForm);
    if (dateInput) dateInput.min = today;
    quoteForm.addEventListener("input", calculateQuote);
    quoteForm.addEventListener("change", calculateQuote);
    quoteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(quoteForm).entries());
      data.addons = $$('input[name="addon"]:checked', quoteForm).map((input) => input.dataset.label);
      data.estimate = calculateQuote();
      data.createdAt = new Date().toISOString();
      try {
        const requests = JSON.parse(localStorage.getItem(QUOTE_KEY) || "[]");
        requests.push(data);
        localStorage.setItem(QUOTE_KEY, JSON.stringify(requests));
      } catch (_) { /* Browser storage can be unavailable in private previews. */ }
      toast(`Thanks, ${data.name.split(" ")[0] || "there"}. Your ${data.estimate.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} starting estimate is saved for review. Amos will follow up with the secure payment link.`);
    });
  }

  // Contact form is a front-end handoff until a real inbox endpoint is selected.
  const contactForm = $("#contactForm");
  if (contactForm) contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = new FormData(contactForm).get("name") || "there";
    toast(`Thanks, ${String(name).split(" ")[0]}. Your note is ready for Amos — connect this form to the business inbox before launch.`);
    contactForm.reset();
  });

  $$('[data-toast]').forEach((button) => button.addEventListener("click", () => toast(button.dataset.toast)));
})();
