import * as chain from "./chain.js";
import * as ui from "./ui.js";

function ensureConnected() {
  if (!chain.isConnected()) {
    ui.setAlert("請先點選「連接錢包」連接 MetaMask 後再操作。");
    return false;
  }
  return true;
}

async function connectWalletFlow() {
  if (!chain.hasMetaMask()) {
    ui.setAlert("找不到 MetaMask。請先安裝 MetaMask 後再開啟此頁面。");
    return;
  }

  const result = await chain.connectWallet();

  ui.setText("txtNetwork", `${result.networkName} (${result.chainId})`);

  if (!result.ok) {
    ui.setAlert("請將 MetaMask 網路切換到 Sepolia 測試網後再試一次。");
    return;
  }

  ui.setText("txtAddress", result.address);
  ui.updateRoleUI(result.isAdmin, result.isVip);
  ui.setAlert("");

  window.ethereum.on("accountsChanged", async () => {
    try {
      const r = await chain.refreshSignerAddress();
      ui.setText("txtAddress", r.address);

      const role = await chain.getRoleFlags();
      ui.updateRoleUI(role.isAdmin, role.isVip);

      ui.setAlert("");
    } catch (err) {
      ui.setAlert("偵測到帳號變更，請重新連接錢包。");
    }
  });

  window.ethereum.on("chainChanged", async () => {
    window.location.reload();
  });
}

async function onExists() {
  if (!ensureConnected()) {
    return;
  }

  ui.setPre("outQuery", "");
  const raw = document.getElementById("qProductId").value;
  const id = Number(raw);

  if (!Number.isFinite(id) || id < 0) {
    ui.setAlert("請輸入正確的商品編號（非負整數）。");
    return;
  }

  const ok = await chain.existsProduct(id);
  ui.setAlert("");
  ui.setPre("outQuery", ui.renderExistsText(id, ok));
}

async function onGetProduct() {
  if (!ensureConnected()) {
    return;
  }

  ui.setPre("outQuery", "");
  const raw = document.getElementById("qProductId").value;
  const id = Number(raw);

  if (!Number.isFinite(id) || id < 0) {
    ui.setAlert("請輸入正確的商品編號（非負整數）。");
    return;
  }

  const ok = await chain.existsProduct(id);
  if (!ok) {
    ui.setAlert("");
    ui.setPre("outQuery", ui.renderProductNotFoundText(id));
    return;
  }

  const out = await chain.getProduct(id);

  ui.setAlert("");
  ui.setPre("outQuery", ui.renderProductText(out));
}

async function onRegister() {
  if (!ensureConnected()) {
    return;
  }

  ui.setPre("outRegister", "");

  const rawId = document.getElementById("rProductId").value;
  const id = Number(rawId);
  const name = document.getElementById("rName").value.trim();
  const origin = document.getElementById("rOrigin").value.trim();

  if (!Number.isFinite(id) || id < 0) {
    ui.setAlert("請輸入正確的商品編號（非負整數）。");
    return;
  }
  if (!name || !origin) {
    ui.setAlert("請輸入完整資料（商品名稱與產地皆不可空白）。");
    return;
  }

  ui.setAlert("");

  const tx = await chain.registerProduct(id, name, origin);

  ui.setPre(
    "outRegister",
    ui.renderTxPendingText(
      "新增商品",
      [`商品編號：${id}`, `商品名稱：${name}`, `產地：${origin}`],
      tx.hash
    )
  );

  await tx.wait();

  ui.setPre(
    "outRegister",
    ui.renderTxSuccessText(
      "新增商品完成",
      [`商品編號：${id}`, `商品名稱：${name}`, `產地：${origin}`],
      tx.hash
    )
  );
}

async function onAddVip() {
  if (!ensureConnected()) {
    return;
  }

  ui.setPre("outAdmin", "");

  const addr = document.getElementById("vipAddress").value.trim();
  if (!chain.isValidAddress(addr)) {
    ui.setPreError(
      "outAdmin",
      "新增 VIP 失敗",
      "錢包地址格式不正確，請輸入正確的 0x 開頭地址。"
    );
    return;
  }

  try {
    const tx = await chain.addVip(addr);

    ui.setPre(
      "outAdmin",
      ui.renderTxPendingText("新增 VIP", [`VIP 錢包地址：${addr}`], tx.hash)
    );

    await tx.wait();

    ui.setPre(
      "outAdmin",
      ui.renderTxSuccessText(
        "新增 VIP 完成",
        [`VIP 錢包地址：${addr}`],
        tx.hash
      )
    );
  } catch (err) {
    // 使用者取消 ≠ 錯誤
    if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
      ui.setPreNotice(
        "outAdmin",
        "新增 VIP 已取消",
        "你已取消錢包確認，因此沒有送出任何操作。"
      );
      return;
    }

    // 其他錯誤 → 就地顯示
    ui.setPreError(
      "outAdmin",
      "新增 VIP 失敗",
      ui.showFriendlyError ? "" : "操作失敗，請確認你具有管理者權限。"
    );
    console.error("[addVIP]", err);
  }
}

async function onRemoveVip() {
  if (!ensureConnected()) {
    return;
  }

  ui.setPre("outAdmin", "");

  const addr = document.getElementById("vipAddress").value.trim();
  if (!chain.isValidAddress(addr)) {
    ui.setPreError(
      "outAdmin",
      "移除 VIP 失敗",
      "錢包地址格式不正確，請輸入正確的 0x 開頭地址。"
    );
    return;
  }

  try {
    const tx = await chain.removeVip(addr);

    ui.setPre(
      "outAdmin",
      ui.renderTxPendingText("移除 VIP", [`VIP 錢包地址：${addr}`], tx.hash)
    );

    await tx.wait();

    ui.setPre(
      "outAdmin",
      ui.renderTxSuccessText(
        "移除 VIP 完成",
        [`VIP 錢包地址：${addr}`],
        tx.hash
      )
    );
  } catch (err) {
    if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
      ui.setPreNotice(
        "outAdmin",
        "移除 VIP 已取消",
        "你已取消錢包確認，因此沒有送出任何操作。"
      );
      return;
    }

    ui.setPreError(
      "outAdmin",
      "移除 VIP 失敗",
      "操作失敗，請確認你具有管理者權限，且該地址為 VIP。"
    );
    console.error("[removeVIP]", err);
  }
}

async function onCheckVip() {
  if (!ensureConnected()) {
    return;
  }

  ui.setPre("outAdmin", "");

  const addr = document.getElementById("vipAddress").value.trim();
  if (!chain.isValidAddress(addr)) {
    ui.setPreError(
      "outAdmin",
      "查詢 VIP 狀態失敗",
      "錢包地址格式不正確，請輸入正確的 0x 開頭地址。"
    );
    return;
  }

  try {
    const ok = await chain.checkVip(addr);
    ui.setPre("outAdmin", ui.renderVipStatusText(addr, ok));
  } catch (err) {
    ui.setPreError(
      "outAdmin",
      "查詢 VIP 狀態失敗",
      "無法讀取 VIP 狀態，請確認網路與合約狀態。"
    );
    console.error("[checkVIP]", err);
  }
}

function bindUI() {
  document.getElementById("btnConnect").addEventListener("click", async () => {
    try {
      ui.setAlert("");
      await connectWalletFlow();
    } catch (err) {
      ui.showFriendlyError("connect", err);
    }
  });

  document.getElementById("btnExists").addEventListener("click", async () => {
    try {
      ui.setAlert("");
      await onExists();
    } catch (err) {
      ui.showFriendlyError("exists", err);
    }
  });

  document
    .getElementById("btnGetProduct")
    .addEventListener("click", async () => {
      try {
        ui.setAlert("");
        await onGetProduct();
      } catch (err) {
        ui.showFriendlyError("getProduct", err);
      }
    });

  document.getElementById("btnRegister").addEventListener("click", async () => {
    try {
      ui.setAlert("");
      await onRegister();
    } catch (err) {
      ui.showFriendlyError("registerProduct", err);
    }
  });

  document.getElementById("btnAddVip").addEventListener("click", async () => {
    try {
      ui.setAlert("");
      await onAddVip();
      const role = await chain.getRoleFlags();
      ui.updateRoleUI(role.isAdmin, role.isVip);
    } catch (err) {
      ui.showFriendlyError("addVIP", err);
    }
  });

  document
    .getElementById("btnRemoveVip")
    .addEventListener("click", async () => {
      try {
        ui.setAlert("");
        await onRemoveVip();
      } catch (err) {
        ui.showFriendlyError("removeVIP", err);
      }
    });

  document.getElementById("btnCheckVip").addEventListener("click", async () => {
    try {
      ui.setAlert("");
      await onCheckVip();
    } catch (err) {
      ui.showFriendlyError("isVIP", err);
    }
  });
}

bindUI();
ui.showAdminSection(false);
ui.showVipSection(false);
