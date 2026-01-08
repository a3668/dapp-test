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

async function ensureSepolia() {
  const network = await provider.getNetwork();
  setText("txtNetwork", `${network.name} (${network.chainId})`);

  if (Number(network.chainId) === SEPOLIA_CHAIN_ID_DEC) {
    setAlert("");
    return true;
  }

  setAlert("Please switch MetaMask network to Sepolia, then try again.");

  // 嘗試自動切換
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (err) {
    // 需要手動切換或手動新增網路
    return false;
  }
}

async function refreshRole() {
  const isAdminValue = await contract.isAdmin(currentAddress);
  const isVipValue = await contract.isVIP(currentAddress);

  let roleText = "User";
  if (isAdminValue) {
    roleText = "Admin";
  } else if (isVipValue) {
    roleText = "VIP";
  }

  setText("txtRole", roleText);

  // 顯示對應區塊
  showAdminSection(Boolean(isAdminValue));
  showVipSection(Boolean(isAdminValue || isVipValue));
}

async function connectWallet() {
  if (!window.ethereum) {
    setAlert("MetaMask not found. Please install MetaMask.");
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

  // 監聽帳號/網路切換
  window.ethereum.on("accountsChanged", async () => {
    try {
      signer = await provider.getSigner();
      currentAddress = await signer.getAddress();
      setText("txtAddress", currentAddress);
      await refreshRole();
    } catch (err) {
      setAlert("Account changed, please reconnect.");
    }
  });

  window.ethereum.on("chainChanged", async () => {
    window.location.reload();
  });
}

async function onExists() {
  setPre("outQuery", "");
  const id = Number(document.getElementById("qProductId").value);
  const ok = await contract.exists(id);
  setPre("outQuery", `exists(${id}) = ${ok}`);
}

async function onGetProduct() {
  setPre("outQuery", "");
  const id = Number(document.getElementById("qProductId").value);
  const p = await contract.getProduct(id);
  const out = {
    id: p[0].toString(),
    name: p[1],
    origin: p[2],
    producer: p[3],
    timestamp: p[4].toString(),
  };
  setPre("outQuery", JSON.stringify(out, null, 2));
}

async function onRegister() {
  setPre("outRegister", "");
  const id = Number(document.getElementById("rProductId").value);
  const name = document.getElementById("rName").value;
  const origin = document.getElementById("rOrigin").value;

  const tx = await contract.registerProduct(id, name, origin);
  setPre("outRegister", `Sent tx: ${tx.hash}\nWaiting for confirmation...`);
  await tx.wait();
  setPre("outRegister", `Confirmed tx: ${tx.hash}`);
}

async function onAddVip() {
  setPre("outAdmin", "");
  const addr = document.getElementById("vipAddress").value;
  const tx = await contract.addVIP(addr);
  setPre("outAdmin", `Sent tx: ${tx.hash}\nWaiting for confirmation...`);
  await tx.wait();
  setPre("outAdmin", `VIP added. tx: ${tx.hash}`);
}

async function onRemoveVip() {
  setPre("outAdmin", "");
  const addr = document.getElementById("vipAddress").value;
  const tx = await contract.removeVIP(addr);
  setPre("outAdmin", `Sent tx: ${tx.hash}\nWaiting for confirmation...`);
  await tx.wait();
  setPre("outAdmin", `VIP removed. tx: ${tx.hash}`);
}

async function onCheckVip() {
  setPre("outAdmin", "");
  const addr = document.getElementById("vipAddress").value;
  const ok = await contract.isVIP(addr);
  setPre("outAdmin", `isVIP(${addr}) = ${ok}`);
}

function bindUI() {
  document.getElementById("btnConnect").addEventListener("click", async () => {
    try {
      await connectWallet();
    } catch (err) {
      setAlert(err && err.message ? err.message : "Connect failed.");
    }
  });

  document.getElementById("btnExists").addEventListener("click", async () => {
    try {
      await onExists();
    } catch (err) {
      setAlert(err && err.message ? err.message : "exists() failed.");
    }
  });

  document
    .getElementById("btnGetProduct")
    .addEventListener("click", async () => {
      try {
        await onGetProduct();
      } catch (err) {
        setAlert(err && err.message ? err.message : "getProduct() failed.");
      }
    });

  document.getElementById("btnRegister").addEventListener("click", async () => {
    try {
      await onRegister();
    } catch (err) {
      setAlert(err && err.message ? err.message : "registerProduct() failed.");
    }
  });

  document.getElementById("btnAddVip").addEventListener("click", async () => {
    try {
      await onAddVip();
      await refreshRole();
    } catch (err) {
      setAlert(err && err.message ? err.message : "addVIP() failed.");
    }
  });

  document
    .getElementById("btnRemoveVip")
    .addEventListener("click", async () => {
      try {
        await onRemoveVip();
      } catch (err) {
        setAlert(err && err.message ? err.message : "removeVIP() failed.");
      }
    });

  document.getElementById("btnCheckVip").addEventListener("click", async () => {
    try {
      await onCheckVip();
    } catch (err) {
      setAlert(err && err.message ? err.message : "isVIP() failed.");
    }
  });
}

bindUI();
showAdminSection(false);
showVipSection(false);
