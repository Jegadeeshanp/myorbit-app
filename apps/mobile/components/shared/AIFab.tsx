import { useState, useRef, useEffect } from 'react';
import { Animated, PanResponder, Dimensions, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import AICommandModal from './AICommandModal';

const FAB_SIZE = 52;
const MARGIN = 20;
const DRAG_THRESHOLD = 8;
const POS_KEY = 'ai_fab_pos';

export default function AIFab() {
  const queryClient = useQueryClient();
  const [showAI, setShowAI] = useState(false);

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const defaultPos = { x: screenW - FAB_SIZE - MARGIN, y: screenH - FAB_SIZE - 90 };

  const [basePos, setBasePos] = useState(defaultPos);
  // Always-current ref so the PanResponder closure doesn't go stale
  const basePosRef = useRef(basePos);
  basePosRef.current = basePos;

  const pan = useRef(new Animated.ValueXY()).current;
  const dragDetected = useRef(false);

  useEffect(() => {
    SecureStore.getItemAsync(POS_KEY)
      .then(v => {
        if (!v) return;
        const pos = JSON.parse(v) as { x: number; y: number };
        const clampedX = Math.max(MARGIN, Math.min(pos.x, screenW - FAB_SIZE - MARGIN));
        const clampedY = Math.max(60, Math.min(pos.y, screenH - FAB_SIZE - 90));
        setBasePos({ x: clampedX, y: clampedY });
      })
      .catch(() => {});
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragDetected.current = false;
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > DRAG_THRESHOLD || Math.abs(gs.dy) > DRAG_THRESHOLD) {
          dragDetected.current = true;
        }
        pan.setValue({ x: gs.dx, y: gs.dy });
      },
      onPanResponderRelease: (_, gs) => {
        const bp = basePosRef.current;
        const newX = Math.max(MARGIN, Math.min(bp.x + gs.dx, screenW - FAB_SIZE - MARGIN));
        const newY = Math.max(60, Math.min(bp.y + gs.dy, screenH - FAB_SIZE - 90));
        const newPos = { x: newX, y: newY };

        pan.setValue({ x: 0, y: 0 });
        setBasePos(newPos);
        SecureStore.setItemAsync(POS_KEY, JSON.stringify(newPos)).catch(() => {});

        if (!dragDetected.current) {
          setShowAI(true);
        }
        dragDetected.current = false;
      },
    })
  ).current;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['today'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['finance'] });
    queryClient.invalidateQueries({ queryKey: ['habits'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  };

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.fab,
          { left: basePos.x, top: basePos.y },
          { transform: pan.getTranslateTransform() },
        ]}
      >
        <Sparkles size={22} color="#fff" />
      </Animated.View>

      <AICommandModal
        visible={showAI}
        onClose={() => setShowAI(false)}
        onSuccess={invalidateAll}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position:        'absolute',
    width:           FAB_SIZE,
    height:          FAB_SIZE,
    borderRadius:    FAB_SIZE / 2,
    backgroundColor: '#10B981',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#10B981',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    elevation:       8,
    zIndex:          999,
  },
});
