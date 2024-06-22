import { Utilities } from '../common/Utilities.js';

/**
 * 確認画面用のメソッドたち
 */
export class CheckUtilities {
    
    #target;
    #checkItemsNum;
    #riskScore;

    constructor(target) {
        
        // 送信しようとしているメールデータ
        this.#target = target;
        
        // チェック項目数
        this.#checkItemsNum = this.countCheckItems();
        
        // リスク値
        this.#riskScore = this.calculateRiskScore();
    }
    
    // チェック項目数のゲッタ
    getCheckItemsNum() {
        return this.#checkItemsNum;
    }    

    // チェック項目を数える（=チェックボックスの数）
    countCheckItems() {
        let count = 3;  // FROMアドレス、件名、本文で3カウント
        count += this.#target.details.to.length;
        count += this.#target.details.cc.length;
        count += this.#target.details.bcc.length;
        count += this.#target.attachments.length;
    
        return count;
    }
     
    // リスク値を計算する
    calculateRiskScore() {
        let score = 0;
        score += this.#target.details.to.length;
        score += this.#target.details.cc.length;
        score += this.#target.details.bcc.length;
        score += this.#target.attachments.length * 3;   // 1添付ファイルにつき3スコア
    
        return score;
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
        
    // リスク値によって表題の色を変える
    setRiskScoreColor() {
        let riskScore   = this.#riskScore;
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
        let domain      = '<span class="domain">@' + strs[1] + '</span>';
    
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
    
        return addr;
    }
    
    // 送信先メールアドレスのチェックリスト作成する
    makeDestEmailAddressesList() {
    
        // 送信先メールアドレスを抽出する
        let destEmailAddresses = this.extractDestEmailAddresses();
        
        // リストの背景色
        let colorPool = ['#e5ffcc', '#ffffcc', '#ffe5cc', '#ccccff', '#cce5ff', '#ccffff', '#ccffe5', '#ccffcc'];
        
        let list    = '';
        let color   = '';
        for (let i = 0; i < destEmailAddresses.length; i++) {
            color = colorPool.shift();
            
            list += this.makeDestEmailAddressesListHelper(destEmailAddresses[i], color);
            
            colorPool.push(color);
        }
        
        return list;
    }
    makeDestEmailAddressesListHelper(d, color) {
        let r = '';
        let style = "style='background-color: " + color + ";'";

        r += "<table class='main'>";
        r += "<tr><td class='td01'></td><td class='td02'></td><td class='td03'></td></tr>";
        
        // 送信先ドメイン
        let domain = this.addNumberStyle(Utilities.sanitaize(d['domain']));
        r += "<tr>";
        r += "<td colspan='2' class='item-name'>" + browser.i18n.getMessage('toDomain') + "</td>";
        r += "<td class='detail' " + style + "><span class='mailaddr'>" + domain + "</span></td>";
        r += "<tr>";
        
        // 送信先メールアドレス
        let address = '';
        for (let i = 0; i < d['dests'].length; i++) {
            address = this.decorateEmailAddress(Utilities.sanitaize(d['dests'][i]['address']));
            r += "<tr>";
            r += "<td class='item-name'>" + d['dests'][i]['method'] + "</td>";
            r += "<td><input type='checkbox' class='checkbox' name='checkitem'></td>";
            r += "<td class='detail' " + style + "><span class='mailaddr'>" + address + "</span></td>";
            r += "<tr>"; 
        }
        
        r += "</table>";
        r += "<div class='space10'></div>";
        
        return r;
    }
    
    // 送信先のメールアドレスを抽出する
    extractDestEmailAddresses() {
        let r = [];
        r = this.extractDestEmailAddressesHelper(this.#target.details.to, r, 'To');
        r = this.extractDestEmailAddressesHelper(this.#target.details.cc, r, 'Cc');
        r = this.extractDestEmailAddressesHelper(this.#target.details.bcc, r, 'Bcc');

        return r;
    }
    extractDestEmailAddressesHelper(d, r, method) {
        let address = '';
        let domain  = '';
    
        for (let i = 0; i < d.length; i++) {
            address = this.extractEmailAddress(d[i]);       
            domain  = this.extractDomain(address);
        
            var exist_flag = false;
            for (let j = 0; j < r.length; j++) {
                if (domain === r[j]['domain']) {
                    r[j]['dests'].push({
                        address:    address,
                        method:     method
                    });
                    exist_flag = true;
                    break;
                }
            }
        
            if (!exist_flag) {
                r.push({
                    domain: domain,
                    dests: [{
                        address:    address,
                        method:     method
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
    
    // サニタイズ処理
    sanitaize(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    unsanitaize(str) {
        return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&');
    }
}