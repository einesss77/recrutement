import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".agents/**", ".codex/**", ".playwright-cli/**", "tmp/**", "output/**"] },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
