import { Utilities } from '../common/Utilities.js';

// 現在の設定値を設定画面に反映させる
document.addEventListener('DOMContentLoaded', loadSettings);
async function loadSettings() {

    // 設定値の取得
    let settingValues = await Utilities.getSettingValues();

    // 「後で送信」をデフォルトにする
    document.getElementById('sendLaterDefault').checked = settingValues['sendLaterDefault'];

    // 送信元メールアドレス
    document.getElementById('senderEmailAddress').checked = settingValues['senderEmailAddress'];

    // 件名
    document.getElementById('subject').checked = settingValues['subject'];

    // 本文
    document.getElementById('body').checked = settingValues['body'];

    // 送信先メールアドレス
    document.getElementById('destinationEmailAddress').checked = settingValues['destinationEmailAddress'];

    // 添付ファイル
    document.getElementById('attachment').checked = settingValues['attachment'];

    // チェックを除外する送信元メールアドレス・ドメインリスト
    document.getElementById('senderAllowList').value = settingValues['senderAllowList'].join('\n');

    // チェックを除外する送信先メールアドレス・ドメインリスト
    document.getElementById('destinationAllowList').value = settingValues['destinationAllowList'].join('\n');

    // チェック項目がない場合は、確認画面を表示させない。
    document.getElementById('disableConfirmationScreen').checked = settingValues['disableConfirmationScreen'];
}

// 設定値の保存（チェックボックスのみ）
settingArea.addEventListener('click', async () => {

    // 設定値の取得
    let settingValues = await Utilities.getSettingValues();

    // 「後で送信」をデフォルトにする
    settingValues['sendLaterDefault'] = document.getElementById('sendLaterDefault').checked;

    // 送信元メールアドレス
    settingValues['senderEmailAddress'] = document.getElementById('senderEmailAddress').checked;

    // 件名
    settingValues['subject'] = document.getElementById('subject').checked;

    // 本文
    settingValues['body'] = document.getElementById('body').checked;

    // 送信先メールアドレス
    settingValues['destinationEmailAddress'] = document.getElementById('destinationEmailAddress').checked;

    // 添付ファイル
    settingValues['attachment'] = document.getElementById('attachment').checked;
 
    // 「後で送信」をデフォルトにする
    settingValues['disableConfirmationScreen'] = document.getElementById('disableConfirmationScreen').checked;

    // 設定値を保存
    await browser.storage.local.set({settingValues});
});

// チェックを除外する送信元メールアドレス・ドメインリストの保存
senderAllowList.addEventListener('input', e => saveAllowList('senderAllowList'));

// チェックを除外する送信先メールアドレス・ドメインリストの保存
destinationAllowList.addEventListener('input', e => saveAllowList('destinationAllowList'));

// メールアドレス・ドメインリストを配列にして保存する関数
async function saveAllowList(key) {

    // 設定値の取得
    let settingValues = await Utilities.getSettingValues();    

    // 入力されたリストを行ごとに配列にする
    let allowList_text      = document.getElementById(key).value;
    let allowList_text_LF   = Utilities.toLF(allowList_text);
    let allowList           = allowList_text_LF.split('\n');

    // 入力されたリストを掃除する
    let clean = '';
    let allowList_clean = [];
    for (let i = 0; i < allowList.length; i++) {
        clean = allowList[i].trim();
        if (clean) {
            allowList_clean.push(clean);    
        }
    }

    // リストを保存
    settingValues[key] = allowList_clean;
    await browser.storage.local.set({settingValues});
}