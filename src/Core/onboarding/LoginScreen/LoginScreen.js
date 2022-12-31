import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  View,
  Alert,
  TouchableOpacity,
  Image,
  BackHandler,
} from "react-native";
import Button from "react-native-button";
import { connect } from "react-redux";
// import firebase from 'react-native-firebase';
import { useDynamicStyleSheet } from "react-native-dark-mode";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import TNActivityIndicator from "../../truly-native/TNActivityIndicator";
import { IMLocalized } from "../../localization/IMLocalization";
import dynamicStyles from "./styles";
import { setUserData } from "../redux/auth";
import authManager from "../utils/authManager";
import { localizedErrorMessage } from "../utils/ErrorCode";
import { AppStyles } from "../../../AppStyles";

const LoginScreen = (props) => {
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setisForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const appStyles =
    props.navigation.state.params.appStyles ||
    props.navigation.getParam("appStyles");
  const styles = useDynamicStyleSheet(dynamicStyles(appStyles));
  const appConfig =
    props.navigation.state.params.appConfig ||
    props.navigation.getParam("appConfig");

  const isEmailValid = (strEmail) => {
    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([\t]*\r\n)?[\t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([\t]*\r\n)?[\t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

    return expression.test(String(strEmail).toLowerCase());
  };

  const onPressLogin = () => {
    if (!email) {
      Alert.alert(
        "",
        "Please add your email id",
        [{ text: IMLocalized("OK") }],
        {
          cancelable: false,
        }
      );
    } else if (!isEmailValid(email)) {
      Alert.alert(
        "",
        "Please enter correct email id",
        [{ text: IMLocalized("OK") }],
        {
          cancelable: false,
        }
      );
    } else {
      setLoading(true);
      authManager
        .loginWithEmailAndPassword(email, password)
        .then((response) => {
          if (response.user) {
            const user = response.user;

            // var credential = firebase.auth.EmailAuthProvider.credential(email.user, user.password);
            // firebase.auth().currentUser.linkWithCredential(credential).then(function (usercred) {
            //   var user = usercred.user;
            //   console.log("Account linking success", user);
            // }, function (error) {
            //   console.log("Account linking error", error);
            // });

            props.setUserData(user);
            props.navigation.navigate("MainStack", { user: user });
          } else {
            setLoading(false);
            Alert.alert(
              "",
              localizedErrorMessage(response.error),
              [{ text: IMLocalized("OK") }],
              {
                cancelable: false,
              }
            );
          }
        });
    }
  };

  const onPressForgotPassword = () => {
    if (!email) {
      Alert.alert(
        "",
        "Please add your email id",
        [{ text: IMLocalized("OK") }],
        {
          cancelable: false,
        }
      );
    } else if (!isEmailValid(email)) {
      Alert.alert(
        "",
        "Please enter correct email id",
        [{ text: IMLocalized("OK") }],
        {
          cancelable: false,
        }
      );
    } else {
      setLoading(true);
      authManager.forgetPasswordByEmail(email).then((response) => {
        setLoading(false);
        if (response) {
          Alert.alert("Failed", response, [{ text: IMLocalized("OK") }], {
            cancelable: false,
          });
        } else {
          props.navigation.navigate("Welcome", { appStyles, appConfig });
          Alert.alert(
            "Success",
            "Can you please check you mail",
            [{ text: IMLocalized("OK") }],
            {
              cancelable: false,
            }
          );
        }
      });
    }
  };

  const onFBButtonPress = () => {
    authManager
      .loginOrSignUpWithFacebook(appConfig.appIdentifier)
      .then((response) => {
        if (response.user) {
          const user = response.user;
          props.setUserData(user);
          props.navigation.navigate("MainStack", { user: user });
        } else {
          Alert.alert(
            "",
            localizedErrorMessage(response.error),
            [{ text: IMLocalized("OK") }],
            {
              cancelable: false,
            }
          );
        }
      });
  };

  const handleBackButtonClick = () => {
    console.log("backhandler click");
    props.navigation.goBack();
    return true;
  };

  useEffect(() => {
    console.log("inside login Screen");
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    return () => {
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={{ flex: 1, width: "100%" }}
        keyboardShouldPersistTaps="always"
      >
        <TouchableOpacity
          style={{ alignSelf: "flex-start" }}
          onPress={() => props.navigation.goBack()}
        >
          <Image
            style={[
              appStyles.styleSet.backArrowStyle,
              { tintColor: "#84C1BA" },
            ]}
            source={appStyles.iconSet.backArrow}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: AppStyles.fontName.main }]}>
          {!isForgotPassword
            ? IMLocalized("Sign In")
            : IMLocalized("Forgot Password")}
        </Text>
        {!isForgotPassword ? (
          <View>
            <TextInput
              style={[
                styles.InputContainer,
                { fontFamily: AppStyles.fontName.main },
              ]}
              placeholder={IMLocalized("E-mail")}
              placeholderTextColor="#aaaaaa"
              onChangeText={(text) => setEmail(text.trim())}
              value={email}
              underlineColorAndroid="transparent"
              autoCapitalize="none"
            />
            <TextInput
              style={[
                styles.InputContainer,
                { fontFamily: AppStyles.fontName.main },
              ]}
              placeholderTextColor="#aaaaaa"
              secureTextEntry
              placeholder={IMLocalized("Password")}
              onChangeText={(text) => setPassword(text)}
              value={password}
              underlineColorAndroid="transparent"
              autoCapitalize="none"
            />
            <Button
              containerStyle={styles.loginContainer}
              style={[
                styles.loginText,
                { fontFamily: AppStyles.fontName.main },
              ]}
              onPress={() => onPressLogin()}
            >
              {IMLocalized("Log In")}
            </Button>
            <TouchableOpacity
              onPress={() => setisForgotPassword(true)}
              style={{ alignSelf: "center", marginTop: 16 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: AppStyles.fontName.main,
                  color: "blue",
                }}
              >
                Forgot password
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              style={[
                styles.InputContainer,
                { fontFamily: AppStyles.fontName.main },
              ]}
              placeholder={IMLocalized("E-mail")}
              placeholderTextColor="#aaaaaa"
              onChangeText={(text) => setEmail(text.trim())}
              value={email}
              underlineColorAndroid="transparent"
              autoCapitalize="none"
            />
            <Button
              containerStyle={styles.loginContainer}
              style={[
                styles.loginText,
                { fontFamily: AppStyles.fontName.main },
              ]}
              onPress={() => onPressForgotPassword()}
            >
              {IMLocalized("Forgot")}
            </Button>
            <TouchableOpacity
              onPress={() => setisForgotPassword(false)}
              style={{ alignSelf: "center", marginTop: 16 }}
            >
              <Text
                style={{ fontSize: 14, fontFamily: AppStyles.fontName.main }}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* <Text style={styles.orTextStyle}> {IMLocalized('OR')}</Text>
        <Button
          containerStyle={styles.facebookContainer}
          style={styles.facebookText}
          onPress={() => onFBButtonPress()}
        >
          {IMLocalized('Login With Facebook')}
        </Button> */}
        {/* {appConfig.isSMSAuthEnabled && (
          <Button
            containerStyle={styles.phoneNumberContainer}
            onPress={() =>
              props.navigation.navigate('Sms', {
                isSigningUp: false,
                appStyles,
                appConfig,
              })
            }
          >
            {IMLocalized('Login with phone number')}
          </Button>
        )} */}

        {loading && <TNActivityIndicator appStyles={appStyles} />}
      </KeyboardAwareScrollView>
    </View>
  );
};

export default connect(null, {
  setUserData,
})(LoginScreen);
