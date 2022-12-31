import React, { useState, useEffect, useRef } from 'react';
import firebase from 'react-native-firebase';
import { Text, View, TextInput, Alert, Image, TouchableOpacity, BackHandler, ActivityIndicator, Dimensions, Modal } from 'react-native';
import ActionSheet from 'react-native-actionsheet';
import Button from 'react-native-button';
import PhoneInput from 'react-native-phone-input';
import CodeField from 'react-native-confirmation-code-field';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDynamicStyleSheet } from 'react-native-dark-mode';
import dynamicStyles from './styles';
import TNActivityIndicator from '../../truly-native/TNActivityIndicator';
import TNProfilePictureSelector from '../../truly-native/TNProfilePictureSelector/TNProfilePictureSelector';
import CountriesModalPicker from '../../truly-native/CountriesModalPicker/CountriesModalPicker';
import { IMLocalized } from '../../localization/IMLocalization';
import { setUserData } from '../redux/auth';
import { connect } from 'react-redux';
import authManager from '../utils/authManager';
import { localizedErrorMessage } from '../utils/ErrorCode';
import TermsOfUseView from '../components/TermsOfUseView';
import CountryPicker from 'react-native-country-picker-modal'

import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';
import { AppStyles } from "../../../AppStyles"
const SmsAuthenticationScreen = props => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPhoneVisible, setIsPhoneVisible] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState(false);
  const [countriesPickerData, setCountriesPickerData] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const [profilePictureURL, setProfilePictureURL] = useState(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [setActionSheet, setSetActionSheet] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [countryCode, setCountryCode] = useState('US')
  const [withCallingCodeButton, setwithCallingCodeButton] = useState(true)
  const [contact, setContact] = useState('')
  const withFlagButton = false
  const [country, setCountry] = useState("1")
  const [withCallingCode, setWithCallingCode] = useState(true)
  const onSelect = (country) => {
    setCountryCode(country.cca2)
    setCountry(country.callingCode[0])
    console.log('codeeeeeeeee', country)//cca2
  }
  const myCodeInput = useRef(null);
  const phoneRef = useRef(null);
  const appStyles =
    props.navigation.state.params.appStyles || props.navigation.getParam('appStyles');
  const styles = useDynamicStyleSheet(dynamicStyles(appStyles));
  const appConfig =
    props.navigation.state.params.appConfig || props.navigation.getParam('appConfig');
  const { isSigningUp } = props.navigation.state.params;
  const [isBarber, setIsBarber] = useState(false);
  const showActionSheet = () => {
    this.ActionSheet.show()
    setSetActionSheet(true)
  }

  const usersRef = firebase
    .firestore()
    .collection("users");

  onActionDone = index => {
    if (index == 0) {
      Alert.alert(
        IMLocalized("Sign up with email!"),
        IMLocalized("Please create an account with your email address. You can add a phone number in 'Edit Profile'."),
        [
          {
            text: IMLocalized("Ok!"),
            onPress: setBarberTrue = () => {
              props.navigation.navigate('Signup', { appStyles, appConfig })
            }
          },
        ],
        { cancelable: true }
      );
    }
  };

  useEffect(() => {
    console.log('Now here!!')
    if (phoneRef && phoneRef.current) {
      setCountriesPickerData(phoneRef.current.getPickerData());
    }
  }, [phoneRef]);



  const onFBButtonPress = () => {
    authManager
      .loginOrSignUpWithFacebook(appConfig.appIdentifier)
      .then(response => {
        if (response.user) {
          const user = response.user;
          props.setUserData({ user });
          props.navigation.navigate('MainStack', { user: user });
        } else {
          Alert.alert('', localizedErrorMessage(response.error), [{ text: IMLocalized('OK') }], {
            cancelable: false,
          });
        }
      });
  }

  const handleBackButtonClick = () => {
    console.log('backhandler click')
    props.navigation.goBack();
    return true;
  }

  useEffect(() => {

    const subscriber = firebase.auth().onAuthStateChanged((user) => {
      if (user != null) {
        usersRef
          .doc(user.uid)
          .get()
          .then(function (firestoreDocument) {
            if (!firestoreDocument.exists) {
              console.log('Something Went Wrong')
              return;
            }
            const userData = firestoreDocument.data();
            props.setUserData({ user: userData });
            props.navigation.navigate('MainStack', { user: userData });
          })
      }
    });
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    // return () => {
    //   BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick);
    // };
    return subscriber; // unsubscribe on unmount
  }, []);


  const signInWithPhoneNumber = userValidPhoneNumber => {
    setLoading(true);
    authManager
      .sendSMSToPhoneNumber(userValidPhoneNumber)
      .then(response => {
        console.log("response in signin with phone", response)
        const confirmationResult = response.confirmationResult;
        if (confirmationResult) {
          // SMS sent. Prompt user to type the code from the message, then sign the
          // user in with confirmationResult.confirm(code).
          window.confirmationResult = confirmationResult;
          console.log("window.confirmationResult", JSON.stringify(window.confirmationResult.verificationId))
          setVerificationId(confirmationResult.verificationId);
          setIsPhoneVisible(false);
          setLoading(false);
        } else {
          // Error; SMS not sent
          setLoading(false);
          Alert.alert('', localizedErrorMessage(response.error), [{ text: IMLocalized('OK') }], { cancelable: false });
        }
      })
  };

  const signUpWithPhoneNumber = (smsCode) => {
    const userDetails = {
      firstName,
      lastName,
      isBarber: isBarber,
      phone: phoneNumber,
      photoURI: profilePictureURL
    }
    setLoading(true);
    authManager
      .registerWithPhoneNumber(userDetails, smsCode, verificationId, appConfig.appIdentifier)
      .then(response => {
        console.log('herere err')
        if (response.error) {
          Alert.alert('', localizedErrorMessage(response.error), [{ text: IMLocalized('OK') }], { cancelable: false });
        } else {
          const user = response.user;
          props.setUserData({ user });
          props.navigation.navigate('MainStack', { user: user });
        }
        setLoading(false);
      })
  }

  const onPressSend = () => {
    console.log('number', '+' + country + contact);
    if (contact.length == 10) {
      const userValidPhoneNumber = '+' + country + contact;
      console.log('valid number', userValidPhoneNumber);
      setLoading(true);
      setPhoneNumber(userValidPhoneNumber);
      if (!isSigningUp) {
        // If this is a login attempt, we first need to check that the user associated to this phone number exists
        authManager
          .retrieveUserByPhone(userValidPhoneNumber)
          .then(response => {
            console.log('response get data', response);
            if (response.success) {
              signInWithPhoneNumber(userValidPhoneNumber);
            } else {
              console.log('Not Authorized!!');
              setPhoneNumber(null);
              setLoading(false);
              Alert.alert(
                '',
                IMLocalized('You cannot log in. There is no account with this phone number.'),
                [{ text: IMLocalized('OK') }],
                {
                  cancelable: false,
                }
              );
            }
          })
      } else {
        console.log('valid number', userValidPhoneNumber)
        authManager
          .retrieveUserByPhone(userValidPhoneNumber)
          .then(response => {
            console.log('response get data=====>>>>>>>>>>', response);
            if (response.success) {
              setLoading(false);
              Alert.alert(
                '',
                IMLocalized('Already Account Exist!'),
                [{ text: IMLocalized('OK') }],
                {
                  cancelable: false,
                }
              );

              // signInWithPhoneNumber(userValidPhoneNumber);
            } else {
              console.log('Not found account!!')
              signInWithPhoneNumber(userValidPhoneNumber);
            }
          })

      }
    } else {
      Alert.alert(
        '',
        IMLocalized('Please enter a valid phone number.'),
        [{ text: IMLocalized('OK') }],
        {
          cancelable: false,
        }
      );
    }
  };

  const onPressFlag = () => {
    setCountryModalVisible(true);
  };

  const onPressCancelContryModalPicker = () => {
    setCountryModalVisible(false);
  };

  const onFinishCheckingCode = newCode => {
    setLoading(true);
    console.log("isSigningUp:", isSigningUp)
    if (isSigningUp) {
      signUpWithPhoneNumber(newCode);
    } else {
      authManager
        .loginWithSMSCode(newCode, verificationId)
        .then(response => {
          if (response.error) {
            Alert.alert('', localizedErrorMessage(response.error), [{ text: IMLocalized('OK') }], { cancelable: false });
          } else {
            const user = response.user;
            console.log("SETTING USER DATA:", user)
            props.setUserData({ user });
            props.navigation.navigate('MainStack', { user: user });
          }
          setLoading(false);
        })
    }
  };

  const phoneInputRender = () => {
    return (
      <>
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, height: 45, width: Dimensions.get('window').width - 80, borderColor: 'lightgrey', marginTop: 20 }}>
            <View style={{ padding: 10 }}>
              <CountryPicker
                {...{
                  countryCode,
                  withCallingCode,
                  onSelect,

                  withCallingCodeButton,
                  withFlagButton
                }}
              // visible
              />
            </View>
            <TextInput
              style={{ width: Dimensions.get('window').width - 160, paddingLeft: 20, borderLeftWidth: 1, borderColor: 'lightgrey' }}
              // style={[styles.InputContainer, { fontFamily: AppStyles.fontName.main }]}
              placeholder={IMLocalized('Phone Number')}
              placeholderTextColor="#aaaaaa"
              onChangeText={text => setContact(text)}
              value={contact}
              underlineColorAndroid="transparent"
              keyboardType={'number-pad'}
              maxLength={10}
            />
          </View>
        </View>

        {/* <PhoneInput
          style={styles.InputContainer}
          flagStyle={styles.flagStyle}
          textStyle={styles.phoneInputTextStyle}
          ref={phoneRef}
          onPressFlag={()=>onPressFlag()}
          offset={10}
          allowZeroAfterCountryCode
          textProps={{ placeholder: IMLocalized('Phone number'), placeholderTextColor: '#aaaaaa' }}
        /> */}
        {/* {countriesPickerData ?
          <CountriesModalPicker
            data={countriesPickerData}
            appStyles={appStyles}
            onChange={country => {
              selectCountry(country);
            }}
            cancelText={IMLocalized('Cancel')}
            visible={countryModalVisible}
            onCancel={onPressCancelContryModalPicker}
          /> : <ActivityIndicator size={'small'} />
        } */}
        <Button
          containerStyle={styles.sendContainer}
          style={styles.sendText}
          onPress={() => onPressSend()}
        >
          {IMLocalized('Send code')}
        </Button>
      </>
    );
  };

  const codeInputRender = () => {
    return (
      <>
        <CodeField
          ref={myCodeInput}
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
      </>
    );
  };

  const selectCountry = country => {
    console.log('country code', country);
    phoneRef.current.selectCountry(country.iso2);//changed iso2 to dialCode
  };

  const renderAsSignUpState = () => {
    return (
      <>
        <Text style={[styles.title, { fontFamily: AppStyles.fontName.main }]}>{IMLocalized('Create new account')}</Text>
        <TNProfilePictureSelector
          setProfilePictureURL={setProfilePictureURL}
          appStyles={appStyles}
        />
        <View>
          <Button
            style={styles.sendContainer, { backgroundColor: "#ffffff", margin: 10, fontFamily: AppStyles.fontName.main }}
            onPress={() => setModalVisible(true)}>
            Are you a healthcare provider?
          </Button>
          <ActionSheet
            ref={o => this.ActionSheet = o}
            title={'Are you a black healthcare provider?'}
            options={['Yes', 'No']}
            cancelButtonIndex={1}
            destructiveButtonIndex={1}
            onPress={(index) => { onActionDone(index) }}
          />
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(!modalVisible);
            }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View style={{ height: Dimensions.get('window').height / 3, width: Dimensions.get('window').width, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: AppStyles.fontName.main, fontSize: 18, lineHeight: 19 }}>Are you a healthcare provider?</Text>
                <TouchableOpacity onPress={() => {
                  Alert.alert(
                    IMLocalized("Sign up with email!"),
                    IMLocalized("Please create an account with your email address. You can add a phone number in 'Edit Profile'."),
                    [
                      {
                        text: IMLocalized("Ok!"),
                        onPress: setBarberTrue = () => {
                          props.navigation.navigate('Signup', { appStyles, appConfig })
                        }
                      },
                    ],
                    { cancelable: true }
                  );
                  setModalVisible(false)
                }}>
                  <View style={{ height: 55, width: Dimensions.get('window').width - 80, borderRadius: 40, backgroundColor: 'rgb(231, 193, 146)', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                    <Text style={{ fontFamily: AppStyles.fontName.main, fontSize: 16, lineHeight: 19, color: 'white' }}>Yes</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <View style={{ height: 55, width: Dimensions.get('window').width - 80, borderRadius: 40, backgroundColor: 'rgb(231, 193, 146)', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                    <Text style={{ fontFamily: AppStyles.fontName.main, fontSize: 16, lineHeight: 19, color: 'white' }}>No</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

          </Modal>

        </View>
        <TextInput
          style={[styles.InputContainer, { fontFamily: AppStyles.fontName.main }]}
          placeholder={IMLocalized('First Name')}
          placeholderTextColor="#aaaaaa"
          onChangeText={text => setFirstName(text)}
          value={firstName}
          underlineColorAndroid="transparent"
        />

        <TextInput
          style={[styles.InputContainer, { fontFamily: AppStyles.fontName.main }]}
          placeholder={IMLocalized('Last Name')}
          placeholderTextColor="#aaaaaa"
          onChangeText={text => setLastName(text)}
          value={lastName}
          underlineColorAndroid="transparent"
        />
        {isPhoneVisible ? phoneInputRender() : codeInputRender()}
        <Text></Text>
        <Text style={[styles.orTextStyle, { fontFamily: AppStyles.fontName.main }]}> {IMLocalized('OR')}</Text>
        <Button
          containerStyle={[styles.signWithEmailContainer, { fontFamily: AppStyles.fontName.main }]}
          onPress={() => props.navigation.navigate('Signup', { appStyles, appConfig })}
        >
          {IMLocalized('Sign up with E-mail')}
        </Button>
      </>
    );
  };

  const renderAsLoginState = () => {
    return (
      <>
        <Text style={[styles.title, { fontFamily: AppStyles.fontName.main }]}>{IMLocalized('Sign In')}</Text>
        {isPhoneVisible ? phoneInputRender() : codeInputRender()}
        <Text style={[styles.orTextStyle, { fontFamily: AppStyles.fontName.main }]}> {IMLocalized('OR')}</Text>
        {/* <Button
          containerStyle={styles.facebookContainer}
          style={styles.facebookText}
          onPress={() => onFBButtonPress()}
        >
          {IMLocalized('Login With Facebook')}
        </Button> */}
        <Button
          containerStyle={[styles.signWithEmailContainer, { fontFamily: AppStyles.fontName.main }]}
          onPress={() => props.navigation.navigate('Login', { appStyles, appConfig })}
        >
          {IMLocalized('Sign in with E-mail')}
        </Button>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView style={{ flex: 1, width: '100%' }} keyboardShouldPersistTaps='always'>
        <TouchableOpacity onPress={() => props.navigation.goBack()}>
          <Image style={appStyles.styleSet.backArrowStyle} source={appStyles.iconSet.backArrow} />
        </TouchableOpacity>
        {isSigningUp ? renderAsSignUpState() : renderAsLoginState()}
        {isSigningUp && <TermsOfUseView tosLink={appConfig.tosLink} style={styles.tos} />}
      </KeyboardAwareScrollView>
      {loading && <TNActivityIndicator appStyles={appStyles} />}
    </View>
  );
};

export default connect(null, {
  setUserData
})(SmsAuthenticationScreen);
