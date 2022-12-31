import PropTypes from "prop-types";
import React, { Component, useEffect } from "react";
import { BackHandler, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import TextButton from "react-native-button";
import { firebaseUser } from "../../../firebase";
import IMFormComponent from "../IMFormComponent/IMFormComponent";
import { setUserData } from "../../../onboarding/redux/auth";
import { IMLocalized } from "../../../localization/IMLocalization";
import Icon from "react-native-vector-icons/FontAwesome";

class IMEditProfileScreen extends Component {
  static navigationOptions = ({ screenProps, navigation }) => {
    let appStyles = navigation.state.params.appStyles;
    let screenTitle = navigation.state.params.screenTitle;
    let currentTheme = appStyles.navThemeConstants[screenProps.theme];
    const { params = {} } = navigation.state;

    return {
      headerTitle: screenTitle,
      headerLeft: (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <View style={{ margin: 10 }}>
            <Icon name="angle-left" color="white" size={30} />
          </View>
        </TouchableOpacity>
      ),
      headerRight: (
        <TextButton
          style={{ marginRight: 12, color: "white" }}
          onPress={params.onFormSubmit}
        >
          Done
        </TextButton>
      ),
      headerTitleStyle: {
        color: "#FFFFFF",
        textAlign: "center",
        alignItems: "center",
        flex: 1,
      },
      headerStyle: { backgroundColor: "#000000" },
      headerTintColor: currentTheme.fontColor,
    };
  };

  constructor(props) {
    super(props);
    this.appStyles = props.navigation.getParam("appStyles") || props.appStyles;
    this.form = props.navigation.getParam("form") || props.form;
    this.onComplete =
      props.navigation.getParam("onComplete") || props.onComplete;

    this.state = {
      form: props.form,
      alteredFormDict: {},
    };
    this.didFocusSubscription = props.navigation.addListener(
      "didFocus",
      (payload) =>
        BackHandler.addEventListener(
          "hardwareBackPress",
          this.onBackButtonPressAndroid
        )
    );
  }

  componentDidMount() {
    this.props.navigation.setParams({
      onFormSubmit: this.onFormSubmit,
    });
    this.willBlurSubscription = this.props.navigation.addListener(
      "willBlur",
      (payload) =>
        BackHandler.removeEventListener(
          "hardwareBackPress",
          this.onBackButtonPressAndroid
        )
    );
  }

  componentWillUnmount() {
    this.didFocusSubscription && this.didFocusSubscription.remove();
    this.willBlurSubscription && this.willBlurSubscription.remove();
  }

  onBackButtonPressAndroid = () => {
    this.props.navigation.goBack();
    return true;
  };

  isInvalid = (value, regex) => {
    if (value == true || value == false) {
      const regexResult = regex.test(JSON.stringify(value));

      console.log("regexResult", regexResult, JSON.stringify(value).length);
      if (JSON.stringify(value).length > 0 && regexResult == true) {
        return true;
      }
      if (JSON.stringify(value).length > 0 && regexResult == false) {
        return false;
      }
    } else {
      const regexResult = regex.test(value);

      console.log("regexResult", regexResult, JSON.stringify(value).length);
      if (value.length > 0 && regexResult == true) {
        return true;
      }
      if (value.length > 0 && regexResult == false) {
        return false;
      }
    }
  };

  onFormSubmit = () => {
    var newUser = this.props.user;
    const form = this.form;
    const alteredFormDict = this.state.alteredFormDict;
    var allFieldsAreValid = true;
    // console.log('profile data update', JSON.stringify(form.sections))
    // console.log('alteredform', alteredFormDict);
    form.sections.forEach((section) => {
      // console.log(section)
      section.fields.forEach((field) => {
        // console.log(field.key);
        const newValue = alteredFormDict[field.key];
        console.log("newValue", newValue);
        console.log("field.regex", field);
        if (newValue != null) {
          console.log(
            "now comes",
            field.regex,
            newValue,
            !this.isInvalid(newValue, field.regex)
          );
          if (field.regex && !this.isInvalid(newValue, field.regex)) {
            allFieldsAreValid = false;
          } else {
            newUser[field.key] = alteredFormDict[field.key];
          }
        }
      });
    });
    console.log("allFieldsAreValid", allFieldsAreValid);

    if (allFieldsAreValid) {
      //newUser['isSecondAccountActive'] = true
      console.log("new user", newUser);
      firebaseUser.updateUserData(this.props.user.id, newUser);
      this.props.setUserData({ user: newUser });
      this.props.navigation.goBack();
      if (this.onComplete) {
        this.onComplete();
      }
    } else {
      alert(
        IMLocalized(
          "An error occured while trying to update your account. Please make sure all fields are valid."
        )
      );
    }
  };

  onFormChange = (alteredFormDict) => {
    console.log("onformchange", alteredFormDict);
    this.setState({ alteredFormDict });
  };

  render() {
    return (
      <>
        <IMFormComponent
          form={this.form}
          initialValuesDict={this.props.user}
          onFormChange={this.onFormChange}
          navigation={this.props.navigation}
          appStyles={this.appStyles}
        />
      </>
    );
  }
}

IMEditProfileScreen.propTypes = {
  user: PropTypes.object,
  setUserData: PropTypes.func,
};

const mapStateToProps = ({ auth }) => {
  return {
    user: auth.user,
  };
};

export default connect(mapStateToProps, { setUserData })(IMEditProfileScreen);
