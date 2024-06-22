// 設定値の読出し
function setSendLaterDefault(settings) {
    let checked;
    
    try {
        checked = settings.sendLaterDefault.checked;
    } catch(e) {
        
        // 未設定の場合は初期値を設定する
        let sendLaterDefault = {
            checked: true
        };
        browser.storage.local.set({sendLaterDefault});
        
        return false;
    }
    
    document.getElementById('sendLaterDefault').checked = checked;
};

// 設定値の保存
sendLaterDefault.addEventListener('click', () => {
    let sendLaterDefault = {
        checked: document.getElementById('sendLaterDefault').checked
    };
    browser.storage.local.set({sendLaterDefault});
});

document.addEventListener('DOMContentLoaded', () => {
    browser.storage.local.get('sendLaterDefault').then(setSendLaterDefault);
});