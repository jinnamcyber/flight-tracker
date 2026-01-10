# ✈️ Flight Tracker

即時航班追蹤與票價查詢應用程式，使用 Next.js 與 React 建構。

## ✨ 功能特色

- 🔍 航班號碼查詢
- 📊 即時航班狀態追蹤
- 💰 票價比較查詢
- 🌍 起降機場資訊

## 🚀 快速開始

### 環境需求

- Node.js 20+
- npm 或 yarn

### 安裝

```bash
# 安裝依賴套件
npm install
```

### 環境變數設定

在專案根目錄建立 `.env.local` 檔案：

```env
AVIATIONSTACK_API_KEY=your_api_key_here
```

### 開發模式

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
npm run build
```

### 啟動生產伺服器

```bash
npm start
```

## 📁 專案結構

```
flight-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions 部署設定
├── src/
│   └── app/
│       ├── api/
│       │   ├── flights/  # 航班 API
│       │   └── prices/   # 票價 API
│       ├── page.tsx      # 首頁
│       └── globals.css   # 全域樣式
├── public/               # 靜態資源
├── .env.local            # 環境變數（不上傳）
├── next.config.ts        # Next.js 設定
├── package.json          # 專案設定
└── README.md             # 說明文件
```

## 🔧 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建置生產版本 |
| `npm start` | 啟動生產伺服器 |
| `npm run lint` | 執行 ESLint 檢查 |

## 🌐 部署

### Vercel（推薦）

由於專案使用 API Routes，建議使用 Vercel 部署：

#### 方法一：Vercel Dashboard

1. 前往 [Vercel](https://vercel.com) 並連結 GitHub
2. Import 此 Repository
3. 在 Environment Variables 中新增 `AVIATIONSTACK_API_KEY`
4. 點擊 Deploy

#### 方法二：GitHub Actions 自動部署

專案已設定 GitHub Actions，需在 Repository Settings → Secrets 中新增：

| Secret 名稱 | 說明 |
|-------------|------|
| `VERCEL_TOKEN` | Vercel 個人存取權杖 |
| `VERCEL_ORG_ID` | Vercel 組織 ID |
| `VERCEL_PROJECT_ID` | Vercel 專案 ID |

取得方式：
1. `VERCEL_TOKEN`: Vercel Dashboard → Settings → Tokens
2. `VERCEL_ORG_ID` & `VERCEL_PROJECT_ID`: 執行 `vercel link` 後在 `.vercel/project.json` 中取得

## 📝 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 與 Pull Request！
