'use client';
import { useEffect, useState } from 'react';
import liff from '@line/liff';

// データベースから取得する「コンテンツ（アトラクション等）」のデータ型定義
interface Content {
  id: number;
  name: string;
  capacity: number;
  time: number;
  slot: number;
  price: number;
  isPer: boolean;
  isActive: boolean;
  waitingCount: number;
  waitTime: number;
}

export default function Home() {
  // 画面の表示を管理する状態（ステート）
  const [userId, setUserId] = useState<string | null>(null); // LINEのユーザーID
  const [contents, setContents] = useState<Content[]>([]);   // 予約可能なコンテンツ一覧
  const [selectedContentIds, setSelectedContentIds] = useState<number[]>([]); // 選択されたコンテンツID配列
  const [partySize, setPartySize] = useState<number>(1);     // 予約人数（初期値1人）
  const [isReserved, setIsReserved] = useState<boolean>(false); // 予約完了画面への切り替えフラグ

  // ⚠️ 【重要：バックエンドのURLを設定】
  // PCでのローカルテスト時は "http://localhost:3000" で問題ありません。
  // テスト時は "https://fuka-api-2026.loca.lt" を使用
  // 本番環境（デプロイ後）は Render のURL を指定します。
  const API_URL = "https://line-event-backend.onrender.com"; 

  // 画面が開かれたときに1回だけ実行される処理
  useEffect(() => {
    liff.init({ liffId: "2012421505-9SP3cC39" })
      .then(() => {
        if (liff.isLoggedIn()) {
          liff.getProfile().then(profile => setUserId(profile.userId));
        } else {
          liff.login();
        }
      })
      .catch(e => console.error("LIFF初期化失敗", e));

    fetch(`${API_URL}/api/contents`, {
      headers: {
        'Bypass-Tunnel-Reminder': 'true',
      }
    })
      .then(res => res.json())
      .then((data: Content[]) => {
        setContents(data);
      });
  }, []);

  // コンテンツ選択のチェックボックス切り替え
  const handleToggleContent = (id: number) => {
    setSelectedContentIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  // 「予約する」ボタンが押されたときの処理
  const handleReserve = async () => {
    if (!userId) return alert("LINEユーザー情報の取得に失敗しました。");
    if (selectedContentIds.length === 0) return alert("コンテンツを選択してください。");
    
    try {
      const res = await fetch(`${API_URL}/api/reserve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ userId, contentIds: selectedContentIds, partySize })
      });
      if (res.ok) {
        setIsReserved(true);
      }
    } catch (e) {
      alert("エラーが発生しました。");
    }
  };

  if (isReserved) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>予約が完了しました！</h2>
        <p>順番が近づきましたらLINEでお知らせします。</p>
        <button onClick={() => liff.closeWindow()} style={{ padding: '10px 20px', marginTop: '20px' }}>画面を閉じる</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', textAlign: 'center' }}>順番待ち受付</h1>
      
      {/* 人数入力欄 */}
      <div style={{ marginTop: '20px' }}>
        <label><b>ご利用人数</b></label>
        <input 
          type="number" 
          min="1" 
          value={partySize} 
          onChange={(e) => {
            const newSize = Number(e.target.value);
            setPartySize(newSize);
            // 人数オーバーの選択済みコンテンツを自動解除
            setSelectedContentIds(prev =>
              prev.filter(id => {
                const c = contents.find(item => item.id === id);
                return c && newSize <= c.capacity;
              })
            );
          }}
          style={{ width: '100%', padding: '10px', marginTop: '5px', fontSize: '16px' }}
        />
      </div>

      {/* コンテンツ選択リスト（複数選択対応） */}
      <div style={{ marginTop: '20px' }}>
        <label><b>ご希望のコンテンツ（複数選択可）</b></label>
        <div style={{ marginTop: '10px' }}>
          {contents.map(c => {
            const isDisabled = partySize > c.capacity;
            const isChecked = selectedContentIds.includes(c.id);
            const priceText = c.isPer ? `¥${c.price} / 人` : `¥${c.price} / グループ`;

            return (
              <div key={c.id} style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', opacity: isDisabled ? 0.5 : 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => handleToggleContent(c.id)}
                    style={{ width: '20px', height: '20px', marginRight: '10px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      料金: {priceText} | 待ち目安: 約{c.waitTime}分 (定員: {c.capacity}名)
                    </div>
                    {isDisabled && (
                      <div style={{ fontSize: '12px', color: 'red' }}>※定員超えのため選択できません</div>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        onClick={handleReserve}
        disabled={selectedContentIds.length === 0}
        style={{ 
          width: '100%', 
          padding: '15px', 
          marginTop: '20px', 
          backgroundColor: selectedContentIds.length > 0 ? '#06C755' : '#ccc', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          fontSize: '16px', 
          fontWeight: 'bold',
          cursor: selectedContentIds.length > 0 ? 'pointer' : 'not-allowed'
        }}
      >
        予約する ({selectedContentIds.length}件選択中)
      </button>
    </div>
  );
}