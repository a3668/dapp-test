function byId(id) {
  return document.getElementById(id);
}

export function setAlert(message) {
  const el = byId("alertBox");
  if (!el) {
    return;
  }

  if (message) {
    el.textContent = message;
    el.classList.remove("d-none");
  } else {
    el.textContent = "";
    el.classList.add("d-none");
  }
}

export function setText(id, value) {
  const el = byId(id);
  if (!el) {
    return;
  }
  el.textContent = value;
}

export function showAdminSection(show) {
  const el = byId("adminSection");
  if (!el) {
    return;
  }

  if (show) {
    el.classList.remove("d-none");
  } else {
    el.classList.add("d-none");
  }
}

export function showVipSection(show) {
  const el = byId("vipSection");
  if (!el) {
    return;
  }

  if (show) {
    el.classList.remove("d-none");
  } else {
    el.classList.add("d-none");
  }
}

export function getValue(id) {
  const el = byId(id);
  if (!el) {
    return "";
  }
  return String(el.value || "");
}

export function onClick(id, handler) {
  const el = byId(id);
  if (!el) {
    return;
  }
  el.addEventListener("click", handler);
}

export function clearContent(id) {
  const el = byId(id);
  if (!el) {
    return;
  }
  el.replaceChildren();
}

export function setContent(id, node) {
  const el = byId(id);
  if (!el) {
    return;
  }

  if (!node) {
    el.replaceChildren();
    return;
  }

  el.replaceChildren(node);
}
