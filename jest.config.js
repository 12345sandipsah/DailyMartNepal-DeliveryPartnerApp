module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@rnmapbox/maps$': '<rootDir>/__mocks__/rnmapbox-maps.js',
  },
};
