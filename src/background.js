let target = { tab: null };
const map1 = new Map();
import { Utilities } from './common/Utilities.js';

// targetオブジェクトの初期化
function clearTarget() {
    target = {};
    target = { tab: null };
};

// 送信ボタンを押した時に実行される
browser.compose.onBeforeSend.addListener(async (tab, details) => {

    // 「後で送信」をクリックした時の処理
    if (target.mode === 'sendLater') {
        clearTarget();
        return { cancel: false };
    }

    // TODO チェック項目数の取得
    let CheckItemsNum = 0;  // ダミー
    
    // 設定値の取得
    let settingValues = await Utilities.getSettingValues();

    // チェック項目が1つ以上ある または 確認画面を表示させない設定がOFFの場合
    if (CheckItemsNum > 0 || !settingValues['disableConfirmationScreen']) {

        // 同時処理の禁止
        if (target.tab !== null) {
        
            if (map1.get('inprocessWindow')) {
                const inprocessWindow = map1.get('inprocessWindow');
                browser.windows.remove(inprocessWindow.id);
            }

            let inprocessWindow = await browser.windows.create({
                height: 300,
                width:  600,
                url:    'inprocess/inprocess.html',
                type:   'popup'
            });
            map1.set('inprocessWindow', inprocessWindow);

            return { cancel: true };
        }
    
        // 確認画面で使うデータをtargetオブジェクトにまとめる
        let attachments = await messenger.compose.listAttachments(tab.id);
        target = { tab: tab, details: details, attachments: attachments };

        // 確認画面を表示
        target.window = await browser.windows.create({
            height: 620,
            width:  820,
            url:    'check/check.html',
            type:   'popup'
        });
    
        return new Promise(resolve => {
            map1.set(tab.id, resolve);
        });
    
    // 確認画面を表示しない場合
    } else {

        // 後で送信（送信トレイに入れる）        
        if (settingValues['sendLaterDefault']) {
            
            target.mode = 'sendLater';
            return new Promise(async resolve => {
                resolve({ cancel: true });
                setTimeout(() => {
                    messenger.compose.sendMessage(tab.id, { mode: 'sendLater' });
                });
            });
        }
    }
});

// 確認画面とのデータ交換
browser.runtime.onMessage.addListener(message => {
   
    const resolve = map1.get(target.tab.id);
   
    // targetオブジェクトを返す
    if (message === 'getTarget') {
        return Promise.resolve(target);
    }
    
    // 送信実行
    if (message === 'send') {
        target.mode = message;
        browser.windows.remove(target.window.id)
        .then(() => clearTarget())
        .then(() => resolve());
    }
    
    // 送信キャンセル
    if (message === 'cancel') {
        target.mode = message;
        browser.windows.remove(target.window.id)
        .then(() => clearTarget())
        .then(() => resolve({ cancel: true }));
    }
    
    // 後で送信（送信トレイに入れる）
    if (message === 'sendLater') {
        target.mode = message;
        browser.windows.remove(target.window.id)
        .then(() => resolve({ cancel: true }))
        .then(() => setTimeout(() => {
            messenger.compose.sendMessage(target.tab.id, { mode: 'sendLater' });
        }));
    }
    
    return false;
});

// 確認画面をコントロールボックスで閉じた場合の処理
browser.windows.onRemoved.addListener((windowId) => {
    
    try {
        
        if (target.mode) {
            return false;
        }
        
        if(target.window.id !== null && target.window.id === windowId) {
            const resolve = map1.get(target.tab.id);
            clearTarget();
            resolve({ cancel: true });
        }
        
    } catch {};
    
    return false;
});