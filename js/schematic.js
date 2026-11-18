/**
 * Универсальный парсер схем Minecraft:
 *  - Sponge .schem v1/v2/v3 (WorldEdit / FAWE)
 *  - Litematica .litematic
 *  - Structure .nbt (ванильные структуры)
 *  - MCEdit / WorldEdit .schematic (legacy)
 *
 * Файл разбирается полностью в браузере. На сервер ничего не уходит.
 */

import { readNBT, isProbablyNBT } from './nbt.js';
import { legacyName, isAir, baseId } from './blocks.js';

const MAX_PREVIEW_BLOCKS = 220000;

function emptyResult() {
    return {
        counts: {},
        palette: [],
        paletteIndex: new Map(),
        positions: [],
        min: { x: Infinity, y: Infinity, z: Infinity },
        max: { x: -Infinity, y: -Infinity, z: -Infinity }
    };
}

function addBlock(acc, rawId, x, y, z, sampleStride) {
    const id = baseId(rawId);
    if (isAir(id)) return;
    acc.counts[id] = (acc.counts[id] || 0) + 1;

    if (acc.min.x > x) acc.min.x = x;
    if (acc.min.y > y) acc.min.y = y;
    if (acc.min.z > z) acc.min.z = z;
    if (acc.max.x < x) acc.max.x = x;
    if (acc.max.y < y) acc.max.y = y;
    if (acc.max.z < z) acc.max.z = z;

    if (sampleStride > 1) {
        // Детерминированная выборка для предпросмотра: пропускаем часть блоков,
        // чтобы не держать в памяти миллионы экземпляров.
        acc.sampling = true;
        acc.sampled = (acc.sampled || 0) + 1;
        if (acc.sampled % sampleStride !== 0) return;
    }

    let pi = acc.paletteIndex.get(id);
    if (pi === undefined) {
        pi = acc.palette.length;
        acc.palette.push(id);
        acc.paletteIndex.set(id, pi);
    }
    acc.positions.push(x, y, z, pi);
}

function finalize(acc) {
    const positions = new Int32Array(acc.positions);
    const min = acc.min.x === Infinity ? { x: 0, y: 0, z: 0 } : acc.min;
    const max = acc.max.x === -Infinity ? { x: 0, y: 0, z: 0 } : acc.max;

    // Сдвигаем блоки к началу координат
    for (let i = 0; i < positions.length; i += 4) {
        positions[i] -= min.x;
        positions[i + 1] -= min.y;
        positions[i + 2] -= min.z;
    }

    const counts = acc.counts;
    let blockCount = 0;
    for (const k in counts) blockCount += counts[k];

    return {
        counts,
        blockCount,
        uniqueBlocks: Object.keys(counts).length,
        voxels: positions.length
            ? {
                palette: acc.palette,
                data: positions,
                size: {
                    x: max.x - min.x + 1,
                    y: max.y - min.y + 1,
                    z: max.z - min.z + 1
                },
                sampled: !!acc.sampling
            }
            : null
    };
}

function dimsFrom(data) {
    return {
        x: Math.abs(Number(data.Width ?? data.width ?? 0)) || 0,
        y: Math.abs(Number(data.Height ?? data.height ?? 0)) || 0,
        z: Math.abs(Number(data.Length ?? data.length ?? 0)) || 0
    };
}

/* ------------------------- Sponge (.schem) ------------------------- */

function parseSponge(data, version) {
    const blocks = data.Blocks && typeof data.Blocks === 'object' ? data.Blocks : null;
    const paletteRaw = (blocks && blocks.Palette) || data.Palette || {};
    const blockData = (blocks && (blocks.Data || blocks.BlockData)) || data.BlockData || data.Data;

    if (!blockData || !blockData.length) {
        throw new Error('В схеме нет данных о блоках (BlockData)');
    }

    const dimensions = dimsFrom(data);
    if (!dimensions.x || !dimensions.y || !dimensions.z) {
        throw new Error('В схеме не указаны размеры (Width/Height/Length)');
    }
    const volume = dimensions.x * dimensions.y * dimensions.z;
    const sampleStride = Math.max(1, Math.ceil(volume / MAX_PREVIEW_BLOCKS));

    // Palette: { "minecraft:stone": 0 }
    const paletteById = [];
    for (const name in paletteRaw) {
        const id = Number(paletteRaw[name]);
        if (!Number.isFinite(id) || id < 0) continue;
        paletteById[id] = name;
    }

    const acc = emptyResult();
    const width = dimensions.x;
    const length = dimensions.z;
    const layer = width * length;
    const totalCells = Math.min(volume, blockData.length);
    let i = 0;
    let cell = 0;

    while (i < blockData.length && cell < totalCells) {
        let value = 0;
        let shift = 0;
        let b;
        do {
            if (i >= blockData.length) break;
            b = blockData[i++] & 0xff;
            value |= (b & 0x7f) << shift;
            shift += 7;
        } while (b & 0x80);

        const x = cell % width;
        const z = Math.floor(cell / width) % length;
        const y = Math.floor(cell / layer);
        const name = paletteById[value];
        if (name) {
            addBlock(acc, name,
                x + (data.Offset?.[0] || 0),
                y + (data.Offset?.[1] || 0),
                z + (data.Offset?.[2] || 0), sampleStride);
        }
        cell++;
    }

    return {
        format: `Sponge v${version || 2}`,
        dimensions,
        ...finalize(acc)
    };
}

/* ------------------------- Litematica ------------------------- */

function readPackedValue(longs, index, bits) {
    const bitIndex = BigInt(index) * BigInt(bits);
    const longIndex = Number(bitIndex >> 6n);
    const offset = Number(bitIndex & 63n);
    const mask = (1n << BigInt(bits)) - 1n;
    let first = BigInt.asUintN(64, longs[longIndex] ?? 0n) >> BigInt(offset);
    let value = first;
    if (offset + bits > 64) {
        const second = BigInt.asUintN(64, longs[longIndex + 1] ?? 0n);
        value |= second << BigInt(64 - offset);
    }
    return Number(value & mask);
}

function parseLitematic(data, fileName) {
    const regions = data.Regions;
    if (!regions || typeof regions !== 'object') {
        throw new Error('В файле .litematic нет регионов');
    }

    const acc = emptyResult();
    let sizeX = 0, sizeY = 0, sizeZ = 0;
    const warnings = [];

    for (const regionName in regions) {
        const region = regions[regionName];
        if (!region || !region.BlockStates) continue;

        const palette = (region.BlockStatePalette || []).map(e => e && e.Name).filter(Boolean);
        if (!palette.length) continue;

        const sz = region.Size || {};
        const sx = Math.abs(Number(sz.x) || 0);
        const sy = Math.abs(Number(sz.y) || 0);
        const szz = Math.abs(Number(sz.z) || 0);
        const pos = region.Position || {};
        const ox = Number(pos.x) || 0;
        const oy = Number(pos.y) || 0;
        const oz = Number(pos.z) || 0;
        const startX = Number(sz.x) < 0 ? ox + Number(sz.x) + 1 : ox;
        const startY = Number(sz.y) < 0 ? oy + Number(sz.y) + 1 : oy;
        const startZ = Number(sz.z) < 0 ? oz + Number(sz.z) + 1 : oz;

        const volume = sx * sy * szz;
        const longs = region.BlockStates;
        const bits = Math.max(2, Math.ceil(Math.log2(Math.max(2, palette.length))));
        const expectedLongs = Math.ceil((volume * bits) / 64);
        if (longs.length + 1 < expectedLongs) {
            warnings.push(`Регион «${regionName}»: данных меньше ожидаемого, часть блоков пропущена`);
        }

        const sampleStride = Math.max(1, Math.ceil(volume / MAX_PREVIEW_BLOCKS));
        let index = 0;
        for (let y = 0; y < sy; y++) {
            for (let z = 0; z < szz; z++) {
                for (let x = 0; x < sx; x++, index++) {
                    let state;
                    try {
                        state = readPackedValue(longs, index, bits);
                    } catch (e) {
                        state = 0;
                    }
                    const name = palette[state];
                    if (name) addBlock(acc, name, startX + x, startY + y, startZ + z, sampleStride);
                }
            }
        }

        sizeX = Math.max(sizeX, sx);
        sizeY = Math.max(sizeY, sy);
        sizeZ = Math.max(sizeZ, szz);
    }

    const result = finalize(acc);
    return {
        format: 'Litematica',
        dimensions: result.voxels ? result.voxels.size : { x: sizeX, y: sizeY, z: sizeZ },
        warnings,
        ...result
    };
}

/* ------------------------- Structure .nbt ------------------------- */

function parseStructure(data) {
    const sizeArr = data.size || data.Size || [0, 0, 0];
    const paletteArr = data.palette || data.Palette || [];
    const blocksArr = data.blocks || data.Blocks || [];

    const dimensions = { x: Number(sizeArr[0]) || 0, y: Number(sizeArr[1]) || 0, z: Number(sizeArr[2]) || 0 };
    const palette = paletteArr.map(e => e && (e.Name || e.name)).filter(Boolean);
    const volume = dimensions.x * dimensions.y * dimensions.z || blocksArr.length || 1;
    const sampleStride = Math.max(1, Math.ceil(volume / MAX_PREVIEW_BLOCKS));

    const acc = emptyResult();
    for (const block of blocksArr) {
        const pos = block.pos || block.Pos;
        const state = Number(block.state ?? block.State ?? 0);
        const name = palette[state];
        if (!name || !pos) continue;
        addBlock(acc, name, Number(pos[0]) || 0, Number(pos[1]) || 0, Number(pos[2]) || 0, sampleStride);
    }

    return {
        format: 'Structure NBT',
        dimensions,
        ...finalize(acc)
    };
}

/* ------------------------- Legacy .schematic ------------------------- */

function parseLegacy(data) {
    const blocks = data.Blocks;
    const add = data.AddBlocks;
    const width = Math.abs(Number(data.Width) || 0);
    const height = Math.abs(Number(data.Height) || 0);
    const length = Math.abs(Number(data.Length) || 0);
    if (!blocks || !width || !height || !length) {
        throw new Error('Некорректный legacy-схематик (нет Blocks/Width/Height/Length)');
    }

    const volume = width * height * length;
    const sampleStride = Math.max(1, Math.ceil(volume / MAX_PREVIEW_BLOCKS));
    const acc = emptyResult();

    for (let i = 0; i < blocks.length && i < volume; i++) {
        let id = blocks[i] & 0xff;
        if (add && add.length) {
            const extra = (add[i >> 1] >> ((i & 1) ? 4 : 0)) & 0x0f;
            id += extra << 8;
        }
        if (id === 0) continue;

        const x = i % width;
        const z = Math.floor(i / width) % length;
        const y = Math.floor(i / (width * length));
        addBlock(acc, legacyName(id), x, y, z, sampleStride);
    }

    return {
        format: 'Legacy .schematic',
        dimensions: { x: width, y: height, z: length },
        ...finalize(acc)
    };
}

/* ------------------------- Detection + entry point ------------------------- */

function detectAndParse(nbt, fileName) {
    const root = nbt.value || {};
    // Некоторые старые .schem оборачивают всё в тег "Schematic"
    const data = (root.Schematic && typeof root.Schematic === 'object') ? root.Schematic : root;

    if (data.Regions && typeof data.Regions === 'object') {
        return parseLitematic(data, fileName);
    }

    const isArrayLike = (v) => Array.isArray(v) || (ArrayBuffer.isView(v) && typeof v.length === 'number');
    if (isArrayLike(data.blocks) && isArrayLike(data.palette) &&
        (isArrayLike(data.size) || isArrayLike(data.Size))) {
        return parseStructure(data);
    }

    const spongeBlocks = data.Blocks && typeof data.Blocks === 'object' ? data.Blocks : null;
    const hasSpongePalette = spongeBlocks?.Palette || data.Palette;
    const hasSpongeData = spongeBlocks?.Data || data.BlockData;
    if (hasSpongePalette && hasSpongeData) {
        const version = Number(data.Version) || (spongeBlocks ? 3 : (data.Offset ? 2 : 1));
        return parseSponge(data, version);
    }

    if (data.Blocks && typeof data.Blocks.length === 'number' &&
        (data.Width || data.width) && (data.Height || data.height)) {
        return parseLegacy(data);
    }

    throw new Error('Неизвестный формат схемы. Поддерживаются .schem, .litematic, .nbt и .schematic');
}

/**
 * @param {ArrayBuffer|Uint8Array} input
 * @param {string} fileName
 */
export function parseSchematic(input, fileName = 'schematic') {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (!isProbablyNBT(bytes)) {
        throw new Error('Файл не похож на NBT-схему Minecraft (нужен .schem, .litematic, .nbt или .schematic)');
    }

    const nbt = readNBT(bytes);
    const parsed = detectAndParse(nbt, fileName);
    if (!parsed.blockCount) {
        throw new Error('В схеме не найдено ни одного блока');
    }

    const baseName = fileName.replace(/\.(schem|schematic|litematic|nbt)$/i, '');
    return {
        name: baseName || 'Схема',
        fileName,
        ...parsed,
        warnings: parsed.warnings || []
    };
}

export function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
}

export { MAX_PREVIEW_BLOCKS };
