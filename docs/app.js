import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const SEPOLIA_CHAIN_ID_DEC = 11155111;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

const CONTRACT_ADDRESS = "0xc5720274645A7E4cB839372bFd753f3922153B54";

const ABI = [
  "function isAdmin(address account) view returns (bool)",
  "function isVIP(address account) view returns (bool)",
  "function addVIP(address account)",
  "function removeVIP(address account)",
  "function registerProduct(uint256 productId, string name, string origin)",
  "function exists(uint256 productId) view returns (bool)",
  "function getProduct(uint256 productId) view returns (uint256 id, string name, string origin, address producer, uint256 timestamp)",
];

let provider = null;
let signer = null;
let contract = null;
let currentAddress = null;

function setAlert(message) {
  const el = document.getElementById("alertBox");
  if (message) {
    el.textContent = message;
    el.classList.remove("d-none");
  } else {
    el.textContent = "";
    el.classList.add("d-none");
  }
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function setPre(id, value) {
  document.getElementById(id).textContent = value;
}

function showAdminSection(show) {
  const el = document.getElementById("adminSection");
  if (show) {
    el.classList.remove("d-none");
  } else {
    el.classList.add("d-none");
  }
}

function showVipSection(show) {
  const el = document.getElementById("vipSection");
  if (show) {
    el.classList.remove("d-none");
  } else {
    el.classList.add("d-none");
  }
}

function ensureConnected() {
  if (!provider || !signer || !contract || !currentAddress) {
    setAlert("請先點選「連接錢包」連接 MetaMask 後再操作。");
    return false;
  }
  return true;
}

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

  // 使用者取消簽名/交易
  if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
    return "你已取消錢包確認，因此沒有送出任何操作。";
  }
  if (
    lower.includes("user rejected") ||
    lower.includes("rejected") ||
    lower.includes("denied")
  ) {
    return "你已取消錢包確認，因此沒有送出任何操作。";
  }

  // 網路/節點問題
  if (
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("could not detect network")
  ) {
    return "目前無法連線到區塊鏈節點，請檢查網路連線或稍後再試。";
  }

  // 餘額不足
  if (lower.includes("insufficient funds")) {
    return "錢包測試幣不足（Sepolia ETH 不夠支付 gas）。請先補充測試幣後再試。";
  }

  // 地址格式錯誤
  if (
    lower.includes("invalid address") ||
    (err && err.code === "INVALID_ARGUMENT" && lower.includes("address"))
  ) {
    return "錢包地址格式不正確，請輸入正確的 0x 開頭地址。";
  }

  // 常見：交易可能會失敗（估 gas 失敗 / 權限不足 / 參數不合法）
  if (
    lower.includes("cannot estimate gas") ||
    lower.includes("estimategas") ||
    (err && err.code === "UNPREDICTABLE_GAS_LIMIT")
  ) {
    if (context === "registerProduct") {
      return "無法送出「新增商品」交易。請確認你是管理者或 VIP，且輸入資料完整，且該商品編號尚未登記。";
    }
    if (context === "addVIP" || context === "removeVIP") {
      return "無法送出「VIP 管理」交易。請確認你是管理者，且輸入的錢包地址正確。";
    }
    return "交易可能會失敗（權限不足或資料不合法）。請確認角色與輸入資料後再試。";
  }

  // 合約呼叫失敗（常見於查不到商品或合約/ABI 不匹配）
  if (err && err.code === "CALL_EXCEPTION") {
    if (context === "getProduct") {
      return "查無此商品資料。請先用「檢查是否已登記」確認該商品編號是否已登記。";
    }
    return "讀取合約資料失敗。請確認網路在 Sepolia，且合約地址/ABI 設定正確。";
  }

  // 特別針對你畫面出現的 missing revert data
  if (
    lower.includes("missing revert data") ||
    lower.includes("call_exception")
  ) {
    if (context === "getProduct") {
      return "查無此商品資料。請先用「檢查是否已登記」確認該商品編號是否已登記。";
    }
    return "操作失敗（合約未回傳詳細原因）。請確認網路、合約地址與輸入資料後再試。";
  }

  // 預設訊息
  return "操作失敗，請稍後再試。";
}

function showFriendlyError(context, err) {
  const userMsg = toUserMessage(context, err);
  setAlert(userMsg);

  // 技術細節不要丟給一般使用者，但可以留在 console 方便你 debug
  console.error(`[${context}]`, err);
}

async function ensureSepolia() {
  const network = await provider.getNetwork();
  const networkName = network && network.name ? network.name : "unknown";
  setText("txtNetwork", `${networkName} (${network.chainId})`);

  if (Number(network.chainId) === SEPOLIA_CHAIN_ID_DEC) {
    setAlert("");
    return true;
  }

  setAlert("請將 MetaMask 網路切換到 Sepolia 測試網後再試一次。");

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (err) {
    return false;
  }
}

async function refreshRole() {
  const isAdminValue = await contract.isAdmin(currentAddress);
  const isVipValue = await contract.isVIP(currentAddress);

  let roleText = "一般使用者";
  if (isAdminValue) {
    roleText = "管理者";
  } else if (isVipValue) {
    roleText = "VIP";
  }

  setText("txtRole", roleText);

  showAdminSection(Boolean(isAdminValue));
  showVipSection(Boolean(isAdminValue || isVipValue));
}

async function connectWallet() {
  if (!window.ethereum) {
    setAlert("找不到 MetaMask。請先安裝 MetaMask 後再開啟此頁面。");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);

  const ok = await ensureSepolia();
  if (!ok) {
    return;
  }

  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  currentAddress = await signer.getAddress();

  setText("txtAddress", currentAddress);

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  await refreshRole();
  setAlert("");

  window.ethereum.on("accountsChanged", async () => {
    try {
      signer = await provider.getSigner();
      currentAddress = await signer.getAddress();
      setText("txtAddress", currentAddress);
      await refreshRole();
      setAlert("");
    } catch (err) {
      setAlert("偵測到帳號變更，請重新連接錢包。");
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

  setPre("outQuery", "");
  const raw = document.getElementById("qProductId").value;
  const id = Number(raw);

  if (!Number.isFinite(id) || id < 0) {
    setAlert("請輸入正確的商品編號（非負整數）。");
    return;
  }

  const ok = await contract.exists(id);
  setPre("outQuery", `exists(${id}) = ${ok}`);
}

async function onGetProduct() {
  if (!ensureConnected()) {
    return;
  }

  setPre("outQuery", "");
  const raw = document.getElementById("qProductId").value;
  const id = Number(raw);

  if (!Number.isFinite(id) || id < 0) {
    setAlert("請輸入正確的商品編號（非負整數）。");
    return;
  }

  // 先 exists()，避免 getProduct() 直接 revert 造成醜的錯誤訊息
  const ok = await contract.exists(id);
  if (!ok) {
    setAlert("");
    setPre("outQuery", "查無此商品。請確認商品編號是否已登記。");
    return;
  }

  const p = await contract.getProduct(id);
  const out = {
    id: p[0].toString(),
    name: p[1],
    origin: p[2],
    producer: p[3],
    timestamp: p[4].toString(),
  };

  setAlert("");
  setPre("outQuery", JSON.stringify(out, null, 2));
}

async function onRegister() {
  if (!ensureConnected()) {
    return;
  }

  setPre("outRegister", "");

  const rawId = document.getElementById("rProductId").value;
  const id = Number(rawId);
  const name = document.getElementById("rName").value.trim();
  const origin = document.getElementById("rOrigin").value.trim();

  if (!Number.isFinite(id) || id < 0) {
    setAlert("請輸入正確的商品編號（非負整數）。");
    return;
  }
  if (!name || !origin) {
    setAlert("請輸入完整資料（商品名稱與產地皆不可空白）。");
    return;
  }

  setAlert("");

  const tx = await contract.registerProduct(id, name, origin);
  setPre("outRegister", `已送出交易：\n${tx.hash}\n等待鏈上確認中...`);
  await tx.wait();
  setPre("outRegister", `新增成功。\n交易：\n${tx.hash}`);
}

async function onAddVip() {
  if (!ensureConnected()) {
    return;
  }

  setPre("outAdmin", "");

  const addr = document.getElementById("vipAddress").value.trim();
  if (!ethers.isAddress(addr)) {
    setAlert("VIP 錢包地址格式不正確，請輸入正確的 0x 開頭地址。");
    return;
  }

  setAlert("");

  const tx = await contract.addVIP(addr);
  setPre("outAdmin", `已送出交易：\n${tx.hash}\n等待鏈上確認中...`);
  await tx.wait();
  setPre("outAdmin", `已新增 VIP。\n交易：\n${tx.hash}`);
}

async function onRemoveVip() {
  if (!ensureConnected()) {
    return;
  }

  setPre("outAdmin", "");

  const addr = document.getElementById("vipAddress").value.trim();
  if (!ethers.isAddress(addr)) {
    setAlert("VIP 錢包地址格式不正確，請輸入正確的 0x 開頭地址。");
    return;
  }

  setAlert("");

  const tx = await contract.removeVIP(addr);
  setPre("outAdmin", `已送出交易：\n${tx.hash}\n等待鏈上確認中...`);
  await tx.wait();
  setPre("outAdmin", `已移除 VIP。\n交易：\n${tx.hash}`);
}

async function onCheckVip() {
  if (!ensureConnected()) {
    return;
  }

  setPre("outAdmin", "");

  const addr = document.getElementById("vipAddress").value.trim();
  if (!ethers.isAddress(addr)) {
    setAlert("VIP 錢包地址格式不正確，請輸入正確的 0x 開頭地址。");
    return;
  }

  setAlert("");

  const ok = await contract.isVIP(addr);
  setPre("outAdmin", `isVIP(${addr}) = ${ok}`);
}

function bindUI() {
  document.getElementById("btnConnect").addEventListener("click", async () => {
    try {
      setAlert("");
      await connectWallet();
    } catch (err) {
      showFriendlyError("connect", err);
    }
  });

  document.getElementById("btnExists").addEventListener("click", async () => {
    try {
      setAlert("");
      await onExists();
    } catch (err) {
      showFriendlyError("exists", err);
    }
  });

  document
    .getElementById("btnGetProduct")
    .addEventListener("click", async () => {
      try {
        setAlert("");
        await onGetProduct();
      } catch (err) {
        showFriendlyError("getProduct", err);
      }
    });

  document.getElementById("btnRegister").addEventListener("click", async () => {
    try {
      setAlert("");
      await onRegister();
    } catch (err) {
      showFriendlyError("registerProduct", err);
    }
  });

  document.getElementById("btnAddVip").addEventListener("click", async () => {
    try {
      setAlert("");
      await onAddVip();
      await refreshRole();
    } catch (err) {
      showFriendlyError("addVIP", err);
    }
  });

  document
    .getElementById("btnRemoveVip")
    .addEventListener("click", async () => {
      try {
        setAlert("");
        await onRemoveVip();
      } catch (err) {
        showFriendlyError("removeVIP", err);
      }
    });

  document.getElementById("btnCheckVip").addEventListener("click", async () => {
    try {
      setAlert("");
      await onCheckVip();
    } catch (err) {
      showFriendlyError("isVIP", err);
    }
  });
}

bindUI();
showAdminSection(false);
showVipSection(false);
