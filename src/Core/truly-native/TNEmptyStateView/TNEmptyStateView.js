import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useDynamicStyleSheet } from 'react-native-dark-mode';
import dynamicStyles from './styles';
import { AppStyles } from "../../../AppStyles"
const TNEmptyStateView = props => {
  const styles = new useDynamicStyleSheet(dynamicStyles(props.appStyles));
  const { emptyStateConfig } = props;
  return (
    <View style={[props.style]}>
      <Text style={[styles.title, { fontFamily: AppStyles.fontName.main }]}>{emptyStateConfig.title || "Loading..."}</Text>
      <Text style={[styles.description, { fontFamily: AppStyles.fontName.main }]}>{emptyStateConfig.description || "Loading..."}</Text>
      {emptyStateConfig.buttonName && emptyStateConfig.buttonName.length > 0 && (
        <TouchableOpacity onPress={emptyStateConfig.onPress} style={styles.buttonContainer}>
          <Text style={[styles.buttonName, { fontFamily: AppStyles.fontName.main }]}>{emptyStateConfig.buttonName}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TNEmptyStateView;
