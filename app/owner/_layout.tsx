import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SCREEN_BACKGROUND, BRAND_GREEN } from '@/constants/theme';

/** First screen in this stack often has no system back control. */
function OwnerPortalHeaderBack() {
    const router = useRouter();
    return (
        <TouchableOpacity
            onPress={() => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/(tabs)');
                }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ marginLeft: Platform.OS === 'ios' ? 4 : 0 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
        >
            <Ionicons name="chevron-back" size={28} color={BRAND_GREEN} />
        </TouchableOpacity>
    );
}

function OwnerPortalHeaderHome() {
    const router = useRouter();
    return (
        <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ marginRight: Platform.OS === 'ios' ? 8 : 12 }}
            accessibilityRole="button"
            accessibilityLabel="Home"
        >
            <Ionicons name="home-outline" size={26} color={BRAND_GREEN} />
        </TouchableOpacity>
    );
}

export default function OwnerLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: SCREEN_BACKGROUND },
                headerTintColor: BRAND_GREEN,
                headerShadowVisible: false,
                headerBackTitle: '',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Business portal',
                    headerLeft: () => <OwnerPortalHeaderBack />,
                    headerRight: () => <OwnerPortalHeaderHome />,
                }}
            />
            <Stack.Screen name="edit" options={{ title: 'Edit listing' }} />
        </Stack>
    );
}
