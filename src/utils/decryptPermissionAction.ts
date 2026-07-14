import CryptoJS from 'crypto-js';

const PERMISSION_ACTION_KEY = import.meta.env.VITE_PERMISSION_ACTION_KEY;

export function decryptAction(encrypted: string, key: string = PERMISSION_ACTION_KEY): string {
    const iv = CryptoJS.enc.Hex.parse(CryptoJS.SHA256(key).toString().substr(0, 32));
    const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Utf8.parse(key), {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}
export function encryptAction(action: string, key: string = PERMISSION_ACTION_KEY): string {
    const iv = CryptoJS.enc.Hex.parse(CryptoJS.SHA256(key).toString().substr(0, 32));
    const encrypted = CryptoJS.AES.encrypt(action, CryptoJS.enc.Utf8.parse(key), {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}
