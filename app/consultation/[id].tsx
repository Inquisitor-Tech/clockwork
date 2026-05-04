import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function ConsultationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { consultations, updateConsultation, deleteConsultation } = useApp();
  const router = useRouter();

  const consultation = consultations.find(c => c.id === id);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(consultation?.notes ?? '');
  const [totalCharge, setTotalCharge] = useState(String(consultation?.totalCharge ?? ''));

  if (!consultation) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Consultation not found.</Text>
      </View>
    );
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatDuration(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  }

  async function handleSave() {
    const charge = parseFloat(totalCharge);
    if (isNaN(charge) || charge < 0) {
      Alert.alert('Invalid amount', 'Please enter a valid charge amount.');
      return;
    }
    await updateConsultation(id, { notes, totalCharge: charge });
    setEditing(false);
    Alert.alert('Updated', 'Consultation record has been updated.');
  }

  function handleDelete() {
    Alert.alert('Delete consultation', 'This will permanently remove this record and adjust the client balance.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteConsultation(id);
          router.back();
        }
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Client */}
      <View style={styles.clientCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{consultation.clientName[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.clientName}>{consultation.clientName}</Text>
          <Text style={styles.dateText}>{formatDate(consultation.startDatetime)}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailCard}>
        <Row label="Start time" value={formatDate(consultation.startDatetime)} />
        <Row label="End time" value={formatDate(consultation.endDatetime)} />
        <Row label="Duration" value={formatDuration(consultation.durationMinutes)} />
        <View style={styles.divider} />
        <Row label="Total charge" value={`£${consultation.totalCharge.toFixed(2)}`} highlight />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.notesCard}>
          <Text style={styles.notesText}>
            {consultation.notes || <Text style={{ color: '#9CA3AF' }}>No notes added.</Text>}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
        <Text style={styles.editBtnText}>✏️  Edit record</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>🗑  Delete consultation</Text>
      </TouchableOpacity>

      {/* Edit modal */}
      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit consultation</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Final charge (£)</Text>
            <TextInput
              style={styles.input}
              value={totalCharge}
              onChangeText={setTotalCharge}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>You can adjust the final billed amount here.</Text>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add or edit notes…"
              placeholderTextColor="#9CA3AF"
              multiline numberOfLines={4}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 40 },
  missing: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  missingText: { color: '#6B7280', fontSize: 16 },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#1D4ED8' },
  clientName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  dateText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  detailCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  rowHighlight: { fontSize: 18, fontWeight: '700', color: '#1D4ED8' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  notesCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  notesText: { fontSize: 15, color: '#111827', lineHeight: 22 },
  editBtn: {
    backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 10,
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
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: -10, marginBottom: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15, color: '#111827', marginBottom: 16,
  },
  multiline: { textAlignVertical: 'top', minHeight: 100 },
});
