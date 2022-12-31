import React from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  BackHandler,
  Image,
  AsyncStorage,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Modal,
} from "react-native";
import PropTypes from "prop-types";
import Button from "react-native-button";
import StarRating from "react-native-star-rating";
import FastImage from "react-native-fast-image";
import { firebaseListing } from "../firebase";
import firebase from "react-native-firebase";
import { connect } from "react-redux";
import ActionSheet from "react-native-actionsheet";
import {
  AppIcon,
  AppStyles,
  HeaderButtonStyle,
  TwoColumnListStyle,
} from "../AppStyles";
import HeaderButton from "../components/HeaderButton";
import PostModal from "../components/PostModal";
import SavedButton from "../components/SavedButton";
import { Configuration } from "../Configuration";
import { IMLocalized } from "../Core/localization/IMLocalization";
import DynamicAppStyles from "../DynamicAppStyles";
import ListingAppConfig from "../ListingAppConfig";
import { MapScreen } from "../screens/MapScreen";
import GetLocation from "react-native-get-location";
import Geolocation from "@react-native-community/geolocation";
import isBarber from "./isBarber";
import { global } from "./global";
import { firebaseUser } from "../Core/firebase";
import { setUserData } from "../Core/onboarding/redux/auth";
import Geocoder from "react-native-geocoding";

class HomeScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: IMLocalized("BlackMD Cares"),
    headerStyle: {
      backgroundColor: styles.header.backgroundColor,
      height: 80,
    },
    headerTitleStyle: {
      color: "#FFFFFF",
      fontFamily: AppStyles.fontName.main,
    },
    headerLeft: (
      <View style={HeaderButtonStyle.leftButton}>
        {navigation.state.params.isBarber ? (
          <HeaderButton
            iconStyle={{ tintColor: "white" }}
            customStyle={styles.composeButton}
            icon={require("../CoreAssets/add.png")}
            onPress={() => {
              navigation.state.params.onPressPost();
            }}
          />
        ) : null}
      </View>
    ),
    headerRight: (
      <View style={HeaderButtonStyle.multi}>
        <HeaderButton
          iconStyle={{ tintColor: "white" }}
          customStyle={styles.mapButton}
          icon={DynamicAppStyles.iconSet.search}
          onPress={() => {
            navigation.navigate("Search", {
              isProfileComplete: navigation.state.params.isProfileComplete,
            });
          }}
        />
      </View>
    ),
  });

  constructor(props) {
    super(props);
    this.listingItemActionSheet = React.createRef();
    global.isProfileComplete = false;
    global.isBarber = this.props.user.isBarber;
    Geocoder.init("AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0");
    this.state = {
      activeSlide: 0,
      categories: [],
      listings: [],
      allListings: [],
      savedListings: [],
      selectedItem: null,
      showedAll: false,
      postModalVisible: false,
      myLoc: "",
      myLat: "",
      isEmpty: true,
      isBarber: true,
      isProfileComplete: false,
      newAnnouncements: 0,
      mesgAvailable: false,
      modalVisible: false,
    };

    this.didFocusSubscription = props.navigation.addListener(
      "didFocus",
      (payload) => {
        this.checkMsg();
        BackHandler.addEventListener(
          "hardwareBackPress",
          this.onBackButtonPressAndroid
        );
      }
    );
  }

  componentWillMount() {
    this.onListingsCollectionUpdate;
    Geolocation.getCurrentPosition(
      (position) => {
        const myLat = JSON.stringify(position.coords.latitude);
        const myLong = JSON.stringify(position.coords.longitude);
        console.log("home location ", myLat, " ", myLong);
        this.setState({
          myLat: myLat,
          myLong: myLong,
        });
      },
      (error) => console.log("Error", JSON.stringify(error)),
      {
        enableHighAccuracy: Platform.OS === "android" ? false : true,
        timeout: 20000,
      }
    );

    this.listingsUnsubscribe = firebaseListing.subscribeListings(
      //if we want to show featured category on homepage
      // { categoryId: ListingAppConfig.homeConfig.mainCategoryID },
      {},
      this.onListingsCollectionUpdate
    );
  }

  componentDidMount() {
    this.checkMsg();
    this.categoriesUnsubscribe = firebaseListing.subscribeListingCategories(
      this.onCategoriesCollectionUpdate
    );

    this.savedListingsUnsubscribe = firebaseListing.subscribeSavedListings(
      this.props.user.id,
      this.onSavedListingsCollectionUpdate
    );

    this.props.navigation.setParams({
      onPressPost: this.onPressPost,
      menuIcon: this.props.user.profilePictureURL,
      onModal: this.onModal,
      isBarber: this.props.user.isBarber,
      isProfileComplete: false,
    });

    this.willBlurSubscription = this.props.navigation.addListener(
      "willBlur",
      (payload) => {
        console.log("willBlur");
        //this.messagesListener();
        BackHandler.removeEventListener(
          "hardwareBackPress",
          this.onBackButtonPressAndroid
        );
      }
    );

    AsyncStorage.getItem("isProviderMsg").then((res) => {
      if (res) {
        return false;
      } else if (!this.props.user.isBarber) {
        this.ActionSheet.show();
      } else {
        AsyncStorage.setItem("isProviderMsg", "true");
      }
    });
  }

  checkMsg() {
    this.messagesListener = firebase
      .firestore()
      .collection("channels")
      .orderBy("lastMessageDate", "desc")
      .onSnapshot((querySnapshot) => {
        const threads = querySnapshot.docs.map((documentSnapshot) => {
          if (documentSnapshot.data().lastMessageDate) {
            return documentSnapshot.data().lastMessageDate.seconds;
          } else {
            return false;
          }
        });
        console.log(global.runThatCode);
        if (global.runThatCode) {
          AsyncStorage.getItem("lastMsgTime").then((res) => {
            console.log("res", res);
            if (res) {
              let fromAsy = JSON.parse(res);
              let fromThis = Math.max(...threads);
              console.log("res after", fromThis, fromAsy);
              if (fromThis > fromAsy) {
                console.log("got new message");
                global.lastMsg = true;
                this.setState({ mesgAvailable: true });
              } else {
                global.lastMsg = false;
                this.setState({ mesgAvailable: false });
              }
            }
          });
        } else {
          global.runThatCode = true;
          this.setState({ mesgAvailable: false });
        }
      });
  }

  componentWillUnmount() {
    this.categoriesUnsubscribe();
    this.listingsUnsubscribe();
    this.savedListingsUnsubscribe();
    this.didFocusSubscription && this.didFocusSubscription.remove();
    this.willBlurSubscription && this.willBlurSubscription.remove();
    this.messagesListener();
  }

  onBackButtonPressAndroid = () => {
    BackHandler.exitApp();
    return true;
  };

  onCategoriesCollectionUpdate = (querySnapshot) => {
    const data = [];
    querySnapshot.forEach((doc) => {
      const category = doc.data();
      data.push({ ...category, id: doc.id });
    });
    this.setState({
      categories: data,
      loading: false,
    });
  };

  onListingsCollectionUpdate = (querySnapshot) => {
    const distance = (lat1, lon1, lat2, lon2, unit) => {
      // console.log('unit', unit)
      if (lat1 == lat2 && lon1 == lon2) {
        return 0;
      } else {
        const radlat1 = (Math.PI * lat1) / 180;
        const radlat2 = (Math.PI * lat2) / 180;
        const theta = lon1 - lon2;
        const radtheta = (Math.PI * theta) / 180;
        let dist =
          Math.sin(radlat1) * Math.sin(radlat2) +
          Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

        if (dist > 1) {
          dist = 1;
        }

        dist = Math.acos(dist);
        dist = (dist * 180) / Math.PI;
        dist = dist * 60 * 1.1515;

        if (unit == "K") {
          dist = dist * 1.609344;
        }

        if (unit == "N") {
          dist = dist * 0.8684;
        }
        // if (unit == "M") {// changes
        //   dist = dist / 1000;
        // }

        return dist;
      }
    };

    const data = [];

    const myLat = this.state.myLat;
    const myLong = this.state.myLong;
    let isAuther = this.props.user.id;
    querySnapshot.forEach((doc) => {
      const listing = doc.data();
      const listingLat = doc.data().latitude;
      const listingLong = doc.data().longitude;
      if (isAuther == listing.author.id) {
        global.isProfileComplete = true;
        this.props.navigation.setParams({
          isProfileComplete: true,
        });
        this.setState({ isProfileComplete: true });
      }

      if (this.state.savedListings.findIndex((k) => k == doc.id) >= 0) {
        listing.saved = true;
      } else {
        listing.saved = false;
      }
      //this is the logic for calculate distance
      // console.log('=====>>>>',distance(myLat, myLong, listingLat, listingLong, 'M'))
      if (distance(myLat, myLong, listingLat, listingLong, "M") <= 38) {
        // changes for M
        this.state.isEmpty = false;
        data.push({ ...listing, id: doc.id });
      }
    });

    this.setState({
      listings: data.slice(0, Configuration.home.initial_show_count),
      allListings: data,
      loading: false,
      showedAll: data.length <= Configuration.home.initial_show_count,
    });
  };

  onSavedListingsCollectionUpdate = (querySnapshot) => {
    const savedListingdata = [];
    querySnapshot.forEach((doc) => {
      const savedListing = doc.data();
      savedListingdata.push(savedListing.listingID);
    });
    const listingsData = [];
    this.state.listings.forEach((listing) => {
      const temp = listing;
      if (savedListingdata.findIndex((k) => k == temp.id) >= 0) {
        temp.saved = true;
      } else {
        temp.saved = false;
      }
      listingsData.push(temp);
    });

    this.setState({
      savedListings: savedListingdata,
      listings: listingsData,
      loading: false,
    });
  };

  onPressPost = () => {
    this.setState({
      selectedItem: null,
      postModalVisible: true,
    });
  };

  onPostCancel = () => {
    this.setState({ postModalVisible: false });
  };

  onPressCategoryItem = (item) => {
    this.props.navigation.navigate("Listing", {
      item: item,
      isProfileComplete: this.props.navigation.state.params.isProfileComplete,
    });
  };

  onPressListingItem = (item) => {
    this.props.navigation.navigate("Detail", {
      item: item,
      customLeft: true,
      routeName: "Home",
      isProfileComplete: this.props.navigation.state.params.isProfileComplete,
    });
  };

  onLongPressListingItem = (item) => {
    if (item.authorID === this.props.user.id) {
      this.setState({ selectedItem: item }, () => {
        // this.listingItemActionSheet.current.show();
        this.setState({ modalVisible: true });
      });
    }
  };

  onShowAll = () => {
    //uncomment to show a category rather than all listings nearby
    //this.props.navigation.navigate("Listing", { item: { id: ListingAppConfig.homeConfig.mainCategoryID, name: ListingAppConfig.homeConfig.mainCategoryName } });
    //this.props.navigation.navigate("Listing", { item: this.state.allListings });
    this.setState({
      showedAll: true,
      listings: this.state.allListings,
    });
  };

  onPressSavedIcon = (item) => {
    firebaseListing.saveUnsaveListing(item, this.props.user.id);
  };

  onModal = (modalVisible, callback) => {
    this.setState({ [modalVisible]: !this.state[modalVisible] }, () => {
      callback;
    });
  };

  onAddListing = () => {
    this.onModal("isMyListingVisible", this.onModal("isAddListingVisible"));
  };

  onLisingItemActionDone = (index) => {
    if (index == 0) {
      this.setState({
        postModalVisible: true,
      });
      console.log(index);
    }

    if (index == 1) {
      Alert.alert(
        IMLocalized("Delete Listing"),
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
    firebaseListing.removeListing(this.state.selectedItem.id, ({ success }) => {
      if (!success) {
        alert(
          IMLocalized(
            "There was an error deleting the listing. Please try again"
          )
        );
      }
    });
  };

  renderCategoryItem = ({ item }) => (
    <TouchableOpacity onPress={() => this.onPressCategoryItem(item)}>
      <View style={styles.categoryItemContainer}>
        <FastImage
          style={styles.categoryItemPhoto}
          source={{ uri: item.photo }}
        />
        <Text numberOfLines={1} style={styles.categoryItemTitle}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  renderCategorySeparator = () => {
    return (
      <View
        style={{
          width: 20,
          height: "100%",
        }}
      />
    );
  };

  renderListingItem = ({ item }) => {
    // console.log('in listing')
    return (
      // <TouchableOpacity
      //   onPress={() => this.onPressListingItem(item)}
      //   onLongPress={() => this.onLongPressListingItem(item)}
      // >
      //   <View style={TwoColumnListStyle.listingItemContainer}>
      //     <FastImage
      //       style={TwoColumnListStyle.listingPhoto}
      //       source={{ uri: item.photo }}
      //     />
      //     <SavedButton
      //       style={TwoColumnListStyle.savedIcon}
      //       onPress={() => this.onPressSavedIcon(item)}
      //       item={item}
      //     />
      //     <View style={{backgroundColor:'rgba(0,0,0,0.4)', borderBottomRightRadius:10, borderBottomLeftRadius:10, marginBottom:10}}>
      //         <Text style={{ ...TwoColumnListStyle.listingName, maxHeight: 40, fontFamily: AppStyles.fontName.main, textAlign:'center', color:'white' }}>
      //           {item.title}
      //         </Text>
      //         <Text style={[TwoColumnListStyle.listingPlace ,{textAlign:'center', color:'white'}]}>{item.categoryTitle}</Text>
      //         <View style={{alignItems:'center'}}>
      //           <StarRating
      //             containerStyle={styles.starRatingContainer}
      //             maxStars={5}
      //             starSize={15}
      //             disabled={true}
      //             starStyle={styles.starStyle}
      //             emptyStar={AppIcon.images.starNoFilled}
      //             fullStar={AppIcon.images.starFilled}
      //             halfStarColor={DynamicAppStyles.colorSet.mainThemeForegroundColor}
      //             rating={item.starCount}
      //           />
      //         </View>
      //     </View>
      //   </View>
      // </TouchableOpacity>
      <TouchableOpacity
        onPress={() => this.onPressListingItem(item)}
        onLongPress={() => this.onLongPressListingItem(item)}
      >
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
                  halfStarColor={"white"}
                  rating={item.starCount}
                />
              </View>
            </View>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    );
  };

  renderListingFooter = () => {
    return (
      <Button
        containerStyle={TwoColumnListStyle.showAllButtonContainer}
        style={TwoColumnListStyle.showAllButtonText}
        onPress={() => this.onShowAll()}
      >
        <Text style={{ color: "white" }}>
          {IMLocalized("Show all")} ({this.state.allListings.length})
        </Text>
      </Button>
    );
  };

  onPersonalMessage = () => {
    console.log("On Press notification list");
    this.props.navigation.navigate("ChatList", { appStyles: DynamicAppStyles });
  };

  onActionDone = (index) => {
    let willUpdateData = this.props.user;
    AsyncStorage.setItem("isProviderMsg", "true");
    if (index == 0) {
      willUpdateData["isBarber"] = true;
      firebaseUser.updateUserData(this.props.user.id, willUpdateData);
      this.props.setUserData({ user: willUpdateData });
    }
  };

  render() {
    const { isProfileComplete } = this.state;
    return (
      <View style={{ flex: 1, paddingBottom: 10 }}>
        <ScrollView style={styles.container}>
          <Text
            style={
              (styles.H2,
              {
                fontSize: 18,
                alignSelf: "center",
                paddingBottom: 5,
                fontFamily: AppStyles.fontName.main,
                color: "rgb(152,152,152)",
              })
            }
          >
            Better care, better health.
          </Text>
          <Text
            style={
              (styles.title,
              {
                fontSize: 12,
                alignSelf: "center",
                fontFamily: AppStyles.fontName.main,
                color: "rgb(152,152,152)",
              })
            }
          >
            {
              "Connecting patients with culturally sensitive healthcare providers and clinical trials."
            }
          </Text>
          <Text></Text>
          {/* {this.props.user.isBarber && !this.props.user.completedReg && ( */}
          {this.props.user.isBarber && !this.state.isProfileComplete && (
            <View style={styles.completeReg}>
              <TouchableOpacity
                onPress={() => this.setState({ postModalVisible: true })}
              >
                <Text
                  style={{
                    alignSelf: "center",
                    fontSize: 20,
                    padding: 10,
                    fontFamily: AppStyles.fontName.main,
                  }}
                >
                  {" "}
                  Incomplete Provider Listing!{" "}
                </Text>
                <Text
                  style={{
                    alignSelf: "center",
                    paddingBottom: 8,
                    color: "white",
                    fontFamily: AppStyles.fontName.main,
                  }}
                >
                  {" "}
                  Click here to complete your provider profile
                </Text>
                <Text
                  style={{
                    alignSelf: "center",
                    fontFamily: AppStyles.fontName.main,
                  }}
                >
                  {" "}
                  Check www.blackmdcares.com to confirm
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.title}> {IMLocalized("Specialities")}</Text>
          <View style={styles.categories}>
            {this.state.categories && !this.state.categories.length ? (
              <View>
                <ActivityIndicator size="small" color=" #11877A" />
              </View>
            ) : (
              <FlatList
                horizontal={true}
                initialNumToRender={5}
                ItemSeparatorComponent={() => this.renderCategorySeparator()}
                data={this.state.categories}
                showsHorizontalScrollIndicator={false}
                renderItem={(item) => this.renderCategoryItem(item)}
                keyExtractor={(item) => `${item.id}`}
              />
            )}
          </View>
          <Text style={[styles.title, styles.listingTitle]}>
            {ListingAppConfig.homeConfig.mainCategoryName}
          </Text>

          <View style={styles.listings}>
            {this.state.isEmpty && (
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  fontFamily: AppStyles.fontName.main,
                }}
              >
                We're sorry, There are no health care professionals in our
                database found in your immediate area. Find the closest doctors
                by browsing categories or exploring the map.
              </Text>
            )}
            <FlatList
              vertical
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                !this.state.showedAll ? this.renderListingFooter : ""
              }
              numColumns={2}
              data={this.state.listings} //changes to listings
              renderItem={this.renderListingItem}
              keyExtractor={(item) => `${item.id}`}
            />
          </View>
          {this.state.postModalVisible && (
            <PostModal
              selectedItem={this.state.selectedItem}
              categories={this.state.categories}
              onCancel={this.onPostCancel}
              navigation={this.props.navigation}
            />
          )}
          <ActionSheet
            ref={this.listingItemActionSheet}
            title={IMLocalized("Confirm")}
            options={[
              IMLocalized("Edit Listing"),
              IMLocalized("Remove Listing"),
              IMLocalized("Cancel"),
            ]}
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

          <ActionSheet
            ref={(o) => (this.ActionSheet = o)}
            title={"Are you a black healthcare provider?"}
            options={["Yes", "No"]}
            cancelButtonIndex={1}
            destructiveButtonIndex={1}
            onPress={(index) => {
              this.onActionDone(index);
            }}
          />
        </ScrollView>
        {isProfileComplete && this.props.user.isBarber && (
          <TouchableOpacity
            onPress={() => {
              this.onPersonalMessage();
            }}
            style={[styles.chatIconView]}
          >
            {this.state.mesgAvailable && <View style={[styles.redDot]} />}
            <Image
              source={require("../../assets/icons/chat.png")}
              style={{ width: 25, height: 25, tintColor: "white" }}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#000000",
  },
  chatIconView: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgb(231, 193, 146)",
  },
  redDot: {
    backgroundColor: "red",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: "#fff",
    borderWidth: 2,
    position: "absolute",
    right: -4,
    top: -4,
  },
  container: {
    flex: 1,
    padding: Configuration.home.listing_item.offset,
    backgroundColor: "#fafafa",
    marginBottom: 10,
    paddingBottom: 10,
  },

  completeReg: {
    backgroundColor: "#84C1BA",
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
    color: "white",
    borderRadius: 15,
  },
  title: {
    fontWeight: "500",
    color: AppStyles.color.title,
    fontSize: 20,
    marginBottom: 15,
    fontFamily: AppStyles.fontName.main,
  },
  H2: {
    fontWeight: "500",
    color: AppStyles.color.background,
    fontSize: 20,
    marginBottom: 15,
    fontFamily: AppStyles.fontName.main,
  },
  listings: {
    shadowColor: AppStyles.color.background,
    shadowOpacity: 0.1,
  },
  listingTitle: {
    marginTop: 10,
    marginBottom: 10,
  },
  categories: {
    marginBottom: 7,
    shadowColor: AppStyles.color.background,
    shadowOpacity: 0.15,
  },
  categoryItemContainer: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#84C1BA",
    width: 110,
    // paddingBottom: 10
  },
  categoryItemPhoto: {
    height: 80,
    borderTopLeftRadius: 8,
    width: "100%",
    minWidth: 100,
    borderTopRightRadius: 8,
  },
  categoryItemTitle: {
    fontFamily: AppStyles.fontName.bold,
    fontWeight: "400",
    color: "rgb(61, 61, 61)",
    margin: 10,
    alignContent: "center",
    textAlign: "center",
    fontSize: 14,
  },
  userPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 10,
  },
  mapButton: {
    marginRight: 13,
    marginLeft: 7,
  },
  composeButton: {},
  starStyle: {
    tintColor: "rgb(231, 193, 146)",
  },
  starRatingContainer: {
    width: 90,
    marginTop: 10,
  },
});

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

HomeScreen.propTypes = {
  setUserData: PropTypes.func,
};

export default connect(mapStateToProps, { setUserData })(HomeScreen);
