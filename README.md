# UPFC Post Tracking Linkifier

UPFCマイページ配下のページに含まれる 11〜13 桁の数字を、日本郵便の追跡サービスへのリンクに自動変換する Chrome 拡張です。拡張アイコンをクリックすると、ページ内の番号（最大10件）をまとめて日本郵便の一括追跡URLで開けます。

対象URL

- <https://www.upfc.jp/helloproject/mypage...>
- <https://www.upfc.jp/m-line/mypage...>

## 使い方

1. Chrome で `chrome://extensions` を開きます。
2. 右上の「デベロッパーモード」をオンにします。
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、本フォルダを選択します。
4. 対象ページにアクセスすると、11〜13桁の数字がリンクに変換されます。
5. 拡張アイコンをクリックすると、ページ内の番号（最大10件）を一括で追跡ページに開きます。

## 実装メモ

- Manifest V3。
- content script はページ読み込み時に一度だけ走査（動的変化は監視しない）。
- 11〜13桁の連続した数字（前後が数字でない）を対象。a/script/style/textarea/input 内や contentEditable は除外。
- 背景（service worker）は拡張アイコンクリック時にページから番号を収集して一括追跡URLを開く。まず拡張が生成したリンク（`a[data-upfc-post-tracking="1"]`）から取得し、足りなければテキストノードも走査。
- URL生成は `shared/japanpost.js` に共通化。content script からは動的 import で利用。

## 権限

- `tabs`, `contextMenus`, `scripting`, `activeTab`
- host_permissions: `https://www.upfc.jp/*`

## 追跡リンク

- 日本郵便: <https://trackings.post.japanpost.jp/services/srv/search?requestNo1=37189000855&requestNo2=&requestNo3=&requestNo4=&requestNo5=&requestNo6=&requestNo7=&requestNo8=&requestNo9=&requestNo10=&search.x=104&search.y=26&startingUrlPatten=&locale=ja>
