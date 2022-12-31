import { DynamicStyleSheet } from "react-native-dark-mode";
import { Platform } from "react-native";
import { withOrientation } from "react-navigation";
import { AppStyles } from "../../../AppStyles";
const dynamicStyles = (appStyles) => {
  return new DynamicStyleSheet({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
    },
    containerOuter: {
      flex: 1,
      paddingTop: 20,
      backgroundColor: "#FFFFFF",
    },
    logo: {
      width: 250,
      height: 250,
      justifyContent: "center",
      alignItems: "center",
      // marginBottom: 20,
      // marginTop: -100
    },
    logoImage: {
      width: 210,
      height: 310,
      borderRadius: 40,
    },
    title: {
      fontSize: 30,
      fontWeight: "bold",
      color: "rgb(61, 61, 61)",
      marginTop: 20,
      marginBottom: 20,
      textAlign: "center",
      fontFamily: AppStyles.fontName.main,
    },
    caption: {
      fontSize: 16,
      paddingHorizontal: 50,
      marginBottom: 20,
      textAlign: "center",
      color: "rgb(152,152,152)",
      fontFamily: AppStyles.fontName.main,
    },
    loginContainer: {
      width: appStyles.sizeSet.buttonWidth,
      backgroundColor: "#84C1BA",
      borderRadius: appStyles.sizeSet.radius,
      marginTop: 30,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      fontFamily: AppStyles.fontName.main,
    },
    loginText: {
      color: "white",
      fontFamily: AppStyles.fontName.main,
    },
    signupContainer: {
      justifyContent: "center",
      alignItems: "center",
      width: appStyles.sizeSet.buttonWidth,
      backgroundColor: appStyles.colorSet.mainThemeBackgroundColor,
      borderRadius: appStyles.sizeSet.radius,
      borderWidth: Platform.OS === "ios" ? 0.5 : 1.0,
      borderColor: "rgb(61,61,61)",
      marginTop: 20,
      height: 45,
    },
    signupText: {
      color: "rgb(152,152,152)",
      fontFamily: AppStyles.fontName.main,
    },
  });
};

export default dynamicStyles;
