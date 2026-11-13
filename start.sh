#!/bin/bash
echo "🔄 データベースを更新しています..."
cd backend
npx prisma generate
npx prisma db push

echo "🚀 サーバーと通信トンネルを起動します..."

# 1. バックエンド (API) と localtunnel
npx nodemon server.js &
npx localtunnel --port 3000 --subdomain fuka-api-2026 &

# 2. お客様用画面 (LIFF) と localtunnel
cd ../liff-app
npm run dev -- -p 3001 &
npx localtunnel --port 3001 --subdomain fuka-liff-2026 &

# 3. 管理画面 (Admin)
cd ../admin-app
npm run dev -- -p 3002 &

echo "✅ 起動コマンドを送信しました！"
echo "------------------------------------------------------"
echo "🌍 [API URL]  https://fuka-api-2026.loca.lt"
echo "📱 [LIFF URL] https://fuka-liff-2026.loca.lt"
echo "💻 [Admin]    http://localhost:3002"
echo "------------------------------------------------------"
echo "※ APIとLIFFのコード内のURL設定が上記と一致しているか確認してください。"
wait