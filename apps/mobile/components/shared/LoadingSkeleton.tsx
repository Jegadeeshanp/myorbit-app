import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

function SkeletonBox({ w, h, rounded = 'rounded-lg' }: { w: string; h: string; rounded?: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity, width: w, height: h }}
      className={`bg-gray-200 ${rounded}`}
    />
  );
}

export default function LoadingSkeleton() {
  return (
    <View className="px-4 pt-4">
      {[1, 2, 3, 4, 5].map(i => (
        <View
          key={i}
          className="rounded-2xl bg-white border border-gray-100 p-4 mb-2"
        >
          <View className="flex-row items-center gap-3">
            <SkeletonBox w="36" h="36" rounded="rounded-xl" />
            <View className="flex-1 gap-2">
              <SkeletonBox w="75%" h="12" />
              <SkeletonBox w="50%" h="10" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
