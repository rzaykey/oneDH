import React, {useEffect, useState} from 'react';
import {Modal, View, Text, FlatList, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createStyles as styles} from '../../styles/ShowOfflineAESModalStyle';
import Toast from 'react-native-toast-message';

const ShowOfflineQueueModalScreen = ({visible, onClose, queueKey}) => {
  const [queue, setQueue] = useState([]);

  const fetchQueue = async () => {
    const data = await AsyncStorage.getItem(queueKey);
    if (data) {
      setQueue(JSON.parse(data));
    } else {
      setQueue([]);
    }
  };

  const handleDeleteItem = async index => {
    const updatedQueue = [...queue];
    updatedQueue.splice(index, 1);
    await AsyncStorage.setItem(queueKey, JSON.stringify(updatedQueue));
    setQueue(updatedQueue);

    Toast.show({
      type: 'success',
      text1: 'Berhasil',
      text2: 'Data berhasil dihapus dari antrian offline.',
      position: 'top',
      visibilityTime: 2000,
      topOffset: 40,
    });
  };

  useEffect(() => {
    if (visible) fetchQueue();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Antrian Offline</Text>

          {queue.length === 0 ? (
            <Text style={styles.empty}>Tidak ada data offline</Text>
          ) : (
            <FlatList
              data={queue}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({item, index}) => (
                <View style={styles.itemContainer}>
                  <Text style={styles.itemText}>
                    {index + 1}. {item.name_guest || 'Tanpa Nama'} (
                    {item.code_agenda || '-'})
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(index)}
                    style={styles.deleteButton}>
                    <Text style={styles.deleteText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ShowOfflineQueueModalScreen;
