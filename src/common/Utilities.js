/**
 * 便利なメソッドたち
 */
export class Utilities {
    
    // サニタイズ
    static sanitaize(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    
    // サニタイズされた文字を元に戻す
    static unsanitaize(str) {
        return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&');
    }

    // アドレスリスト名を抽出する
    static extractAddressListName(str) {
        // To、Cc、Bccに入力されたアドレスリスト名は以下のようなフォーマットで内部処理される
        // 例：sample list <サンプルリスト＞　← この場合アドレスリスト名は「sample list」
        let temp = str.split(' <');

        // アドレスリスト名に使えない文字列を除去する
        let addressListName = temp[0].replace(/[<>;,"]/g, '');

        return addressListName;
    }

    // 該当するアドレスリストに登録されているメールアドレスを返す。該当がなければ null を返す。
    static async getAddressList(name) {

        // アドレス帳リストの取得
        let booksList = await messenger.addressBooks.list(true);

        // アドレス帳データの入れ物
        let book = {};

        // メールアドレスの入れ物
        let addresses = [];

        for (let i = 0; i < booksList.length; i++) {

            // アドレス帳データの取得
            book = await messenger.addressBooks.get(booksList[i]['id'], true);

            // アドレス帳にアドレスリストの登録がなければ以降の処理は行わない。
            if (book['mailingLists'].length === 0) {
                continue;
            }

            for (let j = 0; j < book['mailingLists'].length; j++) {

                // アドレスリストにメールアドレスが登録されていなければ以降の処理は行わない。
                if (book['mailingLists'][j]['contacts'].length === 0) {
                    continue;
                }

                // 該当するアドレスリストが見つかったらメールアドレスを取り出す。
                if (book['mailingLists'][j]['name'] === name) {
                    for (let k = 0; k < book['mailingLists'][j]['contacts'].length; k++) {
                        addresses.push(book['mailingLists'][j]['contacts'][k]['properties']['PrimaryEmail']);
                    }

                    // メールアドレスを返して処理終了
                    return addresses;    
                }
            }
        }

        // 該当するアドレスリストなし
        return null;
    }

    // 設定値の取得
    static async getSettingValues() {

        // デフォルト値
        let defaultValues = {
            "sendLaterDefault":         true,
            "senderEmailAddress":       true,
            "subject":                  true,
            "body":                     true,
            "destinationEmailAddress":  true,
            "attachment":               true,
            "senderAllowList":          [],
            "destinationAllowList":     []  // v0.3.0までキー名は「allowList」だった
        };

        // 設定値オブジェクト取得
        let obj = await browser.storage.local.get('settingValues');

        // 旧設定値オブジェクトの取得
        let old_obj = await browser.storage.local.get('sendLaterDefault');

        // 設定値オブジェクトの設定
        let settingValues = {};
        if (obj['settingValues']) {
            settingValues = obj['settingValues'];
        } else {
            settingValues = defaultValues;
        }

        // キー名の変更対応（v0.3.1で「allowList」から「destinationAllowList」に変更）
        if (settingValues['allowList'] && !settingValues['destinationAllowList']) {
                settingValues['destinationAllowList'] = settingValues['allowList'];
        }

        // 旧設定値オブジェクトがある場合
        if (old_obj['sendLaterDefault']) {

            // 旧設定値オブジェクトの値のみ上書きする
            settingValues['sendLaterDefault'] = old_obj['sendLaterDefault']['checked'];

            // 旧設定値オブジェクトは削除する
            await browser.storage.local.remove('sendLaterDefault');
        }  

        // 設定が新たに追加された場合の処理（設定が削除された場合はそのままで問題ない）
        for (const key in defaultValues) {
            if (settingValues[key] === undefined) {
                settingValues[key] = defaultValues[key];
            }
        }

        // 設定値を保存
        await browser.storage.local.set({settingValues});

        // 設定値を返して終了
        return settingValues;
    }

    // 改行コードをLF（\n）に変換する
    static toLF(str) {
        return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');   
    }
}