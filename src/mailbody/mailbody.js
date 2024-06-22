async function main() {
    let target = await browser.runtime.sendMessage('getTarget');

    // メールの件名をウィンドウ名として表示する
    document.title = browser.i18n.getMessage('subject') + ' : '+ target.details.subject;
    
    // 本文
    document.getElementById('mailbody').innerText = target.details.plainTextBody;
}

document.addEventListener('DOMContentLoaded', main);