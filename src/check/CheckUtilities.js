import { Utilities } from '../common/Utilities.js';

/**
 * 確認画面用のメソッドたち
 */
export class CheckUtilities {
    
    #target;
    #checkItemsNum;

    constructor(target) {
        
        // 送信しようとしているメールデータ
        this.#target = target;
        
        // チェック項目数
        this.#checkItemsNum = 3; // FROMアドレス、件名、本文で基本3カウント
    }
    
    // チェック項目数のゲッタ
    getCheckItemsNum() {
        return this.#checkItemsNum;
    }    
    
    // チェック済みのチェックボックスの数を数える
    countCheckedBoxes() {
        let checkitem = document.getElementsByName('checkitem');
        let checked = 0;
        for (let i = 0; i < checkitem.length; i++) {
            if (checkitem[i]['checked']) {
                checked++;
            }
        }
    
        return checked;
    }
        
    // リスク値（=チェック項目数）によって表題の色を変える
    setRiskScoreColor() {
        let riskScore   = this.#checkItemsNum;
        let header      = document.getElementById('header');
    
        if (riskScore <= 4) {
            header.style.backgroundColor = '#ffff43';
        } else if (5 <= riskScore && riskScore <= 8) {
            header.style.backgroundColor = '#ffcc99';
        } else if (9 <= riskScore && riskScore <= 12) {
            header.style.backgroundColor = '#ff9999';
        } else if (13 <= riskScore) {
            header.style.backgroundColor = '#ff99ff';
        }
    }
    
    // メールアドレスに表示用のスタイルを設定する
    async decorateEmailAddress(str) {
        let addr        = await this.extractEmailAddress(str);
        let strs        = addr.split('@');
        let username    = this.addNumberStyle(strs[0]);
        let domain      = '';
        if (strs[1]) {
            domain = '<span class="domain">@' + strs[1] + '</span>';
        }

        return username + domain;
    }
    
    // メールアドレスのみを抽出する
    // 例：str = 'Sample <sample@example.com>';
    async extractEmailAddress(str) {
        let str_parsed = await messenger.messengerUtilities.parseMailboxString(str);
        return str_parsed[0]['email'];
    }
    
    // メールアドレスのドメインのみを抽出する
    async extractDomain(emailAddress) {
        let strs = await this.extractEmailAddress(emailAddress);
        let temp = strs.split('@');
        return temp[1];
    }

    // メールアドレスであるか判定し、メールアドレスであれば true そうでなければ false を返す
    async isEmailAddress(str) {
        let temp1 = await this.extractEmailAddress(str);
        let temp2 = temp1.split('@');

        if (temp2.length === 2
         && temp2[0].length > 0
         && temp2[1].length > 0
        ) {
            return true;
        }

        return false;
    }
    
    // 数字にのみスタイルを指定する
    addNumberStyle(str, className = 'numstyle') {
        let strs = str.split('');
    
        let addr = '';
        let numFlag = false;
        for (let i = 0; i < strs.length; i++) {
        
            // 数値ではない
            if (isNaN(strs[i]) ===  true) {
            
                // 直前の文字は数値
                if (numFlag === true) {
                    addr += '</span>' + strs[i];
                
                // 直前の文字も数値ではない    
                } else {
                    addr += strs[i];
                }
                numFlag = false;
            
            // 数値    
            } else {
            
                // 直前の文字も数値
                if (numFlag === true) {
                    addr += strs[i];
                
                // 直前の文字は数値ではない    
                } else {
                    addr += '<span class="' + className + '">' + strs[i];
                }
                numFlag = true;  
            }
        }

        // 最後の文字が数値
        if (numFlag === true) {
            addr += '</span>';
        }
    
        return addr;
    }
    
    // 送信先メールアドレスのチェックリスト作成する
    async makeDestEmailAddressesList() {
    
        // 送信先メールアドレスを抽出する
        let destEmailAddresses = await this.extractDestEmailAddresses();
        
        // リストの背景色
        let colorPool = ['#e5ffcc', '#ffffcc', '#ffe5cc', '#ccccff', '#cce5ff', '#ccffff', '#ccffe5', '#ccffcc'];
        
        let list    = '';
        let color   = '';
        for (let i = 0; i < destEmailAddresses.length; i++) {
            color = colorPool.shift();
            
            list += await this.makeDestEmailAddressesListHelper(destEmailAddresses[i], color);
            
            colorPool.push(color);
        }
        
        return list;
    }
    async makeDestEmailAddressesListHelper(d, color) {
        let r = '';
        let style = "style='background-color: " + color + ";'";

        r += "<table class='main'>";
        r += "<tr><td class='td01'></td><td class='td02'></td><td class='td03'></td></tr>";
        
        // 送信先ドメイン
        let domain = '';
        if (d['domain']) {
            domain = this.addNumberStyle(Utilities.sanitaize(d['domain']));
        }
        r += "<tr>";
        r += "<td colspan='2' class='item-name'>" + browser.i18n.getMessage('toDomain') + "</td>";
        r += "<td class='detail' " + style + "><span class='mailaddr'>" + domain + "</span></td>";
        r += "<tr>";
        
        // 送信先メールアドレス
        let address = '';
        for (let i = 0; i < d['dests'].length; i++) {
            address = await this.decorateEmailAddress(Utilities.sanitaize(d['dests'][i]['address']));
            r += "<tr>";
            r += "<td class='item-name'>" + d['dests'][i]['method'] + "</td>";
            r += "<td><input type='checkbox' class='checkbox' name='checkitem'></td>";
            r += "<td class='detail' " + style + "><span class='mailaddr'>" + address + "</span>";
            if (d['dests'][i]['addressListName']) {
                r += "<span class='addressListName'> [" + d['dests'][i]['addressListName'] + "]</span>";
            }
            r += "</td>";
            r += "<tr>";
        }
        
        r += "</table>";
        r += "<div class='space10'></div>";
        
        return r;
    }
    
    // 送信先のメールアドレスを抽出する
    async extractDestEmailAddresses() {
        let r = [];
        r = await this.extractDestEmailAddressesHelper(this.#target.details.to, r, 'To');
        r = await this.extractDestEmailAddressesHelper(this.#target.details.cc, r, 'Cc');
        r = await this.extractDestEmailAddressesHelper(this.#target.details.bcc, r, 'Bcc');

        return r;
    }
    async extractDestEmailAddressesHelper(d, r, method) {

        /**
         * アドレスリストをメールアドレスに展開する処理
         * ＜アドレスリストの仕様＞
         * アドレスリスト名が正しいメールアドレスかつメールアドレスが登録されていない場合、アドレスリスト名がメールアドレスとして扱われる。（注意すべき仕様）
         * アドレスリスト名が正しいメールアドレスかつメールアドレスが登録されている場合は、通常のアドレスリストとして扱われる。
         * アドレスリスト名が正しくないメールアドレスかつメールアドレスが登録されていない場合、エラーとして処理されメールが送信できない。
         */
        let destEmailAddresses  = [];
        let addressListName     = '';
        let addressList         = '';
        for (let i = 0; i < d.length; i++) {

            // To、Cc、Bccに入力された文字列でアドレスリストを取得を試みる
            addressListName = await Utilities.extractAddressListName(d[i]);
            addressList     = await Utilities.getAddressList(addressListName);

            // 該当するアドレスリストが無い（=メールアドレスのはず）
            if (addressList === null) {
                if (await this.isEmailAddress(d[i])) {
                    destEmailAddresses.push({
                        address:            d[i],
                        addressListName:    ''
                    });
                }

            // 該当するアドレスリストがありメールアドレスが登録されている
            } else {
                for (let j = 0; j < addressList.length; j++) {
                    destEmailAddresses.push({
                        address:            addressList[j],
                        addressListName:    addressListName
                    });
                }
            }
        }

        let address = '';
        let domain  = '';
        for (let i = 0; i < destEmailAddresses.length; i++) {
            address = await this.extractEmailAddress(destEmailAddresses[i]['address']);
            domain  = await this.extractDomain(address);

            // チェック項目数のカウント
            this.#checkItemsNum++;
        
            var exist_flag = false;
            for (let j = 0; j < r.length; j++) {
                if (domain === r[j]['domain']) {
                    r[j]['dests'].push({
                        address:            address,
                        method:             method,
                        addressListName:    destEmailAddresses[i]['addressListName']
                    });
                    exist_flag = true;
                    break;
                }
            }
        
            if (!exist_flag) {
                r.push({
                    domain: domain,
                    dests: [{
                        address:            address,
                        method:             method,
                        addressListName:    destEmailAddresses[i]['addressListName']
                    }]
                });
            }
        }

        return r;
    }
    
    // 添付ファイルのチェックリストを作成する
    makeAttachmentsList() {
        let r = '';
        
        r += "<p>" + browser.i18n.getMessage('checkAttachments') + "</p>"; 
        
        r += "<table class='main'>";
        r += "<tr><td class='td01'></td><td class='td02'></td><td class='td03'></td></tr>";
        
        // 添付ファイルの情報
        let a = this.#target.attachments;
        let name = '';
        let size = '';
        for (let i = 0; i < a.length; i++) {    
            name = Utilities.sanitaize(a[i]['name']);
            size = this.byteToKbyte(a[i]['size']).toLocaleString();

            // チェック項目数のカウント
            this.#checkItemsNum++;

            r += "<tr>";
            r += "<td class='item-name'>" + browser.i18n.getMessage('attachment') + "</td>";
            r += "<td><input type='checkbox' class='checkbox' name='checkitem'></td>";
            r += "<td class='attachments'>" + name + "<span class='size'>(" + size + "KB)</span></td>";
            r += "<tr>";  
        }
        
        r += "</table>";
        r += "<div class='space30'></div>";

        return r;
    }
    
    // B（バイト）をKB（キロバイトに変換する）
    byteToKbyte(num) {
    
        // 1024B以下は1KBとする
        if (num < 1024) {
            return 1;
        }
        
        return Math.round(num / 1024);
    }
}