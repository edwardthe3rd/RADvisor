(function () {
  var body = document.body;
  var form = document.getElementById("waitlist-form");
  var fullNameInput = document.getElementById("waitlist-full-name");
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

  /** Full URL to API Gateway POST (…/waitlist/notify). Empty → use Django /api/v1/waitlist/ */
  function waitlistGatewayUrl() {
    if (
      typeof window.__RADVISOR_WAITLIST_NOTIFY_URL__ === "string" &&
      window.__RADVISOR_WAITLIST_NOTIFY_URL__.trim()
    ) {
      return window.__RADVISOR_WAITLIST_NOTIFY_URL__.trim().replace(/\/$/, "");
    }
    var u = body.getAttribute("data-waitlist-notify-url");
    return u && u.trim() ? u.trim().replace(/\/$/, "") : "";
  }

  function setMessage(text, kind) {
    messageEl.textContent = text || "";
    messageEl.classList.remove("is-success", "is-error");
    if (kind) {
      messageEl.classList.add(kind);
    }
  }

  if (!form || !fullNameInput || !emailInput || !messageEl) {
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setMessage("");

    var fullName = fullNameInput.value.trim();
    var email = emailInput.value.trim();
    if (!fullName) {
      setMessage("Please enter your full name.", "is-error");
      fullNameInput.focus();
      return;
    }
    if (!email) {
      setMessage("Please enter your email address.", "is-error");
      emailInput.focus();
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    var gatewayUrl = waitlistGatewayUrl();
    var url = gatewayUrl || apiBase() + "/api/v1/waitlist/";
    var payload = gatewayUrl
      ? JSON.stringify({ fullName: fullName, email: email })
      : JSON.stringify({ email: email, full_name: fullName });

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: payload,
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          if (text) {
            try {
              data = JSON.parse(text);
            } catch (e) {
              data = null;
            }
          }
          return { ok: res.ok, status: res.status, data: data, gateway: !!gatewayUrl };
        });
      })
      .then(function (result) {
        if (result.ok) {
          var msg = "Thanks — we will notify you when RADvisor is live.";
          if (!result.gateway && result.data && result.data.detail) {
            msg = result.data.detail;
          }
          setMessage(msg, "is-success");
          fullNameInput.value = "";
          emailInput.value = "";
          return;
        }
        var errMsg = "Something went wrong. Please try again.";
        if (result.gateway && result.data && result.data.error) {
          errMsg = String(result.data.error);
        } else if (result.data && result.data.full_name && Array.isArray(result.data.full_name)) {
          errMsg = result.data.full_name[0];
        } else if (result.data && result.data.email && Array.isArray(result.data.email)) {
          errMsg = result.data.email[0];
        } else if (result.data && result.data.detail) {
          errMsg = String(result.data.detail);
        }
        setMessage(errMsg, "is-error");
      })
      .catch(function () {
        setMessage(
          gatewayUrl
            ? "Could not reach the signup service. Check data-waitlist-notify-url or your connection."
            : "Could not reach the server. Is the API running? Check the address in data-api-base.",
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
