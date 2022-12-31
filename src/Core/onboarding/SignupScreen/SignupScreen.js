import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  View,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Modal,
} from "react-native";
import ActionSheet from "react-native-actionsheet";
import Button from "react-native-button";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useDynamicStyleSheet } from "react-native-dark-mode";
import dynamicStyles from "./styles";
import TNActivityIndicator from "../../truly-native/TNActivityIndicator";
import TNProfilePictureSelector from "../../truly-native/TNProfilePictureSelector/TNProfilePictureSelector";
import { IMLocalized } from "../../localization/IMLocalization";
import { setUserData } from "../redux/auth";
import { connect } from "react-redux";
import authManager from "../utils/authManager";
import { localizedErrorMessage } from "../utils/ErrorCode";
import TermsOfUseView from "../components/TermsOfUseView";
import { AppStyles } from "../../../AppStyles";
import { Dimensions } from "react-native";
const SignupScreen = (props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBarber, setIsBarber] = useState(false);
  const [completedReg, setCompletedReg] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [profilePictureURL, setProfilePictureURL] = useState(null);
  const [loading, setLoading] = useState(false);

  const appConfig =
    props.navigation.state.params.appConfig ||
    props.navigation.getParam("appConfig");
  const appStyles =
    props.navigation.state.params.appStyles ||
    props.navigation.getParam("appStyles");
  const styles = useDynamicStyleSheet(dynamicStyles(appStyles));

  const showActionSheet = () => {
    this.ActionSheet.show();
  };

  const isDoctor = () => {
    setIsBarber((previousState) => !previousState);
    setCompletedReg((previousState) => !previousState);
  };
  const onActionDone = (index) => {
    console.log("index", index);
    if (index == 0) {
      Alert.alert(
        IMLocalized("You are signing up as a healthcare provider!"),
        IMLocalized("Please visit www.blackmdcares.com to finish registration"),
        [
          {
            text: IMLocalized("Cancel"),
            style: "destructive",
          },
          {
            text: IMLocalized("Continue"),
            onPress: isDoctor,
          },
        ],
        { cancelable: false }
      );
    }
  };

  const isEmailValid = (strEmail) => {
    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([\t]*\r\n)?[\t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([\t]*\r\n)?[\t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

    return expression.test(String(strEmail).toLowerCase());
  };

  const onRegister = () => {
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
    }
    if (!password) {
      Alert.alert(
        "",
        "Please add your email id",
        [{ text: IMLocalized("OK") }],
        {
          cancelable: false,
        }
      );
    } else if (password.length < 6) {
      Alert.alert(
        "",
        "Password should be at least 6 characters",
        [{ text: IMLocalized("OK") }],
        {
          cancelable: false,
        }
      );
    } else {
      setLoading(true);
      //setIsBarber(true)
      const userDetails = {
        firstName,
        lastName,
        email,
        password,
        isBarber: isBarber,
        completedReg,
        photoURI: profilePictureURL,
        appIdentifier: appConfig.appIdentifier,
      };
      authManager
        .createAccountWithEmailAndPassword(userDetails, appConfig.appIdentifier)
        .then((response) => {
          const user = response.user;
          console.log("user:######################", response);
          if (user) {
            props.setUserData({ user: user });
            props.navigation.navigate("MainStack", { user: user });
          } else {
            console.log("Error in Signup Number");
            Alert.alert(
              "",
              localizedErrorMessage(response.error),
              [{ text: IMLocalized("OK") }],
              {
                cancelable: true,
              }
            );
          }
          setLoading(false);
        });
    }
  };

  const renderSignupWithEmail = () => {
    return (
      <View>
        <View>
          <Button
            style={
              (styles.sendContainer,
              {
                backgroundColor: "#ffffff",
                fontFamily: AppStyles.fontName.main,
              })
            }
            onPress={() => setModalVisible(true)}
          >
            Are you a healthcare provider?
          </Button>
          <ActionSheet
            ref={(o) => (this.ActionSheet = o)}
            title={"Are you a black healthcare provider?"}
            options={["Yes", "No"]}
            cancelButtonIndex={1}
            destructiveButtonIndex={1}
            onPress={(index) => {
              onActionDone(index);
            }}
          />
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(!modalVisible);
            }}
          >
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "flex-end",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            >
              <View
                style={{
                  height: Dimensions.get("window").height / 3,
                  width: Dimensions.get("window").width,
                  backgroundColor: "white",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: AppStyles.fontName.main,
                    fontSize: 18,
                    lineHeight: 19,
                  }}
                >
                  Are you a healthcare provider?
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      IMLocalized(
                        "You are signing up as a healthcare provider!"
                      ),
                      IMLocalized(
                        "Please visit www.blackmdcares.com to finish registration"
                      ),
                      [
                        {
                          text: IMLocalized("Cancel"),
                          style: "destructive",
                        },
                        {
                          text: IMLocalized("Continue"),
                          onPress: isDoctor,
                        },
                      ],
                      { cancelable: false }
                    );
                    setModalVisible(false);
                  }}
                >
                  <View
                    style={{
                      height: 55,
                      width: Dimensions.get("window").width - 80,
                      borderRadius: 40,
                      backgroundColor: "rgb(231, 193, 146)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: AppStyles.fontName.main,
                        fontSize: 16,
                        lineHeight: 19,
                        color: "white",
                      }}
                    >
                      Yes
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <View
                    style={{
                      height: 55,
                      width: Dimensions.get("window").width - 80,
                      borderRadius: 40,
                      backgroundColor: "rgb(231, 193, 146)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: AppStyles.fontName.main,
                        fontSize: 16,
                        lineHeight: 19,
                        color: "white",
                      }}
                    >
                      No
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
        <View>
          <TextInput
            style={[
              styles.InputContainer,
              { fontFamily: AppStyles.fontName.main },
            ]}
            placeholder={IMLocalized("First Name")}
            placeholderTextColor="#aaaaaa"
            onChangeText={(text) => setFirstName(text)}
            value={firstName}
            underlineColorAndroid="transparent"
          />
          <TextInput
            style={[
              styles.InputContainer,
              { fontFamily: AppStyles.fontName.main },
            ]}
            placeholder={IMLocalized("Last Name")}
            placeholderTextColor="#aaaaaa"
            onChangeText={(text) => setLastName(text)}
            value={lastName}
            underlineColorAndroid="transparent"
          />
          <TextInput
            style={[
              styles.InputContainer,
              { fontFamily: AppStyles.fontName.main },
            ]}
            placeholder={IMLocalized("E-mail Address")}
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
            placeholder={IMLocalized("Password")}
            placeholderTextColor="#aaaaaa"
            secureTextEntry
            onChangeText={(text) => setPassword(text)}
            value={password}
            underlineColorAndroid="transparent"
            autoCapitalize="none"
          />
        </View>
        <Text></Text>
        <Text></Text>

        <Button
          containerStyle={styles.signupContainer}
          style={[styles.signupText, { fontFamily: AppStyles.fontName.main }]}
          onPress={() => onRegister()}
        >
          {IMLocalized("Sign Up")}
        </Button>
      </View>
    );
  };

  const handleBackButtonClick = () => {
    console.log("backhandler clickkkkk");
    props.navigation.goBack();
    return true;
  };

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    return () => {
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.container}>
        <KeyboardAwareScrollView
          style={{ flex: 1, width: "100%" }}
          keyboardShouldPersistTaps="always"
        >
          <TouchableOpacity onPress={() => props.navigation.goBack()}>
            <Image
              style={[
                appStyles.styleSet.backArrowStyle,
                { tintColor: "#84C1BA" },
              ]}
              source={appStyles.iconSet.backArrow}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: AppStyles.fontName.main }]}>
            {IMLocalized("Create new account")}
          </Text>
          <TNProfilePictureSelector
            setProfilePictureURL={setProfilePictureURL}
            appStyles={appStyles}
          />
          {renderSignupWithEmail()}
          {appConfig.isSMSAuthEnabled && (
            <>
              <Text
                style={[
                  styles.orTextStyle,
                  { fontFamily: AppStyles.fontName.main },
                ]}
              >
                {IMLocalized("OR")}
              </Text>
              <Button
                containerStyle={[
                  styles.PhoneNumberContainer,
                  { fontFamily: AppStyles.fontName.main },
                ]}
                onPress={() =>
                  props.navigation.navigate("Sms", {
                    isSigningUp: true,
                    appStyles,
                    appConfig,
                  })
                }
              >
                {IMLocalized("Sign up with phone number")}
              </Button>
            </>
          )}
          <TermsOfUseView tosLink={appConfig.tosLink} style={styles.tos} />
        </KeyboardAwareScrollView>
        {loading && <TNActivityIndicator appStyles={appStyles} />}
      </View>
    </ScrollView>
  );
};

export default connect(null, {
  setUserData,
})(SignupScreen);
