import React from 'react';
import { Text, Linking, View } from 'react-native';
import { IMLocalized } from '../../localization/IMLocalization';
import { AppStyles } from "../AppStyles"
const Links = props => {
    const { site, booking, instagram, style } = props;
    return (
        <View style={style}>
            <Text style={{ fontFamily: AppStyles.fontName.main }}>
                {IMLocalized("Website:")}
            </Text>
            <Text style={{ color: 'blue', fontSize: 12, fontFamily: AppStyles.fontName.main }}
                onPress={() => Linking.openURL("http://" + site)}>
                {site}
            </Text>
            <Text style={{ fontFamily: AppStyles.fontName.main }}>
                {IMLocalized("Book an apt:")}
            </Text>
            <Text style={{ color: 'blue', fontSize: 12, fontFamily: AppStyles.fontName.main }}
                onPress={() => Linking.openURL("http://" + booking)}>
                {booking}
            </Text>
            <Text style={{ fontFamily: AppStyles.fontName.main }}>
                {IMLocalized("Instagram:")}
            </Text>
            <Text style={{ color: 'blue', fontSize: 12, fontFamily: AppStyles.fontName.main }}
                onPress={() => Linking.openURL("http://instagram.com/" + instagram)}>
                {IMLocalized("@") + instagram}
            </Text>
        </View>
    );
}

export default Links;