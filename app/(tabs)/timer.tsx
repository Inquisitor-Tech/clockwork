import { Client, useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type TimerState = 'idle' | 'running' | 'paused' | 'stopped';

export default function TimerScreen() {
  const { clients, currentUser, addConsultation } = useApp();
  const router = useRouter();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startDatetime, setStartDatetime] = useState<string | null>(null);
  const [endDatetime, setEndDatetime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function startTimer() {
    if (!selectedClient) {
      Alert.alert('No client selected', 'Please select a client before starting.');
      return;
    }
    const now = new Date();
    setStartDatetime(now.toISOString());
    startTimeRef.current = Date.now();
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedMs(accumulatedRef.current + (Date.now() - startTimeRef.current));
    }, 500);
  }

  function pauseTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    accumulatedRef.current = elapsedMs;
    setTimerState('paused');
  }

  function resumeTimer() {
    startTimeRef.current = Date.now();
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedMs(accumulatedRef.current + (Date.now() - startTimeRef.current));
    }, 500);
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    accumulatedRef.current = elapsedMs;
    setEndDatetime(new Date().toISOString());
    setTimerState('stopped');
  }

  function resetTimer() {
    Alert.alert('Reset timer', 'This will discard the current consultation. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimerState('idle');
          setElapsedMs(0);
          accumulatedRef.current = 0;
          setStartDatetime(null);
          setEndDatetime(null);
          setNotes('');
        }
      },
    ]);
  }

  async function saveConsultation() {
    if (!selectedClient || !startDatetime || !endDatetime) return;
    const durationMinutes = Math.ceil(elapsedMs / 60000);
    const rate = selectedClient.hourlyRate ?? currentUser?.defaultRate ?? 0;
    const totalCharge = parseFloat(((durationMinutes / 60) * rate).toFixed(2));

    Alert.alert(
      'Save consultation',
      `Duration: ${formatTime(elapsedMs)}\nCharge: £${totalCharge.toFixed(2)}\n\nSave this consultation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save', onPress: async () => {
            setSaving(true);
            await addConsultation({
              clientId: selectedClient.id,
              clientName: selectedClient.fullName,
              startDatetime,
              endDatetime,
              durationMinutes,
              totalCharge,
              notes,
            });
            setSaving(false);
            Alert.alert('Saved!', 'Consultation has been saved.', [
              { text: 'OK', onPress: () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setTimerState('idle');
                setElapsedMs(0);
                accumulatedRef.current = 0;
                setStartDatetime(null);
                setEndDatetime(null);
                setNotes('');
                setSelectedClient(null);
              }},
            ]);
          }
        },
      ]
    );
  }

  function formatTime(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const durationMinutes = Math.ceil(elapsedMs / 60000);
  const rate = selectedClient?.hourlyRate ?? currentUser?.defaultRate ?? 0;
  const estimatedCharge = parseFloat(((durationMinutes / 60) * rate).toFixed(2));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Client selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <TouchableOpacity
          style={styles.clientPicker}
          onPress={() => timerState === 'idle' && setShowClientPicker(true)}
          disabled={timerState !== 'idle'}
        >
          <Text style={selectedClient ? styles.clientName : styles.clientPlaceholder}>
            {selectedClient ? selectedClient.fullName : 'Tap to select a client'}
          </Text>
          {timerState === 'idle' && <Text style={styles.pickerArrow}>›</Text>}
        </TouchableOpacity>
        {selectedClient && (
          <Text style={styles.rateInfo}>
            Rate: £{(selectedClient.hourlyRate ?? currentUser?.defaultRate ?? 0).toFixed(2)} / hr
          </Text>
        )}
      </View>

      {/* Timer display */}
      <View style={styles.timerCard}>
        <Text style={styles.timerDisplay}>{formatTime(elapsedMs)}</Text>
        {timerState === 'running' && <View style={styles.liveDot} />}
        {timerState !== 'idle' && timerState !== 'stopped' && (
          <Text style={styles.chargeEstimate}>≈ £{estimatedCharge.toFixed(2)}</Text>
        )}
      </View>

      {/* Start time info */}
      {startDatetime && (
        <Text style={styles.timeInfo}>
          Started: {new Date(startDatetime).toLocaleTimeString()}
          {endDatetime ? `  •  Ended: ${new Date(endDatetime).toLocaleTimeString()}` : ''}
        </Text>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {timerState === 'idle' && (
          <TouchableOpacity style={[styles.btn, styles.btnStart]} onPress={startTimer}>
            <Text style={styles.btnText}>▶  Start consultation</Text>
          </TouchableOpacity>
        )}

        {timerState === 'running' && (
          <>
            <TouchableOpacity style={[styles.btn, styles.btnPause]} onPress={pauseTimer}>
              <Text style={styles.btnText}>⏸  Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnStop]} onPress={stopTimer}>
              <Text style={styles.btnText}>⏹  End consultation</Text>
            </TouchableOpacity>
          </>
        )}

        {timerState === 'paused' && (
          <>
            <TouchableOpacity style={[styles.btn, styles.btnStart]} onPress={resumeTimer}>
              <Text style={styles.btnText}>▶  Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnStop]} onPress={stopTimer}>
              <Text style={styles.btnText}>⏹  End consultation</Text>
            </TouchableOpacity>
          </>
        )}

        {timerState === 'stopped' && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Consultation summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{formatTime(elapsedMs)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate</Text>
                <Text style={styles.summaryValue}>£{rate.toFixed(2)} / hr</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Total charge</Text>
                <Text style={[styles.summaryValue, styles.totalAmount]}>£{estimatedCharge.toFixed(2)}</Text>
              </View>
            </View>

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this consultation..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={saveConsultation} disabled={saving}>
              <Text style={styles.btnText}>💾  Save consultation</Text>
            </TouchableOpacity>
          </>
        )}

        {(timerState === 'running' || timerState === 'paused' || timerState === 'stopped') && (
          <TouchableOpacity style={[styles.btn, styles.btnReset]} onPress={resetTimer}>
            <Text style={[styles.btnText, { color: '#EF4444' }]}>✕  Discard</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Client picker modal */}
      <Modal visible={showClientPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select client</Text>
            <TouchableOpacity onPress={() => setShowClientPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          {clients.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No clients yet. Add one in the Clients tab first.</Text>
            </View>
          ) : (
            <FlatList
              data={clients}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.clientRow}
                  onPress={() => { setSelectedClient(item); setShowClientPicker(false); }}
                >
                  <View>
                    <Text style={styles.clientRowName}>{item.fullName}</Text>
                    <Text style={styles.clientRowRate}>£{item.hourlyRate.toFixed(2)} / hr</Text>
                  </View>
                  {selectedClient?.id === item.id && <Text style={{ color: '#1D4ED8', fontSize: 20 }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  clientPicker: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  clientName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  clientPlaceholder: { fontSize: 15, color: '#9CA3AF' },
  pickerArrow: { fontSize: 22, color: '#9CA3AF' },
  rateInfo: { fontSize: 12, color: '#6B7280', marginTop: 6, marginLeft: 4 },
  timerCard: {
    backgroundColor: '#1D4ED8', borderRadius: 20, padding: 32,
    alignItems: 'center', marginBottom: 8,
  },
  timerDisplay: { fontSize: 56, fontWeight: '700', color: '#fff', fontVariant: ['tabular-nums'] },
  liveDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80',
    position: 'absolute', top: 16, right: 16,
  },
  chargeEstimate: { fontSize: 18, color: '#BFDBFE', marginTop: 8 },
  timeInfo: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  controls: { gap: 10 },
  btn: {
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  btnStart: { backgroundColor: '#16A34A' },
  btnPause: { backgroundColor: '#D97706' },
  btnStop: { backgroundColor: '#DC2626' },
  btnSave: { backgroundColor: '#1D4ED8' },
  btnReset: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 4,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 6, paddingTop: 12 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#1D4ED8' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  notesInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', fontSize: 14,
    color: '#111827', textAlignVertical: 'top', minHeight: 80, marginBottom: 4,
  },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 16, color: '#1D4ED8', fontWeight: '600' },
  clientRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  clientRowName: { fontSize: 16, fontWeight: '500', color: '#111827' },
  clientRowRate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
});
