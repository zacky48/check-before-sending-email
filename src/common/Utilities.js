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
}