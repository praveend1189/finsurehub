(function () {
  "use strict";

  var WA_NUMBER = "919303061805";
  var navCollapseEl = document.getElementById("mainNav");
  var leadForm = document.getElementById("leadForm");
  var formStatus = document.getElementById("formStatus");
  var stickyCall = document.querySelector(".sticky-call");
  var whatsappFab = document.querySelector(".whatsapp-fab");

  function closeMobileNav() {
    if (!navCollapseEl || typeof bootstrap === "undefined") return;
    var instance = bootstrap.Collapse.getInstance(navCollapseEl);
    if (instance) instance.hide();
  }

  document.querySelectorAll("#mainNav a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (link.classList.contains("dropdown-toggle")) return;
      if (window.innerWidth < 992) closeMobileNav();
    });
  });

  function enableDesktopDropdownHover(toggleId) {
    var toggle = document.getElementById(toggleId);
    if (!toggle || typeof bootstrap === "undefined") return;
    var item = toggle.closest(".nav-item.dropdown");
    var menu = bootstrap.Dropdown.getOrCreateInstance(toggle);
    var hideTimer;
    function isDesktopNav() {
      return window.innerWidth >= 992;
    }
    if (!item) return;
    item.addEventListener("mouseenter", function () {
      if (!isDesktopNav()) return;
      window.clearTimeout(hideTimer);
      menu.show();
    });
    item.addEventListener("mouseleave", function () {
      if (!isDesktopNav()) return;
      hideTimer = window.setTimeout(function () {
        menu.hide();
      }, 120);
    });
  }

  enableDesktopDropdownHover("navServices");
  enableDesktopDropdownHover("navCalculators");

  if (stickyCall) stickyCall.classList.add("is-visible");
  if (whatsappFab) whatsappFab.classList.add("is-visible");

  if ("IntersectionObserver" in window && leadForm) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          document.body.classList.toggle("form-in-view", entry.isIntersecting);
        });
      },
      { threshold: 0.28, rootMargin: "0px 0px -12% 0px" }
    );
    observer.observe(leadForm);
  }

  function setInvalid(el, isInvalid) {
    if (!el) return;
    el.classList.toggle("is-invalid", isInvalid);
  }

  function isValidName(value) {
    return value.trim().length >= 2;
  }

  function isValidMobile(value) {
    return /^[6-9]\d{9}$/.test(value.trim());
  }

  function showFormError(message) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.add("is-error");
  }

  function clearFormError() {
    if (!formStatus) return;
    formStatus.textContent = "";
    formStatus.classList.remove("is-error");
  }

  function buildWhatsAppText(data) {
    var lines = [
      "Hello Finsure Hub, I would like to speak with an advisor.",
      "",
      "Name: " + data.name,
      "Mobile: " + data.mobile,
      "Service interest: " + data.service
    ];
    if (data.city) lines.push("City / area: " + data.city);
    if (data.message) lines.push("Message: " + data.message);
    return lines.join("\n");
  }

  if (leadForm) {
    var nameInput = document.getElementById("fullName");
    var mobileInput = document.getElementById("mobile");
    var serviceInput = document.getElementById("serviceInterest");
    var cityInput = document.getElementById("city");
    var messageInput = document.getElementById("message");
    var consentInput = document.getElementById("consent");
    var honeypot = document.getElementById("website");
    var params = new URLSearchParams(window.location.search);
    var requestedService = params.get("service");
    if (requestedService && serviceInput) {
      var match = Array.prototype.find.call(serviceInput.options, function (opt) {
        return opt.value.toLowerCase() === requestedService.toLowerCase();
      });
      if (match) serviceInput.value = match.value;
    }

    [nameInput, mobileInput, serviceInput, consentInput].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", function () {
        setInvalid(el, false);
        clearFormError();
      });
      el.addEventListener("change", function () {
        setInvalid(el, false);
        clearFormError();
      });
    });

    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();
      clearFormError();

      if (honeypot && honeypot.value) {
        return;
      }

      var name = nameInput ? nameInput.value : "";
      var mobile = mobileInput ? mobileInput.value : "";
      var service = serviceInput ? serviceInput.value : "";
      var city = cityInput ? cityInput.value.trim() : "";
      var message = messageInput ? messageInput.value.trim() : "";
      var consented = consentInput ? consentInput.checked : false;

      var nameOk = isValidName(name);
      var mobileOk = isValidMobile(mobile);
      var serviceOk = service.trim().length > 0;
      var consentOk = consented;

      setInvalid(nameInput, !nameOk);
      setInvalid(mobileInput, !mobileOk);
      setInvalid(serviceInput, !serviceOk);
      setInvalid(consentInput, !consentOk);

      if (!nameOk || !mobileOk || !serviceOk || !consentOk) {
        showFormError("Please complete the required fields before continuing.");
        var firstInvalid = leadForm.querySelector(".is-invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var url =
        "https://wa.me/" +
        WA_NUMBER +
        "?text=" +
        encodeURIComponent(
          buildWhatsAppText({
            name: name.trim(),
            mobile: mobile.trim(),
            service: service,
            city: city,
            message: message
          })
        );

      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
})();
