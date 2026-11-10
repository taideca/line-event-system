'use client';

export default function AdminDashboard() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>スタッフ用 管理画面</h1>
      <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '20px' }}>
        <h2>待機列一覧</h2>
        {/* 後でここにAPIから取得した予約リストを表示します */}
        <p>現在待機中のお客様はいません。</p>
      </div>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button style={{ padding: '10px' }}>呼び出し</button>
        <button style={{ padding: '10px' }}>案内</button>
        <button style={{ padding: '10px' }}>不在</button>
      </div>
    </div>
  );
}