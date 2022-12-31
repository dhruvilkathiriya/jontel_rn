import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View, FlatList, ActivityIndicator, Text, TouchableOpacity, AsyncStorage } from 'react-native';
import { useDynamicStyleSheet } from 'react-native-dark-mode';
import IMConversationView from '../IMConversationView';
import dynamicStyles from './styles';
import { IMLocalized } from '../../localization/IMLocalization';
import { TNEmptyStateView } from '../../truly-native';
import { AppStyles } from "../../../AppStyles"
import { global } from "../../../screens/global";
function IMConversationList(props) {
  const {
    onConversationPress,
    emptyStateConfig,
    conversations,
    loading,
    appStyles
  } = props;
  const styles = useDynamicStyleSheet(dynamicStyles(appStyles));
  //console.log("conversations", conversations)
  const lastMsgTime = conversations.map(item => {
    if (item.lastMessageDate) {
      return item.lastMessageDate.seconds
    }
  })

  global.lastMsg = false;
  global.runThatCode = false;
  if (lastMsgTime.length > 0) {
    let ltm = Math.max(...lastMsgTime)

    //if (global.lastMsgDate < ltm) {
    global.lastMsgDate = ltm
    AsyncStorage.setItem('lastMsgTime', JSON.stringify(ltm));
    //}
  }

  const formatMessage = item => {
    if (item.lastMessage && item.lastMessage.mime && item.lastMessage.mime.startsWith('video')) {
      return IMLocalized('Someone sent a video.');
    } else if (
      item.lastMessage &&
      item.lastMessage.mime &&
      item.lastMessage.mime.startsWith('image')
    ) {
      return IMLocalized('Someone sent a photo.');
    } else if (item.lastMessage) {
      return item.lastMessage;
    }
    return '';
  };

  const renderConversationView = ({ item }) => (
    <IMConversationView
      formatMessage={formatMessage}
      onChatItemPress={onConversationPress}
      item={item}
      appStyles={appStyles}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 15 }} size="small" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.container]}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.chatsChannelContainer]}>
          {conversations && conversations.length > 0 && (
            <FlatList
              vertical={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              data={conversations}
              renderItem={renderConversationView}
              keyExtractor={item => `${item.id}`}
            />
          )}
          {conversations && conversations.length <= 0 && (
            <View style={styles.emptyViewContainer}>
              {emptyStateConfig && <TNEmptyStateView
                emptyStateConfig={emptyStateConfig}
                appStyles={appStyles}
              />}
            </View>
          )}

          {conversations && conversations.length <= 0 && (
            <View style={[styles.emptyViewContainer, { alignItems: 'center' }]}>
              <Text style={{ fontFamily: AppStyles.fontName.main }}>There are no message history!</Text>
            </View>
          )}
        </View>

      </ScrollView>
      {/* <TouchableOpacity
        style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', bottom: 16, right: 16, width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A99F4' }}>
        <Text style={{ color: '#FFF', fontSize: 34, fontWeight: 'bold', alignSelf: 'center', marginTop: -3 }}>+</Text>
      </TouchableOpacity> */}
    </View>
  );
}

IMConversationList.propTypes = {
  onConversationPress: PropTypes.func,
  conversations: PropTypes.array,
};

export default IMConversationList;
