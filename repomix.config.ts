import { defineConfig } from 'repomix';

export default defineConfig({
  output: {
    filePath: 'repomix-output.xml',
    style: 'xml',
    directoryStructure: true,
    patterns: [
      {
        pattern: 'src/assets/**',
        directoryStructureOnly: true,
      },
      {
        pattern: 'public/**',
        directoryStructureOnly: true,
      },
      {
        pattern: 'src/components/common/Map.vue',
        directoryStructureOnly: true,
      }
    ],
  },
});
