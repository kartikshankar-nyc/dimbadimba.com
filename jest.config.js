module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/test/mocks/fileMock.js',
    '\\.(css|less)$': '<rootDir>/test/mocks/styleMock.js'
  },
  testPathIgnorePatterns: ['/node_modules/', '/playwright/'],
  collectCoverage: true,
  collectCoverageFrom: ['script.js'],
  coverageDirectory: 'coverage',
  verbose: true
}; 