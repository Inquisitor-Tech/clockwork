import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function HomeScreen() {
  const { currentUser, clients, consultations, signOut, updateDefaultRate } = useApp();
  const router = useRouter();

  const totalOwed = clients.reduce((sum, c) => sum + (c.totalOwed || 0), 0);
  const thisMonth = consultations.filter(c => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyRevenue = thisMonth.reduce((sum, c) => sum + c.totalCharge, 0);

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.email}>{currentUser?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Text style={styles.statValue}>£{totalOwed.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total outstanding</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.statValue, { color: '#15803D' }]}>£{monthlyRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>This month</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statValue, { color: '#92400E' }]}>{clients.length}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
          <Text style={[styles.statValue, { color: '#5B21B6' }]}>{consultations.length}</Text>
          <Text style={styles.statLabel}>Consultations</Text>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/timer')}>
        <Text style={styles.actionIcon}>⏱</Text>
        <View>
          <Text style={styles.actionTitle}>Start a consultation</Text>
          <Text style={styles.actionSub}>Select a client and start the timer</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/clients')}>
        <Text style={styles.actionIcon}>➕</Text>
        <View>
          <Text style={styles.actionTitle}>Add a client</Text>
          <Text style={styles.actionSub}>Create a new client profile</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/history')}>
        <Text style={styles.actionIcon}>📋</Text>
        <View>
          <Text style={styles.actionTitle}>View history</Text>
          <Text style={styles.actionSub}>Browse past consultations</Text>
        </View>
      </TouchableOpacity>

      {/* Default rate */}
      <View style={styles.rateCard}>
        <Text style={styles.rateLabel}>Default hourly rate</Text>
        <Text style={styles.rateValue}>£{(currentUser?.defaultRate ?? 0).toFixed(2)} / hr</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  signOutBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  signOutText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 16,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1D4ED8' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12, marginBottom: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  actionIcon: { fontSize: 24 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  actionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rateCard: {
    marginTop: 16, backgroundColor: '#EFF6FF', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  rateLabel: { fontSize: 14, color: '#1E40AF', fontWeight: '500' },
  rateValue: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
});
