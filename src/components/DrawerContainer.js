import React from 'react';
import { StyleSheet, View , Alert} from 'react-native';
import { connect } from 'react-redux';
import MenuButton from '../components/MenuButton';
import { AppIcon } from '../AppStyles';
import authManager from "../Core/onboarding/utils/authManager";
import DynamicAppStyles from "../DynamicAppStyles";
import ListingAppConfig from "../ListingAppConfig";
import { logout, setUserData } from '../Core/onboarding/redux/auth';

class DrawerContainer extends React.Component {

  constructor(props) {
    super(props);

    
  }
  render() {
    return (
      <View style={styles.content}>
        <View style={styles.container}>
          <MenuButton
            title="LOG OUT"
            source={AppIcon.images.logout}
            onPress={() => {
              // alert(JSON.stringify(this.props))
              // this.props.navigation.dispatch({ type: 'Logout' });
              authManager.logout(this.props.user);
            this.props.logout();
            this.props.navigation.navigate("LoadScreen", {
              appStyles: DynamicAppStyles,
              appConfig: ListingAppConfig
            });
            }}
          />
        </View>
      </View>
    );
  }
}



const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: "rgb(231, 193, 146)",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    backgroundColor:'rgb(231, 193, 146)'
  }
});

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(mapStateToProps, {
  logout,
})(DrawerContainer);
