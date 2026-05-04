import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp, Consultation } from '@/context/AppContext';

export default function HistoryScreen() {
  const { consultations, clients, deleteConsultation } = useApp();
  const router = useRouter();

  const [filterClient, setFilterClient] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filtered = useMemo(() => {
    return consultations.filter(c => {
      const matchClient = filterClient
        ? c.clientName.toLowerCase().includes(filterClient.toLowerCase())
        : true;
      const matchDate = filterDate
        ? c.startDatetime.startsWith(filterDate)
        : true;
      return matchClient && matchDate;
    });
  }, [consultations, filterClient, filterDate]);

  function clearFilters() {
    setFilterClient('');
    setFilterDate('');
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete consultation', 'Remove this consultation record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteConsultation(id) },
    ]);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  function formatDuration(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  const hasFilters = filterClient || filterDate;

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TextInput
          style={styles.filterInput}
          value={filterClient}
          onChangeText={setFilterClient}
          placeholder="Filter by client…"
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={[styles.filterInput, { flex: 0.8 }]}
          value={filterDate}
          onChangeText={setFilterDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
          keyboardType="numbers-and-punctuation"
        />
        {hasFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>
            {consultations.length === 0 ? 'No consultations yet' : 'No results'}
          </Text>
          <Text style={styles.emptyText}>
            {consultations.length === 0
              ? 'Start a timer to record your first consultation.'
              : 'Try adjusting your filters.'}
          </Text>
          {hasFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/consultation/${item.id}`)}
              onLongPress={() => confirmDelete(item.id)}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.clientName[0].toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.clientName}>{item.clientName}</Text>
                  <Text style={styles.date}>{formatDate(item.startDatetime)}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.charge}>£{item.totalCharge.toFixed(2)}</Text>
                  <Text style={styles.duration}>{formatDuration(item.durationMinutes)}</Text>
                </View>
              </View>
              {item.notes ? (
                <Text style={styles.notes} numberOfLines={1}>📝 {item.notes}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      {filtered.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} • Total: £{filtered.reduce((s, c) => s + c.totalCharge, 0).toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  filterBar: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 8, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB',
  },
  clearBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
  },
  clearText: { fontSize: 14, color: '#6B7280' },
  list: { padding: 12, paddingBottom: 80 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  clearAllBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#EFF6FF', borderRadius: 10 },
  clearAllText: { color: '#1D4ED8', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  cardInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  date: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  charge: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  duration: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  notes: { fontSize: 12, color: '#6B7280', marginTop: 8, marginLeft: 50 },
  summary: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 14,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', alignItems: 'center',
  },
  summaryText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
});
