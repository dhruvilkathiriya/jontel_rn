import { DynamicStyleSheet } from 'react-native-dark-mode';
import { AppStyles } from "../../../AppStyles"
const dynamicStyles = (appStyles) => {
    return new DynamicStyleSheet({
        title: {
            fontSize: 25,
            fontWeight: "bold",
            textAlign: "center",
            paddingBottom: 25,
            color: 'white'
        },
        text: {
            fontSize: 18,
            textAlign: "center",
            color: 'white',
            paddingLeft: 10,
            paddingRight: 10,
            fontFamily: AppStyles.fontName.main
        },
        image: {
            width: 100,
            height: 100,
            marginBottom: 60,
            tintColor: "white"
        },
        container: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: appStyles.colorSet.mainThemeForegroundColor,
        },
        button: {
            fontSize: 18,
            color: 'white',
            marginTop: 10
        }
    })
};

export default dynamicStyles;
