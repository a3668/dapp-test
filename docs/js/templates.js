import { getUiMessage, UiCode } from "./messages.js";

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  return node;
}

function textNode(text) {
  return document.createTextNode(String(text ?? ""));
}

function setText(node, text) {
  node.textContent = String(text ?? "");
  return node;
}

function formatAddress(addr) {
  const s = String(addr ?? "");
  if (s.length <= 12) {
    return s;
  }
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

function formatUnixSecondsToLocal(tsSeconds) {
  const n = Number(tsSeconds);
  if (!Number.isFinite(n) || n <= 0) {
    return "-";
  }
  const d = new Date(n * 1000);
  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function badge(variant, label) {
  const b = el("span", `badge text-bg-${variant}`);
  b.appendChild(textNode(label));
  return b;
}

function kvTable(rows) {
  const tableWrap = el("div", "table-responsive");
  const table = el("table", "table table-sm mb-0 align-middle");
  const tbody = el("tbody");

  for (const row of rows) {
    const tr = el("tr");

    const th = el("th", "text-muted");
    th.style.width = "34%";
    setText(th, row.key);

    const td = el("td");
    if (row.isCode) {
      const code = el("code", "d-block wrap-anywhere");
      setText(code, row.value);
      td.appendChild(code);
    } else {
      const span = el("span", "wrap-anywhere");
      setText(span, row.value);
      td.appendChild(span);
    }

    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  return tableWrap;
}

function cardShell(titleText, rightNode) {
  const card = el("div", "card");
  const header = el(
    "div",
    "card-header d-flex align-items-center justify-content-between gap-2"
  );

  const title = el("div");
  title.appendChild(textNode(titleText));

  header.appendChild(title);
  if (rightNode) {
    header.appendChild(rightNode);
  }

  const body = el("div", "card-body");
  card.appendChild(header);
  card.appendChild(body);

  return { card, body };
}

export function renderInfoCard({ title, message, variant }) {
  const v = variant || "secondary";
  const defaultTitle = getUiMessage(UiCode.T_INFO_DEFAULT_TITLE);
  const { card, body } = cardShell(
    title || defaultTitle,
    badge(v, v.toUpperCase())
  );

  const p = el("div", "wrap-anywhere");
  setText(p, message || "");
  body.appendChild(p);
  return card;
}

export function renderExistsResult({ id, exists }) {
  const row = el(
    "div",
    "d-flex align-items-center justify-content-between border rounded-3 p-2 bg-body-tertiary"
  );

  const left = el("div", "fw-semibold");
  left.appendChild(
    textNode(`${getUiMessage(UiCode.T_EXISTS_PRODUCT_ID_PREFIX)}${id}`)
  );

  const right = exists
    ? badge("success", getUiMessage(UiCode.T_BADGE_REGISTERED))
    : badge("secondary", getUiMessage(UiCode.T_BADGE_NOT_REGISTERED));

  row.appendChild(left);
  row.appendChild(right);
  return row;
}

export function renderProductResult(product) {
  const id = product?.id ?? "-";
  const name = product?.name ?? "-";
  const origin = product?.origin ?? "-";
  const producer = product?.producer ?? "-";
  const ts = product?.timestamp ?? "-";

  const titlePrefix = getUiMessage(UiCode.T_PRODUCT_TITLE_PREFIX);
  const detailLabel = getUiMessage(UiCode.T_BADGE_DETAIL);
  const { card, body } = cardShell(
    `${titlePrefix}${id}`,
    badge("primary", detailLabel)
  );

  const summary = el("div", "mb-3");
  const title = el("div", "h5 mb-1");
  setText(title, name);

  const sub = el("div", "text-muted");
  setText(sub, `${getUiMessage(UiCode.T_PRODUCT_ORIGIN_PREFIX)}${origin}`);

  summary.appendChild(title);
  summary.appendChild(sub);

  const rows = [
    {
      key: getUiMessage(UiCode.T_FIELD_PRODUCER),
      value: producer,
      isCode: true,
    },
    {
      key: getUiMessage(UiCode.T_FIELD_PRODUCER_SHORT),
      value: formatAddress(producer),
      isCode: false,
    },
    {
      key: getUiMessage(UiCode.T_FIELD_TIMESTAMP_UNIX),
      value: String(ts),
      isCode: true,
    },
    {
      key: getUiMessage(UiCode.T_FIELD_TIMESTAMP_LOCAL),
      value: formatUnixSecondsToLocal(ts),
      isCode: false,
    },
  ];

  body.appendChild(summary);
  body.appendChild(kvTable(rows));

  return card;
}

export function renderTxCard({ title, hash, status }) {
  const s = status || "pending";
  const variant =
    s === "success" ? "success" : s === "failed" ? "danger" : "warning";

  let label = getUiMessage(UiCode.T_BADGE_TX_PENDING);
  if (s === "success") {
    label = getUiMessage(UiCode.T_BADGE_TX_CONFIRMED);
  } else if (s === "failed") {
    label = getUiMessage(UiCode.T_BADGE_TX_FAILED);
  }

  const defaultTitle = getUiMessage(UiCode.T_TX_DEFAULT_TITLE);
  const { card, body } = cardShell(
    title || defaultTitle,
    badge(variant, label)
  );

  const rows = [
    {
      key: getUiMessage(UiCode.T_TX_FIELD_HASH),
      value: hash || "-",
      isCode: true,
    },
  ];

  body.appendChild(kvTable(rows));
  return card;
}

export function renderVipCheck({ address, isVip }) {
  const title = getUiMessage(UiCode.T_VIP_CHECK_TITLE);
  const right = isVip
    ? badge("success", getUiMessage(UiCode.T_BADGE_VIP))
    : badge("secondary", getUiMessage(UiCode.T_BADGE_NOT_VIP));

  const { card, body } = cardShell(title, right);

  const rows = [
    {
      key: getUiMessage(UiCode.T_FIELD_ADDRESS),
      value: address || "-",
      isCode: true,
    },
    {
      key: getUiMessage(UiCode.T_FIELD_IS_VIP),
      value: String(Boolean(isVip)),
      isCode: false,
    },
  ];

  body.appendChild(kvTable(rows));
  return card;
}
