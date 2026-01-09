import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
import * as ui from "./ui.js";
import * as tpl from "./templates.js";
import { ErrorCode, mapErrorToCode, makeAppError } from "./errors.js";
import { getUserMessage, getUiMessage, UiCode } from "./messages.js";
import {
  requireConnectedAndClear,
  readNonNegInt,
  readTrimmed,
  alertUi,
  renderInfoByCode,
  runTxFlowByCode,
  bindAction,
} from "./helpers.js";

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

function ensureConnected() {
  if (!provider || !signer || !contract || !currentAddress) {
    ui.setAlert(getUiMessage(UiCode.PLEASE_CONNECT));
    return false;
  }
  return true;
}

function showFriendlyError(context, err) {
  const code = mapErrorToCode(context, err);
  const userMsg = getUserMessage(context, code);
  ui.setAlert(userMsg);
  console.error(`[${context}]`, err);
}

async function ensureSepolia() {
  const network = await provider.getNetwork();
  const networkName = network && network.name ? network.name : "unknown";
  ui.setText("txtNetwork", `${networkName} (${network.chainId})`);

  if (Number(network.chainId) === SEPOLIA_CHAIN_ID_DEC) {
    ui.setAlert("");
    return true;
  }

  ui.setAlert(getUserMessage("connect", ErrorCode.WRONG_NETWORK));

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (err) {
    throw makeAppError(ErrorCode.WRONG_NETWORK, "connect", err);
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

  ui.setText("txtRole", roleText);

  ui.showAdminSection(Boolean(isAdminValue));
  ui.showVipSection(Boolean(isAdminValue || isVipValue));
}

async function connectWallet() {
  if (!window.ethereum) {
    ui.setAlert(getUiMessage(UiCode.METAMASK_NOT_FOUND));
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);

  await ensureSepolia();

  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  currentAddress = await signer.getAddress();

  ui.setText("txtAddress", currentAddress);

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  await refreshRole();
  ui.setAlert("");

  window.ethereum.on("accountsChanged", async () => {
    try {
      signer = await provider.getSigner();
      currentAddress = await signer.getAddress();
      ui.setText("txtAddress", currentAddress);
      await refreshRole();
      ui.setAlert("");
    } catch (err) {
      ui.setAlert(getUiMessage(UiCode.ACCOUNT_CHANGED_RECONNECT));
    }
  });

  window.ethereum.on("chainChanged", async () => {
    window.location.reload();
  });
}

async function onExists() {
  if (!requireConnectedAndClear(ensureConnected, "outQuery")) {
    return;
  }

  const id = readNonNegInt("qProductId", UiCode.INVALID_PRODUCT_ID);
  if (id === null) {
    return;
  }

  const ok = await contract.exists(id);
  ui.setContent("outQuery", tpl.renderExistsResult({ id: id, exists: ok }));
}

async function onGetProduct() {
  if (!requireConnectedAndClear(ensureConnected, "outQuery")) {
    return;
  }

  const id = readNonNegInt("qProductId", UiCode.INVALID_PRODUCT_ID);
  if (id === null) {
    return;
  }

  const ok = await contract.exists(id);
  if (!ok) {
    ui.setAlert("");
    renderInfoByCode(
      "outQuery",
      UiCode.QUERY_RESULT_TITLE,
      UiCode.PRODUCT_NOT_FOUND,
      "secondary"
    );
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

  ui.setAlert("");
  ui.setContent("outQuery", tpl.renderProductResult(out));
}

async function onRegister() {
  if (!requireConnectedAndClear(ensureConnected, "outRegister")) {
    return;
  }

  const id = readNonNegInt("rProductId", UiCode.INVALID_PRODUCT_ID);
  if (id === null) {
    return;
  }

  const name = readTrimmed("rName");
  const origin = readTrimmed("rOrigin");

  if (!name || !origin) {
    alertUi(UiCode.INCOMPLETE_INPUT);
    return;
  }

  ui.setAlert("");
  await runTxFlowByCode(
    "outRegister",
    UiCode.TX_TITLE_REGISTER_PRODUCT,
    async () => {
      return await contract.registerProduct(id, name, origin);
    }
  );
}

async function onAddVip() {
  if (!requireConnectedAndClear(ensureConnected, "outAdmin")) {
    return;
  }

  const addr = readTrimmed("vipAddress");
  if (!ethers.isAddress(addr)) {
    ui.setAlert(getUserMessage("addVIP", ErrorCode.INVALID_ADDRESS));
    return;
  }

  ui.setAlert("");
  await runTxFlowByCode("outAdmin", UiCode.TX_TITLE_ADD_VIP, async () => {
    return await contract.addVIP(addr);
  });
}

async function onRemoveVip() {
  if (!requireConnectedAndClear(ensureConnected, "outAdmin")) {
    return;
  }

  const addr = readTrimmed("vipAddress");
  if (!ethers.isAddress(addr)) {
    ui.setAlert(getUserMessage("removeVIP", ErrorCode.INVALID_ADDRESS));
    return;
  }

  ui.setAlert("");
  await runTxFlowByCode("outAdmin", UiCode.TX_TITLE_REMOVE_VIP, async () => {
    return await contract.removeVIP(addr);
  });
}

async function onCheckVip() {
  if (!requireConnectedAndClear(ensureConnected, "outAdmin")) {
    return;
  }

  const addr = readTrimmed("vipAddress");
  if (!ethers.isAddress(addr)) {
    ui.setAlert(getUserMessage("isVIP", ErrorCode.INVALID_ADDRESS));
    return;
  }

  ui.setAlert("");
  const ok = await contract.isVIP(addr);
  ui.setContent("outAdmin", tpl.renderVipCheck({ address: addr, isVip: ok }));
}

function bindUI() {
  bindAction("btnConnect", "connect", showFriendlyError, connectWallet);
  bindAction("btnExists", "exists", showFriendlyError, onExists);
  bindAction("btnGetProduct", "getProduct", showFriendlyError, onGetProduct);
  bindAction("btnRegister", "registerProduct", showFriendlyError, onRegister);
  bindAction("btnAddVip", "addVIP", showFriendlyError, onAddVip, refreshRole);
  bindAction("btnRemoveVip", "removeVIP", showFriendlyError, onRemoveVip);
  bindAction("btnCheckVip", "isVIP", showFriendlyError, onCheckVip);
}

bindUI();
ui.showAdminSection(false);
ui.showVipSection(false);
