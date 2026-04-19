# ステップメールシステム 設計仕様書

## 概要

`card-ocr-for-gws` で作成された名簿（Google Sheets）をデータソースとして、  
連絡先へ時間差でメールを順番に送信するステップメール（ドリップメール）システム。

---

## 前提条件

- **データソース**: `card-ocr-for-gws` が書き込む Google Sheets スプレッドシート
- **対象シート**: `BusinessCards`（名刺OCRデータ）
- **技術スタック**: Google Apps Script（GAS）
- **メール送信**: `GmailApp`（Google Workspace アカウント）

---

## スプレッドシート構成

同一スプレッドシート内に以下の3シートを使用する。

### 1. `BusinessCards`（既存）

`card-ocr-for-gws` が作成・管理するシート。このシステムは**読み取り専用**で参照する。

| 列 | 内容 |
|----|------|
| A | Timestamp |
| B | Image Data (Ref) |
| C | Name |
| D | Company |
| E | Job Title |
| F | Email |
| G | Phone |
| H | Address |
| I | Website |
| J | メール送信状態（挨拶メール用・card-ocr-for-gwsが管理） |

### 2. `EmailTemplates`（新規作成）

ステップメールのテンプレートをユーザーが自由に編集できるシート。

| 列 | ヘッダー | 説明 |
|----|----------|------|
| A | Step | 0 始まりの連番。行を追加するだけでステップ増加可能 |
| B | DelayDays | 登録日（Timestamp）からの送信遅延日数 |
| C | Subject | メール件名。プレースホルダー使用可 |
| D | Body | メール本文。プレースホルダー使用可 |

**プレースホルダー一覧:**

| プレースホルダー | 置換内容 |
|----------------|---------|
| `{{name}}` | 氏名（Name列） |
| `{{company}}` | 会社名（Company列） |
| `{{title}}` | 役職（Job Title列） |

**サンプルデータ:**

| Step | DelayDays | Subject | Body |
|------|-----------|---------|------|
| 0 | 3 | 先日はありがとうございました | {{name}}様\n\nお世話になっております... |
| 1 | 7 | ご案内：〇〇について | {{name}}様\n\n先日ご紹介した件ですが... |
| 2 | 14 | 最後のご連絡 | {{name}}様\n\nその後いかがでしょうか... |

> **注意**: Step 0 の DelayDays は「挨拶メール送信日 + 3日後」ではなく「BusinessCards 登録日 + 3日後」を意味する。

### 3. `EmailTracking`（新規作成）

各連絡先のステップ進行状況を管理するシート。

| 列 | ヘッダー | 説明 |
|----|----------|------|
| A | Email | 連絡先メールアドレス（一意キー） |
| B | Name | 氏名 |
| C | Company | 会社名 |
| D | RegisteredAt | BusinessCardsへの登録日時 |
| E | CurrentStep | 次に送信するステップ番号 |
| F | NextSendAt | 次の送信予定日時 |
| G | LastSentAt | 最後に送信した日時 |
| H | Status | `active` / `completed` / `skipped` |

---

## アーキテクチャ

```
[BusinessCards シート]
        ↓ 新規連絡先を検出（メールアドレスあり・EmailTrackingに未登録）
[EmailTracking に登録]
        ↓ NextSendAt <= now かつ Status = active
[sendScheduledEmails() 毎時実行]
        ↓
[EmailTemplates から CurrentStep のテンプレート取得]
        ↓
[プレースホルダー展開 → GmailApp.sendEmail()]
        ↓
[EmailTracking 更新: CurrentStep++, NextSendAt 更新]
        ↓ 最終ステップ完了
[Status = completed]
```

---

## ファイル構成

```
step-email-system/
├── src/
│   ├── Config.gs          # 設定定数
│   ├── main.gs            # エントリポイント
│   ├── TemplateService.gs # EmailTemplates シート操作
│   ├── TrackingService.gs # EmailTracking シート操作
│   └── EmailService.gs    # メール送信ロジック
└── README.md
```

---

## 各ファイルの仕様

### `Config.gs`

```javascript
var CONFIG = {
  // card-ocr-for-gws と同じスプレッドシートのIDを設定
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',

  BUSINESS_CARDS_SHEET_NAME: 'BusinessCards',
  EMAIL_TEMPLATES_SHEET_NAME: 'EmailTemplates',
  EMAIL_TRACKING_SHEET_NAME:  'EmailTracking',

  // EMAIL_CAMPAIGN_START_DATE 以降に登録された連絡先のみステップメール対象
  // 過去の名刺を一括登録した後に今日の日付を設定する
  // 形式: 'YYYY-MM-DD'（空文字の場合は全連絡先が対象）
  EMAIL_CAMPAIGN_START_DATE: '',
};
```

### `main.gs`

**公開関数（GAS トリガーに登録する）:**

| 関数名 | 用途 | 推奨トリガー |
|--------|------|-------------|
| `setup()` | 初期化（シート作成・ヘッダー設定） | 手動実行（1回のみ） |
| `sendScheduledEmails()` | スケジュール済みメールを送信 | 毎時 |
| `enrollNewContacts()` | BusinessCards の新規連絡先を EmailTracking に登録 | 毎時（sendScheduledEmails内で呼び出し可） |

**処理フロー（`sendScheduledEmails`）:**

```
1. enrollNewContacts() を呼び出す
2. EmailTracking から Status=active かつ NextSendAt <= now の行を取得
3. 各行について:
   a. EmailTemplates から CurrentStep のテンプレートを取得
   b. テンプレートが存在しない → Status = completed に更新してスキップ
   c. GmailApp.sendEmail() で送信
   d. CurrentStep++ に更新
   e. 次ステップが存在する場合: NextSendAt = now + 次ステップの DelayDays
   f. 次ステップが存在しない場合: Status = completed
```

**処理フロー（`enrollNewContacts`）:**

```
1. BusinessCards から Email列が空でない行を全取得
2. EMAIL_CAMPAIGN_START_DATE が設定されている場合: Timestamp >= start_date の行のみ対象
3. EmailTracking に未登録のメールアドレスをフィルタリング
4. EmailTemplates の Step=0 の DelayDays を取得
5. EmailTracking に追加: Status=active, CurrentStep=0, NextSendAt=Timestamp+Step0.DelayDays
```

### `TemplateService.gs`

```javascript
// 主要メソッド
getTemplate(stepNumber)  // → {step, delayDays, subject, body} | null
getAllTemplates()         // → [{step, delayDays, subject, body}, ...]
expandPlaceholders(template, data) // → {subject, body} (プレースホルダー展開済み)
```

### `TrackingService.gs`

```javascript
// 主要メソッド
isEnrolled(email)                          // → boolean
enroll(email, name, company, registeredAt, nextSendAt) // → void
getDueContacts()                           // → [{rowIndex, email, name, company, currentStep, ...}, ...]
updateProgress(rowIndex, currentStep, nextSendAt) // → void
markCompleted(rowIndex)                    // → void
markSkipped(email)                         // → void
```

---

## `EmailTracking` の `Status` 値と遷移

```
[空白・未登録]
    ↓ enrollNewContacts()
  active
    ↓ 全ステップ完了
  completed

  active → skipped（手動でシートを編集してスキップ指定）
```

---

## セットアップ手順

1. `card-ocr-for-gws` で過去名刺の一括登録を完了させる
2. このシステムの GAS プロジェクトを作成し、スプレッドシートにバインドする
3. `Config.gs` の `SPREADSHEET_ID` に対象スプレッドシートのIDを設定する
4. `Config.gs` の `EMAIL_CAMPAIGN_START_DATE` に今日の日付を設定する（例: `'2024-01-15'`）
5. `setup()` を実行して `EmailTemplates` / `EmailTracking` シートを初期化する
6. `EmailTemplates` にステップメールの内容を記入する
7. `sendScheduledEmails()` を手動実行してテストする
8. GAS タイムトリガーで `sendScheduledEmails()` を **毎時** 実行に設定する

---

## スキップ機能

`EmailTracking` シートの `Status` 列を手動で `skipped` に変更すると、以降の全ステップがスキップされる。

---

## 注意事項

- Gmail の送信上限: 1日あたり 100～1500通（アカウント種別による）。大量送信時は注意。
- `sendScheduledEmails()` は全ての対象行を1回の実行で処理する（card-ocr-for-gws の挨拶メールと異なり、ステップメールは1対1の関係性が薄いため一括処理とする）。
- スプレッドシートIDは `card-ocr-for-gws` と同じものを指定する。
