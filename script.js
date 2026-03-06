// NordWoods — Premium JS (no frameworks)

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ----------------------------
  // Cursor glow follow
  // ----------------------------
  const glow = $(".cursor-glow");
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty("--mx", `${x}%`);
    document.documentElement.style.setProperty("--my", `${y}%`);
  });

  // ----------------------------
  // Header solid on scroll
  // ----------------------------
  const header = $(".header");
  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle("is-solid", window.scrollY > 60);
  };
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  // ----------------------------
  // Smooth scroll for anchors
  // ----------------------------
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id && id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Button "Забронировать" in header
  const scrollToBooking = $("#scrollToBooking");
  if (scrollToBooking) {
    scrollToBooking.addEventListener("click", () => {
      const booking = $("#booking");
      if (booking)
        booking.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => $("#in")?.focus(), 450);
    });
  }

  // ----------------------------
  // Reveal on scroll
  // ----------------------------
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) en.target.classList.add("in");
      });
    },
    { threshold: 0.14 }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  // ----------------------------
  // Set backgrounds with fallback
  // Works for .shot and #heroParallax
  // ----------------------------
  function setBgWithFallback(el, cssVarName) {
    const local = el.dataset.bg;
    const fallback = el.dataset.fallback;

    const apply = (url) => {
      el.style.setProperty(cssVarName, `url("${url}")`);
    };

    if (!local) {
      if (fallback) apply(fallback);
      return;
    }

    const img = new Image();
    img.onload = () => apply(local);
    img.onerror = () => {
      if (fallback) apply(fallback);
      console.warn("Image not found, using fallback:", local, "->", fallback);
    };
    img.src = local;
  }

  // hero image
  const hero = $("#heroParallax");
  if (hero) setBgWithFallback(hero, "--hero-bg");

  // gallery shots
  $$(".shot").forEach((shot) => setBgWithFallback(shot, "--shot-bg"));

  // ----------------------------
  // Parallax hero image (subtle)
  // ----------------------------
  if (hero) {
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY * 0.18;
        hero.style.transform = `translateY(${Math.min(y, 18)}px)`;
      },
      { passive: true }
    );
  }

  // ----------------------------
  // Magnetic buttons
  // ----------------------------
  $$(".magnetic").forEach((btn) => {
    const strength = 14;

    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });

  // ----------------------------
  // Tilt cards (very subtle)
  // ----------------------------
  const tiltTargets = [...$$(".card"), ...$$(".plan"), ...$$(".heroCard")];
  tiltTargets.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 3).toFixed(
        2
      )}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-2px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });

  // ----------------------------
  // Booking calculator
  // ----------------------------
  const money = (n) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "EUR",
    }).format(n);

  const BASE_WEEKDAY = 89;
  const BASE_WEEKEND = 129;
  const EXTRA_GUEST = 12;
  const TUB = 25;
  const SAUNA = 20;

  const inEl = $("#in");
  const outEl = $("#out");
  const guestsEl = $("#guests");
  const stayTypeEl = $("#stayType");
  const nightsEl = $("#nights");
  const totalEl = $("#total");
  const prepayEl = $("#prepay");

  const tub = $("#tub");
  const sauna = $("#sauna");

  const isWeekend = (d) => {
    const day = d.getDay();
    return day === 5 || day === 6; // Fri/Sat
  };

  const daysBetween = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24));

  const setToggle = (el, on) => {
    el.dataset.on = on ? "1" : "0";
    el.setAttribute("aria-checked", on ? "true" : "false");
  };

  const toggle = (el) => {
    const on = el.dataset.on === "1";
    setToggle(el, !on);
    calc();
  };

  ["click", "keydown"].forEach((evt) => {
    tub?.addEventListener(evt, (e) => {
      if (evt === "click" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(tub);
      }
    });
    sauna?.addEventListener(evt, (e) => {
      if (evt === "click" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(sauna);
      }
    });
  });

  function calc() {
    if (!inEl || !outEl || !guestsEl || !stayTypeEl) return;

    const inV = inEl.value;
    const outV = outEl.value;

    if (!inV || !outV) {
      nightsEl.textContent = "—";
      totalEl.textContent = "—";
      prepayEl.textContent = "—";
      return;
    }

    const start = new Date(inV + "T12:00:00");
    const end = new Date(outV + "T12:00:00");

    const n = daysBetween(start, end);
    if (!Number.isFinite(n) || n <= 0) {
      nightsEl.textContent = "—";
      totalEl.textContent = "—";
      prepayEl.textContent = "—";
      return;
    }

    let sum = 0;
    for (let i = 0; i < n; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      sum += isWeekend(day) ? BASE_WEEKEND : BASE_WEEKDAY;
    }

    const g = Number(guestsEl.value || 2);
    if (g > 2) sum += (g - 2) * EXTRA_GUEST * n;

    if (tub?.dataset.on === "1") sum += TUB * n;
    if (sauna?.dataset.on === "1") sum += SAUNA * n;

    const st = stayTypeEl.value;
    if (st === "romantic") sum *= 1.06;
    if (st === "workation") sum *= 1.03;

    nightsEl.textContent = String(n);
    totalEl.textContent = money(sum);
    prepayEl.textContent = money(sum * 0.3);
  }

  [inEl, outEl, guestsEl, stayTypeEl].forEach((el) =>
    el?.addEventListener("change", calc)
  );

  // min dates today
  (function initMin() {
    if (!inEl || !outEl) return;
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    inEl.min = iso;
    outEl.min = iso;

    inEl.addEventListener("change", () => {
      outEl.min = inEl.value || iso;
      if (outEl.value && inEl.value && outEl.value <= inEl.value)
        outEl.value = "";
      calc();
    });
  })();

  // ----------------------------
  // Real booking submit (no "demo" text)
  // - shows confirmation
  // - copy details
  // - download .ics calendar file
  // ----------------------------
  const modal = $("#modal");
  const modalText = $("#modalText");
  const modalTitle = $("#modalTitle");
  const copyBtn = $("#copyDetails");
  const icsBtn = $("#downloadIcs");

  const openModal = (title, text) => {
    if (modalTitle) modalTitle.textContent = title || "Готово ✅";
    if (modalText) modalText.textContent = text || "";
    modal?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const closeModal = () => {
    modal?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  $$("[data-close='1']").forEach((b) =>
    b.addEventListener("click", closeModal)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.getAttribute("aria-hidden") === "false")
      closeModal();
  });

  const form = $("#form");
  const nameEl = $("#name");
  const phoneEl = $("#phone");
  const emailEl = $("#email");
  const noteEl = $("#note");
  const timeEl = $("#time");
  const agreeEl = $("#agree");
  const hpEl = $("#company");

  let lastDetailsText = "";
  let lastIcsBlob = null;

  const normalizePhone = (s) => (s || "").replace(/[^\d+]/g, "").trim();
  const isValidEmail = (s) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test((s || "").trim());

  function safeText(v) {
    return String(v ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildDetails() {
    const inV = safeText(inEl?.value);
    const outV = safeText(outEl?.value);
    const guests = safeText(guestsEl?.value);
    const style =
      stayTypeEl?.options?.[stayTypeEl.selectedIndex]?.text ||
      safeText(stayTypeEl?.value);

    const opts = [];
    if (tub?.dataset.on === "1") opts.push("Чан");
    if (sauna?.dataset.on === "1") opts.push("Баня");

    const nights = safeText(nightsEl?.textContent);
    const total = safeText(totalEl?.textContent);
    const prepay = safeText(prepayEl?.textContent);

    const name = safeText(nameEl?.value);
    const phone = safeText(phoneEl?.value);
    const email = safeText(emailEl?.value);
    const arrival =
      timeEl?.options?.[timeEl.selectedIndex]?.text || safeText(timeEl?.value);
    const note = safeText(noteEl?.value);

    const lines = [
      "NordWoods — Заявка на бронь",
      "--------------------------------",
      `Даты: ${inV} → ${outV}`,
      `Ночей: ${nights}`,
      `Гостей: ${guests}`,
      `Стиль: ${style}`,
      `Опции: ${opts.length ? opts.join(", ") : "—"}`,
      "--------------------------------",
      `Итого: ${total}`,
      `Предоплата 30%: ${prepay}`,
      "--------------------------------",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Email: ${email}`,
      `Время прибытия: ${arrival}`,
      `Комментарий: ${note || "—"}`,
    ];

    return lines.join("\n");
  }

  function makeIcs({ startDate, endDate, title, description }) {
    // all-day event
    // DTSTART/DTEND use DATE (end exclusive)
    const fmt = (isoDate) => isoDate.replaceAll("-", "");
    const dtStart = fmt(startDate);
    const dtEnd = fmt(endDate);

    const uid = `nordwoods-${Date.now()}@nordwoods`;
    const now = new Date();
    const dtStamp = now
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

    const esc = (s) =>
      String(s || "")
        .replaceAll("\\", "\\\\")
        .replaceAll("\n", "\\n")
        .replaceAll(",", "\\,")
        .replaceAll(";", "\\;");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NordWoods//Booking//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new Blob([ics], { type: "text/calendar;charset=utf-8" });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  copyBtn?.addEventListener("click", async () => {
    if (!lastDetailsText) return;
    try {
      await navigator.clipboard.writeText(lastDetailsText);
      openModal("Скопировано ✅", "Детали заявки скопированы в буфер обмена.");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = lastDetailsText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      openModal("Скопировано ✅", "Детали заявки скопированы.");
    }
  });

  icsBtn?.addEventListener("click", () => {
    if (!lastIcsBlob) return;
    downloadBlob(lastIcsBlob, "NordWoods-booking.ics");
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    // simple anti-bot honeypot
    if (hpEl && hpEl.value && hpEl.value.trim().length > 0) {
      openModal("Ошибка", "Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }

    // validate dates
    if (!inEl?.value || !outEl?.value) {
      openModal(
        "Нужны даты",
        "Выберите даты заезда и выезда — мы посчитаем цену."
      );
      return;
    }

    // validate nights calc exists
    const nTxt = (nightsEl?.textContent || "").trim();
    if (!nTxt || nTxt === "—") {
      openModal(
        "Проверьте даты",
        "Даты указаны неверно. Выберите корректный диапазон."
      );
      return;
    }

    // validate contact fields
    const name = safeText(nameEl?.value);
    const phone = normalizePhone(phoneEl?.value);
    const email = safeText(emailEl?.value);

    if (name.length < 2) {
      openModal("Проверьте имя", "Введите имя (минимум 2 символа).");
      nameEl?.focus();
      return;
    }
    if (phone.length < 7) {
      openModal("Проверьте телефон", "Введите корректный номер телефона.");
      phoneEl?.focus();
      return;
    }
    if (!isValidEmail(email)) {
      openModal("Проверьте email", "Введите корректный email.");
      emailEl?.focus();
      return;
    }
    if (!agreeEl?.checked) {
      openModal(
        "Нужно согласие",
        "Подтвердите согласие с условиями проживания."
      );
      agreeEl?.focus();
      return;
    }

    // build details
    lastDetailsText = buildDetails();

    // prepare ics
    lastIcsBlob = makeIcs({
      startDate: inEl.value,
      endDate: outEl.value,
      title: "NordWoods — проживание",
      description: lastDetailsText,
    });

    // store last booking (optional)
    try {
      localStorage.setItem(
        "nordwoods_last_booking",
        JSON.stringify({
          checkin: inEl.value,
          checkout: outEl.value,
          guests: guestsEl?.value,
          style: stayTypeEl?.value,
          tub: tub?.dataset.on === "1",
          sauna: sauna?.dataset.on === "1",
          total: totalEl?.textContent,
          prepay: prepayEl?.textContent,
          name,
          phone,
          email,
          note: noteEl?.value || "",
          createdAt: Date.now(),
        })
      );
    } catch {}

    // show confirmation
    openModal(
      "Заявка принята ✅",
      "Мы получили вашу заявку. Подтверждение и реквизиты предоплаты пришлём в течение дня.\n\nВы можете скопировать детали и добавить даты в календарь."
    );

    // optional: reset note only, keep dates
    // noteEl && (noteEl.value = "");
  });

  // year
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
});
