# 五線譜拔河大戰

國小音樂課用的網頁版互動遊戲。老師端投影五線譜題目與拔河畫面，兩隊各用一台 iPad 作答；答對會把繩子往自己隊伍方向拉。

## 題目範圍

高音譜表：中央 Do 到高音 Do，共 8 個音。

- 中央 Do / C
- Re / D
- Mi / E
- Fa / F
- Sol / G
- La / A
- Si / B
- 高音 Do / C

## 方式一：放到網路上，任何電腦都能開啟

如果你希望「不用固定老師電腦當主機」，而是任何電腦或 iPad 只要打開網址就能操作，請把這個專案部署到雲端平台。

### 使用 Render 部署

1. 建立 GitHub 帳號，並把此專案上傳到 GitHub repository。
2. 到 <https://render.com/> 註冊或登入。
3. 選擇 **New +** → **Blueprint**。
4. 選擇剛剛上傳的 GitHub repository。
5. Render 會讀取 `render.yaml`，自動建立網站。
6. 部署完成後，Render 會給你一個網址，例如：

```text
https://music-tug-of-war.onrender.com
```

之後任何電腦或 iPad 只要開這個網址就可以使用。

### 雲端版使用方式

假設你的網址是：

```text
https://music-tug-of-war.onrender.com
```

老師端：

```text
https://music-tug-of-war.onrender.com/teacher.html
```

藍隊：

```text
https://music-tug-of-war.onrender.com/team.html?team=A
```

紅隊：

```text
https://music-tug-of-war.onrender.com/team.html?team=B
```

也可以直接開首頁，由首頁進入老師端、藍隊、紅隊。

> 注意：免費雲端服務可能會在一段時間沒人使用後休眠，第一次開啟可能需要等待 30～60 秒。

## 方式二：只在教室同一個 Wi‑Fi 使用

請先安裝 Node.js：<https://nodejs.org/>

在此資料夾開啟終端機後執行：

```bash
npm install
npm start
```

啟動後會顯示類似：

```text
五線譜拔河大戰已啟動：http://localhost:3000
同一個 Wi‑Fi 的 iPad 可開啟：http://192.168.x.x:3000
```

## 課堂使用方式

1. 老師電腦開啟 `http://localhost:3000/teacher.html`，並投影到大螢幕。
2. 藍隊 iPad 開啟 `http://老師電腦IP:3000/team.html?team=A`。
3. 紅隊 iPad 開啟 `http://老師電腦IP:3000/team.html?team=B`。
4. 老師按「下一題」。
5. 兩隊看老師畫面上的五線譜，在 iPad 選出正確音名。

也可以先開首頁：

```text
http://localhost:3000/
```

首頁會提供老師端、藍隊、紅隊三個入口。

## 遊戲規則

- 答對：該隊拔河拉力 +1。
- 連續答對 3 題：額外 +1 拉力。
- 答錯：本題不加分，該隊本題不能再答。
- 先把繩子拉到底的隊伍獲勝。

## 建議設備配置

- 老師端：電腦或筆電，用投影機顯示。
- 學生端：兩台 iPad，一台給藍隊、一台給紅隊。
- 所有設備需連到同一個 Wi‑Fi。
