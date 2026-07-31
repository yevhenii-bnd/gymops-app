/** @type {import('jest').Config} */
module.exports = {
  displayName: "integration",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/integration/**/*.spec.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.base.json",
        diagnostics: { ignoreCodes: [151002] }
      }
    ]
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@gymops/contracts$": "<rootDir>/packages/contracts/src/index.ts",
    "^@gymops/test-data$": "<rootDir>/packages/test-data/src/index.ts"
  }
};
