/* =========================
   Global alert (semantic)
   ========================= */

export function setAlert(message, type = "error") {
  const el = document.getElementById("alertBox");

  // reset classes
  el.classList.remove("alert-info", "alert-warning", "alert-danger", "d-none");

  if (!message) {
    el.textContent = "";
    el.classList.add("d-none");
    return;
  }

  el.textContent = message;
  el.classList.add("alert");

  switch (type) {
    case "info":
      el.classList.add("alert-info");
      break;
    case "notice":
      el.classList.add("alert-warning");
      break;
    case "error":
    default:
      el.classList.add("alert-danger");
      break;
  }
}

/* =========================
   Basic DOM helpers
   ========================= */

export function setText(id, value) {
  document.getElementById(id).textContent = value;
}

export function setPre(id, value) {
  document.getElementById(id).textContent = value;
}

export function showAdminSection(show) {
  const el = document.getElementById("adminSection");
  if (show) {
    el.classList.remove("d-none");
  } else {
    el.classList.add("d-none");
  }
}

export function showVipSection(show) {
  const el = document.getElementById("vipSection");
  if (show) {
    el.classList.remove("d-none");
  } else {
    el.classList.add("d-none");
  }
}

export function updateRoleUI(isAdmin, isVip) {
  let roleText = "一般使用者";
  if (isAdmin) {
    roleText = "管理者";
  } else if (isVip) {
    roleText = "VIP";
  }

  setText("txtRole", roleText);
  showAdminSection(Boolean(isAdmin));
  showVipSection(Boolean(isAdmin || isVip));
}

/* =========================
   Human-readable renderers
   ========================= */

const SEPARATOR = "────────────";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatYMDHM(unixSeconds) {
  const sec = Number(unixSeconds);
  if (!Number.isFinite(sec)) {
    return "-";
  }

  const d = new Date(sec * 1000);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

export function renderBlock(title, lines) {
  const body = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
  return `${title}\n${SEPARATOR}\n${body}`.trim();
}

export function renderExistsText(productId, exists) {
  return renderBlock("商品登記狀態", [
    `商品編號：${productId}`,
    `是否已登記：${exists ? "是" : "否"}`,
  ]);
}

export function renderProductNotFoundText(productId) {
  return renderBlock("商品查詢結果", [
    `商品編號：${productId}`,
    "查無此商品資料。請先確認是否已登記。",
  ]);
}

export function renderProductText(product) {
  return renderBlock("商品資訊", [
    `商品編號：${product.id}`,
    `商品名稱：${product.name}`,
    `產地：${product.origin}`,
    `生產者：${product.producer}`,
    `登記時間：${formatYMDHM(product.timestamp)}`,
  ]);
}

export function renderTxPendingText(title, detailLines, txHash) {
  const lines = [];
  if (Array.isArray(detailLines) && detailLines.length > 0) {
    lines.push(...detailLines);
  }
  lines.push("交易狀態：等待鏈上確認中...");
  lines.push("交易雜湊：");
  lines.push(String(txHash || "-"));

  return renderBlock(title, lines);
}

export function renderTxSuccessText(title, detailLines, txHash) {
  const lines = [];
  if (Array.isArray(detailLines) && detailLines.length > 0) {
    lines.push(...detailLines);
  }
  lines.push("交易狀態：已完成");
  lines.push("交易雜湊：");
  lines.push(String(txHash || "-"));

  return renderBlock(title, lines);
}

export function renderVipStatusText(addr, isVip) {
  return renderBlock("VIP 狀態查詢", [
    `錢包地址：${addr}`,
    `是否為 VIP：${isVip ? "是" : "否"}`,
  ]);
}

/* =========================
   Friendly error mapping
   ========================= */

function safeMessageFromError(err) {
  const msg =
    (err && err.shortMessage) ||
    (err && err.reason) ||
    (err && err.message) ||
    String(err);

  return String(msg || "");
}

function toUserMessage(context, err) {
  const msg = safeMessageFromError(err);
  const lower = msg.toLowerCase();

  // user cancelled
  if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
    return { text: "你已取消錢包確認，因此沒有送出任何操作。", type: "notice" };
  }
  if (
    lower.includes("user rejected") ||
    lower.includes("rejected") ||
    lower.includes("denied")
  ) {
    return { text: "你已取消錢包確認，因此沒有送出任何操作。", type: "notice" };
  }

  // network
  if (
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("could not detect network")
  ) {
    return {
      text: "目前無法連線到區塊鏈節點，請檢查網路連線或稍後再試。",
      type: "error",
    };
  }

  // gas
  if (lower.includes("insufficient funds")) {
    return {
      text: "錢包測試幣不足（Sepolia ETH 不夠支付 gas）。請先補充測試幣後再試。",
      type: "error",
    };
  }

  // address
  if (
    lower.includes("invalid address") ||
    (err && err.code === "INVALID_ARGUMENT" && lower.includes("address"))
  ) {
    return {
      text: "錢包地址格式不正確，請輸入正確的 0x 開頭地址。",
      type: "notice",
    };
  }

  // gas estimation / permission
  if (
    lower.includes("cannot estimate gas") ||
    lower.includes("estimategas") ||
    (err && err.code === "UNPREDICTABLE_GAS_LIMIT")
  ) {
    if (context === "registerProduct") {
      return {
        text: "無法送出「新增商品」交易。請確認你是管理者或 VIP，且輸入資料完整，且該商品編號尚未登記。",
        type: "error",
      };
    }
    if (context === "addVIP" || context === "removeVIP") {
      return {
        text: "無法送出「VIP 管理」交易。請確認你是管理者，且輸入的錢包地址正確。",
        type: "error",
      };
    }
    return {
      text: "交易可能會失敗（權限不足或資料不合法）。請確認角色與輸入資料後再試。",
      type: "error",
    };
  }

  // call exception
  if (err && err.code === "CALL_EXCEPTION") {
    if (context === "getProduct") {
      return {
        text: "查無此商品資料。請先用「檢查是否已登記」確認該商品編號是否已登記。",
        type: "notice",
      };
    }
    return {
      text: "讀取合約資料失敗。請確認網路在 Sepolia，且合約地址/ABI 設定正確。",
      type: "error",
    };
  }

  return { text: "操作失敗，請稍後再試。", type: "error" };
}

export function showFriendlyError(context, err) {
  const { text, type } = toUserMessage(context, err);
  setAlert(text, type);
  console.error(`[${context}]`, err);
}
/* =========================
   Local (block-level) errors
   ========================= */

export function renderErrorBlock(title, message) {
  return renderBlock(title, [`錯誤原因：${message}`, "請修正後再試。"]);
}

export function renderNoticeBlock(title, message) {
  return renderBlock(title, [message]);
}

export function setPreError(id, title, message) {
  setPre(id, renderErrorBlock(title, message));
}

export function setPreNotice(id, title, message) {
  setPre(id, renderNoticeBlock(title, message));
}
