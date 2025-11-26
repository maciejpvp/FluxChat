
import { compressData, decompressData } from './src/utils/common';
import pako from 'pako';

// Mock browser globals for node environment
global.window = {
    btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
    atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
} as any;

const mockSdp = {
    type: "offer",
    sdp: "v=0\r\no=- 4611731400430051336 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=text 9 UDP/TLS/RTP/SAVPF 0\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:Jv9e\r\na=ice-pwd:6q5/7+3/8+9/0+1\r\na=fingerprint:sha-256 2A:2B:2C:2D:2E:2F:30:31:32:33:34:35:36:37:38:39:3A:3B:3C:3D:3E:3F:40:41:42:43:44:45:46:47:48:49\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n"
};

const mockKey = {
    alg: "A256GCM",
    ext: true,
    k: "7+3/8+9/0+1/2+3/4+5/6+7/8+9/0+1/2+3/4+5/6+7",
    key_ops: ["encrypt", "decrypt"],
    kty: "oct"
};

const payload = {
    sdp: mockSdp,
    keyJson: mockKey
};

try {
    console.log("Compressing...");
    const compressed = compressData(payload);
    console.log("Compressed:", compressed);

    console.log("Decompressing...");
    const decompressed = decompressData(compressed);
    console.log("Decompressed:", decompressed);

    if (decompressed.sdp.sdp === mockSdp.sdp) {
        console.log("SUCCESS: SDP matches");
    } else {
        console.log("FAILURE: SDP mismatch");
    }
} catch (e) {
    console.error("ERROR:", e);
}
