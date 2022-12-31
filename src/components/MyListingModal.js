import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  BackHandler,
  Alert,
  ImageBackground,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import TextButton from "react-native-button";
import firebase from "react-native-firebase";
import { connect } from "react-redux";
import FastImage from "react-native-fast-image";
import StarRating from "react-native-star-rating";
import ActionSheet from "react-native-actionsheet";
import SavedButton from "./SavedButton";
import PostModal from "./PostModal";
import ServerConfiguration from "../ServerConfiguration";
import { AppStyles, AppIcon, TwoColumnListStyle } from "../AppStyles";
import { Configuration } from "../Configuration";
import { IMLocalized } from "../Core/localization/IMLocalization";
import DynamicAppStyles from "../DynamicAppStyles";

class MyListingModal extends React.Component {
  static navigationOptions = ({ screenProps }) => {
    let currentTheme = DynamicAppStyles.navThemeConstants[screenProps.theme];
    return {
      title: IMLocalized("My Listings"),
      headerStyle: {
        backgroundColor: "black",
      },
      headerTintColor: "white",
      headerTitleStyle: { color: "white" },
    };
  };

  constructor(props) {
    super(props);

    this.state = {
      listings: [],
      savedListings: [],
      selectedItem: null,
      postModalVisible: false,
      categories: [],
      loading: true,
      modalVisible: false,
    };

    this.listingItemActionSheet = React.createRef();

    this.didFocusSubscription = props.navigation.addListener(
      "didFocus",
      (payload) =>
        BackHandler.addEventListener(
          "hardwareBackPress",
          this.onBackButtonPressAndroid
        )
    );

    this.listingsRef = firebase
      .firestore()
      .collection(ServerConfiguration.database.collection.LISTINGS);

    this.savedListingsRef = firebase
      .firestore()
      .collection(ServerConfiguration.database.collection.SAVED_LISTINGS)
      .where("userID", "==", this.props.user.id);
    this.categoriesRef = firebase
      .firestore()
      .collection(ServerConfiguration.database.collection.CATEGORIES);
  }

  componentDidMount() {
    this.savedListingsUnsubscribe = this.savedListingsRef.onSnapshot(
      this.onSavedListingsCollectionUpdate
    );

    this.listingsUnsubscribe = this.listingsRef
      .where("authorID", "==", this.props.user.id)
      .where("isApproved", "==", true)
      .onSnapshot(this.onListingsCollectionUpdate);

    this.categoriesUnsubscribe = this.categoriesRef.onSnapshot(
      this.onCategoriesCollectionUpdate
    );

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
    if (this.listingsUnsubscribe) {
      this.listingsUnsubscribe();
    }

    if (this.savedListingsUnsubscribe) {
      this.savedListingsUnsubscribe();
    }

    this.didFocusSubscription && this.didFocusSubscription.remove();
    this.willBlurSubscription && this.willBlurSubscription.remove();
  }

  onBackButtonPressAndroid = () => {
    this.props.navigation.goBack();

    return true;
  };

  onSavedListingsCollectionUpdate = (querySnapshot) => {
    const savedListingdata = [];
    querySnapshot.forEach((doc) => {
      const savedListing = doc.data();
      savedListingdata.push(savedListing.listingID);
    });

    this.setState({
      savedListings: savedListingdata,
    });
  };

  onCategoriesCollectionUpdate = (querySnapshot) => {
    const data = [];
    querySnapshot.forEach((doc) => {
      const category = doc.data();
      data.push({ ...category, id: doc.id });
    });
    this.setState({
      categories: data,
    });
  };

  onListingsCollectionUpdate = (querySnapshot) => {
    const data = [];
    querySnapshot.forEach((doc) => {
      const listing = doc.data();
      if (this.state.savedListings.findIndex((k) => k == doc.id) >= 0) {
        listing.saved = true;
      } else {
        listing.saved = false;
      }
      data.push({ ...listing, id: doc.id });
    });

    this.setState({
      listings: data,
      loading: false,
    });
  };

  onPressListingItem = (item) => {
    this.props.navigation.navigate("MyListingDetailModal", { item });
  };

  onLongPressListingItem = (item) => {
    console.log("am actually working");
    if (item.authorID === this.props.user.id) {
      this.setState({ selectedItem: item }, () => {
        // this.listingItemActionSheet.current.show();
        this.setState({ modalVisible: true });
      });
    }
  };

  onLisingItemActionDone = (index) => {
    if (index == 0) {
      this.setState({
        postModalVisible: true,
      });
    }

    if (index == 1) {
      Alert.alert(
        IMLocalized("Delete listing?"),
        IMLocalized("Are you sure you want to remove this listing?"),
        [
          {
            text: IMLocalized("Yes"),
            onPress: this.removeListing,
            style: "destructive",
          },
          { text: IMLocalized("No") },
        ],
        { cancelable: false }
      );
    }
  };

  removeListing = () => {
    this.setState({ modalVisible: false });
    const self = this;

    firebase
      .firestore()
      .collection(ServerConfiguration.database.collection.LISTINGS)
      .doc(self.state.selectedItem.id)
      .delete()
      .then(function() {
        const realEstateSavedQuery = firebase
          .firestore()
          .collection(ServerConfiguration.database.collection.SAVED_LISTINGS)
          .where("listingID", "==", self.state.selectedItem.id);
        realEstateSavedQuery.get().then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            doc.ref.delete();
          });
        });
      })
      .catch(function(error) {
        console.log("Error deleting listing: ", error);
        alert(
          IMLocalized(
            "Oops! an error while deleting listing. Please try again later."
          )
        );
      });
  };

  onPostCancel = () => {
    this.setState({ postModalVisible: false });
  };

  onPressSavedIcon = (item) => {
    if (item.saved) {
      firebase
        .firestore()
        .collection(ServerConfiguration.database.collection.SAVED_LISTINGS)
        .where("listingID", "==", item.id)
        .where("userID", "==", this.props.user.id)
        .get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            doc.ref.delete();
          });
        });
    } else {
      firebase
        .firestore()
        .collection(ServerConfiguration.database.collection.SAVED_LISTINGS)
        .add({
          userID: this.props.user.id,
          listingID: item.id,
        })
        .then(function(docRef) {})
        .catch(function(error) {
          alert(error);
        });
    }
  };

  renderListingItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => this.onPressListingItem(item)}
        onLongPress={() => this.onLongPressListingItem(item)}
      >
        {/* <View style={TwoColumnListStyle.listingItemContainer}>
          <FastImage
            style={[TwoColumnListStyle.listingPhoto, {height:210, borderBottomLeftRadius:10, borderBottomRightRadius:10}]}
            source={{ uri: item.photo }}
          />
          <SavedButton
            // style={TwoColumnListStyle.savedIcon}
            onPress={() => this.onPressSavedIcon(item)}
            item={item}
          />
          <View style={{backgroundColor:'rgba(0,0,0,0.4)', borderBottomLeftRadius:10, borderBottomRightRadius:10, marginTop:-95}}>
              <Text numberOfLines={1} style={[TwoColumnListStyle.listingName, {textAlign:'center', color:'white'}]}>
                {item.title}
              </Text>
              <Text numberOfLines={2} style={[TwoColumnListStyle.listingPlace, {textAlign:'center', color:'white'}]}>{item.place}</Text>
              <View style={{alignItems:'center', marginBottom:10}}>
                <StarRating
                  containerStyle={styles.starRatingContainer}
                  maxStars={5}
                  starSize={15}
                  disabled={true}
                  emptyStarColor='white'
                  fullStarColor={styles.starStyle}
                  emptyStar={AppIcon.images.starNoFilled}
                  fullStar={AppIcon.images.starFilled}
                  halfStarColor={DynamicAppStyles.colorSet.mainThemeForegroundColor}
                  rating={item.starCount}
                />
              </View>
              </View>
          </View> */}

        <View
          style={{
            marginRight: 20,
            flex: 1,
            borderRadius: 20,
            marginBottom: 10,
          }}
        >
          <ImageBackground
            style={{
              height: Dimensions.get("window").height / 4,
              width: Dimensions.get("window").width / 2 - 30,
              borderRadius: 20,
              resizeMode: "contain",
              flex: 1,
            }}
            source={{ uri: item.photo }}
            imageStyle={{
              borderTopRightRadius: 4,
              borderTopLeftRadius: 4,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}
          >
            <View style={{ alignItems: "flex-end", margin: 10 }}>
              <TouchableOpacity onPress={() => this.onPressSavedIcon(item)}>
                <View
                  style={{
                    height: 25,
                    width: 25,
                    backgroundColor: "black",
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* <Image 
              source={AppIcon.images.heartFilled}
              style={{height:15, width:15, backgroundColor:'black', borderRadius:10,}}
              /> */}
                  <SavedButton
                    // style={{height:15, width:15}}
                    onPress={() => this.onPressSavedIcon(item)}
                    item={item}
                  />
                </View>
              </TouchableOpacity>
            </View>
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.4)",
                borderBottomRightRadius: 10,
                borderBottomLeftRadius: 10,
                marginBottom: 0,
                justifyContent: "flex-end",
                marginTop: Dimensions.get("window").height / 4 - 125,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  ...TwoColumnListStyle.listingName,
                  maxHeight: 40,
                  fontFamily: AppStyles.fontName.main,
                  textAlign: "center",
                  color: "white",
                }}
              >
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  TwoColumnListStyle.listingPlace,
                  { textAlign: "center", color: "white" },
                ]}
              >
                {item.categoryTitle}
              </Text>
              <View style={{ alignItems: "center", paddingBottom: 10 }}>
                <StarRating
                  containerStyle={styles.starRatingContainer}
                  maxStars={5}
                  starSize={15}
                  disabled={true}
                  emptyStarColor="white"
                  fullStarColor={styles.starStyle}
                  emptyStar={AppIcon.images.starNoFilled}
                  fullStar={AppIcon.images.starFilled}
                  halfStarColor={
                    DynamicAppStyles.colorSet.mainThemeForegroundColor
                  }
                  rating={item.starCount}
                />
              </View>
            </View>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    );
  };

  render() {
    if (this.state.loading) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="small" color="#84C1BA" />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View>
          <Text
            style={{ paddingBottom: 10, alignSelf: "center", color: "#a0a0a0" }}
          >
            Long Press to edit or remove listing
          </Text>
        </View>
        <FlatList
          vertical
          showsVerticalScrollIndicator={false}
          numColumns={2}
          data={this.state.listings}
          renderItem={this.renderListingItem}
          keyExtractor={(item) => `${item.id}`}
        />
        {this.state.postModalVisible && (
          <PostModal
            selectedItem={this.state.selectedItem}
            categories={this.state.categories}
            onCancel={this.onPostCancel}
          />
        )}
        <ActionSheet
          ref={this.listingItemActionSheet}
          title={"Confirm"}
          options={["Edit Listing", "Remove Listing", "Cancel"]}
          cancelButtonIndex={2}
          destructiveButtonIndex={1}
          onPress={(index) => {
            this.onLisingItemActionDone(index);
          }}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.setState({ modalVisible: false });
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                height: Dimensions.get("window").height / 3 + 100,
                width: Dimensions.get("window").width,
                backgroundColor: "white",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: AppStyles.fontName.main,
                  fontSize: 20,
                  lineHeight: 19,
                  fontWeight: "700",
                }}
              >
                Confirm
              </Text>
              <TouchableOpacity
                onPress={() => {
                  this.setState({
                    postModalVisible: true,
                  });
                  // console.log(index);
                  this.setState({ modalVisible: false });
                }}
              >
                <View
                  style={{
                    height: 55,
                    width: Dimensions.get("window").width - 80,
                    borderRadius: 40,
                    backgroundColor: "rgb(231, 193, 146)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 30,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: AppStyles.fontName.main,
                      fontSize: 16,
                      lineHeight: 19,
                      color: "white",
                    }}
                  >
                    Edit Listing
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    IMLocalized("Delete Listing"),
                    IMLocalized(
                      "Are you sure you want to remove this listing?"
                    ),
                    [
                      {
                        text: IMLocalized("Yes"),
                        onPress: this.removeListing,
                        style: "destructive",
                      },
                      {
                        text: IMLocalized("No"),
                        onPress: () => this.setState({ modalVisible: false }),
                      },
                    ],
                    { cancelable: false }
                  );
                }}
              >
                <View
                  style={{
                    height: 55,
                    width: Dimensions.get("window").width - 80,
                    borderRadius: 40,
                    backgroundColor: "rgb(231, 193, 146)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: AppStyles.fontName.main,
                      fontSize: 16,
                      lineHeight: 19,
                      color: "white",
                    }}
                  >
                    Remove Listing
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => this.setState({ modalVisible: false })}
              >
                <View
                  style={{
                    height: 55,
                    width: Dimensions.get("window").width - 80,
                    borderRadius: 40,
                    backgroundColor: "rgb(231, 193, 146)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: AppStyles.fontName.main,
                      fontSize: 16,
                      lineHeight: 19,
                      color: "white",
                    }}
                  >
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Configuration.home.listing_item.offset,
  },
  rightButton: {
    marginRight: 10,
    color: AppStyles.color.main,
  },
  starRatingContainer: {
    width: 90,
    marginTop: 10,
  },
  starStyle: {
    tintColor: "black",
  },
});

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(MyListingModal);
