/**
 * Web stub: Metro aliases `react-native-maps` here so SSR / web bundles never
 * touch native-only codegen (MapMarkerNativeComponent).
 */
import React from 'react';
import { View } from 'react-native';

const MapView = React.forwardRef(function MapViewStub({ style, children }, _ref) {
  return (
    <View style={style} collapsable={false}>
      {children}
    </View>
  );
});

export default MapView;

export const Marker = () => null;
export const Polyline = () => null;
