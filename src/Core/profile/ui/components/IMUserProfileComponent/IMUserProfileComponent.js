import React, { useEffect } from "react";
import {
  Text,
  View,
  StatusBar,
  Platform,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import firebase from "react-native-firebase";
import { useDynamicStyleSheet } from "react-native-dark-mode";
import dynamicStyles from "./styles";
import { IMLocalized } from "../../../../localization/IMLocalization";
import IMProfileItemView from "../IMProfileItemView/IMProfileItemView";
import { TNProfilePictureSelector } from "../../../../truly-native";
import { firebaseStorage } from "../../../../firebase/storage";
import { firebaseAuth } from "../../../../firebase";

const IMUserProfileComponent = (props) => {
  const { appStyles, menuItems, onUpdateUser, onLogout } = props;
  const {
    profilePictureURL,
    firstName,
    lastName,
    fullname,
    userID,
  } = props.user;

  const styles = useDynamicStyleSheet(dynamicStyles(appStyles));

  const userRef = firebase
    .firestore()
    .collection("users")
    .doc(props.user.id);

  const onUserProfileUpdate = (querySnapshot) => {
    const data = querySnapshot.data();
    if (data) {
      onUpdateUser(data);
    }
  };

  const displayName = () => {
    if (
      (firstName && firstName.length > 0) ||
      (lastName && lastName.length > 0)
    ) {
      return firstName + " " + lastName;
    }
    return fullname || "";
  };

  useEffect(() => {
    const unsubscribeUserFunction = userRef.onSnapshot(onUserProfileUpdate);
    return () => {
      unsubscribeUserFunction();
    };
  }, []);

  const updateProfilePictureURL = (photoURI) => {
    if (photoURI == null) {
      // Remove profile photo action
      firebaseAuth.updateProfilePhoto(userID, null).then((finalRes) => {
        if (finalRes.success == true) {
          onUpdateUser({ ...props.user, profilePictureURL: null });
        }
      });
      return;
    }
    // If we have a photo, we upload it to Firebase, and then update the user
    firebaseStorage.uploadImage(photoURI).then((response) => {
      if (response.error) {
        // there was an error, fail silently
      } else {
        firebaseAuth
          .updateProfilePhoto(userID, response.downloadURL)
          .then((finalRes) => {
            if (finalRes.success == true) {
              onUpdateUser({
                ...props.user,
                profilePictureURL: response.downloadURL,
              });
            }
          });
      }
    });
  };

  const renderMenuItem = (menuItem) => {
    const { title, icon, onPress, tintColor } = menuItem;
    return (
      <IMProfileItemView
        title={title}
        icon={icon}
        iconStyle={{ tintColor: tintColor }}
        onPress={onPress}
        appStyles={appStyles}
      />
    );
  };

  const myProfileScreenContent = () => {
    return (
      <>
        <View style={styles.container}>
          <StatusBar
          // backgroundColor={useDynamicValue('#ffffff', '#121212')}
          // barStyle={useDynamicValue('dark-content', 'light-content')}
          />
          <View style={styles.profileImage}>
            <View style={styles.imageContainer}>
              <TNProfilePictureSelector
                setProfilePictureURL={updateProfilePictureURL}
                appStyles={appStyles}
                profilePictureURL={profilePictureURL}
              />
            </View>
            <Text style={styles.userName}>{displayName()}</Text>
          </View>
          {menuItems.map((menuItem) => {
            return renderMenuItem(menuItem);
          })}
          {/* {Platform.OS == "ios" ? ( */}
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity onPress={() => onLogout()}>
              <View
                style={{
                  height: 45,
                  width: Dimensions.get("window").width - 100,
                  borderRadius: 40,
                  backgroundColor: "#84C1BA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "700", fontSize: 15 }}
                >
                  Logout
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* // ) : (
            // <View
            //   style={{
            //     alignItems: "center",
            //     borderRadius: 0,
            //     backgroundColor: "#84C1BA",
            //   }}
            // > */}
          {/* <Text onPress={onLogout} style={styles.logout}>
            {IMLocalized("Logout")}
          </Text> */}
          {/* // </View> */}
          {/* )} */}
        </View>
      </>
    );
  };

  return <>{myProfileScreenContent()}</>;
};

export default IMUserProfileComponent;
