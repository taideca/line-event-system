'use client';
import { useEffect } from 'react';
import liff from '@line/liff';

export default function Home() {
  useEffect(() => {
    liff.init({ liffId: "2012421505-9SP3cC39" })
      .then(() => console.log("LIFFの初期化に成功しました"))
      .catch(e => console.error("初期化失敗", e));
  }, []);
  return <div>ここにコンテンツ選択や人数入力画面を作ります</div>;
}