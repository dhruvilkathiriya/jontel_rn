import PropTypes from "prop-types";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import ActionSheet from "react-native-actionsheet";
import { useDynamicStyleSheet } from "react-native-dark-mode";
import dynamicStyles, { loadingModal } from "./styles";
import { IMLocalized } from "../../../localization/IMLocalization";
import authManager from "../../../onboarding/utils/authManager";
import firebase from "react-native-firebase";
import CodeField from "react-native-confirmation-code-field";
import { AppStyles } from "../../../../AppStyles";
import { firebaseUser } from "../../../firebase";
import { global } from "../../../../screens/global";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

function IMFormComponent(props) {
  const {
    form,
    initialValuesDict,
    onFormChange,
    onFormButtonPress,
    appStyles,
  } = props;
  const styles = useDynamicStyleSheet(dynamicStyles(appStyles));

  const [alteredFormDict, setAlteredFormDict] = useState({});
  const [isVisibleOTP, setIsVisibleOTP] = useState(false);
  const [isEmailActivating, setisEmailActivating] = useState(false);
  const [password, setPassword] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [displayMsg, setDisplayMsg] = useState("");
  const [fromAuthChanged, serFromAuthChanges] = useState(global.fromAuthChange);
  const [isLoader, setIsLoader] = useState(false);
  const onFormFieldValueChange = (formField, value) => {
    var newFieldsDict = alteredFormDict;
    newFieldsDict[formField.key] = value;
    setAlteredFormDict(newFieldsDict);
    onFormChange(newFieldsDict);
  };

  const renderSwitchField = (switchField) => {
    return (
      <View
        style={[styles.settingsTypeContainer, styles.appSettingsTypeContainer]}
      >
        <Text style={styles.text}>{switchField.displayName}</Text>
        <Switch
          value={computeValue(switchField)}
          onValueChange={(value) => onFormFieldValueChange(switchField, value)}
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />
      </View>
    );
  };

  const renderTextField = (formTextField, index, totalLen) => {
    return (
      <View>
        <View
          style={[
            styles.settingsTypeContainer,
            styles.appSettingsTypeContainer,
          ]}
        >
          <Text style={styles.text}>{formTextField.displayName}</Text>
          <TextInput
            underlineColorAndroid="transparent"
            style={[
              styles.text,
              { textAlign: "right", flex: 1, marginLeft: 20 },
            ]}
            editable={
              props.initialValuesDict.isBarber ? formTextField.editable : true
            }
            onChangeText={(text) => {
              onFormFieldValueChange(formTextField, text);
            }}
            placeholderTextColor={styles.placeholderTextColor}
            placeholder={formTextField.placeholder}
            value={computeValue(formTextField)}
          />
        </View>
        {index < totalLen - 1 && <View style={styles.divider} />}
      </View>
    );
  };

  const renderButtonField = (buttonField) => {
    return (
      <TouchableOpacity
        onPress={() => onFormButtonPress(buttonField)}
        style={[styles.settingsTypeContainer, styles.appSettingsSaveContainer]}
      >
        <Text style={styles.settingsType}>{buttonField.displayName}</Text>
      </TouchableOpacity>
    );
  };

  const onSelectFieldPress = (selectField, ref) => {
    ref.current.show();
  };

  const onActionSheetValueSelected = (selectField, selectedIndex) => {
    if (selectedIndex < selectField.options.length) {
      const newValue = selectField.options[selectedIndex];
      onFormFieldValueChange(selectField, newValue);
    }
  };

  const renderSelectField = (selectField) => {
    const actionSheetRef = React.createRef();
    return (
      <TouchableOpacity
        onPress={() => onSelectFieldPress(selectField, actionSheetRef)}
        style={[styles.settingsTypeContainer, styles.appSettingsTypeContainer]}
      >
        <Text style={styles.text}>{selectField.displayName}</Text>
        <Text style={styles.text}>{computeValue(selectField)}</Text>
        <ActionSheet
          ref={actionSheetRef}
          title={selectField.displayName}
          options={[...selectField.displayOptions, IMLocalized("Cancel")]}
          cancelButtonIndex={selectField.displayOptions.length}
          onPress={(selectedIndex) =>
            onActionSheetValueSelected(selectField, selectedIndex)
          }
        />
      </TouchableOpacity>
    );
  };

  const renderField = (formField, index, totalLen) => {
    const type = formField.type;
    if (type == "text") {
      return renderTextField(formField, index, totalLen);
    }
    if (type == "switch") {
      return renderSwitchField(formField);
    }
    if (type == "button") {
      return renderButtonField(formField);
    }
    if (type == "select") {
      return renderSelectField(formField);
    }
    return null;
  };

  const renderSection = (section) => {
    return (
      <View>
        <View style={styles.settingsTitleContainer}>
          <Text style={styles.settingsTitle}>{section.title}</Text>
        </View>
        <View style={styles.contentContainer}>
          {section.fields.map((field, index) =>
            renderField(field, index, section.fields.length)
          )}
        </View>
      </View>
    );
  };

  const displayValue = (field, value) => {
    if (!field.displayOptions || !field.options) {
      return value;
    }
    for (var i = 0; i < field.options.length; ++i) {
      if (i < field.displayOptions.length && field.options[i] == value) {
        return field.displayOptions[i];
      }
    }
    return value;
  };

  const deactivateEmail = (email) => {
    //firebase.auth().onAuthStateChanged((user) => {
    const user = firebase.auth().currentUser;
    let isEmailAccSecond =
      user.providerData[0].providerId == "phone" ? true : false;
    if (user && isEmailAccSecond) {
      user.providerData.map((item) => {
        if (item.email) {
          unLinkAccount(user, item.providerId);
        }
      });
    }
    //});
  };

  const deactivateMobile = (mobile) => {
    //firebase.auth().onAuthStateChanged((user) => {
    const user = firebase.auth().currentUser;
    let isPhoneAccSecond =
      user.providerData[0].providerId == "password" ? true : false;
    if (user && isPhoneAccSecond) {
      user.providerData.map((item) => {
        if (item.phoneNumber) {
          unLinkAccount(user, item.providerId);
        } else {
          alert("Your mobile number is alredy deactivated!");
        }
      });
    }
    //});
  };

  const activatEmail = (email) => {
    setisEmailActivating(true);
    setIsVisibleOTP(true);
  };
  const submitEmailPass = () => {
    setIsLoader(true);
    var passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    if (password.length < 6) {
      Alert.alert("Password should be atleast 6 alphanumeric character");
      setIsLoader(false);
    } else {
      if (password.match(passw)) {
        let email = props.initialValuesDict.email;
        var credential = firebase.auth.EmailAuthProvider.credential(
          email,
          password
        );
        firebase
          .auth()
          .currentUser.linkWithCredential(credential)
          .then(
            function(usercred) {
              let isSecondAccountActive = true;
              updateFlagOnFirebase(isSecondAccountActive);
            },
            function(error) {
              setIsLoader(false);
              setDisplayMsg(error.message);
            }
          );
      } else {
        Alert.alert(
          "Password should be 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter"
        );
        setIsLoader(false);
      }
    }
  };

  const unLinkAccount = (user, providerId) => {
    user
      .unlink(providerId)
      .then(function() {
        let isSecondAccountActive = false;
        updateFlagOnFirebase(isSecondAccountActive);
        alert("Your account is deactivated successfully!");
      })
      .catch(function(error) {
        console.log("Your account is unlink", error);
      });
  };

  const sendOTP = (mobile) => {
    console.log("mobile", mobile);
    verifyPhone(mobile);
  };

  const validatePhoneNumber = (mobile) => {
    var regexp = /^\+[0-9]?()[0-9](\s|\S)(\d[0-9]{8,16})$/;
    return regexp.test(mobile);
  };

  const verifyPhone = (phnumber) => {
    authManager.sendSMSToPhoneNumber(phnumber).then((resp) => {
      if (resp.confirmationResult) {
        setIsVisibleOTP(true);
        setVerificationId(resp.confirmationResult._verificationId);
      } else {
        alert("Your mobile number is invalid");
      }
    });
  };

  const onFinishCheckingCode = (newCode) => {
    let credential = firebase.auth.PhoneAuthProvider.credential(
      verificationId,
      newCode
    );

    firebase
      .auth()
      .currentUser.linkWithCredential(credential)
      .then(
        function(usercred) {
          var user = usercred.user;
          let isSecondAccountActive = true;
          updateFlagOnFirebase(isSecondAccountActive);
          setTimeout(() => {
            setIsVisibleOTP(false);
          }, 3000);
        },
        function(error) {
          setDisplayMsg(error.message);
        }
      );
  };

  const updateFlagOnFirebase = (isSecondAccountActive) => {
    setIsLoader(false);
    let newData = props.initialValuesDict;
    newData["isSecondAccountActive"] = isSecondAccountActive;
    firebaseUser.updateUserData(newData.id, newData);
    setDisplayMsg("Your account successfully linked.");
  };

  const Close = () => (
    <TouchableOpacity
      onPress={() => {
        setIsVisibleOTP(false);
        setPassword("");
        setDisplayMsg("");
      }}
      style={{ alignSelf: "flex-end", marginBottom: 16 }}
    >
      <Text style={{ color: "#333", fontFamily: AppStyles.fontName.bold }}>
        Close
      </Text>
    </TouchableOpacity>
  );

  const Loader = () => (
    <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 16 }} />
  );

  const computeValue = (field) => {
    if (alteredFormDict[field.key] != null) {
      return displayValue(field, alteredFormDict[field.key]);
    }
    if (initialValuesDict[field.key] != null) {
      return displayValue(field, initialValuesDict[field.key]);
    }
    return displayValue(field, field.value);
  };

  //console.log("form.sections", props.initialValuesDict)
  let isBarberForEmail = props.initialValuesDict.isBarber;
  let phone = props.initialValuesDict.phone || null;
  let email = props.initialValuesDict.email || null;
  //console.log("Is Present email:", email)

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {form.sections.map((section) => renderSection(section))}

      {isBarberForEmail
        ? phone && (
            <TouchableOpacity
              style={{
                margin: 16,
                alignSelf: "center",
                backgroundColor: "green",
                padding: 16,
              }}
              onPress={() =>
                initialValuesDict.isSecondAccountActive
                  ? deactivateMobile(phone)
                  : sendOTP(phone)
              }
            >
              <Text style={[{ color: "#FFF" }]}>
                {initialValuesDict.isSecondAccountActive
                  ? "Deactivate"
                  : "Activate"}{" "}
                your mobile for login
              </Text>
            </TouchableOpacity>
          )
        : email && (
            <TouchableOpacity
              style={{
                margin: 16,
                alignSelf: "center",
                backgroundColor: "green",
                padding: 16,
              }}
              onPress={() =>
                initialValuesDict.isSecondAccountActive
                  ? deactivateEmail(email)
                  : activatEmail(email)
              }
            >
              <Text style={[{ color: "#FFF" }]}>
                {initialValuesDict.isSecondAccountActive
                  ? "Deactivate"
                  : "Activate"}{" "}
                your email for login
              </Text>
            </TouchableOpacity>
          )}

      <Modal
        animationType={"slide"}
        transparent={false}
        visible={isVisibleOTP}
        onRequestClose={() => {
          console.log("Modal has been closed.");
        }}
      >
        <View
          style={{ justifyContent: "center", alignItems: "center", margin: 50 }}
        >
          <Close />
          {isEmailActivating ? (
            <View>
              <Text
                style={{
                  alignSelf: "center",
                  fontFamily: AppStyles.fontName.bold,
                }}
              >
                Please add password
              </Text>

              <View style={{ marginTop: 32 }}>
                <Text style={[styles.text]}>Password</Text>
                <TextInput
                  style={[
                    styles.text,
                    { borderWidth: 1, padding: 8, borderRadius: 5 },
                  ]}
                  secureTextEntry={true}
                  editable={true}
                  onChangeText={(text) => {
                    setPassword(text);
                  }}
                  placeholderTextColor={styles.placeholderTextColor}
                  placeholder="Enter password"
                  value={password}
                />
                {isLoader ? (
                  <Loader />
                ) : (
                  <Text
                    style={[
                      {
                        fontFamily: AppStyles.fontName.bold,
                        fontSize: 14,
                        color: "#333",
                        marginTop: 16,
                        lineHeight: 21,
                      },
                    ]}
                  >
                    {displayMsg}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => {
                    submitEmailPass();
                  }}
                  style={{
                    backgroundColor: "#000",
                    padding: 10,
                    alignItems: "center",
                    marginTop: 16,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFF",
                      fontFamily: AppStyles.fontName.bold,
                    }}
                  >
                    Activate
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text
                style={{
                  alignSelf: "center",
                  fontFamily: AppStyles.fontName.bold,
                }}
              >
                Can you please add OTP
              </Text>
              <CodeField
                inputPosition="full-width"
                variant="border-b"
                codeLength={6}
                size={50}
                space={8}
                keyboardType="numeric"
                cellProps={{ style: styles.input }}
                containerProps={{ style: styles.codeFieldContainer }}
                onFulfill={onFinishCheckingCode}
              />
              <Text
                style={[
                  {
                    fontFamily: AppStyles.fontName.bold,
                    fontSize: 14,
                    color: "#333",
                    marginTop: 16,
                    lineHeight: 21,
                  },
                ]}
              >
                {displayMsg}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsVisibleOTP(false);
                }}
                style={{
                  backgroundColor: "#000",
                  padding: 10,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text
                  style={{ color: "#FFF", fontFamily: AppStyles.fontName.bold }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

IMFormComponent.propTypes = {
  onFormChange: PropTypes.func,
};

export default IMFormComponent;
