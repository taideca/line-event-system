const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/contents', async (req, res) => {
  // ここにコンテンツ一覧取得と待ち時間計算（5分切り上げ）のロジックを書く
  res.json({ message: "API稼働中" });
});

// Webhook, 予約受付, 呼び出し・案内・不在アクションのAPIもここに追加していく

app.listen(3000, () => console.log('Server is running on port 3000'));
app.post('/webhook', (req, res) => {
  res.status(200).send('OK');
});