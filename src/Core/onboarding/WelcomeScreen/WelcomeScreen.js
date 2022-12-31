import React, { useState, useEffect } from "react";
import Button from "react-native-button";
import {
  Text,
  View,
  Image,
  PermissionsAndroid,
  ScrollView,
} from "react-native";
import { useDynamicStyleSheet } from "react-native-dark-mode";
import TNActivityIndicator from "../../truly-native/TNActivityIndicator";
import { IMLocalized } from "../../localization/IMLocalization";
import dynamicStyles from "./styles";
import { setUserData } from "../redux/auth";
import { connect } from "react-redux";
import authManager from "../utils/authManager";
import GlobalFont from "react-native-global-font";
const WelcomeScreen = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  const appStyles =
    props.navigation.state.params.appStyles ||
    props.navigation.getParam("appStyles");
  const styles = useDynamicStyleSheet(dynamicStyles(appStyles));
  const appConfig =
    props.navigation.state.params.appConfig ||
    props.navigation.getParam("appConfig");

  useEffect(() => {
    tryToLoginFirst();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the location");
      } else {
        console.log("location permission denied");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const tryToLoginFirst = async () => {
    setIsLoading(true);
    authManager.retrievePersistedAuthUser().then((response) => {
      console.log("retrievePersistedAuthUser", response);
      setIsLoading(false);
      if (response) {
        const user = response.user;
        props.setUserData(user);
        props.navigation.navigate("MainStack", { user: user });
      }
    });
  };

  if (isLoading == true) {
    return <TNActivityIndicator appStyles={appStyles} />;
  }

  return (
    <View style={styles.containerOuter}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.logo}>
            <Image
              style={styles.logoImage}
              source={require("../../../CoreAssets/logoNew1.png")}
              resizeMode={"contain"}
            />
          </View>
          {/* <Image style={{height:250, width:200, resizeMode:'contain', marginTop:-250}} source={require('../../../CoreAssets/logoNew.png')} /> */}

          <Text style={styles.title}>BlackMD Cares</Text>
          <Text style={styles.caption}>
            {appConfig.onboardingConfig.welcomeCaption}
          </Text>
          <Button
            containerStyle={[styles.loginContainer]}
            style={styles.loginText}
            onPress={() => {
              appConfig.isSMSAuthEnabled
                ? props.navigation.navigate("Sms", {
                    isSigningUp: false,
                    appStyles,
                    appConfig,
                  })
                : props.navigation.navigate("Login", { appStyles, appConfig });
            }}
          >
            {IMLocalized("Log In")}
          </Button>
          <Button
            containerStyle={styles.signupContainer}
            style={styles.signupText}
            onPress={() => {
              appConfig.isSMSAuthEnabled
                ? props.navigation.navigate("Sms", {
                    isSigningUp: true,
                    appStyles,
                    appConfig,
                  })
                : props.navigation.navigate("Signup", { appStyles, appConfig });
            }}
          >
            {IMLocalized("Sign Up As Patient")}
          </Button>

          <Button
            containerStyle={styles.signupContainer}
            style={styles.signupText}
            onPress={
              (setBarberTrue = () => {
                props.navigation.navigate("Signup", { appStyles, appConfig });
              })
            }
          >
            {IMLocalized("Sign Up As Provider")}
          </Button>

          {/* <Button
        containerStyle={[styles.signupContainer, { borderWidth: 0 }]}
        style={styles.signupText}
        onPress={() => {
          props.navigation.navigate('Home', { appStyles, appConfig });
        }}
      >
        {IMLocalized('Skip & Enter App')}
      </Button> */}
        </View>
      </ScrollView>
    </View>
  );
};

const mapStateToProps = ({ auth }) => {
  return {
    user: auth.user,
  };
};

export default connect(mapStateToProps, {
  setUserData,
})(WelcomeScreen);
