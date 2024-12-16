import { type ViteUserConfig } from 'vitest/config';
import reactPlugin from '@vitejs/plugin-react-swc';

export default {
  plugins: [reactPlugin()],
  test: {
    include: [`${import.meta.dirname}/**/*.spec.{js,jsx,ts,tsx}`],
    setupFiles: [`${import.meta.dirname}/testSetup.ts`],
    environment: 'jsdom',
    globals: false,
    isolate: false,
    fileParallelism: false,
    reporters: ['verbose'],
    pool: 'threads',
    poolOptions: {
      threads: { singleThread: undefined },
      forks: { singleFork: undefined },
      vmThreads: { singleThread: undefined },
      vmForks: { singleFork: undefined },
    },
  },
} as const satisfies ViteUserConfig;
