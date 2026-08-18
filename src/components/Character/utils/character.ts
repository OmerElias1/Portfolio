import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        const encryptedBlob = await decryptFile(
          "/models/character.enc",
          "Character3D#@"
        );
        const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

        const darkSkinMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#d5a382"),
          roughness: 0.6,
          metalness: 0.05,
        });

        const whiteTopMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#f5f6f8"),
          roughness: 0.7,
          metalness: 0.02,
        });

        const jeansMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#2c4a6a"),
          roughness: 0.85,
          metalness: 0.05,
        });

        let character: THREE.Object3D;
        loader.load(
          blobUrl,
          async (gltf) => {
            character = gltf.scene;
            await renderer.compileAsync(character, camera, scene);
            character.traverse((child: any) => {
              if (child.isMesh) {
                const mesh = child as THREE.Mesh;
                child.castShadow = false;
                child.receiveShadow = false;
                mesh.frustumCulled = true;
                const name = (child.name || "").toLowerCase();
                const parentName = (child.parent?.name || "").toLowerCase();

                const isSkin =
                  name.includes("hand") || parentName.includes("hand") || name.includes("mesh.002") ||
                  name.includes("neck") || parentName.includes("neck") || name.includes("plane.005") ||
                  name.includes("ear") || parentName.includes("ear") || name.includes("plane.003") ||
                  name.includes("plane.007") || name.includes("plane007") || parentName.includes("plane.007") || parentName.includes("plane007");

                const isTop = name.includes("shirt") || parentName.includes("shirt");
                const isBottom = name.includes("pant") || parentName.includes("pant");

                if (isSkin) {
                  mesh.material = darkSkinMaterial;
                } else if (isTop) {
                  mesh.material = whiteTopMaterial;
                } else if (isBottom) {
                  mesh.material = jeansMaterial;
                } else if (mesh.material && !Array.isArray(mesh.material)) {
                  (mesh.material as THREE.ShaderMaterial).precision = 'mediump';
                }
              }
            });
            const headBone =
              character.getObjectByName("spine006") ||
              character.getObjectByName("spine.006");
            if (headBone) {
              const mustacheGroup = new THREE.Group();
              mustacheGroup.name = "mustache";

              const mustacheMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color("#181818"),
                roughness: 0.65,
                metalness: 0.05,
                side: THREE.DoubleSide,
              });

              const createHalf = (isRight: boolean) => {
                const shape = new THREE.Shape();
                const sign = isRight ? 1 : -1;

                shape.moveTo(0, 0.042);
                shape.bezierCurveTo(
                  sign * 0.10, 0.062,
                  sign * 0.24, 0.048,
                  sign * 0.38, -0.035
                );
                shape.bezierCurveTo(
                  sign * 0.40, -0.065,
                  sign * 0.36, -0.095,
                  sign * 0.31, -0.085
                );
                shape.bezierCurveTo(
                  sign * 0.22, -0.055,
                  sign * 0.10, -0.015,
                  0, 0.002
                );
                shape.closePath();

                const extrudeSettings = {
                  steps: 1,
                  depth: 0.025,
                  bevelEnabled: true,
                  bevelThickness: 0.012,
                  bevelSize: 0.01,
                  bevelSegments: 3,
                };

                const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                const pos = geom.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                  const x = pos.getX(i);
                  const z = pos.getZ(i);
                  pos.setZ(i, z - Math.pow(x, 2) * 0.55);
                }
                geom.computeVertexNormals();

                return new THREE.Mesh(geom, mustacheMaterial);
              };

              mustacheGroup.add(createHalf(true));
              mustacheGroup.add(createHalf(false));
              mustacheGroup.position.set(0, 0.74, 1.23);
              mustacheGroup.rotation.x = -0.05;

              headBone.add(mustacheGroup);
            }

            resolve(gltf);
            setCharTimeline(character, camera);
            setAllTimeline();
            character!.getObjectByName("footR")!.position.y = 3.36;
            character!.getObjectByName("footL")!.position.y = 3.36;
            dracoLoader.dispose();
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
