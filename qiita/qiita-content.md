# しつこく予定をリマインドするbotをGASで作った

## やったこと

**「また何もせず1か月経ってしまった..。
計画を立ててもその通り行動できず、
とりあえず現状に自覚的になろうと思って、
PCなりスマホで日々を記録しようとするも、 
それすら続かない..。」**

という現状を打破すべく、自動でしつこく予定をリマインドしてくる、
PC・スマホを操作せずとも音声対話でやり取りできるプログラム作ってみました。

chrome(上で動くjs)とGASで、PCのマイクとスピーカーで音声認識・音声合成するプログラムです。

1. ページにアクセスすると、15分おきに「ちゃんと～に取り組んでる？」と聞いてくる
1. 「違う」と答えると、「じゃあ何してるの？」と聞いてくる
1. 「youtube見てる」とか答えると、「youtubeね。なんで？」と聞いてくる
1. 「めんどくさいから..」とか答えると、「めんどくさいのね
。記録したよ」

的な会話できます。（会話の文言は自分で設定した文言になる）
スマートスピーカーでやったほうが良いの作れそうじゃんって感じですが、持ってないのでPCで代用しました。

コードもロジックもかなり荒い作りなので、もっとこうした方がいいよなど教えていただきたく投稿しました。

### 作ったコード

[https://github.com/hugepeach/GAS-talk-reminder](https://github.com/hugepeach/GAS-talk-reminder)にソース置いています

## 目次

1. 全体イメージ
2. スプレッドシートの作成
   1. カレンダー記録用シート
   2. 返答用辞書シート
   3. ログ記録用シート
3. ソースの作成 (from github)
   1. 音声合成 Synthesis (js)
   2. 音声認識 Recognition (js)
   3. 連携処理 (js & GAS)
4. 使い方
5. 音声リマインダーで日々の計画実行力は上がったか

## 1. 全体イメージ

- Google App Script
  - Google スプレッドシート
    - task カレンダーの予定保存
    - dict 返答用辞書
    - log 会話記録
  - Google カレンダー
- javascript
  - Web Speech API
    - Speech Synthesis(音声合成)
    - Speech Recognition(音声認識)
- Chrome(実行環境)
- Windows(実行環境)
- マイク・スピーカー(PC内臓)

![GAS-talk-reminder-image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/217395/a6926369-9942-1f22-ee14-d4167a22c96a.png)

## 2. スプレッドシートの作成

スプレッドシートの準備をしていきます。

**① 適当な名前でスプレッドシートを作成**  

**② ツール>スクリプトエディタ から、GASのプロジェクトを立ち上げる**

<img width="830" alt="2019-07-27_18h05_58.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/217395/7a6cc99d-aa10-c512-4004-0fa145488cff.png">

### 2-1. カレンダー記録用シート

カレンダーの予定タイトルと開始時間、終了時間を記録する用のシートを作成する。

**① シート`task`を作成**

**② [github](https://github.com/hugepeach/GAS-talk-reminder/tree/master/CSV)にあるtaskのCSVファイルをインポートする**

<img width="928" alt="2019-07-27_18h15_11.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/217395/d97cd635-5dd5-381e-7ddf-eefa198d1a32.png">

### 2-2. 返答用辞書シート

聞き取った音声により返答する文言を分岐させる、辞書用のシートを作成する。

**① シート`dict`を作成**

**② [github](https://github.com/hugepeach/GAS-talk-reminder/tree/master/CSV)にあるdictのCSVファイルをインポートする**

### 2-3. ログ記録用シート

PCが読み上げた文言と、聞き取った言葉を記録する用のシートを作成する。

**① シート`log`を作成**

**② [github](https://github.com/hugepeach/GAS-talk-reminder/tree/master/CSV)にあるlogのCSVファイルをインポートする**

## 3. ソースの作成 (from github)

githubにあるソースをGASのプロジェクトに張り付けていき、数か所コードを自分用に変え、トリガーの設定をすれば動くようになる。

ファイル通しの関係図は以下のイメージ👇

![file-relation-image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/217395/e88ccc1e-060d-047b-acda-4c787a60d0eb.png)

**① ファイル名`コード.gs`をここからコピペし張り付ける**

**② 213行目カレンダーの`カレンダーのIDを入力`を書き換える**

**③ ファイル>新規作成>HTMLファイルを押し、ファイル名`index.html`と`speech-synthesis.html`と`speech-recognition.html`の3つを作成し、該当するコードを [github](https://github.com/hugepeach/GAS-talk-reminder/tree/master)からコピペする**

**④ `index.html`9行目の`スプレッドシートのID`を書き換える**

**⑤ カレンダーから自動で予定を取得させるトリガーを設定する**

<img width="922" alt="2019-07-27_19h15_27.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/217395/b0f48a1c-9ace-05e3-cbc1-c9865935c89c.png">

- 実行する関数：`getCalenderTask`
- 実行するデプロイを選択：`HEAD`
- イベントのソースを選択：`時間ベースのタイマー`
- 時間ベースのトリガーのタイプを選択：`日付ベースのタイマー`
- 時刻を選択：`午前0時~1時`

とすると、毎晩翌日の予定をスプレッドシートのtaskに書き込んでおいてくれる。

**⑥ webアプリの公開をする**

<img width="833" alt="2019-07-27_19h18_06.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/217395/ebef8654-841d-da09-e318-c829e89f8836.png">

これでプログラムが動くようになりました！

### 3-1. 音声合成 Synthesis (js)

`speech-synthesis.html`で音声合成する。
Web Speech APIのSpeechRecognitionを利用。
引数で受け取った値をそのまま読み上げる。発した音声はhtmlの`textarea id="speak_text"`に書き込む。

### 3-2. 音声認識 Recognition (js)

`speech-recognition.html`で音声認識する。  
Web Speech APIのSpeechRecognitionを利用。  
聞き取っている音声が途切れるのを検知し、音声認識する。聞き取った文言はhtmlの`textarea id="recognize_text"`に書き込む。  

### 3-3. 連携処理 (js & GAS)

`コード.gs`と`index.html`で`talk_data`という配列をやり取りし、条件分岐しながら返答している。  

1. gasからhtmlを呼び出す
1. htmlが読まれたとき、15分間のカウントを始め、また現在時刻にカレンダーに予定されているタイトルを取得（@no1）
1. jsからカレンダーのタイトルを格納した`talk_data`をgasに送る
1. gasでdictシートの探索をし、返答文言を生成
   1. dictシートのA1セルから下の行に向かって、@no1に一致するセルを探す
   1. ＠no1に一致した後、右のセルに移動
   1. @otherを読み取り、さらに右のセルに移動
   1. @{}にカレンダーのタイトルを代入した文言を、`talk_data`に格納し`index.html`に返す
1. `speech-synthesis.html`の`speak`関数で音声合成
1. `speech-recognition.html`の`recognize`関数で読み取り開始
1. 読み取りが完了し、画面に文言が表示されたら認識した文言を`talk_data`に格納し再びgasに送る
1. 会話が終わるまで`talk_data`のやり取りを繰り返す。無言で1分経過、セルの値が`@exit`、セルの値が`@-`、dictシートの最終行に到達、エラーが発生した場合、処理を終了する
1. 15分後新しいタブを開き、`1.`から再度処理を開始

#### シートの参照方法

<img width="912" alt="dict-sheet-flow.jpg" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/217395/42e013e2-bd75-7c13-8b22-65b3acbfb794.jpeg">

シートdictで返答文言を探す際のルールは、スプレッドシートの右の方にメモしてあります。

## 4. 使い方

chromeで公開したwebアプリのurlにアクセスすれば自動的に処理が始まります。

例：
bot「予約とる、に取り組んでいますか？」
you「違う」
bot「ちがう、ですね。何をしていますか？」
you「ライン」
bot「ライン、ですね。なぜですか？」
you「急ぎの連絡だから」
bot「急ぎの連絡だから、ですね。記録しました。」

という感じで会話できる。
※音声認識と返答文言の作成には数秒時間がか買ってしまいますが。

## 5. 音声リマインダーで日々の計画実行力は上がったか

無意識にだらつくことが減ると思う(意識的にだらつく)。若干、計画通り過ごさないとなというモチベーションは上がった。

ただ、音楽聞いてるときやラインとかの返信してるときとかにいきなりタブ開いて「～してますか？」と聞かれるとイライラする...
リマインダーというか目覚ましに近い気もする。

### 改良について

- googleアカウントさえあれば手軽に音声対話でき、GASとjsとhtmlを書けばどんどん拡張できる
- IFTTTとかと連動すると手軽に色々連動できそう
- イヤホンのマイクでもうまくうごくPCの設定にしたらもっと便利
- データの受け渡しとか、コールバック処理を整理したらもう少しレスポンスよくなる気がする

## 参考させて頂いた記事

Qiita: [Google Spread Sheetを用いた音声対話型チャットボットを作ってみた](https://qiita.com/glory/items/58091984715e968c3480)  
Qiita: [Webページでブラウザの音声合成機能を使おう - Web Speech API Speech Synthesis](https://qiita.com/hmmrjn/items/be29c62ba4e4a02d305c)

---

意見・アドバイスなどあればコメントください！
    