# 產品溯源系統（Product Traceability DApp）

本專案為一個基於 **Ethereum 區塊鏈（Sepolia 測試網）** 的產品溯源去中心化應用程式（DApp），  
用於示範如何透過智能合約進行 **商品登記、查詢與角色權限管理（Admin / VIP / User）**。

前端以 **HTML5 + JavaScript（ethers.js）** 實作，  
後端邏輯則由 **Solidity 智能合約（搭配 OpenZeppelin 權限模組）** 負責。

---

## 專案功能概述

### 使用者角色

系統依據錢包地址自動判斷使用者角色：

- **User**：一般使用者，可查詢商品資料
- **VIP**：可登記商品，並具備一般查詢權限
- **Admin**：可登記商品，並管理 VIP 名單

角色資訊完全由區塊鏈智能合約維護，前端僅負責顯示狀態。

---

## 主要功能

### 1. 錢包連接

- 使用 MetaMask 連接使用者錢包
- 自動檢查並切換至 Sepolia 測試網
- 顯示錢包地址、目前網路與使用者角色

### 2. 商品查詢

- 輸入商品編號（Product ID）
- 檢查商品是否已登記
- 查詢商品詳細資訊：
  - 商品編號
  - 商品名稱
  - 產地
  - 登記者錢包地址
  - 登記時間（區塊鏈時間戳）

### 3. 商品登記（VIP / Admin）

- 僅限 VIP 或 Admin
- 輸入商品編號、名稱與產地
- 送出交易並等待鏈上確認
- 成功後即可被所有使用者查詢

### 4. VIP 管理（Admin）

- 僅限 Admin
- 新增 VIP 錢包地址
- 移除 VIP
- 查詢指定地址是否為 VIP

---

## 技術使用

### 智能合約

- Solidity ^0.8.x
- OpenZeppelin（AccessControl）
- 部署網路：Ethereum Sepolia Testnet

### 前端

- HTML5 / CSS3
- Bootstrap 5
- ethers.js v6（BrowserProvider）
- MetaMask 整合

---

## 使用方式

### 1. 環境需求

- 安裝 MetaMask 瀏覽器錢包
- MetaMask 切換至 **Sepolia 測試網**
- 錢包內需有少量 **SepoliaETH**（支付交易 gas）

### 2. 開啟應用程式

- 使用 GitHub Pages 開啟本專案 `docs/` 所部署的網頁
- 點擊「連接錢包」
- 連接成功後，畫面將顯示 Address / Network / Role

### 3. 操作流程（建議順序）

1. **連接錢包**
2. **商品查詢**：輸入 Product ID → 可先檢查是否已登記 → 再查詢詳細資料
3. **商品登記（VIP / Admin）**：輸入 Product ID、名稱、產地 → 送出交易 → 等待確認
4. **VIP 管理（Admin）**：輸入地址 → 新增/移除 VIP 或查詢 VIP 狀態

---

## 錯誤處理

- 前端會將區塊鏈錯誤轉換為使用者可理解的提示文字
- 避免直接顯示底層錯誤碼或大量「程式型訊息」
- 詳細錯誤仍會保留在瀏覽器 Console 方便除錯

---

## 注意事項

- 本專案部署於 **Sepolia 測試網**，不屬於主網正式環境
- 本專案以示範「合約 + 前端整合」為目的，未包含完整生產環境安全審計與防護
- 若要展示給他人操作，請確保其 MetaMask 網路與測試幣已準備完成

---

## 授權

MIT License

[測試網址](https://a3668.github.io/dapp-test/)
