import React, { useEffect } from "react";
import { View, Image, Dimensions, BackHandler, Platform } from "react-native";
import PropTypes from "prop-types";
import deviceStorage from "../utils/AuthDeviceStorage";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import Geolocation from "@react-native-community/geolocation";

const LoadScreen = (props) => {
  const { navigation } = props;

  const appStyles =
    navigation.state.params.appStyles || props.navigation.getParam("appStyles");
  const appConfig =
    navigation.state.params.appConfig || props.navigation.getParam("appConfig");
  console.log("in loading screen");
  useEffect(() => {
    setTimeout(() => {
      if (Platform.OS == "android") {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
          interval: 10000,
          fastInterval: 5000,
        })
          .then((data) => {
            console.log("is location", data);
            console.log("grantedd");
            setAppState();
            Geolocation.getCurrentPosition(
              async (position) => {
                console.log("inside ");
                console.log(
                  "====================",
                  typeof position.coords.latitude,
                  typeof position.coords.longitude
                );
                setAppState();
              },
              (error) => {
                // setShowLoader(false)
                // Alert.alert('','Error in getiing current location');
                console.log("er", JSON.stringify(error));
              },
              {
                forceRequestLocation: true,
                showLocationDialog: true,
                timeout: 20000,
                maximumAge: 1000,
              }
            );
          })
          .catch((err) => {
            console.log(err);
            BackHandler.exitApp();
          });
      } else {
        setAppState();
      }
    }, 3000);
  }, []);

  const setAppState = async () => {
    const shouldShowOnboardingFlow = await deviceStorage.getShouldShowOnboardingFlow();
    if (!shouldShowOnboardingFlow) {
      navigation.navigate("LoginStack", {
        appStyles: appStyles,
        appConfig: appConfig,
      });
    } else {
      navigation.navigate("Walkthrough", {
        appStyles: appStyles,
        appConfig: appConfig,
      });
    }
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
      }}
    >
      <Image
        style={{ height: 210, width: "80%" }}
        source={require("../../../CoreAssets/logoNewText.png")}
        resizeMode={"contain"}
      />
    </View>
  );
};

LoadScreen.propTypes = {
  user: PropTypes.object,
  navigation: PropTypes.object,
};

LoadScreen.navigationOptions = {
  header: null,
};

export default LoadScreen;
