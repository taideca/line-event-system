'use client';
import { useEffect, useState } from 'react';

// データベースから取得する「予約データ」の型定義
interface Reservation {
  id: number;
  userId: string;
  contentId: number;
  partySize: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  // 予約一覧データを保存するステート
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // ⚠️ 【重要：バックエンドのURLを設定】
  // PCでのローカルテスト時は "http://localhost:3000" で問題ありません。
  // 本番環境（デプロイ後）は Render のURL を指定します。
  const API_URL = "https://line-event-backend.onrender.com";

  // 予約一覧をバックエンドから取得する関数

  const fetchReservations = () => {

    fetch(`${API_URL}/api/reservations`, {
      headers: {
        'Bypass-Tunnel-Reminder': 'true',
      }
    })

      .then(res => res.json())

      .then((data: any) => {

        if (Array.isArray(data)) {

          setReservations(data);

        } else {
          console.error("APIエラー:", data);
        }
      })
  }

  // 画面が開かれたときの処理（ポーリング）
  useEffect(() => {
    fetchReservations(); // 最初に1回取得
    // 10秒ごとに自動で予約一覧を再取得し、画面を最新に保つ（ポーリング処理）
    const intervalId = setInterval(fetchReservations, 10000);
    return () => clearInterval(intervalId); // 画面を閉じたらポーリングを停止
  }, []);

  // お客様のステータス（呼出・案内・不在）を更新する処理
  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`${API_URL}/api/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ id, status })
      });
      fetchReservations(); // 更新成功後、即座に最新の一覧を再取得
    } catch (e) {
      alert("更新に失敗しました");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>スタッフ用 管理画面</h1>
      <button onClick={fetchReservations} style={{ marginBottom: '20px' }}>手動更新</button>

      <div style={{ border: '1px solid #ccc', padding: '10px' }}>
        <h2>現在の待機列</h2>
        {reservations.length === 0 ? (
          <p>現在待機中のお客様はいません。</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>ID</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>コンテンツID</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>人数</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>状態</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(res => (
                <tr key={res.id}>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{res.id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{res.contentId}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{res.partySize}名</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                    {res.status === 'waiting' ? '待機中' : '保留中(呼出済)'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                    {/* ステータス更新ボタン群 */}
                    <button onClick={() => updateStatus(res.id, 'holding')} style={{ marginRight: '5px' }}>呼出</button>
                    <button onClick={() => updateStatus(res.id, 'playing')} style={{ marginRight: '5px' }}>案内</button>
                    <button onClick={() => updateStatus(res.id, 'cancelled')}>不在</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}