# ProductTraceability 智慧合約技術說明文件

這是一個基於 **Solidity 0.8.18** 開發的產品溯源系統，整合了 OpenZeppelin 的 `AccessControl` 標準，提供安全的角色管理與透明的產品資料記錄功能。

---

## 1. 核心設計架構

合約採用 **RBAC (Role-Based Access Control)** 角色權限控管模式，將權限分為管理與操作兩層：

- **DEFAULT_ADMIN_ROLE (管理員)**：
  - 初始由合約部署者獲得。
  - 負責管理 VIP 名單（新增或移除）。
- **VIP_ROLE (特權用戶)**：
  - 由管理員授權。
  - 具備「註冊產品」的權限。

---

## 2. 資料結構與狀態變數

### 產品結構 (Product Struct)

合約使用 `struct` 儲存每個產品的詳細資訊，確保資料的完整性：

- `productId`: 產品唯一識別碼 (uint256)。
- `name`: 產品名稱 (string)。
- `origin`: 產地資訊 (string)。
- `producer`: 執行註冊的帳戶地址 (address)。
- `timestamp`: 寫入區塊的時間戳記 (uint256)。
- `exists`: 存在標記，用於驗證產品是否已註冊 (bool)。

### 儲存機制

- `mapping(uint256 => Product) private products`: 利用映射結構儲存，確保查詢產品的時間複雜度為 $O(1)$。

---

## 3. 函數功能說明

### 權限管理 (僅管理員可用)

- **`addVIP(address account)`**: 將特定地址設為 VIP，賦予註冊產品權限。
- **`removeVIP(address account)`**: 撤回特定地址的 VIP 權限。

### 產品操作 (VIP 或管理員可用)

- **`registerProduct(...)`**:
  - 檢查產品 ID 是否合法且未重複。
  - 驗證輸入欄位不可為空。
  - 將產品資訊寫入區塊鏈並觸發 `ProductRegistered` 事件。

### 查詢功能 (公開)

- **`getProduct(uint256 productId)`**: 回傳指定 ID 的產品詳細資料。若產品不存在，合約會回傳錯誤訊息 "Product not found"。
- **`exists(uint256 productId)`**: 快速確認該 ID 是否已被佔用。

---

## 4. 事件 (Events)

合約定義了以下事件，方便前端應用程式監聽鏈上狀態變動：

1.  `ProductRegistered`: 紀錄新產品的 ID、生產者、時間與基本資訊。
2.  `VIPAdded`: 當有新成員被賦予 VIP 權限時觸發。
3.  `VIPRemoved`: 當成員被移除 VIP 權限時觸發。

---

## 5. 安全性考量

- **零地址檢查**: 在管理 VIP 時，透過 `require(account != address(0))` 防止誤操作。
- **Gas 優化**: `registerProduct` 函數參數使用 `calldata` 類型，減少內存複製帶來的 Gas 消耗。
- **權限防護**: 透過自定義 `modifier` 嚴格限制敏感函數的進入權限。
