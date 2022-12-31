import React, { Component } from "react";
import {
  BackHandler,
  Linking,
  Alert,
  View,
  Text,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import { IMLocalized } from "../../../localization/IMLocalization";
import IMFormComponent from "../IMFormComponent/IMFormComponent";
import Communications from "react-native-communications";
import Icon from "react-native-vector-icons/FontAwesome";

class IMContactUsScreen extends Component {
  static navigationOptions = ({ screenProps, navigation }) => {
    let appStyles = navigation.state.params.appStyles;
    let screenTitle =
      navigation.state.params.screenTitle || IMLocalized("Contact Us");
    let currentTheme = appStyles.navThemeConstants[screenProps.theme];
    return {
      title: screenTitle,
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
      headerRight: <View style={{ width: 35 }} />,
      headerTitleStyle: {
        color: "#FFFFFF",
        textAlign: "center",
        alignItems: "center",
        flex: 1,
        marginRight: 20,
      },
      headerStyle: {
        backgroundColor: "#000000",
      },
      headerTintColor: currentTheme.fontColor,
    };
  };

  constructor(props) {
    super(props);

    this.appStyles = props.navigation.getParam("appStyles") || props.appStyles;
    this.form = props.navigation.getParam("form") || props.form;
    this.phone = props.navigation.getParam("phone") || props.phone;
    this.initialValuesDict = {};

    this.state = {
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

  onFormButtonPress = (_buttonField) => {
    if (_buttonField.key == "email") {
      // Alert.alert("Email", _buttonField.value)
      Communications.email(
        [_buttonField.value],
        null,
        null,
        "My Subject",
        "My body text"
      );
    } else {
      Linking.openURL(_buttonField.value);
    }

    //Linking.openURL(`tel:${this.phone}`)
  };

  render() {
    return (
      // <IMFormComponent
      //   form={this.form}
      //   initialValuesDict={this.initialValuesDict}
      //   navigation={this.props.navigation}
      //   appStyles={this.appStyles}
      //   onFormButtonPress={this.onFormButtonPress}
      // />
      <View style={{ flex: 1, alignItems: "center" }}>
        <TouchableWithoutFeedback
          onPress={() => {
            Communications.phonecall("18336700349", true);
          }}
        >
          <View
            style={{
              height: 55,
              width: Dimensions.get("window").width - 80,
              borderColor: "#84C1BA",
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: "rgb(152,152,152)",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Call Us
            </Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback
          onPress={() => {
            Communications.email(
              ["support@blackmdcares.zendesk.com"],
              null,
              null,
              "My Subject",
              "My body text"
            );
          }}
        >
          <View
            style={{
              height: 55,
              width: Dimensions.get("window").width - 80,
              borderColor: "#84C1BA",
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: "rgb(152,152,152)",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              E-mail Us
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

export default IMContactUsScreen;
