import { DynamicStyleSheet } from 'react-native-dark-mode';
import { AppStyles } from "../../../../AppStyles"
const dynamicStyles = appStyles => {
  return new DynamicStyleSheet({
    container: {
      flex: 1,
      backgroundColor: appStyles.colorSet.whiteSmoke,
    },
    //Profile Settings
    settingsTitleContainer: {
      width: '100%',
      height: 55,
      justifyContent: 'flex-end',
    },
    settingsTitle: {
      color: appStyles.colorSet.mainSubtextColor,
      paddingLeft: 10,
      fontSize: 18,
      paddingBottom: 6,
      fontWeight: '500',
      fontFamily: AppStyles.fontName.main
    },
    settingsTypesContainer: {
      backgroundColor: appStyles.colorSet.mainThemeBackgroundColor,
    },
    settingsTypeContainer: {
      borderBottomColor: appStyles.colorSet.whiteSmoke,
      borderBottomWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: 50,
    },
    settingsType: {
      color: appStyles.colorSet.mainThemeForegroundColor,
      fontSize: 18,
      fontWeight: '500',
      fontFamily: AppStyles.fontName.main
    },

    //Edit Profile
    contentContainer: {
      width: '100%',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: appStyles.colorSet.hairlineColor,
      backgroundColor: appStyles.colorSet.mainThemeBackgroundColor,
    },
    divider: {
      height: 0.5,
      width: '96%',
      alignSelf: 'flex-end',
      backgroundColor: appStyles.colorSet.hairlineColor,
    },
    text: {
      fontSize: 16,
      color: appStyles.colorSet.mainTextColor,
      fontFamily: AppStyles.fontName.main
    },

    //app Settings
    appSettingsTypeContainer: {
      flexDirection: 'row',
      borderBottomWidth: 0,
      justifyContent: 'space-between',
      paddingHorizontal: 15,
    },
    appSettingsSaveContainer: {
      marginTop: 4,
      height: 45,
      backgroundColor: appStyles.colorSet.mainThemeBackgroundColor,
    },
    placeholderTextColor: { color: appStyles.colorSet.hairlineColor },
    input: {
      flex: 1,
      borderLeftWidth: 1,
      borderRadius: 3,
      borderColor: appStyles.colorSet.grey3,
      color: appStyles.colorSet.mainTextColor,
      fontSize: 17,
      fontWeight: '700',
      backgroundColor: appStyles.colorSet.mainThemeBackgroundColor,
    },
    codeFieldContainer: {
      borderWidth: 1,
      borderColor: appStyles.colorSet.grey3,
      width: '80%',
      height: 42,
      marginTop: 30,
      alignSelf: 'center',
      borderRadius: 25,
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: appStyles.colorSet.mainThemeBackgroundColor,
    },
  })
};

export default dynamicStyles;
