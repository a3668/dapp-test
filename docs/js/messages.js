import { ErrorCode } from "./errors.js";

/* -----------------------------
 * UI codes (非錯誤：一般提示/驗證/標題)
 * ----------------------------- */
export const UiCode = {
  PLEASE_CONNECT: "PLEASE_CONNECT",
  METAMASK_NOT_FOUND: "METAMASK_NOT_FOUND",
  INVALID_PRODUCT_ID: "INVALID_PRODUCT_ID",
  INCOMPLETE_INPUT: "INCOMPLETE_INPUT",
  QUERY_RESULT_TITLE: "QUERY_RESULT_TITLE",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  ACCOUNT_CHANGED_RECONNECT: "ACCOUNT_CHANGED_RECONNECT",

  TX_TITLE_REGISTER_PRODUCT: "TX_TITLE_REGISTER_PRODUCT",
  TX_TITLE_ADD_VIP: "TX_TITLE_ADD_VIP",
  TX_TITLE_REMOVE_VIP: "TX_TITLE_REMOVE_VIP",

  UNKNOWN_UI: "UNKNOWN_UI",
  // Template texts (templates.js 會用到)
  T_INFO_DEFAULT_TITLE: "T_INFO_DEFAULT_TITLE",

  T_EXISTS_PRODUCT_ID_PREFIX: "T_EXISTS_PRODUCT_ID_PREFIX",
  T_BADGE_REGISTERED: "T_BADGE_REGISTERED",
  T_BADGE_NOT_REGISTERED: "T_BADGE_NOT_REGISTERED",

  T_PRODUCT_TITLE_PREFIX: "T_PRODUCT_TITLE_PREFIX",
  T_BADGE_DETAIL: "T_BADGE_DETAIL",
  T_PRODUCT_ORIGIN_PREFIX: "T_PRODUCT_ORIGIN_PREFIX",

  T_FIELD_PRODUCER: "T_FIELD_PRODUCER",
  T_FIELD_PRODUCER_SHORT: "T_FIELD_PRODUCER_SHORT",
  T_FIELD_TIMESTAMP_UNIX: "T_FIELD_TIMESTAMP_UNIX",
  T_FIELD_TIMESTAMP_LOCAL: "T_FIELD_TIMESTAMP_LOCAL",

  T_BADGE_TX_PENDING: "T_BADGE_TX_PENDING",
  T_BADGE_TX_CONFIRMED: "T_BADGE_TX_CONFIRMED",
  T_BADGE_TX_FAILED: "T_BADGE_TX_FAILED",
  T_TX_DEFAULT_TITLE: "T_TX_DEFAULT_TITLE",
  T_TX_FIELD_HASH: "T_TX_FIELD_HASH",

  T_VIP_CHECK_TITLE: "T_VIP_CHECK_TITLE",
  T_BADGE_VIP: "T_BADGE_VIP",
  T_BADGE_NOT_VIP: "T_BADGE_NOT_VIP",
  T_FIELD_ADDRESS: "T_FIELD_ADDRESS",
  T_FIELD_IS_VIP: "T_FIELD_IS_VIP",
};

const UI_MESSAGES = {
  [UiCode.PLEASE_CONNECT]: "請先點選 Connect Wallet 連接錢包後再操作。",
  [UiCode.METAMASK_NOT_FOUND]:
    "找不到 MetaMask。請先安裝 MetaMask 後再開啟此頁面。",
  [UiCode.INVALID_PRODUCT_ID]: "請輸入正確的 Product ID（非負整數）。",
  [UiCode.INCOMPLETE_INPUT]: "請輸入完整資料（Name 與 Origin 皆不可空白）。",
  [UiCode.QUERY_RESULT_TITLE]: "查詢結果",
  [UiCode.PRODUCT_NOT_FOUND]: "查無此商品。請確認 Product ID 是否已登記。",
  [UiCode.ACCOUNT_CHANGED_RECONNECT]: "偵測到帳號變更，請重新連接錢包。",

  [UiCode.TX_TITLE_REGISTER_PRODUCT]: "新增商品交易",
  [UiCode.TX_TITLE_ADD_VIP]: "新增 VIP 交易",
  [UiCode.TX_TITLE_REMOVE_VIP]: "移除 VIP 交易",

  [UiCode.UNKNOWN_UI]: "發生未知狀況，請稍後再試。",
  // Template texts
  [UiCode.T_INFO_DEFAULT_TITLE]: "提示",

  [UiCode.T_EXISTS_PRODUCT_ID_PREFIX]: "商品編號：",
  [UiCode.T_BADGE_REGISTERED]: "已登記",
  [UiCode.T_BADGE_NOT_REGISTERED]: "未登記",

  [UiCode.T_PRODUCT_TITLE_PREFIX]: "商品 #",
  [UiCode.T_BADGE_DETAIL]: "詳細",
  [UiCode.T_PRODUCT_ORIGIN_PREFIX]: "產地：",

  [UiCode.T_FIELD_PRODUCER]: "生產者地址",
  [UiCode.T_FIELD_PRODUCER_SHORT]: "生產者（縮寫）",
  [UiCode.T_FIELD_TIMESTAMP_UNIX]: "時間戳（Unix）",
  [UiCode.T_FIELD_TIMESTAMP_LOCAL]: "時間（本地）",

  [UiCode.T_BADGE_TX_PENDING]: "等待確認",
  [UiCode.T_BADGE_TX_CONFIRMED]: "已確認",
  [UiCode.T_BADGE_TX_FAILED]: "失敗",
  [UiCode.T_TX_DEFAULT_TITLE]: "交易",
  [UiCode.T_TX_FIELD_HASH]: "交易 Hash",

  [UiCode.T_VIP_CHECK_TITLE]: "VIP 狀態查詢",
  [UiCode.T_BADGE_VIP]: "VIP",
  [UiCode.T_BADGE_NOT_VIP]: "非 VIP",
  [UiCode.T_FIELD_ADDRESS]: "地址",
  [UiCode.T_FIELD_IS_VIP]: "是否為 VIP",
};

export function getUiMessage(code) {
  if (UI_MESSAGES[code]) {
    return UI_MESSAGES[code];
  }
  return UI_MESSAGES[UiCode.UNKNOWN_UI];
}

/* -----------------------------
 * Error codes -> user messages (你原本的邏輯保留)
 * ----------------------------- */
const COMMON = {
  [ErrorCode.USER_REJECTED]: "你已取消錢包確認，因此沒有送出任何操作。",
  [ErrorCode.NETWORK_ERROR]:
    "目前無法連線到區塊鏈節點，請檢查網路連線或稍後再試。",
  [ErrorCode.WRONG_NETWORK]:
    "請將 MetaMask 網路切換到 Sepolia 測試網後再試一次。",
  [ErrorCode.INSUFFICIENT_FUNDS]:
    "錢包測試幣不足（SepoliaETH 不夠支付 gas）。請先補充測試幣後再試。",
  [ErrorCode.INVALID_ADDRESS]: "地址格式不正確，請輸入正確的 0x 開頭地址。",
  [ErrorCode.CALL_EXCEPTION]:
    "讀取合約資料失敗。請確認網路在 Sepolia，且合約地址/ABI 設定正確。",
  [ErrorCode.UNKNOWN]: "操作失敗，請稍後再試。",
};

const CONTEXT_OVERRIDES = {
  registerProduct: {
    [ErrorCode.GAS_ESTIMATE_FAILED]:
      "無法送出新增商品交易。請確認你是 Admin/VIP，且輸入內容完整，且該 Product ID 尚未登記。",
  },
  addVIP: {
    [ErrorCode.GAS_ESTIMATE_FAILED]:
      "無法送出 VIP 管理交易。請確認你是 Admin，且輸入的地址正確。",
  },
  removeVIP: {
    [ErrorCode.GAS_ESTIMATE_FAILED]:
      "無法送出 VIP 管理交易。請確認你是 Admin，且輸入的地址正確。",
  },
  getProduct: {
    [ErrorCode.CALL_EXCEPTION]:
      "查無此商品資料。請先用 exists() 確認該 Product ID 是否已登記。",
  },
};

export function getUserMessage(context, code) {
  const ctx = context || "";
  const map = CONTEXT_OVERRIDES[ctx];
  if (map && map[code]) {
    return map[code];
  }
  if (COMMON[code]) {
    return COMMON[code];
  }
  return COMMON[ErrorCode.UNKNOWN];
}
