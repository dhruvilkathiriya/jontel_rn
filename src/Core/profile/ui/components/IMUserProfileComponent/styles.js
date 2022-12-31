import { Dimensions } from 'react-native';
import { DynamicStyleSheet } from 'react-native-dark-mode';
import { AppStyles } from "../../../../../AppStyles"
const { height } = Dimensions.get('window');
const imageSize = height * 0.14;

const dynamicStyles = appStyles => {
  return new DynamicStyleSheet({
    container: {
      flex: 1,
      // alignItems: 'center',
      backgroundColor: appStyles.colorSet.mainThemeBackgroundColor,
      overflow: 'scroll'
    },
    buttonContainer: {
      width: '98%',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'scroll'
    },
    imageContainer: {
      height: imageSize,
      width: imageSize,
      marginTop: 50,
      marginRight:20
    },
    closeButton: {
      alignSelf: 'flex-end',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      marginRight: 15,
      backgroundColor: appStyles.colorSet.grey0,
      width: 28,
      height: 28,
      borderRadius: 20,
      overflow: 'hidden',
    },
    closeIcon: {
      width: 27,
      height: 27,
    },
    userName: {
      marginTop: 5,
      color: 'rgb(152,152,152)',
      fontSize: 18,
      fontWeight:'700',
      marginBottom: 0,
      fontFamily: AppStyles.fontName.main,
      marginLeft:10,
      textAlign:'left'
    },
    logout: {
      width: '80%',
      borderWidth: 1,
      color: 'white',
      fontSize: 15,
      marginVertical: 20,
      padding: 20,
      borderColor: appStyles.colorSet.grey3,
      borderRadius: 0,
      textAlign: 'center',
      fontFamily: AppStyles.fontName.main,
      backgroundColor:'rgb(231, 193, 146)'
    },
    profileImage:{
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'flex-start',
      marginLeft:10
    }
  })
};

export default dynamicStyles;
