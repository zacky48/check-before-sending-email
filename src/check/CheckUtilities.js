import { Utilities } from '../common/Utilities.js';

/**
 * 確認画面用のメソッドたち
 */
export class CheckUtilities {
    
    #target;
    #settingValues;
    #checkItemsNum;
    #checkExcludeFlag;

    constructor(target, settingValues) {
        
        // 送信しようとしているメールデータ
        this.#target = target;

        // 設定値
        this.#settingValues = settingValues;
        
        // チェック項目数
        this.#checkItemsNum = 0;

        // チェックを除外する送信先メールアドレスもしくはドメインが１つでもある場合は true とする
        this.#checkExcludeFlag = false;
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
    decorateEmailAddress(str) {
        let addr        = this.extractEmailAddress(str);
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
    extractEmailAddress(str) {
        let strs = str.split(' ');
        let i = strs.length - 1;
    
        // メールアドレス前後の<>を取除く
        let addr = strs[i];
        addr = addr.replace(/^</, '');
        addr = addr.replace(/>$/, '');
    
        return addr;
    }
    
    // メールアドレスのドメインのみを抽出する
    extractDomain(emailAddress) {
        let strs = this.extractEmailAddress(emailAddress).split('@');
        return strs[1];
    }

    // メールアドレスであるか判定し、メールアドレスであれば true そうでなければ false を返す
    isEmailAddress(str) {
        let temp1 = this.extractEmailAddress(str);
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
    
    // はじめのメッセージ
    firstMesg() {

        // チェック項目１つも無い場合は、はじめのメッセージを表示しない
        if (this.#checkItemsNum === 0) {
            document.getElementById('firstMesg').innerHTML = "<div class='space20'></div>";
        } else {
            let firstMesg = "<div class='mesg-box'>" + browser.i18n.getMessage('checkTheBox') + "</div>"
            document.getElementById('firstMesg').innerHTML = firstMesg;
        }
    }

    // 送信元メールアドレスのチェック
    senderEmailAddress() {
        let r = '';

        // 送信元ドメイン
        let domain = this.extractDomain(this.#target.details.from);
        let domein_sanitaized = this.addNumberStyle(Utilities.sanitaize(domain));

        // 送信元ドメインのチェック除外設定
        let exclude_domain = false;
        if (this.#settingValues['senderAllowList'].includes(domain)) {
            exclude_domain = true;  // チェック除外
            this.#checkExcludeFlag = true;
        }

        // 送信元メールアドレス
        let from = this.extractEmailAddress(this.#target.details.from);
        let from_sanitaized = this.decorateEmailAddress(Utilities.sanitaize(from));

        // 送信元メールアドレスのチェック除外設定
        let exclude_from = false;  // チェック除外
        if (this.#settingValues['senderAllowList'].includes(from)) {
            exclude_from = true;
            this.#checkExcludeFlag = true;
        }

        // チェック除外ではない場合
        if (!exclude_domain && !exclude_from) {

            // チェック項目数のカウントアップ
            this.#checkItemsNum++;

            // 確認を促すメッセージの表示
            r += "<p>" + browser.i18n.getMessage('checkFromEmailAddress') + "</p>";
        }
 
        // メインテーブル
        r += "<table class='main'>";
        r += "<tr><td class='td01'></td><td class='td02'></td><td class='td03'></td></tr>";

        // 送信元ドメイン
        r += "<tr>";
        r += "<td colspan='2' class='item-name'>" + browser.i18n.getMessage('fromDomain') + "</td>";
        if (exclude_domain) {
            r += "<td class='check-exclude'>" + domein_sanitaized + "</td>";
        } else {
            r += "<td class='detail'><span class='mailaddr'>" + domein_sanitaized + "</span></td>";
        }
        r += "</tr>";

        // 送信元メールアドレス
        r += "<tr>";
        r += "<td class='item-name'>From</td>";
        if (exclude_domain || exclude_from) {
            r += "<td class='check-exclude'></td>";
            r += "<td class='check-exclude'>" + from_sanitaized + "</td>";
        } else {
            r += "<td><input type='checkbox' class='checkbox' name='checkitem'></td>";
            r += "<td class='detail'><span class='mailaddr'>" + from_sanitaized + "</span></td>";
        }
        r += "</tr>";
        r += "</table>";
        r += "<div class='space20'></div>";

        return r;
    }

    // 件名のチェック
    subject() {
        let r = '';

        // チェック項目数のカウントアップ
        this.#checkItemsNum++;

        // 件名
        let subject_sanitaized = Utilities.sanitaize(this.#target.details.subject)

        r += "<p>" + browser.i18n.getMessage('checkSubject') + "</p>";
        r += "<table class='main'>";
        r += "<tr><td class='td01'></td><td class='td02'></td><td class='td03'></td></tr>";
        r += "<tr>";
        r += "<td class='item-name'>" + browser.i18n.getMessage('subject') +"</td>";
        r += "<td><input type='checkbox' class='checkbox' name='checkitem'></td>";
        r += "<td class='subject'>" + subject_sanitaized + "</td>";
        r += "</tr>";
        r += "</table>";
        r += "<div class='space20'></div>";

        return r;
    }

    // 本文のチェック
    body() {
        let r = '';

        // チェック項目数のカウントアップ
        this.#checkItemsNum++;

        // 本文
        let body = this.#target.details.plainTextBody;

        r += "<p>" + browser.i18n.getMessage('checkBody') + "</p>";
        r += "<table class='main'>";
        r += "<tr><td class='td01'></td><td class='td02'></td><td class='td03'></td></tr>";
        r += "<tr>";
        r += "<td class='item-name'>" + browser.i18n.getMessage('body') +"</td>";
        r += "<td><input type='checkbox' class='checkbox' name='checkitem'></td>";
        r += "<td class='detail'>";
        r += "<textarea class='mailbody' disabled>" + body + "</textarea><br>";
        r += "<a href='#' id='openBodyWindow'>" + browser.i18n.getMessage('openBodyWindow') + "</a>";
        r += "</td>";
        r += "</tr>";
        r += "</table>";
        r += "<div class='space20'></div>";

        return r;
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
            
            list += this.makeDestEmailAddressesListHelper(destEmailAddresses[i], color);
            
            colorPool.push(color);
        }
        
        list += "<div class='space10'></div>";

        return list;
    }
    makeDestEmailAddressesListHelper(d, color) {
        let r = '';
        let style = "style='background-color: " + color + ";'";

        // チェック除外になっているメールアドレス数をカウント
        let checkExcludeCount = 0;
        for (let i = 0; i < d['dests'].length; i++) {
            if (d['dests'][i]['checkExclude']) {
                checkExcludeCount++;    
            }
        }

        if (d['checkExclude']                       // 送信先ドメインがチェック除外
         || d['dests'].length === checkExcludeCount // 送信先メールアドレスが全てチェック除外
        ) {
            r += ''; // 確認を促すメッセージを表示しない
        } else {
            r += "<p>" + browser.i18n.getMessage('checkToEmailAddress') + "</p>";
        }

        r += "<table class='main'>";
        r += "<tr><td class='td01'></td><td class='td02'></td><td class='td03'></td></tr>";
        
        // 送信先ドメイン
        r += "<tr>";
        r += "<td colspan='2' class='item-name'>" + browser.i18n.getMessage('toDomain') + "</td>";
        let domain = '';
        if (d['domain']) {
            if (d['checkExclude']) {
                domain = Utilities.sanitaize(d['domain']);
                r += "<td class='check-exclude'>" + domain + "</td>";
            } else {
                domain = this.addNumberStyle(Utilities.sanitaize(d['domain']));
                r += "<td class='detail' " + style + "><span class='mailaddr'>" + domain + "</span></td>";
            }
        } else {
            r += "<td class='detail' " + style + "><span class='mailaddr'></span></td>";
        }
        r += "<tr>";
        
        // 送信先メールアドレス
        let address = '';
        for (let i = 0; i < d['dests'].length; i++) {
            r += "<tr>";
            r += "<td class='item-name'>" + d['dests'][i]['method'] + "</td>";
            
            if (d['checkExclude'] || d['dests'][i]['checkExclude']) {
                this.#checkExcludeFlag = true;
                r += "<td class='check-exclude'></td>";
                address = Utilities.sanitaize(d['dests'][i]['address']);
                r += "<td class='check-exclude'>" + address;
            } else {
                r += "<td><input type='checkbox' class='checkbox' name='checkitem'></td>";
                address = this.decorateEmailAddress(Utilities.sanitaize(d['dests'][i]['address']));
                r += "<td class='detail' " + style + "><span class='mailaddr'>" + address + "</span>";
            }

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
            addressListName = Utilities.extractAddressListName(d[i]);
            addressList     = await Utilities.getAddressList(addressListName);

            // 該当するアドレスリストが無い（=メールアドレスのはず）
            if (addressList === null) {
                if (this.isEmailAddress(d[i])) {
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
            address = this.extractEmailAddress(destEmailAddresses[i]['address']);
            domain  = this.extractDomain(address);

            if (!this.#settingValues['destinationAllowList'].includes(domain)
             && !this.#settingValues['destinationAllowList'].includes(address)
            ) {
                // チェック項目数のカウントアップ
                this.#checkItemsNum++;
            }

            var exist_flag = false;
            for (let j = 0; j < r.length; j++) {
                if (domain === r[j]['domain']) {
                    r[j]['dests'].push({
                        address:            address,
                        method:             method,
                        addressListName:    destEmailAddresses[i]['addressListName'],
                        checkExclude:       this.#settingValues['destinationAllowList'].includes(address)
                    });
                    exist_flag = true;
                    break;
                }
            }
        
            if (!exist_flag) {
                r.push({
                    domain:         domain,
                    checkExclude:   this.#settingValues['destinationAllowList'].includes(domain),
                    dests: [{
                        address:            address,
                        method:             method,
                        addressListName:    destEmailAddresses[i]['addressListName'],
                        checkExclude:       this.#settingValues['destinationAllowList'].includes(address)
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

            // チェック項目数のカウントアップ
            this.#checkItemsNum++;

            r += "<tr>";
            r += "<td class='item-name'>" + browser.i18n.getMessage('attachment') + "</td>";
            r += "<td><input type='checkbox' class='checkbox' name='checkitem'></td>";
            r += "<td class='attachments'>" + name + "<span class='size'>(" + size + "KB)</span></td>";
            r += "<tr>";  
        }
        
        r += "</table>";
        r += "<div class='space20'></div>";

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

    // 設定で無効化されているチェック項目
    disabledCheckItems() {
        let r = '';

        // チェックを除外するメールアドレスもしくはドメインが１つでもある
        if (this.#checkExcludeFlag) {
            r += "<p>" + browser.i18n.getMessage('disabledEmailDomain') + "</p>";
        }

        // 送信元のメールアドレス
        if (!this.#settingValues['senderEmailAddress']) {
            r += "<p>" + browser.i18n.getMessage('disabledSenderEmailAddressCheck') + "</p>";
        }

        // 件名
        if (!this.#settingValues['subject']) {
            r += "<p>" + browser.i18n.getMessage('disabledSubjectCheck') + "</p>";
        }

        // 本文
        if (!this.#settingValues['body']) {
            r += "<p>" + browser.i18n.getMessage('disabledBodyCheck') + "</p>";
        }

        // 送信先のメールアドレス
        if (!this.#settingValues['destinationEmailAddress']) {
            r += "<p>" + browser.i18n.getMessage('disabledDestinationEmailAddressCheck') + "</p>";
        }

        // 添付ファイル
        if (!this.#settingValues['attachment']) {
            r += "<p>" + browser.i18n.getMessage('disabledAttachmentCheck') + "</p>";
        }

        if (r) {
            r += "<div class='space20'></div>";
            document.getElementById('disabledCheckItems').innerHTML = r;
        }
    }
}