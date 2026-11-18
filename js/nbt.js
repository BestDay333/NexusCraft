/**
 * Минималистичный, но полный парсер NBT (Named Binary Tag) для Minecraft.
 * Поддерживает gzip / zlib / несжатый NBT и все 13 типов тегов.
 * Работает полностью в браузере — файлы никуда не отправляются.
 */

const TD = new TextDecoder('utf-8');

class NBTReader {
    constructor(bytes) {
        this.bytes = bytes;
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        this.pos = 0;
    }

    need(n) {
        if (this.pos + n > this.bytes.length) {
            throw new Error('Повреждённый NBT: неожиданный конец файла');
        }
    }

    u8() { this.need(1); return this.view.getUint8(this.pos++); }
    i8() { this.need(1); return this.view.getInt8(this.pos++); }
    i16() { this.need(2); const v = this.view.getInt16(this.pos); this.pos += 2; return v; }
    u16() { this.need(2); const v = this.view.getUint16(this.pos); this.pos += 2; return v; }
    i32() { this.need(4); const v = this.view.getInt32(this.pos); this.pos += 4; return v; }
    i64() { this.need(8); const v = this.view.getBigInt64(this.pos); this.pos += 8; return v; }
    f32() { this.need(4); const v = this.view.getFloat32(this.pos); this.pos += 4; return v; }
    f64() { this.need(8); const v = this.view.getFloat64(this.pos); this.pos += 8; return v; }

    str() {
        const len = this.u16();
        this.need(len);
        const s = TD.decode(this.bytes.subarray(this.pos, this.pos + len));
        this.pos += len;
        return s;
    }

    byteArray() {
        const len = this.i32();
        if (len < 0) throw new Error('Повреждённый NBT: отрицательная длина массива');
        this.need(len);
        const out = this.bytes.slice(this.pos, this.pos + len);
        this.pos += len;
        return new Int8Array(out.buffer, out.byteOffset, out.byteLength);
    }

    intArray() {
        const len = this.i32();
        if (len < 0) throw new Error('Повреждённый NBT: отрицательная длина массива');
        this.need(len * 4);
        const out = new Int32Array(len);
        for (let i = 0; i < len; i++) out[i] = this.i32();
        return out;
    }

    longArray() {
        const len = this.i32();
        if (len < 0) throw new Error('Повреждённый NBT: отрицательная длина массива');
        this.need(len * 8);
        // Читаем каждый long как big-endian: нельзя копировать байты в BigInt64Array,
        // потому что он использует порядок байт платформы (обычно little-endian).
        const out = new BigInt64Array(len);
        for (let i = 0; i < len; i++) out[i] = this.view.getBigInt64(this.pos + i * 8);
        this.pos += len * 8;
        return out;
    }

    payload(type) {
        switch (type) {
            case 1: return this.i8();
            case 2: return this.i16();
            case 3: return this.i32();
            case 4: return this.i64();
            case 5: return this.f32();
            case 6: return this.f64();
            case 7: return this.byteArray();
            case 8: return this.str();
            case 9: {
                const itemType = this.u8();
                const len = this.i32();
                if (len < 0) throw new Error('Повреждённый NBT: отрицательная длина списка');
                const arr = new Array(len);
                for (let i = 0; i < len; i++) arr[i] = this.payload(itemType);
                return arr;
            }
            case 10: {
                const obj = {};
                for (;;) {
                    const t = this.u8();
                    if (t === 0) break;
                    const name = this.str();
                    obj[name] = this.payload(t);
                }
                return obj;
            }
            case 11: return this.intArray();
            case 12: return this.longArray();
            default:
                throw new Error(`Неизвестный тип NBT-тега: ${type}`);
        }
    }
}

function isGzip(b) {
    return b.length > 2 && b[0] === 0x1f && b[1] === 0x8b;
}

function isZlib(b) {
    // 0x78 — самый частый первый байт zlib-потока (78 01 / 78 5e / 78 9c / 78 da)
    return b.length > 2 && b[0] === 0x78 &&
        (b[1] === 0x01 || b[1] === 0x5e || b[1] === 0x9c || b[1] === 0xda);
}

/** Разжимает gzip/zlib, если нужно, и возвращает Uint8Array с NBT. */
export function decompress(bytes) {
    const pako = window.pako;
    if (isGzip(bytes)) {
        if (!pako) throw new Error('Не загружен модуль распаковки (pako)');
        return pako.ungzip(bytes);
    }
    if (isZlib(bytes)) {
        if (!pako) throw new Error('Не загружен модуль распаковки (pako)');
        return pako.inflate(bytes);
    }
    return bytes;
}

/**
 * Читает NBT из ArrayBuffer/Uint8Array.
 * @returns {{name: string, rootType: number, value: object}}
 */
export function readNBT(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const raw = decompress(bytes);
    if (!raw.length) throw new Error('Файл пустой');

    const reader = new NBTReader(raw);
    const rootType = reader.u8();
    if (rootType === 0) throw new Error('Файл не содержит NBT-данных');
    if (rootType !== 10) throw new Error('Корневой тег NBT должен быть Compound');
    const name = reader.str();
    const value = reader.payload(rootType);
    return { name, rootType, value, decompressedSize: raw.length };
}

export function isProbablyNBT(bytes) {
    if (!bytes.length) return false;
    if (isGzip(bytes) || isZlib(bytes)) return true;
    return bytes[0] === 10;
}
