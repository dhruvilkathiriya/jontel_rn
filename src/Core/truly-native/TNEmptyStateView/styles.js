import { DynamicStyleSheet } from 'react-native-dark-mode';
import { AppStyles } from "../../../AppStyles"
const dynamicStyles = (appStyles) => {
  return new DynamicStyleSheet({
    title: {
      fontSize: 30,
      fontWeight: 'bold',
      alignSelf: 'center',
      color: appStyles.colorSet.mainTextColor,
      marginBottom: 15,
      fontFamily: AppStyles.fontName.main
    },
    description: {
      alignSelf: 'center',
      color: appStyles.colorSet.mainTextColor,
      textAlign: 'center',
      width: '85%',
      lineHeight: 20,
    },
    buttonContainer: {
      backgroundColor: appStyles.colorSet.mainThemeForegroundColor,
      width: '75%',
      height: 45,
      alignSelf: 'center',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 30,
    },
    buttonName: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600'
    },
  })
};

export default dynamicStyles;
