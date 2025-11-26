
import LZString from 'lz-string';
import zlib from 'zlib';
import { promisify } from 'util';

const deflate = promisify(zlib.deflate);

const mockSdpStr = "v=0\r\no=- 4611731400430051336 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=text 9 UDP/TLS/RTP/SAVPF 0\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:Jv9e\r\na=ice-pwd:6q5/7+3/8+9/0+1\r\na=fingerprint:sha-256 2A:2B:2C:2D:2E:2F:30:31:32:33:34:35:36:37:38:39:3A:3B:3C:3D:3E:3F:40:41:42:43:44:45:46:47:48:49\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n";

const mockKey = {
    alg: "A256GCM",
    ext: true,
    k: "7+3/8+9/0+1/2+3/4+5/6+7/8+9/0+1/2+3/4+5/6+7",
    key_ops: ["encrypt", "decrypt"],
    kty: "oct"
};

const minKey = mockKey.k;
const optimizedPayload = [mockSdpStr, minKey];
const jsonString = JSON.stringify(optimizedPayload);

async function run() {
    console.log("--- Payload Info ---");
    console.log("Original JSON length:", jsonString.length);

    // LZ-String
    const lzCompressed = LZString.compressToBase64(jsonString);
    console.log("\n--- LZ-String ---");
    console.log("Length:", lzCompressed.length);

    // Zlib (Deflate) -> Base64
    const buffer = await deflate(jsonString);
    const zlibBase64 = buffer.toString('base64');
    console.log("\n--- Zlib (Deflate) ---");
    console.log("Length:", zlibBase64.length);

    // Custom SDP Minification + Zlib
    // Remove "v=0...", "s=-", "t=0 0" which are standard
    // Remove "a=extmap-allow-mixed", "a=msid-semantic: WMS" if possible
    // This is risky but let's see potential
    const minSdp = mockSdpStr
        .replace("v=0\r\n", "")
        .replace("s=-\r\n", "")
        .replace("t=0 0\r\n", "")
        .replace("a=extmap-allow-mixed\r\n", "")
        .replace("a=msid-semantic: WMS\r\n", "");

    const minPayload = [minSdp, minKey];
    const minJson = JSON.stringify(minPayload);
    const minZlib = (await deflate(minJson)).toString('base64');
    console.log("\n--- Minified SDP + Zlib ---");
    console.log("Length:", minZlib.length);
}

run();
