import { Utilities } from '../common/Utilities.js';
import { CheckUtilities } from './CheckUtilities.js';
let CU;
let settingValues = {};
const map1 = new Map();

async function main() {

    // 設定値の取得
    settingValues = await Utilities.getSettingValues();

    // 送信しようとしているメールデータ
    let target = await browser.runtime.sendMessage('getTarget');

    // 確認画面用のメソッドたち
    CU = new CheckUtilities(target, settingValues);

    // メールの件名をウィンドウ名として表示する
    document.title = browser.i18n.getMessage('subject') + ' : '+ target.details.subject;

    // はじめのメッセージ
    CU.firstMesg();

    // 送信元メールアドレス
    if (settingValues['senderEmailAddress']) {
        document.getElementById('senderEmailAddress').innerHTML = CU.senderEmailAddress();
    }

    // 件名
    if (settingValues['subject']) {
        document.getElementById('subject').innerHTML = CU.subject();
    }

    // 本文
    if (settingValues['body']) {
        document.getElementById('body').innerHTML = CU.body();

        // 本文を別ウィンドウに表示する
        openBodyWindow.addEventListener('click', () => {
    
            // 既に本文が別ウィンドウで開いていたら閉じる
            closeBodyWindow();
                
            browser.windows.create({
                height: 570,
                width:  780,
                url:    '../mailbody/mailbody.html',
                type:   'popup'
            })
            .then(window => {
                map1.set('mailbodyWindow', window);
            }); 
        });
    }

    // 送信先メールアドレス
    if (settingValues['destinationEmailAddress']) {
        document.getElementById('destEmailAddresses').innerHTML = await CU.makeDestEmailAddressesList();
    }
    
    // 添付ファイル
    if (settingValues['attachment'] && target.attachments.length > 0) {
        document.getElementById('attachments').innerHTML = CU.makeAttachmentsList();
    }

    // 設定で無効化されている項目
    CU.disabledCheckItems();

    // チェック項目数の表示
    document.getElementById('checkCount').textContent = CU.getCheckItemsNum();
    
    // チェック済みのチェックボックスの数を表示
    document.getElementById('checked').textContent = CU.countCheckedBoxes();

    // リスク値（=チェック項目数）によって表題の色を変える
    CU.setRiskScoreColor();

    // 後で送信
    if (settingValues['sendLaterDefault']) {        
        // 今すぐ送信ボタンを非表示にする
        document.getElementById('send').disabled        = true;
        document.getElementById('send').style.display   = 'none';
            
    // 今すぐ送信    
    } else { 
        // 後で送信ボタンを非表示にする
        document.getElementById('sendLater').disabled       = true;
        document.getElementById('sendLater').style.display  = 'none';
    }

    // ボタン名の表示
    document.getElementById('sendLater').value  = browser.i18n.getMessage('sendLater');
    document.getElementById('send').value       = browser.i18n.getMessage('send');
    document.getElementById('cancel').value     = browser.i18n.getMessage('cancel');

    // チェックリストを更新（チェック項目が無い場合のため）
    updateCheckLists();
}

// チェックリストのクリックイベントのたびに実行
checkLists.addEventListener('click', updateCheckLists);
function updateCheckLists() {
    
    // チェック済みのチェックボックス数
    let checkedBoxes = CU.countCheckedBoxes();
    
    // カウンターを更新する
    document.getElementById('checked').textContent = checkedBoxes;
    
    // 全てチェック済になった場合の処理
    if (CU.getCheckItemsNum() === checkedBoxes) {
        
        // 見出しの背景色を変える
        header.style.backgroundColor = '#99ff99';
        
        // 後で送信
        let preExecMesg = '';
        if (settingValues['sendLaterDefault']) {
            document.getElementById('sendLater').disabled   = false;
            document.getElementById('sendLater').className  = 'sendLater';
            preExecMesg = "<p>" + browser.i18n.getMessage('preExecMesgSendLater01') + "</p>"
                        + "<p>" + browser.i18n.getMessage('preExecMesgSendLater02') + "</p>";
        // 今すぐ送信    
        } else {
            document.getElementById('send').disabled   = false;
            document.getElementById('send').className  = 'send';
            preExecMesg = "<p class='attention'>" + browser.i18n.getMessage('preExecMesgSendNow') + "</p>";
        }
        
        // ボタンを押す前にお伝えしたいメッセージを更新
        document.getElementById('preExecMesg').innerHTML = preExecMesg;
                
    } else {
        
        // 見出しの背景色を元に戻す
        CU.setRiskScoreColor();
        
        // 後で送信
        if (settingValues['sendLaterDefault']) {
            document.getElementById('sendLater').disabled   = true;
            document.getElementById('sendLater').className  = 'disabledButton';
            
        // 今すぐ送信    
        } else {
            document.getElementById('send').disabled   = true;
            document.getElementById('send').className  = 'disabledButton';
        }
                
        // ボタンを押す前にお伝えしたいメッセージを元に戻す
        document.getElementById('preExecMesg').textContent = browser.i18n.getMessage('preExecMesgCheckAll');
    }
}

// 本文ウィンドウを閉じる
function closeBodyWindow() {
    if (map1.get('mailbodyWindow')) {
        const mailbodyWindow = map1.get('mailbodyWindow');
        browser.windows.remove(mailbodyWindow.id);
        map1.delete('mailbodyWindow');
    } 
}

// 本文ウィンドウをコントロールボックスで閉じた時の処理
browser.windows.onRemoved.addListener(() => {
    map1.delete('mailbodyWindow');
});

// 後で送信
sendLater.addEventListener('click', () => {
    closeBodyWindow();
    browser.runtime.sendMessage('sendLater');
});

// 送信
send.addEventListener('click', () => {
    closeBodyWindow();
    browser.runtime.sendMessage('send');
});

// キャンセル
cancel.addEventListener('click', () => {
    closeBodyWindow();
    browser.runtime.sendMessage('cancel');
});

// メインルーチン実行
document.addEventListener('DOMContentLoaded', main);