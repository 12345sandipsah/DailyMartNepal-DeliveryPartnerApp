const EmptyNativeMapComponent = () => null;

module.exports = {
  __esModule: true,
  default: {
    setAccessToken: jest.fn(),
    StyleURL: {Street: 'mock://street'},
    MapView: EmptyNativeMapComponent,
    Camera: EmptyNativeMapComponent,
    UserLocation: EmptyNativeMapComponent,
    PointAnnotation: EmptyNativeMapComponent,
    ShapeSource: EmptyNativeMapComponent,
    LineLayer: EmptyNativeMapComponent,
  },
};
