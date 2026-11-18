/**
 * 3D-предпросмотр схемы на Three.js (инстансинг блоков).
 * Без внешних контроллеров — собственный orbit-контроль.
 */

import * as THREE from '../vendor/three.module.js';
import { colorFor } from './blocks.js';

export function createPreview(canvas) {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
    } catch (e) {
        return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50000);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 1.15);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.35);
    sun.position.set(1, 2, 1.4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x99aaff, 0.55);
    fill.position.set(-1.4, 0.6, -1);
    scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);

    let mesh = null;
    let bboxLines = null;

    let model = null;
    let layerMax = -1;
    let theta = Math.PI * 0.28;
    let phi = Math.PI * 0.32;
    let distance = 100;
    let target = new THREE.Vector3(0, 0, 0);
    let size = new THREE.Vector3(1, 1, 1);
    let frame = 0;
    let disposed = false;
    let autoRotate = false;
    let onStats = null;

    function resize() {
        const parent = canvas.parentElement;
        if (!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
    }

    function applyCamera() {
        phi = Math.max(0.08, Math.min(Math.PI - 0.08, phi));
        const sin = Math.sin(phi);
        camera.position.set(
            target.x + distance * sin * Math.sin(theta),
            target.y + distance * Math.cos(phi),
            target.z + distance * sin * Math.cos(theta)
        );
        camera.lookAt(target);
    }

    function render() {
        if (disposed) return;
        applyCamera();
        renderer.render(scene, camera);
    }

    function loop() {
        if (disposed || !autoRotate) {
            frame = 0;
            return;
        }
        frame = requestAnimationFrame(loop);
        theta += 0.0035;
        render();
    }

    function disposeMesh() {
        if (mesh) {
            group.remove(mesh);
            mesh.geometry.dispose?.();
            mesh.material.dispose?.();
            mesh.dispose();
            mesh = null;
        }
        if (bboxLines) {
            group.remove(bboxLines);
            bboxLines.geometry.dispose();
            bboxLines.material.dispose();
            bboxLines = null;
        }
    }

    function buildMesh() {
        if (!model || !model.data.length) return;
        const data = model.data;
        const count = layerMax >= 0
            ? countLayer(data, layerMax)
            : data.length / 4;

        if (!count) {
            disposeMesh();
            render();
            return;
        }

        const geometry = new THREE.BoxGeometry(0.97, 0.97, 0.97);
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const inst = new THREE.InstancedMesh(geometry, material, count);
        inst.instanceMatrix.setUsage(THREE.StaticDrawUsage);

        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
        const colorCache = new Map();
        let i = 0;

        for (let p = 0; p < data.length; p += 4) {
            const y = data[p + 1];
            if (layerMax >= 0 && y > layerMax) continue;

            const x = data[p] + 0.5 - half.x;
            const z = data[p + 2] + 0.5 - half.z;
            const py = y + 0.5 - half.y;
            matrix.makeTranslation(x, py, z);
            inst.setMatrixAt(i, matrix);

            const paletteIndex = data[p + 3];
            let hex = colorCache.get(paletteIndex);
            if (hex === undefined) {
                hex = colorFor(model.palette[paletteIndex]);
                colorCache.set(paletteIndex, hex);
            }
            color.setHex(hex, THREE.SRGBColorSpace);
            inst.setColorAt(i, color);
            i++;
        }

        inst.instanceMatrix.needsUpdate = true;
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        inst.computeBoundingSphere();

        disposeMesh();
        mesh = inst;
        group.add(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        const bboxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
        const bboxEdges = new THREE.EdgesGeometry(bboxGeo);
        bboxGeo.dispose();
        bboxLines = new THREE.LineSegments(
            bboxEdges,
            new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.35 })
        );
        bboxLines.position.copy(box.getCenter(new THREE.Vector3()));
        group.add(bboxLines);

        if (onStats) onStats({ visible: i, total: data.length / 4 });
        render();
    }

    function countLayer(data, maxY) {
        let n = 0;
        for (let p = 0; p < data.length; p += 4) {
            if (data[p + 1] <= maxY) n++;
        }
        return n;
    }

    function setModel(voxels, statsCb) {
        onStats = statsCb || null;
        model = voxels && voxels.data && voxels.data.length ? voxels : null;
        layerMax = -1;
        disposeMesh();

        if (!model) {
            size.set(1, 1, 1);
            target.set(0, 0, 0);
            distance = 4;
            render();
            return;
        }

        size.set(model.size.x || 1, model.size.y || 1, model.size.z || 1);
        target.set(0, 0, 0);
        distance = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z) * 1.15 + 3;
        theta = Math.PI * 0.28;
        phi = Math.PI * 0.32;
        buildMesh();
    }

    function setLayer(maxY) {
        layerMax = maxY;
        buildMesh();
    }

    function resetView() {
        theta = Math.PI * 0.28;
        phi = Math.PI * 0.32;
        distance = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z) * 1.15 + 3;
        render();
    }

    function setAutoRotate(v) {
        autoRotate = !!v;
        if (autoRotate && !frame) loop();
        if (!autoRotate && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
        render();
    }

    /* ---------- Управление мышью / тачем ---------- */
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let pinchDist = 0;

    canvas.addEventListener('pointerdown', (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        theta -= dx * 0.006;
        phi -= dy * 0.006;
        render();
    });

    const endDrag = () => {
        dragging = false;
        canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const k = Math.exp(e.deltaY * 0.0012);
        distance = Math.max(2, Math.min(20000, distance * k));
        render();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const d = Math.hypot(dx, dy);
            if (pinchDist) {
                distance = Math.max(2, Math.min(20000, distance * (pinchDist / d)));
                render();
            }
            pinchDist = d;
        }
    }, { passive: false });
    canvas.addEventListener('touchend', () => { pinchDist = 0; });

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    return {
        setModel,
        setLayer,
        resetView,
        setAutoRotate,
        render,
        getStats: () => ({ visible: mesh ? mesh.count : 0, total: model ? model.data.length / 4 : 0 }),
        screenshot() {
            renderer.render(scene, camera);
            return canvas.toDataURL('image/png');
        },
        resize,
        dispose() {
            disposed = true;
            cancelAnimationFrame(frame);
            ro.disconnect();
            disposeMesh();
            renderer.dispose();
        }
    };
}

export function previewSupported() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
        return false;
    }
}
