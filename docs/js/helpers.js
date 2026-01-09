import * as ui from "./ui.js";
import * as tpl from "./templates.js";
import { getUiMessage } from "./messages.js";

export function requireConnectedAndClear(ensureConnectedFn, outId) {
  if (!ensureConnectedFn()) {
    return false;
  }
  ui.clearContent(outId);
  return true;
}

export function readNonNegInt(inputId, invalidUiCode) {
  const raw = ui.getValue(inputId);
  const n = Number(raw);

  if (!Number.isFinite(n) || n < 0) {
    ui.setAlert(getUiMessage(invalidUiCode));
    return null;
  }
  return n;
}

export function readTrimmed(inputId) {
  return ui.getValue(inputId).trim();
}

export function alertUi(uiCode) {
  ui.setAlert(getUiMessage(uiCode));
}

export function renderInfoByCode(outId, titleUiCode, messageUiCode, variant) {
  ui.setContent(
    outId,
    tpl.renderInfoCard({
      title: getUiMessage(titleUiCode),
      message: getUiMessage(messageUiCode),
      variant: variant,
    })
  );
}

export async function runTxFlowByCode(outId, titleUiCode, txFactory) {
  const tx = await txFactory();

  ui.setContent(
    outId,
    tpl.renderTxCard({
      title: getUiMessage(titleUiCode),
      hash: tx.hash,
      status: "pending",
    })
  );

  await tx.wait();

  ui.setContent(
    outId,
    tpl.renderTxCard({
      title: getUiMessage(titleUiCode),
      hash: tx.hash,
      status: "success",
    })
  );
}

export function bindAction(
  buttonId,
  context,
  showFriendlyErrorFn,
  handler,
  after
) {
  ui.onClick(buttonId, async () => {
    try {
      ui.setAlert("");
      await handler();
      if (after) {
        await after();
      }
    } catch (err) {
      showFriendlyErrorFn(context, err);
    }
  });
}
