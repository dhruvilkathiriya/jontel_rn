import React, { Component } from "react";
import {
  BackHandler,
  View,
  Linking,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { connect } from "react-redux";
import { AppIcon, HeaderButtonStyle } from "../AppStyles";
import authManager from "../Core/onboarding/utils/authManager";
import DynamicAppStyles from "../DynamicAppStyles";
import ListingAppConfig from "../ListingAppConfig";
import { IMUserProfileComponent } from "../Core/profile";
import { logout, setUserData } from "../Core/onboarding/redux/auth";
import { IMLocalized } from "../Core/localization/IMLocalization";
// import { ScrollView } from "react-native-gesture-handler";
import HeaderButton from "../components/HeaderButton";
import Icon from "react-native-vector-icons/FontAwesome";

class MyProfileScreen extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: IMLocalized("My Profile"),
    headerStyle: {
      backgroundColor: "black",
    },
    headerTitleStyle: {
      color: "white",
      textAlign: "center",
      alignItems: "center",
      flex: 1,
    },
    headerLeft: (
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <View style={HeaderButtonStyle.multi}>
          {/* <HeaderButton
    
      customStyle={{marginRight: 13,
        marginLeft: 7}}
      icon={DynamicAppStyles.iconSet.back}
      onPress={() => {
        navigation.goBack()
      }}
    /> */}
          <Icon
            name="angle-left"
            size={30}
            color={"white"}
            style={{ marginLeft: 10 }}
          />
        </View>
      </TouchableOpacity>
    ),
    headerRight: (
      <View style={HeaderButtonStyle.multi}>
        <HeaderButton
          customStyle={{
            marginRight: 13,
            marginLeft: 7,
          }}
          icon={DynamicAppStyles.iconSet.search}
          onPress={() => {
            navigation.navigate("Search", {});
          }}
        />
      </View>
    ),
  });

  constructor(props) {
    super(props);

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

  onLogout() {
    authManager.logout(this.props.user);
    this.props.logout();
    this.props.navigation.navigate("LoadScreen", {
      appStyles: DynamicAppStyles,
      appConfig: ListingAppConfig,
    });
  }

  onUpdateUser = (newUser) => {
    this.props.setUserData({
      user: newUser,
      isBarber: this.props.user.isBarber,
    });
    console.log("here data comes", this.props.isBarber);
  };

  render() {
    var menuItems = [
      {
        title: IMLocalized("My Favorites"),
        tintColor: "#84C1BA",
        icon: AppIcon.images.heart,

        onPress: () => this.props.navigation.navigate("SavedListingModal"),
      },
      {
        title: IMLocalized("Account Details"),
        icon: AppIcon.images.account,
        tintColor: "#84C1BA",
        onPress: () =>
          this.props.navigation.navigate("AccountDetail", {
            appStyles: DynamicAppStyles,
            form: ListingAppConfig.editProfileFields,
            screenTitle: IMLocalized("Edit Profile"),
          }),
      },
      {
        title: IMLocalized("Submit a doctor"),
        icon: AppIcon.images.doctor,
        tintColor: "#84C1BA",
        onPress: () => {
          Linking.openURL(
            "https://docs.google.com/forms/d/1NK7BgIjsHvGpmgayAdREaj52Ln0aO5ytg3RYHN0RXfM/viewform?edit_requested=true"
          );
        },
      },
      {
        title: IMLocalized("Settings"),
        icon: AppIcon.images.setting,
        tintColor: "#84C1BA",
        onPress: () =>
          this.props.navigation.navigate("Settings", {
            appStyles: DynamicAppStyles,
            form: ListingAppConfig.userSettingsFields,
            screenTitle: IMLocalized("Settings"),
          }),
      },
      {
        title: IMLocalized("Contact Us"),
        icon: AppIcon.images.phone,
        tintColor: "#84C1BA",
        onPress: () =>
          this.props.navigation.navigate("Contact", {
            appStyles: DynamicAppStyles,
            form: ListingAppConfig.contactUsFields,
            screenTitle: IMLocalized("Contact us"),
          }),
      },
    ];

    if (this.props.isBarber) {
      menuItems.push({
        title: IMLocalized("My Listings"),
        icon: AppIcon.images.listt,
        tintColor: "#84C1BA",
        // icon: AppIcon.images.list,
        onPress: () => this.props.navigation.navigate("MyListingModal"),
      });
    }
    if (this.props.isAdmin) {
      menuItems.push({
        title: IMLocalized("Admin Dashboard"),
        tintColor: "#84C1BA",
        icon: AppIcon.images.admin,
        onPress: () => this.props.navigation.navigate("AdminDashboard"),
      });
    }
    menuItems.push(
      {
        title: IMLocalized("Our Store"),
        icon: AppIcon.images.store,
        tintColor: "#84C1BA",
        onPress: () => {
          Linking.openURL("https://www.blackmdcares.com/blackmdstore");
        },
      },
      {
        title: IMLocalized("Privacy Policy"),
        icon: AppIcon.images.privacy,
        tintColor: "#84C1BA",
        onPress: () => {
          Linking.openURL(
            "https://app.termly.io/document/privacy-policy/bd14fb10-3e95-4dcb-b29e-b9b5fdfeb6bc"
          );
        },
      },
      {
        title: IMLocalized("Terms of Service"),
        icon: AppIcon.images.terms,
        tintColor: "#84C1BA",
        onPress: () => {
          Linking.openURL(
            "https://app.termly.io/document/terms-of-use-for-website/cd671cb2-5cb7-4932-b399-430f19d474a0"
          );
        },
      },
      {
        title: IMLocalized("Disclaimer"),
        icon: AppIcon.images.info,
        tintColor: "#84C1BA",
        onPress: () => {
          Linking.openURL(
            "https://app.termly.io/document/disclaimer/c5353e60-8604-4ed3-9fae-29a54881da42"
          );
        },
      },
      {
        title: IMLocalized("About Us"),
        icon: AppIcon.images.about,
        tintColor: "#84C1BA",
        onPress: () => {
          Linking.openURL("https://www.blackmdcares.com");
        },
      }
    );

    return (
      <ScrollView style={{ flex: 1, overflow: "scroll" }}>
        <IMUserProfileComponent
          tintColor="#84C1BA"
          user={this.props.user}
          onUpdateUser={(user) => this.onUpdateUser(user)}
          onLogout={() => this.onLogout()}
          menuItems={menuItems}
          appStyles={DynamicAppStyles}
        />
      </ScrollView>
    );
  }
}

const mapStateToProps = ({ auth }) => {
  return {
    user: auth.user,
    isAdmin: auth.user && auth.user.isAdmin,
    isBarber: auth.user && auth.user.isBarber,
  };
};

export default connect(mapStateToProps, {
  logout,
  setUserData,
})(MyProfileScreen);
