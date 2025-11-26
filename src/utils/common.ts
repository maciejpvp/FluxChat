import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import pako from 'pako';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const toBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
export const fromBase64 = (str: string) => decodeURIComponent(escape(atob(str)));

export const compressData = (data: any): string => {
    let keyK = undefined;
    if (data.keyJson && data.keyJson.k) {
        keyK = data.keyJson.k;
    }

    let minSdp = data.sdp;
    if (typeof minSdp === 'string') {
        minSdp = minSdp
            .replace("v=0\r\n", "")
            .replace("s=-\r\n", "")
            .replace("t=0 0\r\n", "")
            .replace("a=extmap-allow-mixed\r\n", "")
            .replace("a=msid-semantic: WMS\r\n", "");
    } else if (minSdp && minSdp.sdp) {
        minSdp = minSdp.sdp
            .replace("v=0\r\n", "")
            .replace("s=-\r\n", "")
            .replace("t=0 0\r\n", "")
            .replace("a=extmap-allow-mixed\r\n", "")
            .replace("a=msid-semantic: WMS\r\n", "");
    }

    const payload = [minSdp, keyK];

    const jsonString = JSON.stringify(payload);
    const compressed = pako.deflate(jsonString);
    console.log(compressed)
    return abToBase64(compressed.buffer);
};

export const decompressData = (compressed: string): any => {
    try {
        const binary = base64ToAb(compressed);
        const decompressed = pako.inflate(new Uint8Array(binary), { to: 'string' });
        const payload = JSON.parse(decompressed);

        const [minSdp, keyK] = payload;

        const firstLineEnd = minSdp.indexOf('\r\n');
        if (firstLineEnd === -1) throw new Error("Invalid SDP format");

        const oLine = minSdp.substring(0, firstLineEnd + 2);
        const rest = minSdp.substring(firstLineEnd + 2);

        const fullSdp = "v=0\r\n" +
            oLine +
            "s=-\r\n" +
            "t=0 0\r\n" +
            "a=extmap-allow-mixed\r\n" +
            "a=msid-semantic: WMS\r\n" +
            rest;

        const result: any = {
            sdp: { type: keyK ? 'offer' : 'answer', sdp: fullSdp }
        };

        if (keyK) {
            result.keyJson = {
                alg: "A256GCM",
                ext: true,
                k: keyK,
                key_ops: ["encrypt", "decrypt"],
                kty: "oct"
            };
        }

        return result;
    } catch (e) {
        console.error("Decompression failed", e);
        throw new Error('Failed to decompress data');
    }
};

export const abToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

export const base64ToAb = (base64: string): ArrayBuffer => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
