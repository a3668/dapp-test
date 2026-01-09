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

export function hasMetaMask() {
  return Boolean(window.ethereum);
}

export function isConnected() {
  return Boolean(provider && signer && contract && currentAddress);
}

export function getCurrentAddress() {
  return currentAddress;
}

export function isValidAddress(addr) {
  return ethers.isAddress(addr);
}

async function getNetworkInfoInternal() {
  const network = await provider.getNetwork();
  const networkName = network && network.name ? network.name : "unknown";
  const chainId = Number(network.chainId);
  return { networkName, chainId };
}

export async function ensureSepolia() {
  const infoBefore = await getNetworkInfoInternal();
  if (infoBefore.chainId === SEPOLIA_CHAIN_ID_DEC) {
    return { ok: true, ...infoBefore };
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (err) {
    return { ok: false, ...infoBefore };
  }

  const infoAfter = await getNetworkInfoInternal();
  return { ok: infoAfter.chainId === SEPOLIA_CHAIN_ID_DEC, ...infoAfter };
}

export async function connectWallet() {
  provider = new ethers.BrowserProvider(window.ethereum);

  const sepolia = await ensureSepolia();
  if (!sepolia.ok) {
    return {
      ok: false,
      networkName: sepolia.networkName,
      chainId: sepolia.chainId,
    };
  }

  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  currentAddress = await signer.getAddress();

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const role = await getRoleFlags();

  return {
    ok: true,
    address: currentAddress,
    networkName: sepolia.networkName,
    chainId: sepolia.chainId,
    isAdmin: role.isAdmin,
    isVip: role.isVip,
  };
}

export async function refreshSignerAddress() {
  signer = await provider.getSigner();
  currentAddress = await signer.getAddress();
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  return { address: currentAddress };
}

export async function getRoleFlags(address = currentAddress) {
  const isAdminValue = await contract.isAdmin(address);
  const isVipValue = await contract.isVIP(address);
  return { isAdmin: Boolean(isAdminValue), isVip: Boolean(isVipValue) };
}

export async function existsProduct(productId) {
  const ok = await contract.exists(productId);
  return Boolean(ok);
}

export async function getProduct(productId) {
  const p = await contract.getProduct(productId);
  return {
    id: p[0].toString(),
    name: p[1],
    origin: p[2],
    producer: p[3],
    timestamp: p[4].toString(),
  };
}

export async function registerProduct(productId, name, origin) {
  const tx = await contract.registerProduct(productId, name, origin);
  return {
    hash: tx.hash,
    wait: async () => {
      return await tx.wait();
    },
  };
}

export async function addVip(addr) {
  const tx = await contract.addVIP(addr);
  return {
    hash: tx.hash,
    wait: async () => {
      return await tx.wait();
    },
  };
}

export async function removeVip(addr) {
  const tx = await contract.removeVIP(addr);
  return {
    hash: tx.hash,
    wait: async () => {
      return await tx.wait();
    },
  };
}

export async function checkVip(addr) {
  const ok = await contract.isVIP(addr);
  return Boolean(ok);
}
