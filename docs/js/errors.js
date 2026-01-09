export const ErrorCode = {
  USER_REJECTED: "USER_REJECTED",
  NETWORK_ERROR: "NETWORK_ERROR",
  WRONG_NETWORK: "WRONG_NETWORK",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  INVALID_ADDRESS: "INVALID_ADDRESS",
  GAS_ESTIMATE_FAILED: "GAS_ESTIMATE_FAILED",
  CALL_EXCEPTION: "CALL_EXCEPTION",
  UNKNOWN: "UNKNOWN",
};

export function makeAppError(code, context, originalError) {
  const e = new Error(code);
  e.name = "AppError";
  e.appCode = code;
  e.context = context || "";
  e.originalError = originalError || null;
  return e;
}

function safeMessageFromError(err) {
  const msg =
    (err && err.shortMessage) ||
    (err && err.reason) ||
    (err && err.message) ||
    String(err);

  return String(msg || "");
}

export function mapErrorToCode(context, err) {
  if (!err) {
    return ErrorCode.UNKNOWN;
  }

  // 自己 throw 的 AppError
  if (err.name === "AppError" && err.appCode) {
    return err.appCode;
  }

  // ethers / metamask 常見：使用者取消
  if (err.code === 4001 || err.code === "ACTION_REJECTED") {
    return ErrorCode.USER_REJECTED;
  }

  // 盡量用 code 判斷（穩定），必要時才 fallback 解析訊息（不把字串當狀態，只當 fallback）
  const msg = safeMessageFromError(err);
  const lower = msg.toLowerCase();

  // 網路 / RPC 問題
  if (
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("could not detect network")
  ) {
    return ErrorCode.NETWORK_ERROR;
  }

  // 餘額不足
  if (
    lower.includes("insufficient funds") ||
    err.code === "INSUFFICIENT_FUNDS"
  ) {
    return ErrorCode.INSUFFICIENT_FUNDS;
  }

  // 地址參數錯誤
  if (
    lower.includes("invalid address") ||
    (err.code === "INVALID_ARGUMENT" && lower.includes("address"))
  ) {
    return ErrorCode.INVALID_ADDRESS;
  }

  // 估 gas 失敗 / 交易可能失敗
  if (
    lower.includes("cannot estimate gas") ||
    lower.includes("estimategas") ||
    err.code === "UNPREDICTABLE_GAS_LIMIT"
  ) {
    return ErrorCode.GAS_ESTIMATE_FAILED;
  }

  // 合約呼叫失敗
  if (err.code === "CALL_EXCEPTION" || lower.includes("call_exception")) {
    return ErrorCode.CALL_EXCEPTION;
  }

  return ErrorCode.UNKNOWN;
}
