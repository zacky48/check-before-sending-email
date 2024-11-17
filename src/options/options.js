import { Utilities } from '../common/Utilities.js';

// 現在の設定値を設定画面に反映させる
async function loadSettings() {

    // 設定値の取得
    let settingValues = await Utilities.getSettingValues();

    // 設定画面に反映
    for (const key in settingValues) {
        document.getElementById(key).checked = settingValues[key];
    }
}

// 設定値の保存
settingArea.addEventListener('click', async () => {

    // 設定値の取得
    let settingValues = await Utilities.getSettingValues();

    // 設定値の変更を反映する
    for (const key in settingValues) {
        settingValues[key] = document.getElementById(key).checked;
    }

    // 設定値を保存
    await browser.storage.local.set({settingValues});
});

document.addEventListener('DOMContentLoaded', loadSettings);