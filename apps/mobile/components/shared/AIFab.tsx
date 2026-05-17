import { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import AICommandModal from './AICommandModal';

export default function AIFab() {
  const queryClient  = useQueryClient();
  const [showAI, setShowAI] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['today'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['finance'] });
    queryClient.invalidateQueries({ queryKey: ['habits'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowAI(true)}
        style={styles.fab}
        activeOpacity={0.85}
      >
        <Sparkles size={22} color="#fff" />
      </TouchableOpacity>

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
    bottom:          24,
    right:           20,
    width:           52,
    height:          52,
    borderRadius:    26,
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
