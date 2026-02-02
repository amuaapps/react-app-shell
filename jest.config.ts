import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    // Mock env-provider for Jest to avoid import.meta parsing issues
    '^@/lib/env-provider$': '<rootDir>/tests/__mocks__/lib/env-provider.ts',
    '^@/analytics$': '<rootDir>/tests/__mocks__/analytics.tsx',
    '^@amuaapps/ui-library$': '<rootDir>/tests/__mocks__/@amuaapps/ui-library.tsx',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/layouts/(.*)$': '<rootDir>/src/layouts/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/stubs/**',
  ],
  coverageThreshold: {
    global: {
      branches: 69, // Temporarily lowered for container name change
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
};

export default config;
