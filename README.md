# UPFC Post Tracking Linkifier

UPFCマイページ配下のページ (<https://www.upfc.jp/helloproject/mypage...>) に含まれる 11〜13 桁の数字を、日本郵便の追跡サービスへのリンクに自動変換する Chrome 拡張です。

## 使い方

1. Chrome で `chrome://extensions` を開きます。
2. 右上の「デベロッパーモード」をオンにします。
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、本フォルダを選択します。
4. 対象ページにアクセスすると、11〜13桁の数字がリンクに変換されます。

## 実装メモ

- manifest v3, content script を使用。
- 11〜13桁の連続した数字(前後が数字でない)を対象にし、a/script/style/textarea/input 内と contentEditable はスキップ。
- MutationObserver で動的コンテンツにも対応。

## 追跡リンク

- 日本郵便: <https://trackings.post.japanpost.jp/services/srv/search?requestNo1=37189000855&requestNo2=&requestNo3=&requestNo4=&requestNo5=&requestNo6=&requestNo7=&requestNo8=&requestNo9=&requestNo10=&search.x=104&search.y=26&startingUrlPatten=&locale=ja>
