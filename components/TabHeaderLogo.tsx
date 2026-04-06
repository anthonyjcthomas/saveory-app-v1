import { View, Image, StyleSheet } from 'react-native';

/** Centered Saveory logo only (tab name lives in the tab bar). */
export function TabHeaderLogo() {
  return (
    <View style={styles.wrap}>
      <Image
        source={require('../assets/images/Savor-Logo.webp')}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
