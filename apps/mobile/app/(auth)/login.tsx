import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { Eye, EyeOff } from 'lucide-react-native';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';
import { API_BASE_URL } from '@myorbit/config';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const passwordRef             = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/');
    } catch (e: any) {
      setError(
        e.message === 'Invalid credentials'
          ? 'Wrong email or password'
          : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    const baseUrl = API_BASE_URL || 'http://localhost:3000';
    Linking.openURL(`${baseUrl}/forgot-password`);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0d1117' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card */}
        <View style={{
          backgroundColor: '#1c2128',
          borderRadius: 24,
          padding: 28,
          borderWidth: 1,
          borderColor: '#30363d',
        }}>
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
              <Svg width={60} height={60} viewBox="0 0 40 40">
                <Rect x="0" y="0" width="40" height="40" rx="10" ry="10" fill="#16A34A" />
                <Circle cx="20" cy="20" r="13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
                <Circle cx="20" cy="7" r="2.5" fill="white" />
                <Circle cx="33" cy="20" r="2.5" fill="white" />
                <Circle cx="20" cy="33" r="2.5" fill="white" />
                <Circle cx="7" cy="20" r="2.5" fill="white" />
                <SvgText x="20" y="26" textAnchor="middle" fontFamily="System" fontWeight="800" fontSize="16" fill="white">M</SvgText>
              </Svg>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#e6edf3', marginTop: 16 }}>
              Sign in to MyOrbit
            </Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
              Access your dashboard and track your finances.
            </Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={{ backgroundColor: '#2D1515', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#7F1D1D' }}>
              <Text style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#adbac7', marginBottom: 8 }}>Email</Text>
          <TextInput
            style={{
              backgroundColor: '#21262d',
              borderWidth: 1,
              borderColor: '#30363d',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              color: '#e6edf3',
              marginBottom: 16,
            }}
            placeholder="you@example.com"
            placeholderTextColor="#4B5563"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            importantForAutofill="yes"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />

          {/* Password */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#adbac7' }}>Password</Text>
            <TouchableOpacity onPress={openForgotPassword}>
              <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '500' }}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={{
            backgroundColor: '#21262d',
            borderWidth: 1,
            borderColor: '#30363d',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 28,
          }}>
            <TextInput
              ref={passwordRef}
              style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: '#e6edf3' }}
              placeholder="••••••••"
              placeholderTextColor="#4B5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={{ padding: 4 }}>
              {showPw
                ? <EyeOff size={18} color="#6B7280" />
                : <Eye size={18} color="#6B7280" />
              }
            </TouchableOpacity>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: '#059669',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1,
            }}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={{ fontSize: 16, fontWeight: '700', color: '#e6edf3' }}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={{ alignItems: 'center', marginTop: 24, paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
            Don't have an account?{' '}
            <Text style={{ color: '#10B981', fontWeight: '600' }}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
