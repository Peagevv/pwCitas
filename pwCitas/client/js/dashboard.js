requireAuth();

const alertEl = document.querySelector("#alert");
const tableEl = document.querySelector("#apptTable");
const welcomeEl = document.querySelector("#welcome");

const formTitleEl = document.querySelector("#formTitle");
const apptForm = document.querySelector("#apptForm");
const apptIdEl = document.querySelector("#apptId");
const serviceEl = document.querySelector("#service");
const dateEl = document.querySelector("#date");
const statusEl = document.querySelector("#status");
const notesEl = document.querySelector("#notes");

document.querySelector("#logoutBtn").addEventListener("click", logout);
document.querySelector("#clearBtn").addEventListener("click", clearForm);
apptForm.addEventListener("submit", onSubmit);

welcomeEl.textContent = `Hola, ${localStorage.getItem("userName") || "usuario"} (${localStorage.getItem("userEmail") || ""})`;

function setAlert(msg, type = "ok") {
  alertEl.className = `alert ${type}`;
  alertEl.textContent = msg;
  alertEl.style.display = "block";
}
function clearAlert() {
  alertEl.style.display = "none";
  alertEl.textContent = "";
}

function toLocalDatetimeInputValue(dateString) {
  // Convierte ISO -> datetime-local (sin segundos)
  const d = new Date(dateString);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatHumanDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleString();
}

function clearForm() {
  apptIdEl.value = "";
  serviceEl.value = "";
  dateEl.value = "";
  statusEl.value = "pendiente";
  notesEl.value = "";
  formTitleEl.textContent = "Nueva cita";
  clearAlert();
}

async function loadAppointments() {
  try {
    const list = await apiFetch("/api/appointments");
    renderTable(list);
  } catch (err) {
    setAlert(err.message, "err");
  }
}

function renderTable(list) {
  tableEl.innerHTML = "";

  if (!list.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="small">No tienes citas aún. Crea una arriba.</td>`;
    tableEl.appendChild(tr);
    return;
  }

  for (const a of list) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(a.service)}</td>
      <td>${formatHumanDate(a.date)}</td>
      <td><span class="badge ${a.status}">${a.status}</span></td>
      <td>${escapeHtml(a.notes || "")}</td>
      <td>
        <button class="btn secondary" data-edit="${a._id}">Editar</button>
        <button class="btn danger" data-del="${a._id}">Eliminar</button>
      </td>
    `;

    tableEl.appendChild(tr);
  }

  // acciones
  tableEl.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.edit));
  });

  tableEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => removeAppointment(btn.dataset.del));
  });
}

async function startEdit(id) {
  clearAlert();
  try {
    const a = await apiFetch(`/api/appointments/${id}`);
    apptIdEl.value = a._id;
    serviceEl.value = a.service;
    dateEl.value = toLocalDatetimeInputValue(a.date);
    statusEl.value = a.status;
    notesEl.value = a.notes || "";
    formTitleEl.textContent = "Editar cita";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    setAlert(err.message, "err");
  }
}

async function onSubmit(e) {
  e.preventDefault();
  clearAlert();

  const payload = {
    service: serviceEl.value.trim(),
    date: new Date(dateEl.value).toISOString(),
    status: statusEl.value,
    notes: notesEl.value.trim(),
  };

  if (!payload.service || !dateEl.value) {
    return setAlert("service y date son obligatorios", "err");
  }

  try {
    if (apptIdEl.value) {
      // update
      await apiFetch(`/api/appointments/${apptIdEl.value}`, {
        method: "PUT",
        body: payload,
      });
      setAlert("✅ Cita actualizada", "ok");
    } else {
      // create
      await apiFetch("/api/appointments", {
        method: "POST",
        body: payload,
      });
      setAlert("✅ Cita creada", "ok");
    }

    clearForm();
    await loadAppointments();
  } catch (err) {
    setAlert(err.message, "err");
  }
}

async function removeAppointment(id) {
  const ok = confirm("¿Eliminar esta cita? Esta acción no se puede deshacer.");
  if (!ok) return;

  clearAlert();
  try {
    await apiFetch(`/api/appointments/${id}`, { method: "DELETE" });
    setAlert("🗑️ Cita eliminada", "ok");
    await loadAppointments();
  } catch (err) {
    setAlert(err.message, "err");
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// init
loadAppointments();
