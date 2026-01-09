# 產品溯源系統（Product Traceability DApp）

此專案是一個部署於 **Ethereum Sepolia 測試網** 的產品溯源 DApp，透過智能合約管理商品登記與查詢，並提供 Admin/VIP 權限角色控管。前端為純靜態頁面（HTML + JS + Bootstrap），使用 ethers.js 連接 MetaMask 與鏈上合約互動。

---

## 功能摘要

### 角色與權限

- **User**：僅可查詢商品
- **VIP**：可登記商品
- **Admin**：可登記商品，且可新增/移除 VIP

### 核心功能

- 錢包連接（MetaMask）
- Sepolia 網路檢查與切換
- 商品是否已登記檢查
- 商品詳細資訊查詢
- 商品登記（VIP / Admin）
- VIP 狀態查詢、管理（Admin）

---

## 合約說明

### 合約名稱

`ProductTraceability`

### 主要資料結構

- `Product`：商品編號、名稱、產地、登記者、時間戳

### 主要函式

- `registerProduct(productId, name, origin)`：登記商品（VIP/Admin）
- `exists(productId)`：檢查商品是否已登記
- `getProduct(productId)`：查詢商品完整資訊
- `addVIP(address)` / `removeVIP(address)`：VIP 管理（Admin）
- `isAdmin(address)` / `isVIP(address)`：角色查詢

---

## 使用方式

### 前置需求

- 安裝 MetaMask
- 切換至 Sepolia 測試網
- 錢包需有少量 SepoliaETH（支付 gas）

### 操作流程

1. 開啟 [產品合約網址](https://a3668.github.io/dapp-test/)
2. 點選 **連接錢包**
3. 查看角色（User/VIP/Admin）
4. 進行商品查詢 / 商品登記 / VIP 管理

## 授權

MIT License
