import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/today');
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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F7F7F5]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-gray-900">MyOrbit</Text>
          <Text className="mt-1 text-sm text-gray-500">Your life, in orbit</Text>
        </View>

        <View className="w-full rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <Text className="mb-5 text-lg font-semibold text-gray-900">Sign in</Text>

          {error ? (
            <View className="mb-4 rounded-xl bg-rose-50 px-4 py-3">
              <Text className="text-sm text-rose-600">{error}</Text>
            </View>
          ) : null}

          <Text className="mb-1 text-xs font-medium text-gray-500">Email</Text>
          <TextInput
            className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text className="mb-1 text-xs font-medium text-gray-500">Password</Text>
          <TextInput
            className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="items-center rounded-xl bg-emerald-600 py-3.5"
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text className="text-sm font-semibold text-white">Sign in</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          className="mt-4 py-2"
        >
          <Text className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Text className="font-semibold text-emerald-600">Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
