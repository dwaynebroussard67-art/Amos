# Amos Badeaux site

This replaces the three static draft files with a small, framework-free site that can be hosted as static files now and connected to a real backend later.

## What is in the launch build

- `index.html` — public home with the four businesses, service cards, event preview, vehicle showcase, limousine quote builder, fun-jump inventory, swipe gallery, and contact handoff.
- `calendar.html` — dedicated fireworks season calendar and inventory-reveal page.
- `styles.css` — shared visual system and responsive layout.
- `app.js` — calendar filters, mobile navigation, quote estimate, gallery modal with keyboard arrows and touch swipe, and browser storage for demo requests/inventory.
- `admin.html`, `admin.css`, `admin.js` — media manager. A team member can upload photos, edit inventory labels, drag cards to reorder them, remove items, and restore the sample lineup.
- `assets/images/` — temporary launch imagery used until Amos's own photos are uploaded.
- `archive/` — the three original drafts preserved for reference. They are not linked from the public site.

## Important launch notes

The quote builder is intentionally a **front-end prototype**. It calculates a starting estimate and saves the request in the current browser, but it does not pretend to take money. There is no Stripe account, API key, or payment connection in this preview. `.env.example` documents a safe demo/test/live handoff for later; the static preview does not read it. Before launch, connect the form to a server/inbox and a payment provider such as Stripe. The intended production flow is:

1. Customer submits date, hours, guests, contact information, and chooses pay-in-full or deposit.
2. Amos confirms availability and the final route price.
3. The server creates a secure checkout session and sends the payment link.
4. The booking is only marked reserved after the payment provider confirms payment.

The admin page is also browser-only at this stage. Uploaded photos and quote requests live in `localStorage`, which is useful for a working demo but is not shared across devices. A production media manager should move inventory and images to a database/object store with authentication.

## Temporary image sources

The local starter images came from image-search results and should be treated as reference/placeholder material until usage rights are confirmed or Amos's own photos replace them. The result pages returned by the search were:

- [Pexels fireworks search](https://www.pexels.com/search/fireworks%20in%20the%20sky/)
- [Vecteezy car detailing search](https://www.vecteezy.com/free-photos/car-detailing)
- [Car Spa Denver exterior wash](https://carspadenver.com/car-detailing-prices/)
- [Empire Limousine party bus](https://www.empirelimousine.net/party-bus-nyc/)
- [Santos VIP party bus](https://santoslimousine.com/42-passenger-limo-coach-party-bus)
- [Inflatable Zone bounce house/water slide](https://www.inflatable-zone.com/sk/collections/all-products/products/colorful-block-inflatable-jumping-castle-water-slide-combo-bounce-house-with-waterslide-rental)

Run a local preview with:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open `/` for the public site and `/admin.html` for the media manager.
