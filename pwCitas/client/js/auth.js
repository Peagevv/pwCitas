function setAlert(el, msg, type = "ok") {
  el.className = `alert ${type}`;
  el.textContent = msg;
  el.style.display = "block";
}

function clearAlert(el) {
  el.style.display = "none";
  el.textContent = "";
}

async function handleLogin(e) {
  e.preventDefault();
  const alertEl = document.querySelector("#alert");
  clearAlert(alertEl);

  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userName", data.user.name);

    window.location.href = "dashboard.html";
  } catch (err) {
    setAlert(alertEl, err.message, "err");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const alertEl = document.querySelector("#alert");
  clearAlert(alertEl);

  const name = document.querySelector("#name").value.trim();
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  try {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      auth: false,
      body: { name, email, password },
    });

    // Auto-login al registrar
    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userName", data.user.name);

    window.location.href = "dashboard.html";
  } catch (err) {
    setAlert(alertEl, err.message, "err");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  window.location.href = "index.html";
}

function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "index.html";
}
