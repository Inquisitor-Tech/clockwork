import { AppProvider, useApp } from '@/context/AppContext';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

function AuthGuard() {
  const { currentUser } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!currentUser && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (currentUser && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [currentUser, segments, mounted]);

  return null;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthGuard />
      <StatusBar style="auto" />
      <Slot />
    </AppProvider>
  );
}