import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {getAllMasterCache, cacheKeys} from '../utils/masterCacheViewer';

const MasterCacheScreen = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchAllCache = async () => {
    setLoading(true);
    const cache = await getAllMasterCache();
    setData(cache);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllCache();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={fetchAllCache}>
        <Text style={styles.buttonText}>Refresh Data Cache</Text>
      </TouchableOpacity>
      {loading && (
        <ActivityIndicator size="large" color="#2d3748" style={{margin: 20}} />
      )}
      <ScrollView style={styles.scroll}>
        {cacheKeys.map(key => (
          <View key={key} style={styles.card}>
            <Text style={styles.keyTitle}>{key}</Text>
            <ScrollView horizontal>
              <Text style={styles.jsonText}>
                {data[key] !== undefined
                  ? JSON.stringify(data[key], null, 2)
                  : '(Belum di-cache)'}
              </Text>
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f6fa', paddingTop: 12},
  button: {
    backgroundColor: '#22223b',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 12,
  },
  buttonText: {color: '#fff', fontWeight: 'bold'},
  scroll: {flex: 1},
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    padding: 12,
    elevation: 1,
    shadowColor: '#222',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
  },
  keyTitle: {fontWeight: 'bold', color: '#1d3557', marginBottom: 4},
  jsonText: {
    fontSize: 13,
    color: '#222',
    fontFamily: 'monospace',
    minWidth: 150,
  },
});

export default MasterCacheScreen;
