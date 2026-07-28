import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  { ignores: ["dist/**", ".expo/**", "node_modules/**"] },
  expoConfig,
  {
    files: ["src/cad/native-cad-3d.tsx"],
    rules: {
      "react/no-unknown-property": ["error", {
        ignore: [
          "args",
          "attach",
          "castShadow",
          "emissive",
          "emissiveIntensity",
          "intensity",
          "metalness",
          "position",
          "receiveShadow",
          "rotation",
          "roughness",
          "side",
          "transparent",
        ],
      }],
    },
  },
]);
