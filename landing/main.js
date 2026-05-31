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
    return "http://127.0.0.1:8000";
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

    var gatewayUrl = waitlistGatewayUrl();
    var url = gatewayUrl || apiBase() + "/api/v1/waitlist/";
    var payload = JSON.stringify({ email: email });

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
      .catch(function (err) {
        var baseHint =
          "Is the API running? For local Django: cd backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000. ";
        if (window.location.protocol === "file:") {
          baseHint =
            "Do not open this page as a file. Run: cd landing && python3 -m http.server 5500 then visit http://localhost:5500. ";
        } else if (window.location.protocol === "https:" && /^http:\/\//i.test(url)) {
          baseHint =
            "This page is HTTPS but the API URL is HTTP — the browser blocks that (mixed content). Use an HTTPS API URL, or test the landing over HTTP (e.g. local http.server, not Amplify), or proxy API under the same host. ";
        }
        var corsHint =
          "If the API is up, the browser may be blocking the request (CORS): add this page’s origin to CORS_ALLOWED_ORIGINS on the server when DEBUG is false. ";
        var msg =
          (gatewayUrl
            ? "Could not reach the signup URL. Check data-waitlist-notify-url, HTTPS, and API Gateway CORS. "
            : "Could not reach the server. " + baseHint + corsHint) +
          "Tried: " +
          url +
          (err && err.message ? " (" + err.message + ")" : "");
        setMessage(msg, "is-error");
        if (typeof console !== "undefined" && console.warn) {
          console.warn("Waitlist fetch failed", err);
        }
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      });
  });
})();
