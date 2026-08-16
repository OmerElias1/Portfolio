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
          color: new THREE.Color("#784e35"),
          roughness: 0.6,
          metalness: 0.05,
        });

        const blackTopMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#111111"),
          roughness: 0.5,
          metalness: 0.1,
        });

        const whiteBottomMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#ffffff"),
          roughness: 0.4,
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
                  mesh.material = blackTopMaterial;
                } else if (isBottom) {
                  mesh.material = whiteBottomMaterial;
                } else if (mesh.material && !Array.isArray(mesh.material)) {
                  (mesh.material as THREE.ShaderMaterial).precision = 'mediump';
                }
              }
            });
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
