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
    // To、Cc、Bccに入力されたアドレスリスト名は以下のようなフォーマットで内部処理される
    // 例：sample list <サンプルリスト＞　← この場合アドレスリスト名は「sample list」
    static async extractAddressListName(str) {
        let str_parsed = await messenger.messengerUtilities.parseMailboxString(str);

        // アドレスリスト名に使えない文字列を除去する
        let addressListName = str_parsed[0]['name'].replace(/[<>;,"]/g, '');

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
}