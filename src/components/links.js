import React from 'react';
import { Text, Linking, View } from 'react-native';
import { IMLocalized } from "../Core/localization/IMLocalization";
import { AppStyles } from "../AppStyles";

const Links = props => {
    const { style, site, booking, instagram } = props;
    return (
        <View style={style}>
            {this.site ?
                <Text style={{ fontFamily: AppStyles.fontName.main }}>
                    {IMLocalized("Website:")}
                </Text>
                : null}
            {this.site ?
                <Text style={{ color: 'blue', fontFamily: AppStyles.fontName.main }}
                    onPress={() => Linking.openURL("http://" + site)}>
                    {site}
                </Text>
                : null}
            {this.booking ? (
                <Text style={{ fontFamily: AppStyles.fontName.main }}>
                    {IMLocalized("Book an apt:")}
                </Text>)
                : null}
            {this.booking ? (
                <Text style={{ color: 'blue', fontFamily: AppStyles.fontName.main }}
                    onPress={() => Linking.openURL("http://" + booking)}>
                    {booking}
                </Text>)
                : null}
            {this.instagram ? (
                <Text style={{ fontFamily: AppStyles.fontName.main }}>
                    {IMLocalized("Instagram:")}
                </Text>)
                : null}
            {this.instagram ? (
                <Text style={{ color: 'blue', fontFamily: AppStyles.fontName.main }}
                    onPress={() => Linking.openURL("http://instagram.com/" + instagram)}>
                    {IMLocalized("@") + instagram}
                </Text>)
                : null}
        </View>
    );
}

export default Links;