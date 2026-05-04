import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function ClientsScreen() {
  const { clients, addClient, deleteClient, currentUser } = useApp();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function openModal() {
    setFullName(''); setEmail(''); setPhone('');
    setHourlyRate(String(currentUser?.defaultRate ?? ''));
    setNotes('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Client name is required.');
      return;
    }
    const rate = parseFloat(hourlyRate);
    if (hourlyRate && isNaN(rate)) {
      Alert.alert('Invalid rate', 'Please enter a valid hourly rate.');
      return;
    }
    setSaving(true);
    await addClient({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      hourlyRate: rate || currentUser?.defaultRate || 0,
      notes: notes.trim(),
    });
    setSaving(false);
    setShowModal(false);
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert(
      'Delete client',
      `Delete "${name}"? This will not remove their existing consultation records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteClient(id) },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {clients.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>No clients yet</Text>
          <Text style={styles.emptyText}>Add your first client to start tracking consultations.</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/client/${item.id}`)}
              onLongPress={() => confirmDelete(item.id, item.fullName)}
            >
              <View style={styles.cardLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.fullName[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.clientName}>{item.fullName}</Text>
                  <Text style={styles.clientRate}>£{item.hourlyRate.toFixed(2)} / hr</Text>
                  {item.email ? <Text style={styles.clientEmail}>{item.email}</Text> : null}
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.owedLabel}>Owed</Text>
                <Text style={styles.owedAmount}>£{(item.totalOwed || 0).toFixed(2)}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add client modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New client</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={styles.modalSave}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Full name *</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Jane Smith" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="jane@example.com" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+44 7700 000000" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Hourly rate (£)</Text>
            <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="decimal-pad" placeholder={String(currentUser?.defaultRate ?? '0.00')} placeholderTextColor="#9CA3AF" />
            <Text style={styles.hint}>Leave blank to use your default rate of £{(currentUser?.defaultRate ?? 0).toFixed(2)}</Text>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes} onChangeText={setNotes}
              placeholder="Any notes about this client…"
              placeholderTextColor="#9CA3AF"
              multiline numberOfLines={3}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { padding: 16, paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#1D4ED8' },
  clientName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  clientRate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  clientEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  cardRight: { alignItems: 'flex-end' },
  owedLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  owedAmount: { fontSize: 15, fontWeight: '700', color: '#1D4ED8' },
  chevron: { fontSize: 20, color: '#D1D5DB', marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#1D4ED8',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalCancel: { fontSize: 16, color: '#6B7280' },
  modalSave: { fontSize: 16, color: '#1D4ED8', fontWeight: '700' },
  modalBody: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: -10, marginBottom: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15,
    color: '#111827', marginBottom: 16,
  },
  multiline: { textAlignVertical: 'top', minHeight: 80 },
});
