(function () {
  "use strict";

  var TAB_IDS = { sip: true, insurance: true, emi: true };

  function formatINR(value) {
    var n = Math.round(value);
    var grouped = n.toLocaleString("en-IN");
    var extra = "";
    if (n >= 10000000) {
      extra = " (" + (n / 10000000).toFixed(2).replace(/\.00$/, "") + " crore)";
    } else if (n >= 100000) {
      extra = " (" + (n / 100000).toFixed(2).replace(/\.00$/, "") + " lakh)";
    }
    return "₹" + grouped + extra;
  }

  function parsePositive(el) {
    if (!el) return NaN;
    var raw = String(el.value).replace(/,/g, "").trim();
    return parseFloat(raw);
  }

  function setInvalid(el, isInvalid) {
    if (!el) return;
    el.classList.toggle("is-invalid", isInvalid);
  }

  function sipFutureValue(monthly, annualPct, years) {
    var r = annualPct / 12 / 100;
    var n = years * 12;
    if (r === 0) return monthly * n;
    return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }

  function monthlyEmi(principal, annualPct, months) {
    var r = annualPct / 12 / 100;
    if (months <= 0) return NaN;
    if (r === 0) return principal / months;
    var pow = Math.pow(1 + r, months);
    return (principal * r * pow) / (pow - 1);
  }

  function insuranceYearlyRange(type, age, vehicleValue, cover) {
    var lowFactor;
    var highFactor;
    var base = cover;

    if (type === "health") {
      if (age < 31) {
        lowFactor = 0.006;
        highFactor = 0.012;
      } else if (age < 46) {
        lowFactor = 0.01;
        highFactor = 0.018;
      } else if (age < 61) {
        lowFactor = 0.016;
        highFactor = 0.03;
      } else {
        lowFactor = 0.025;
        highFactor = 0.05;
      }
    } else if (type === "term") {
      if (age < 31) {
        lowFactor = 0.0008;
        highFactor = 0.0015;
      } else if (age < 46) {
        lowFactor = 0.0012;
        highFactor = 0.0028;
      } else if (age < 61) {
        lowFactor = 0.003;
        highFactor = 0.008;
      } else {
        lowFactor = 0.009;
        highFactor = 0.02;
      }
    } else {
      base = vehicleValue;
      lowFactor = 0.022;
      highFactor = 0.04;
    }

    return {
      yearlyLow: base * lowFactor,
      yearlyHigh: base * highFactor
    };
  }

  function activateTabFromHash() {
    var hash = (window.location.hash || "#sip").replace("#", "").toLowerCase();
    if (!TAB_IDS[hash]) hash = "sip";
    var trigger = document.querySelector('[data-bs-target="#' + hash + '"]');
    if (!trigger || typeof bootstrap === "undefined") return;
    bootstrap.Tab.getOrCreateInstance(trigger).show();
  }

  function bindHashTabs() {
    var triggers = document.querySelectorAll('#calcTabs [data-bs-toggle="tab"]');
    triggers.forEach(function (btn) {
      btn.addEventListener("shown.bs.tab", function (event) {
        var target = event.target.getAttribute("data-bs-target");
        if (!target) return;
        if (history.replaceState) {
          history.replaceState(null, "", target);
        } else {
          window.location.hash = target;
        }
      });
    });
    activateTabFromHash();
    window.addEventListener("hashchange", activateTabFromHash);
  }

  function bindSip() {
    var form = document.getElementById("sipForm");
    if (!form) return;
    var monthlyEl = document.getElementById("sipMonthly");
    var returnEl = document.getElementById("sipReturn");
    var yearsEl = document.getElementById("sipYears");
    var resultEl = document.getElementById("sipResult");
    var investedEl = document.getElementById("sipInvested");
    var returnsEl = document.getElementById("sipReturns");
    var futureEl = document.getElementById("sipFuture");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var monthly = parsePositive(monthlyEl);
      var annualPct = parsePositive(returnEl);
      var years = parsePositive(yearsEl);
      var monthlyOk = monthly > 0 && monthly <= 10000000;
      var returnOk = annualPct >= 0 && annualPct <= 30;
      var yearsOk = years >= 1 && years <= 50 && years === Math.floor(years);
      setInvalid(monthlyEl, !monthlyOk);
      setInvalid(returnEl, !returnOk);
      setInvalid(yearsEl, !yearsOk);
      if (!monthlyOk || !returnOk || !yearsOk) {
        resultEl.hidden = true;
        return;
      }
      var future = sipFutureValue(monthly, annualPct, years);
      var invested = monthly * years * 12;
      var returns = Math.max(0, future - invested);
      investedEl.textContent = formatINR(invested);
      returnsEl.textContent = formatINR(returns);
      futureEl.textContent = formatINR(future);
      resultEl.hidden = false;
    });
  }

  function syncInsuranceFields() {
    var typeEl = document.getElementById("insType");
    var ageWrap = document.getElementById("insAgeWrap");
    var vehicleWrap = document.getElementById("insVehicleWrap");
    if (!typeEl || !ageWrap || !vehicleWrap) return;
    var isMotor = typeEl.value === "motor";
    ageWrap.hidden = isMotor;
    vehicleWrap.hidden = !isMotor;
  }

  function bindInsurance() {
    var form = document.getElementById("insuranceForm");
    if (!form) return;
    var typeEl = document.getElementById("insType");
    var ageEl = document.getElementById("insAge");
    var vehicleEl = document.getElementById("insVehicle");
    var coverEl = document.getElementById("insCover");
    var resultEl = document.getElementById("insResult");
    var yearlyEl = document.getElementById("insYearly");
    var monthlyEl = document.getElementById("insMonthly");

    typeEl.addEventListener("change", function () {
      setInvalid(typeEl, false);
      setInvalid(ageEl, false);
      setInvalid(vehicleEl, false);
      syncInsuranceFields();
    });

    syncInsuranceFields();

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var type = typeEl.value;
      var typeOk = type === "health" || type === "term" || type === "motor";
      var cover = parsePositive(coverEl);
      var coverOk = cover >= 50000 && cover <= 100000000;
      var age = parsePositive(ageEl);
      var vehicle = parsePositive(vehicleEl);
      var ageOk = type === "motor" || (age >= 18 && age <= 80 && age === Math.floor(age));
      var vehicleOk = type !== "motor" || (vehicle >= 50000 && vehicle <= 100000000);

      setInvalid(typeEl, !typeOk);
      setInvalid(coverEl, !coverOk);
      setInvalid(ageEl, !ageOk);
      setInvalid(vehicleEl, !vehicleOk);

      if (!typeOk || !coverOk || !ageOk || !vehicleOk) {
        resultEl.hidden = true;
        return;
      }

      var range = insuranceYearlyRange(type, age, vehicle, cover);
      yearlyEl.textContent = formatINR(range.yearlyLow) + " – " + formatINR(range.yearlyHigh);
      monthlyEl.textContent = formatINR(range.yearlyLow / 12) + " – " + formatINR(range.yearlyHigh / 12);
      resultEl.hidden = false;
    });
  }

  function bindEmi() {
    var form = document.getElementById("emiForm");
    if (!form) return;
    var amountEl = document.getElementById("emiAmount");
    var rateEl = document.getElementById("emiRate");
    var tenureEl = document.getElementById("emiTenure");
    var unitEl = document.getElementById("emiUnit");
    var resultEl = document.getElementById("emiResult");
    var monthlyEl = document.getElementById("emiMonthly");
    var interestEl = document.getElementById("emiInterest");
    var totalEl = document.getElementById("emiTotal");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var amount = parsePositive(amountEl);
      var rate = parsePositive(rateEl);
      var tenure = parsePositive(tenureEl);
      var unit = unitEl.value;
      var amountOk = amount > 0 && amount <= 1000000000;
      var rateOk = rate >= 0 && rate <= 36;
      var months;
      var tenureOk;
      if (unit === "months") {
        tenureOk = tenure >= 1 && tenure <= 600 && tenure === Math.floor(tenure);
        months = tenure;
      } else {
        tenureOk = tenure >= 1 && tenure <= 40 && tenure === Math.floor(tenure);
        months = tenure * 12;
      }
      setInvalid(amountEl, !amountOk);
      setInvalid(rateEl, !rateOk);
      setInvalid(tenureEl, !tenureOk);
      if (!amountOk || !rateOk || !tenureOk) {
        resultEl.hidden = true;
        return;
      }
      var emi = monthlyEmi(amount, rate, months);
      var total = emi * months;
      var interest = Math.max(0, total - amount);
      monthlyEl.textContent = formatINR(emi);
      interestEl.textContent = formatINR(interest);
      totalEl.textContent = formatINR(total);
      resultEl.hidden = false;
    });
  }

  bindHashTabs();
  bindSip();
  bindInsurance();
  bindEmi();
})();
