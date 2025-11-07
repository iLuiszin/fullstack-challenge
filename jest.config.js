module.exports = {
  projects: [
    '<rootDir>/apps/auth-service',
    '<rootDir>/apps/tasks-service',
    '<rootDir>/apps/notifications-service',
  ],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'apps/*/src/**/*.ts',
    '!apps/*/src/**/*.spec.ts',
    '!apps/*/src/main.ts',
  ],
};
