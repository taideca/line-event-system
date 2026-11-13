require('dotenv').config(); // 環境変数の読み込み
const express = require('express');
const cors = require('cors');

// Prisma 7 用の接続設定
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

// 1. コンテンツ一覧取得API（待ち時間計算付き）
app.get('/api/contents', async (req, res) => {
  try {
    const contents = await prisma.content.findMany({ where: { isActive: true } });
    
    // 各コンテンツの待ち時間と待機組数を計算して返す
    const contentsWithWaitTime = await Promise.all(contents.map(async (content) => {
      const waitingCount = await prisma.reservation.count({
        where: { contentId: content.id, status: 'waiting' }
      });
      // 新データベーススキーマ (time, slot) に対応
      const rawWaitTime = (waitingCount * content.time) / content.slot;
      const waitTime = Math.ceil(rawWaitTime / 5) * 5;
      
      return { ...content, waitingCount, waitTime };
    }));

    res.json(contentsWithWaitTime);
  } catch (error) {
    console.error("詳細エラー:", error);
    res.status(500).json({ error: "エラーが発生しました", details: error.message });
  }
});

// 2. 予約作成API（複数選択対応）
app.post('/api/reserve', async (req, res) => {
  const { userId, contentIds, partySize } = req.body;
  try {
    const reservations = await prisma.$transaction(
      contentIds.map((contentId) => 
        prisma.reservation.create({
          data: {
            userId,
            contentId: parseInt(contentId),
            partySize: parseInt(partySize),
            status: 'waiting'
          }
        })
      )
    );
    res.json({ success: true, reservations });
  } catch (error) {
    console.error("詳細エラー:", error);
    res.status(500).json({ error: "予約に失敗しました", details: error.message });
  }
});

// 3. 予約一覧取得API（管理画面用）
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { status: { in: ['waiting', 'holding'] } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(reservations);
  } catch (error) {
    console.error("詳細エラー:", error);
    res.status(500).json({ error: "一覧の取得に失敗しました", details: error.message });
  }
});

// 4. ステータス変更API（呼び出し・案内・不在）
app.post('/api/status', async (req, res) => {
  const { id, status } = req.body;
  try {
    const updated = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json({ success: true, updated });
  } catch (error) {
    console.error("詳細エラー:", error);
    res.status(500).json({ error: "ステータス更新に失敗しました", details: error.message });
  }
});

// LINE Webhook用
app.post('/webhook', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));