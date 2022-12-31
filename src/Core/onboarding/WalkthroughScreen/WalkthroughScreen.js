import React, { useEffect } from "react";
import { View, StatusBar, Image, Text } from "react-native";
import PropTypes from "prop-types";
import AppIntroSlider from 'react-native-app-intro-slider';
import deviceStorage from '../utils/AuthDeviceStorage';
import { useDynamicStyleSheet } from 'react-native-dark-mode';
import dynamicStyles from './styles';
import { IMLocalized } from "../../localization/IMLocalization";
import GlobalFont from 'react-native-global-font'
import { AppStyles } from "../../../AppStyles"
const WalkthroughScreen = props => {
    const { navigation } = props;
    const appConfig = (navigation.state.params.appConfig || navigation.getParam('appConfig'));
    const appStyles = (navigation.state.params.appStyles || navigation.getParam('appStyles'));
    const styles = useDynamicStyleSheet(dynamicStyles(appStyles));

    const slides = appConfig.onboardingConfig.walkthroughScreens.map((screenSpec, index) => {
        return {
            key: index,
            text: screenSpec.description,
            title: screenSpec.title,
            image: screenSpec.icon,
        }
    });

    useEffect(() => {
        StatusBar.setHidden(true);
        let fontName = 'Raleway-Medium'
        GlobalFont.applyGlobal(fontName)
    }, []);

    const _onDone = () => {
        deviceStorage.setShouldShowOnboardingFlow('false')
        navigation.navigate("Welcome");
    };

    _renderItem = ({ item, dimensions }) => (
        <View
            style={[
                styles.container,
                dimensions,
            ]}>
            <Image
                style={styles.image}
                source={item.image}
                size={100}
                color="white"
            />
            <View>
                <Text style={[styles.title, { fontFamily: AppStyles.fontName.main }]}>{item.title}</Text>
                <Text style={[styles.text, { fontFamily: AppStyles.fontName.main }]}>{item.text}</Text>
            </View>
        </View>
    );

    _renderNextButton = () => {
        return (
            <Text style={[styles.button, { fontFamily: AppStyles.fontName.main }]}>
                {IMLocalized("Next")}
            </Text>
        );
    };

    _renderSkipButton = () => {
        return (
            <Text style={[styles.button, { fontFamily: AppStyles.fontName.main }]}>
                {IMLocalized("Skip")}
            </Text>
        );
    };

    _renderDoneButton = () => {
        return (
            <Text style={[styles.button, { fontFamily: AppStyles.fontName.main }]}>
                {IMLocalized("Done")}
            </Text>
        );
    };

    return (
        <View style={styles.container}>
            <AppIntroSlider
                slides={slides}
                onDone={_onDone}
                renderItem={this._renderItem}
                //Handler for the done On last slide
                showSkipButton={true}
                onSkip={_onDone}
                renderNextButton={_renderNextButton}
                renderSkipButton={_renderSkipButton}
                renderDoneButton={_renderDoneButton}
            />
        </View>
    );
};

WalkthroughScreen.propTypes = {
    navigation: PropTypes.object
};

WalkthroughScreen.navigationOptions = {
    header: null
};

export default WalkthroughScreen;
