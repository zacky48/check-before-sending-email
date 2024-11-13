import { Utilities } from '../common/Utilities.js';
import { CheckUtilities } from './CheckUtilities.js';
let CU;
let sendLaterDefault = true;
const map1 = new Map();

async function main() {
    
    // 送信しようとしているメールデータ
    let target = await browser.runtime.sendMessage('getTarget');

    // 確認画面用のメソッドたち
    CU = new CheckUtilities(target);

    // メールの件名をウィンドウ名として表示する
    document.title = browser.i18n.getMessage('subject') + ' : '+ target.details.subject;

    // 送信元ドメイン
    let domain = await CU.extractDomain(target.details.from);
    document.getElementById('fromDomain').innerHTML = CU.addNumberStyle(Utilities.sanitaize(domain));
    
    // 送信元メールアドレス
    let from = await CU.extractEmailAddress(target.details.from);
    document.getElementById('fromAddr').innerHTML = await CU.decorateEmailAddress(Utilities.sanitaize(from));
    
    // 件名
    document.getElementById('subject').textContent = target.details.subject;
    
    // 本文
    document.getElementById('mailbody').textContent = target.details.plainTextBody;

    // 送信先メールアドレスのチェックリスト
    document.getElementById('destEmailAddresses').innerHTML = await CU.makeDestEmailAddressesList();
    
    // 添付ファイルのチェックリスト
    if (target.attachments.length > 0) {
        document.getElementById('attachments').innerHTML = CU.makeAttachmentsList();
    }

    // チェック項目数の表示
    document.getElementById('checkCount').textContent = CU.getCheckItemsNum();
    
    // チェック済みのチェックボックスの数を表示
    document.getElementById('checked').textContent = CU.countCheckedBoxes();

    // リスク値（=チェック項目数）によって表題の色を変える
    CU.setRiskScoreColor();
    
    // ”「後で送信」をデフォルトにする” の設定値
    sendLaterDefault = await getSendLaterDefault();

    // 後で送信
    if (sendLaterDefault) {        
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
}

// チェックリストのクリックイベントのたびに実行
checkLists.addEventListener('click', () => {
    
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
        if (sendLaterDefault) {
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
        if (sendLaterDefault) {
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
});

// 設定（oprions.html）：”「後で送信」をデフォルトにする” の設定値
// true:後で送信 false:すぐに送信
const getSendLaterDefault = () => new Promise(resolve => {
    
    // 初期値
    let checked = true;
    
    browser.storage.local.get('sendLaterDefault')
    .then((settings) => {
        try {
            checked = settings.sendLaterDefault.checked;
        } catch {
            
            // 設定画面を一度も開いていない場合は未定義となる
            console.log('settings.sendLaterDefault.checked is undefined.');
            
            // なので初期値をセットする
            let sendLaterDefault = { checked: checked };
            browser.storage.local.set({sendLaterDefault});
        }
        
        resolve(checked);
    });
});

// 本文を別ウィンドウに表示する
openBodyWindow.addEventListener('click', () => {
    
    // 既に本文が別ウィンドウで開いていたら閉じる
    closeBodyWindow();
        
    browser.windows.create({
        height: 700,
        width:  900,
        url:    '../mailbody/mailbody.html',
        type:   'popup'
    })
    .then(window => {
        map1.set('mailbodyWindow', window);
    }); 
});

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