// ---- Helpers ----
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function toMoneyEUR(n) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function daysBetween(start, end) {
  const ms = end - start;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ---- Booking calculator ----
const BASE_WEEKDAY = 89;
const BASE_WEEKEND = 129;
const EXTRA_GUEST = 12; // €/ночь за гостя сверх 2
const ADD_HOTTUB = 25; // €/ночь
const ADD_SAUNA = 20; // €/ночь

const checkin = $("#checkin");
const checkout = $("#checkout");
const guests = $("#guests");
const hotTub = $("#hotTub");
const sauna = $("#sauna");

const nightsEl = $("#nights");
const totalEl = $("#total");
const prepayEl = $("#prepay");

function isWeekend(dateObj) {
  // 0=Sun ... 6=Sat, weekend Fri/Sat => 5/6
  const d = dateObj.getDay();
  return d === 5 || d === 6;
}

function calc() {
  const inVal = checkin.value;
  const outVal = checkout.value;

  if (!inVal || !outVal) {
    nightsEl.textContent = "—";
    totalEl.textContent = "—";
    prepayEl.textContent = "—";
    return;
  }

  const inDate = new Date(inVal + "T12:00:00");
  const outDate = new Date(outVal + "T12:00:00");

  const n = daysBetween(inDate, outDate);
  if (!Number.isFinite(n) || n <= 0) {
    nightsEl.textContent = "—";
    totalEl.textContent = "—";
    prepayEl.textContent = "—";
    return;
  }

  // base price per each night depends on weekday/weekend
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const day = new Date(inDate);
    day.setDate(inDate.getDate() + i);
    sum += isWeekend(day) ? BASE_WEEKEND : BASE_WEEKDAY;
  }

  const g = Number(guests.value || 2);
  if (g > 2) sum += (g - 2) * EXTRA_GUEST * n;

  if (hotTub.checked) sum += ADD_HOTTUB * n;
  if (sauna.checked) sum += ADD_SAUNA * n;

  nightsEl.textContent = String(n);
  totalEl.textContent = toMoneyEUR(sum);
  prepayEl.textContent = toMoneyEUR(sum * 0.3);
}

[checkin, checkout, guests, hotTub, sauna].forEach((el) =>
  el.addEventListener("change", calc)
);

// Set minimum dates to today (local)
(function initDatesMin() {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  checkin.min = iso;
  checkout.min = iso;

  checkin.addEventListener("change", () => {
    checkout.min = checkin.value || iso;
    // if checkout earlier than checkin -> reset
    if (checkout.value && checkin.value && checkout.value <= checkin.value) {
      checkout.value = "";
    }
    calc();
  });
})();

// ---- Modal (demo submit) ----
const modal = $("#modal");
const modalText = $("#modalText");
const openBooking = $("#openBooking");

function openModal(text) {
  modalText.textContent = text;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

openBooking?.addEventListener("click", () => {
  $("#booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => checkin?.focus(), 400);
});

$$("[data-close='1']").forEach((btn) =>
  btn.addEventListener("click", closeModal)
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false")
    closeModal();
});

$("#booking")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const inVal = checkin.value;
  const outVal = checkout.value;

  if (!inVal || !outVal) {
    openModal("Выбери даты заезда и выезда — и мы посчитаем цену.");
    return;
  }

  const text =
    `Демо-заявка создана.\n` +
    `Даты: ${inVal} → ${outVal}\n` +
    `Гостей: ${guests.value}\n` +
    `Опции: ${hotTub.checked ? "чан " : ""}${
      sauna.checked ? "баня" : ""
    }`.trim();

  openModal(text);
});

// ---- Lightbox (gallery) ----
const lightbox = $("#lightbox");
const lightboxImg = $("#lightboxImg");

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || "Фото";
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lightboxImg.src = "";
}

$$(".gallery__item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const img = btn.querySelector("img");
    const src = btn.dataset.full || img?.src;
    openLightbox(src, img?.alt);
  });
});
$$("[data-lightbox-close='1']").forEach((x) =>
  x.addEventListener("click", closeLightbox)
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false")
    closeLightbox();
});
