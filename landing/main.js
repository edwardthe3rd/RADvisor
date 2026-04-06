(function () {
  var body = document.body;
  var form = document.getElementById("waitlist-form");
  var emailInput = document.getElementById("waitlist-email");
  var messageEl = document.getElementById("waitlist-message");

  function apiBase() {
    if (typeof window.__RADVISOR_API_BASE__ === "string" && window.__RADVISOR_API_BASE__) {
      return window.__RADVISOR_API_BASE__.replace(/\/$/, "");
    }
    var fromData = body.getAttribute("data-api-base");
    if (fromData && fromData.trim()) {
      return fromData.trim().replace(/\/$/, "");
    }
    return "http://localhost:8000";
  }

  function setMessage(text, kind) {
    messageEl.textContent = text || "";
    messageEl.classList.remove("is-success", "is-error");
    if (kind) {
      messageEl.classList.add(kind);
    }
  }

  if (!form || !emailInput || !messageEl) {
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setMessage("");

    var email = emailInput.value.trim();
    if (!email) {
      setMessage("Please enter your email address.", "is-error");
      emailInput.focus();
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    var url = apiBase() + "/api/v1/waitlist/";

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: email }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          var msg =
            (result.data && result.data.detail) ||
            "Thanks — we will notify you when RADvisor is live.";
          setMessage(msg, "is-success");
          emailInput.value = "";
          return;
        }
        var errMsg = "Something went wrong. Please try again.";
        if (result.data && result.data.email && Array.isArray(result.data.email)) {
          errMsg = result.data.email[0];
        } else if (result.data && result.data.detail) {
          errMsg = String(result.data.detail);
        }
        setMessage(errMsg, "is-error");
      })
      .catch(function () {
        setMessage(
          "Could not reach the server. Is the API running? Check the address in data-api-base.",
          "is-error"
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      });
  });
})();
