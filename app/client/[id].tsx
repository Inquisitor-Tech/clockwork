import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  FlatList, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients, consultations, updateClient, deleteClient } = useApp();
  const router = useRouter();

  const client = clients.find(c => c.id === id);
  const clientConsultations = consultations.filter(c => c.clientId === id);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(client?.fullName ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [hourlyRate, setHourlyRate] = useState(String(client?.hourlyRate ?? ''));
  const [notes, setNotes] = useState(client?.notes ?? '');

  if (!client) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Client not found.</Text>
      </View>
    );
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Client name is required.');
      return;
    }
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 0) {
      Alert.alert('Invalid rate', 'Please enter a valid hourly rate.');
      return;
    }
    await updateClient(id, {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      hourlyRate: rate,
      notes: notes.trim(),
    });
    setEditing(false);
  }

  function handleDelete() {
    Alert.alert('Delete client', `Delete "${client.fullName}"? Their consultation records will remain in history.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteClient(id);
          router.back();
        }
      },
    ]);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatDuration(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{client.fullName[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.clientName}>{client.fullName}</Text>
        {client.email ? <Text style={styles.meta}>{client.email}</Text> : null}
        {client.phone ? <Text style={styles.meta}>{client.phone}</Text> : null}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Text style={styles.statValue}>£{(client.totalOwed || 0).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total owed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.statValue, { color: '#15803D' }]}>£{client.hourlyRate.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Hourly rate</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
          <Text style={[styles.statValue, { color: '#5B21B6' }]}>{clientConsultations.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>

      {client.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{client.notes}</Text>
        </View>
      ) : null}

      {/* Recent consultations */}
      <Text style={styles.sectionTitle}>Recent consultations</Text>
      {clientConsultations.length === 0 ? (
        <Text style={styles.noConsultations}>No consultations recorded yet.</Text>
      ) : (
        clientConsultations.slice(0, 5).map(con => (
          <TouchableOpacity
            key={con.id}
            style={styles.conCard}
            onPress={() => router.push(`/consultation/${con.id}`)}
          >
            <View>
              <Text style={styles.conDate}>{formatDate(con.startDatetime)}</Text>
              <Text style={styles.conDuration}>{formatDuration(con.durationMinutes)}</Text>
            </View>
            <Text style={styles.conCharge}>£{con.totalCharge.toFixed(2)}</Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
        <Text style={styles.editBtnText}>✏️  Edit client</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>🗑  Delete client</Text>
      </TouchableOpacity>

      {/* Edit modal */}
      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit client</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Full name *</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.label}>Hourly rate (£)</Text>
            <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="decimal-pad" />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes} onChangeText={setNotes}
              multiline numberOfLines={3}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 40 },
  missing: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  missingText: { color: '#6B7280', fontSize: 16 },
  profileCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 24,
    alignItems: 'center', marginBottom: 12,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#1D4ED8' },
  clientName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1D4ED8' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  notesCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 },
  notesText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  noConsultations: { fontSize: 14, color: '#9CA3AF', marginBottom: 16 },
  conCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  conDate: { fontSize: 14, fontWeight: '500', color: '#111827' },
  conDuration: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  conCharge: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  editBtn: {
    backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, marginBottom: 10,
  },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalCancel: { fontSize: 16, color: '#6B7280' },
  modalSave: { fontSize: 16, color: '#1D4ED8', fontWeight: '700' },
  modalBody: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15, color: '#111827', marginBottom: 16,
  },
  multiline: { textAlignVertical: 'top', minHeight: 80 },
});
