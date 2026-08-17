# Case 01 — ACG Activity Discovery Survey

手機優先的匿名 Product Discovery 問卷網站。

## 已完成

- 5 段式問卷流程
- Screening / Skip Logic
- 必填驗證
- 複選上限
- Exclusive option
- 1–5 分量表
- Mobile-first UI
- Progress bar
- `?source=` / `?campaign=` 渠道追蹤
- Supabase 匿名 INSERT
- 後續訪談聯絡頁獨立儲存
- 不提供瀏覽器端 SELECT 權限

## 1. 本機預覽

請不要直接雙擊 `index.html`。建議使用本機 HTTP server：

```bash
cd case01-survey-site
python3 -m http.server 8080
```

瀏覽器開啟：

```text
http://localhost:8080
```

## 2. 建立 Supabase

1. 建立一個 Supabase Project。
2. 打開 SQL Editor。
3. 執行 `supabase.sql`。
4. 到 Project Settings → API，取得：
   - Project URL
   - anon public key
5. 編輯 `config.js`：

```js
window.SURVEY_CONFIG = {
  SUPABASE_URL: "https://xxxx.supabase.co",
  SUPABASE_ANON_KEY: "你的 anon key",
  RESPONSES_TABLE: "survey_responses",
  CONTACTS_TABLE: "survey_contacts"
};
```

### 安全提醒

`anon key` 本來就是設計給前端使用的 public key。真正的資料權限由 Supabase RLS 控制。

本專案的 SQL 只允許 `anon INSERT`，沒有 `anon SELECT`，因此一般填答者不能從前端讀取其他人的回答。

## 3. Pre-test 渠道追蹤

可以發不同網址：

```text
https://你的網站/?source=friend
https://你的網站/?source=maid_A
https://你的網站/?source=bahamut
https://你的網站/?source=threads
```

也可再加 campaign：

```text
?source=maid_A&campaign=pretest
```

## 4. 建議正式發布流程

1. 先本機測試。
2. 設好 Supabase。
3. 先丟 5–10 位 Persona 做 Pre-test。
4. 收集「看不懂的題目 / 缺選項 / 完成時間」。
5. 修成 v1.1。
6. 再正式廣發。

## 5. 部署

純靜態網站，可部署到：

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel

### GitHub Pages

如果 repository root 就是這些檔案：

1. Push 到 GitHub。
2. Repository → Settings → Pages。
3. Deploy from branch。
4. Branch 選 `main` / root。

## 6. 後續分析

回答都在 `survey_responses.answers` JSONB。

建議第一輪分析：

- Qualified sample
- Q7 friction score / 4–5 占比
- Q10 failure rate
- Q6 primary competitor
- Q9 Discovery vs Freshness
- Q13 notification intent
- Q14 consumer-only ratio
- Maid / Idol / Cos segmentation
- Taipei vs non-Taipei
- source channel differences
