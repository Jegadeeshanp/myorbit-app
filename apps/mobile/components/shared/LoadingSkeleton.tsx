import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

function SkeletonBar({ width, height = 14, marginBottom = 0 }: { width: string | number; height?: number; marginBottom?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: '#E5E7EB',
        marginBottom,
        opacity,
      }}
    />
  );
}

function SkeletonRow() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 }}>
      <SkeletonBar width={20} height={20} />
      <View style={{ flex: 1, gap: 7 }}>
        <SkeletonBar width="68%" height={14} />
        <SkeletonBar width="38%" height={11} />
      </View>
    </View>
  );
}

export default function LoadingSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 24, backgroundColor: '#F9FAFB' }}>
      {/* Page title */}
      <SkeletonBar width="42%" height={26} marginBottom={6} />
      <SkeletonBar width="22%" height={13} marginBottom={28} />

      {/* Section header */}
      <SkeletonBar width="28%" height={16} marginBottom={14} />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />

      {/* Section header 2 */}
      <SkeletonBar width="22%" height={16} marginBottom={14} />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  );
}
