(function () {
  "use strict";

  var WA_NUMBER = window.FINSURE_CONTACT && window.FINSURE_CONTACT.waId ? window.FINSURE_CONTACT.waId : "919303061805";
  var SLOT_START = 10;
  var SLOT_END = 19;
  var SLOT_MINUTES = 30;
  var BOOKABLE_DAYS = 7;
  var IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  var state = {
    step: 1,
    selectedDate: null,
    selectedSlot: null,
    topic: "",
    submitAttempted: false
  };

  var root;
  var overlay;
  var step1;
  var step2;
  var dateList;
  var slotList;
  var slotHint;
  var formBanner;
  var nameInput;
  var phoneInput;
  var emailInput;
  var topicInput;
  var descInput;

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function istPartsFromUtcMs(utcMs) {
    var d = new Date(utcMs + IST_OFFSET_MS);
    return {
      y: d.getUTCFullYear(),
      m: d.getUTCMonth(),
      day: d.getUTCDate(),
      h: d.getUTCHours(),
      min: d.getUTCMinutes()
    };
  }

  function istNowParts() {
    return istPartsFromUtcMs(Date.now());
  }

  function dateKeyFromParts(p) {
    return p.y + "-" + pad2(p.m + 1) + "-" + pad2(p.day);
  }

  function parseDateKey(key) {
    var bits = key.split("-");
    return {
      y: parseInt(bits[0], 10),
      m: parseInt(bits[1], 10) - 1,
      day: parseInt(bits[2], 10)
    };
  }

  function utcMsForIstDateTime(y, m, day, h, min) {
    return Date.UTC(y, m, day, h, min) - IST_OFFSET_MS;
  }

  function formatDisplayDate(key) {
    var p = parseDateKey(key);
    var utc = Date.UTC(p.y, p.m, p.day);
    var d = new Date(utc);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    });
  }

  function formatTime12(h, min) {
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    var ampm = h < 12 ? "AM" : "PM";
    return h12 + ":" + pad2(min) + " " + ampm;
  }

  function slotLabel(h, min) {
    var endMin = min + SLOT_MINUTES;
    var endH = h;
    if (endMin >= 60) {
      endMin -= 60;
      endH += 1;
    }
    return formatTime12(h, min) + " - " + formatTime12(endH, endMin);
  }

  function allSlotsForDay() {
    var slots = [];
    var h;
    for (h = SLOT_START; h < SLOT_END; h++) {
      slots.push({ h: h, min: 0, label: slotLabel(h, 0) });
      slots.push({ h: h, min: 30, label: slotLabel(h, 30) });
    }
    return slots;
  }

  function bookableDates() {
    var now = istNowParts();
    var todayKey = dateKeyFromParts(now);
    var results = [];
    var cursorUtc = Date.UTC(now.y, now.m, now.day);
    var i;
    for (i = 0; i < 14 && results.length < BOOKABLE_DAYS; i++) {
      var dUtc = cursorUtc + i * 86400000;
      var p = istPartsFromUtcMs(dUtc);
      var key = dateKeyFromParts(p);
      var slots = availableSlotsForDate(key);
      if (slots.length) results.push(key);
    }
    if (!results.length) results.push(todayKey);
    return results;
  }

  function availableSlotsForDate(key) {
    var p = parseDateKey(key);
    var now = istNowParts();
    var todayKey = dateKeyFromParts(now);
    var slots = allSlotsForDay();
    if (key !== todayKey) return slots;
    return slots.filter(function (s) {
      var slotUtc = utcMsForIstDateTime(p.y, p.m, p.day, s.h, s.min);
      return slotUtc > Date.now();
    });
  }

  function slotKey(s) {
    return pad2(s.h) + ":" + pad2(s.min);
  }

  function ensureModal() {
    if (root) return;
    root = document.createElement("div");
    root.className = "book-modal-root";
    root.innerHTML =
      '<div class="book-modal-overlay" data-book-close tabindex="-1"></div>' +
      '<div class="book-modal" role="dialog" aria-modal="true" aria-labelledby="bookModalTitle">' +
      '<button type="button" class="book-modal-close" data-book-close aria-label="Close">&times;</button>' +
      '<h2 id="bookModalTitle" class="book-modal-title">Book a free consultation</h2>' +
      '<p class="book-modal-lead">Pick a time that works for you. We will confirm on WhatsApp.</p>' +
      '<div class="book-step book-step-1">' +
      '<p class="book-step-label">Choose a date</p>' +
      '<div class="book-date-list" role="listbox" aria-label="Available dates"></div>' +
      '<p class="book-step-label book-step-label-slots">Choose a time (IST)</p>' +
      '<p class="book-slot-hint" hidden></p>' +
      '<div class="book-slot-list" role="listbox" aria-label="Available time slots"></div>' +
      '<div class="book-modal-actions">' +
      '<button type="button" class="btn-navy book-btn-continue">Continue</button>' +
      "</div></div>" +
      '<div class="book-step book-step-2" hidden>' +
      '<p class="book-step-summary"></p>' +
      '<p class="book-form-banner" role="alert" hidden></p>' +
      '<form class="book-form" novalidate>' +
      '<div class="book-field">' +
      '<label for="bookName">Full name <span class="book-req">*</span></label>' +
      '<input id="bookName" name="name" type="text" autocomplete="name" required>' +
      '<p class="book-field-error" data-for="bookName" hidden></p>' +
      "</div>" +
      '<div class="book-field">' +
      '<label for="bookPhone">Phone / WhatsApp <span class="book-req">*</span></label>' +
      '<input id="bookPhone" name="phone" type="text" inputmode="numeric" autocomplete="tel" maxlength="10" required>' +
      '<p class="book-field-error" data-for="bookPhone" hidden></p>' +
      "</div>" +
      '<div class="book-field">' +
      '<label for="bookEmail">Email <span class="book-opt">(optional)</span></label>' +
      '<input id="bookEmail" name="email" type="email" autocomplete="email">' +
      "</div>" +
      '<div class="book-field">' +
      '<label for="bookTopic">Topic <span class="book-opt">(optional)</span></label>' +
      '<input id="bookTopic" name="topic" type="text">' +
      "</div>" +
      '<div class="book-field">' +
      '<label for="bookDesc">Notes <span class="book-opt">(optional)</span></label>' +
      '<textarea id="bookDesc" name="description" rows="3"></textarea>' +
      "</div>" +
      '<div class="book-modal-actions book-modal-actions-split">' +
      '<button type="button" class="btn-ghost book-btn-back">Back</button>' +
      '<button type="submit" class="btn-navy book-btn-submit">Submit on WhatsApp</button>' +
      "</div></form></div></div>";
    document.body.appendChild(root);

    overlay = root.querySelector(".book-modal-overlay");
    step1 = root.querySelector(".book-step-1");
    step2 = root.querySelector(".book-step-2");
    dateList = root.querySelector(".book-date-list");
    slotList = root.querySelector(".book-slot-list");
    slotHint = root.querySelector(".book-slot-hint");
    formBanner = root.querySelector(".book-form-banner");
    nameInput = root.querySelector("#bookName");
    phoneInput = root.querySelector("#bookPhone");
    emailInput = root.querySelector("#bookEmail");
    topicInput = root.querySelector("#bookTopic");
    descInput = root.querySelector("#bookDesc");

    root.querySelectorAll("[data-book-close]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    root.querySelector(".book-btn-continue").addEventListener("click", onContinue);
    root.querySelector(".book-btn-back").addEventListener("click", goStep1);
    root.querySelector(".book-form").addEventListener("submit", onSubmit);

    phoneInput.addEventListener("keydown", onPhoneKeydown);
    phoneInput.addEventListener("paste", onPhonePaste);
    phoneInput.addEventListener("input", onPhoneInput);

    nameInput.addEventListener("input", function () {
      if (state.submitAttempted) validateField("name");
    });
    phoneInput.addEventListener("input", function () {
      if (state.submitAttempted) validateField("phone");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("is-open")) close();
    });
  }

  function sanitizePhone(raw) {
    return raw.replace(/\D/g, "").slice(0, 10);
  }

  function onPhoneKeydown(e) {
    var allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (allowed.indexOf(e.key) !== -1) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }

  function onPhonePaste(e) {
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text");
    phoneInput.value = sanitizePhone(text);
    if (state.submitAttempted) validateField("phone");
  }

  function onPhoneInput() {
    phoneInput.value = sanitizePhone(phoneInput.value);
  }

  function isValidName(value) {
    return value.trim().length >= 3;
  }

  function isValidPhone(value) {
    return /^[6-9]\d{9}$/.test(value.trim());
  }

  function fieldErrorEl(id) {
    return root.querySelector('.book-field-error[data-for="' + id + '"]');
  }

  function setFieldError(input, message) {
    var err = fieldErrorEl(input.id);
    input.classList.toggle("is-invalid", !!message);
    if (err) {
      err.textContent = message || "";
      err.hidden = !message;
    }
  }

  function validateField(which) {
    if (which === "name") {
      var name = nameInput.value;
      if (!isValidName(name)) {
        setFieldError(nameInput, "Enter at least 3 characters.");
        return false;
      }
      setFieldError(nameInput, "");
      return true;
    }
    if (which === "phone") {
      var phone = phoneInput.value;
      if (!isValidPhone(phone)) {
        setFieldError(phoneInput, "Enter a valid phone number.");
        return false;
      }
      setFieldError(phoneInput, "");
      return true;
    }
    return true;
  }

  function renderDates() {
    var dates = bookableDates();
    dateList.innerHTML = "";
    dates.forEach(function (key) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book-date-chip";
      btn.textContent = formatDisplayDate(key);
      btn.dataset.date = key;
      if (key === state.selectedDate) btn.classList.add("is-selected");
      btn.addEventListener("click", function () {
        state.selectedDate = key;
        state.selectedSlot = null;
        renderDates();
        renderSlots();
      });
      dateList.appendChild(btn);
    });
    if (!state.selectedDate && dates[0]) {
      state.selectedDate = dates[0];
      renderDates();
      renderSlots();
    }
  }

  function renderSlots() {
    slotList.innerHTML = "";
    slotHint.hidden = true;
    slotHint.textContent = "";
    if (!state.selectedDate) return;
    var slots = availableSlotsForDate(state.selectedDate);
    if (!slots.length) {
      slotHint.hidden = false;
      slotHint.textContent = "No slots left for this date. Please choose another day.";
      return;
    }
    slots.forEach(function (s) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book-slot-chip";
      btn.textContent = s.label;
      btn.dataset.slot = slotKey(s);
      if (state.selectedSlot === slotKey(s)) btn.classList.add("is-selected");
      btn.addEventListener("click", function () {
        state.selectedSlot = slotKey(s);
        renderSlots();
      });
      slotList.appendChild(btn);
    });
  }

  function goStep1() {
    state.step = 1;
    step1.hidden = false;
    step2.hidden = true;
    state.submitAttempted = false;
    formBanner.hidden = true;
    setFieldError(nameInput, "");
    setFieldError(phoneInput, "");
  }

  function goStep2() {
    state.step = 2;
    step1.hidden = true;
    step2.hidden = false;
    var summary = root.querySelector(".book-step-summary");
    summary.textContent =
      formatDisplayDate(state.selectedDate) +
      " · " +
      slotLabel(parseInt(state.selectedSlot.split(":")[0], 10), parseInt(state.selectedSlot.split(":")[1], 10)) +
      " IST";
    if (state.topic && topicInput && !topicInput.value) topicInput.value = state.topic;
  }

  function onContinue() {
    if (!state.selectedSlot) {
      slotHint.hidden = false;
      slotHint.textContent = "Please select a time slot to continue.";
      return;
    }
    goStep2();
  }

  function buildWhatsAppBody(data) {
    var lines = [
      "Hello Finsure Hub, I would like to book a free consultation.",
      "",
      "Date: " + data.dateLabel,
      "Time: " + data.timeLabel + " IST",
      "Name: " + data.name,
      "Phone: " + data.phone
    ];
    if (data.email) lines.push("Email: " + data.email);
    if (data.topic) lines.push("Topic: " + data.topic);
    if (data.description) lines.push("Notes: " + data.description);
    return lines.join("\n");
  }

  function onSubmit(e) {
    e.preventDefault();
    state.submitAttempted = true;
    formBanner.hidden = true;

    var nameOk = validateField("name");
    var phoneOk = validateField("phone");
    if (!nameOk || !phoneOk) {
      formBanner.hidden = false;
      formBanner.textContent = "Please fix the highlighted fields.";
      return;
    }

    var sk = state.selectedSlot.split(":");
    var timeLabel = slotLabel(parseInt(sk[0], 10), parseInt(sk[1], 10));
    var url =
      "https://wa.me/" +
      WA_NUMBER +
      "?text=" +
      encodeURIComponent(
        buildWhatsAppBody({
          dateLabel: formatDisplayDate(state.selectedDate),
          timeLabel: timeLabel,
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          email: emailInput.value.trim(),
          topic: topicInput.value.trim(),
          description: descInput.value.trim()
        })
      );
    window.open(url, "_blank", "noopener,noreferrer");
    close();
  }

  function open(options) {
    options = options || {};
    ensureModal();
    state.step = 1;
    state.selectedDate = null;
    state.selectedSlot = null;
    state.topic = options.topic || "";
    state.submitAttempted = false;
    formBanner.hidden = true;
    nameInput.value = "";
    phoneInput.value = "";
    emailInput.value = "";
    topicInput.value = state.topic;
    descInput.value = "";
    setFieldError(nameInput, "");
    setFieldError(phoneInput, "");
    renderDates();
    goStep1();
    root.classList.add("is-open");
    document.body.classList.add("book-modal-open");
    nameInput.focus();
  }

  function close() {
    if (!root) return;
    root.classList.remove("is-open");
    document.body.classList.remove("book-modal-open");
  }

  window.FinsureBooking = { open: open, close: close };

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest(".js-book-consultation");
    if (!trigger) return;
    e.preventDefault();
    var topic = trigger.getAttribute("data-book-topic") || "";
    open({ topic: topic });
  });
})();
