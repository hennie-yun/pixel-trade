import React, { useState } from 'react';
import {
  Alert,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { PixelButton } from '../../src/components/ui/PixelButton';
import { PixelCard } from '../../src/components/ui/PixelCard';
import { PixelInput } from '../../src/components/ui/PixelInput';
import { exportAllData } from '../../src/db/backup';
import { useBrokerStore } from '../../src/store/brokerStore';
import { Broker } from '../../src/types';

function BrokerItem({ broker, onEdit, onDelete }: {
  broker: Broker;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.brokerRow}>
      <View style={styles.brokerInfo}>
        <Text style={styles.brokerName}>{broker.name}</Text>
        <Text style={styles.brokerFee}>수수료 {broker.feeRate}%</Text>
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
        <Text style={styles.actionText}>수정</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, styles.deleteBtn]}>
        <Text style={[styles.actionText, { color: Colors.danger }]}>삭제</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen() {
  const { brokers, addBroker, editBroker, removeBroker } = useBrokerStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [feeRate, setFeeRate] = useState('');
  const [nameError, setNameError] = useState('');
  const [feeError, setFeeError] = useState('');

  function openAddForm() {
    setEditingId(null);
    setName('');
    setFeeRate('');
    setNameError('');
    setFeeError('');
    setShowForm(true);
  }

  function openEditForm(b: Broker) {
    setEditingId(b.id);
    setName(b.name);
    setFeeRate(String(b.feeRate));
    setNameError('');
    setFeeError('');
    setShowForm(true);
  }

  function validate() {
    let ok = true;
    if (!name.trim()) { setNameError('증권사 이름을 입력하세요'); ok = false; }
    else setNameError('');
    const f = parseFloat(feeRate);
    if (isNaN(f) || f < 0 || f > 100) { setFeeError('유효한 수수료율을 입력하세요 (0~100)'); ok = false; }
    else setFeeError('');
    return ok;
  }

  function handleSave() {
    if (!validate()) return;
    const f = parseFloat(feeRate);
    if (editingId !== null) {
      editBroker(editingId, name.trim(), f);
    } else {
      addBroker(name.trim(), f);
    }
    setShowForm(false);
  }

  function handleDelete(id: number) {
    Alert.alert('삭제', '이 증권사 프로필을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => removeBroker(id) },
    ]);
  }

  function handleExport() {
    try {
      const data = exportAllData();
      const json = JSON.stringify(data, null, 2);
      Alert.alert('내보내기 (개발용)', `데이터 크기: ${json.length} 바이트\n\n실제 앱에서는 파일로 저장됩니다.`);
    } catch (e) {
      Alert.alert('오류', String(e));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>설정</Text>

      {/* 증권사 프로필 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>증권사 프로필</Text>
        <PixelButton label="+ 추가" variant="accent" onPress={openAddForm} style={styles.addBtn} />
      </View>

      {showForm && (
        <PixelCard style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? '증권사 수정' : '증권사 추가'}</Text>
          <PixelInput
            label="증권사 이름"
            placeholder="예: 키움증권"
            value={name}
            onChangeText={setName}
            error={nameError}
          />
          <PixelInput
            label="수수료율"
            placeholder="예: 0.015"
            value={feeRate}
            onChangeText={setFeeRate}
            keyboardType="decimal-pad"
            suffix="%"
            error={feeError}
          />
          <View style={styles.formActions}>
            <PixelButton label="취소" variant="outline" onPress={() => setShowForm(false)} style={styles.formBtn} />
            <PixelButton label="저장" variant="primary" onPress={handleSave} style={styles.formBtn} />
          </View>
        </PixelCard>
      )}

      {brokers.length === 0 ? (
        <PixelCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>등록된 증권사가 없습니다.</Text>
        </PixelCard>
      ) : (
        <PixelCard style={styles.brokerListCard} padding={0}>
          {brokers.map((b, idx) => (
            <React.Fragment key={b.id}>
              {idx > 0 && <View style={styles.divider} />}
              <BrokerItem
                broker={b}
                onEdit={() => openEditForm(b)}
                onDelete={() => handleDelete(b.id)}
              />
            </React.Fragment>
          ))}
        </PixelCard>
      )}

      {/* 데이터 관리 */}
      {/* <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>데이터 관리</Text>
      <PixelCard style={styles.dataCard}>
        <PixelButton label="📤  데이터 내보내기 (JSON)" variant="outline" fullWidth onPress={handleExport} />
        <View style={styles.dataNote}>
          <Text style={styles.noteText}>
            ℹ️  모든 매매 기록과 증권사 설정을 JSON 파일로 백업합니다.
          </Text>
        </View>
      </PixelCard> */}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { paddingVertical: 5, paddingHorizontal: Spacing.sm },
  formCard: { marginBottom: Spacing.md },
  formTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  formActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  formBtn: { flex: 1 },
  brokerListCard: { marginBottom: Spacing.md },
  brokerRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  brokerInfo: { flex: 1 },
  brokerName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  brokerFee: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 2,
  },
  deleteBtn: { borderColor: Colors.danger },
  actionText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textPrimary },
  emptyCard: { alignItems: 'center', padding: Spacing.lg, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  dataCard: { marginBottom: Spacing.md },
  dataNote: { marginTop: Spacing.md },
  noteText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
});
