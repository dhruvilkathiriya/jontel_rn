import React from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Clipboard,
  View,
  Alert,
  BackHandler,
  ActivityIndicator,
  Linking,
  Image,
} from "react-native";
import { AppStyles, AppIcon, HeaderButtonStyle } from "../AppStyles";
import { firebaseReview, firebaseListing, firebaseChat } from "../firebase";
import { firebaseUser } from "../Core/firebase";
import FastImage from "react-native-fast-image";
import Carousel, { Pagination } from "react-native-snap-carousel";
import MapView, { Marker } from "react-native-maps";
import { connect } from "react-redux";
import StarRating from "react-native-star-rating";
import HeaderButton from "../components/HeaderButton";
import ReviewModal from "../components/ReviewModal";
import Links from "../components/links";
import DynamicAppStyles from "../DynamicAppStyles";
import { timeFormat } from "../Core";
import { IMLocalized } from "../Core/localization/IMLocalization";
import email from "react-native-email";
import Geocoder from "react-native-geocoding";
import ListingAppConfig from "../ListingAppConfig";
import { global } from "./global";
var isBarber = false;
const defaultAvatar =
  "https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg";

const { width: viewportWidth, height: viewportHeight } = Dimensions.get(
  "window"
);
const LATITUDEDELTA = 0.0122;
const LONGITUDEDELTA = 0.0021;

class DetailsScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: "Black MD Provider",
    headerTintColor: "white",
    headerStyle: {
      backgroundColor: "#000000",
    },
    headerTitleStyle: {
      color: "white",
    },
    headerRight: (
      <View style={HeaderButtonStyle.multi}>
        {/* {(navigation.state.params.isAdmin ||
          navigation.state.params.isUser) && (
            <HeaderButton
              customStyle={styles.headerIconContainer}
              iconStyle={[styles.headerIcon, { tintColor: "#e2362d" }]}
              icon={AppIcon.images.delete}
              onPress={() => {
                navigation.state.params.onDelete();
              }}
            />
          )} */}
        {/* {!navigation.state.params.isUser && (
          <HeaderButton
            customStyle={styles.headerIconContainer}
            iconStyle={styles.headerIcon}
            icon={AppIcon.images.accountDetail}
            onPress={() => {
              navigation.navigate("ListingProfileModal", {
                userID: navigation.state.params.item.authorID
              });
            }}
          />
        )} */}
        {/* navigation.state.params.isProfileComplete */}
        {/* {!navigation.state.params.isUser && navigation.state.params.author && isBarber && global.isProfileComplete && (
          <HeaderButton
            customStyle={styles.headerIconContainer}
            iconStyle={styles.headerIcon}
            icon={AppIcon.images.communication}
            onPress={() => {
              navigation.state.params.onPersonalMessage();
            }}
          />
        )} */}
        <HeaderButton
          customStyle={styles.headerIconContainer}
          iconStyle={styles.headerIcon}
          icon={AppIcon.images.review}
          onPress={() => {
            navigation.state.params.onPressReview();
          }}
        />
        <HeaderButton
          customStyle={styles.headerIconContainer}
          icon={
            navigation.state.params.saved
              ? AppIcon.images.heartFilled
              : AppIcon.images.heart
          }
          onPress={() => {
            navigation.state.params.onPressSave();
          }}
          iconStyle={styles.headerIcon}
        />
      </View>
    ),
  });

  constructor(props) {
    isBarber = props.user.isBarber;
    super(props);
    Geocoder.init("AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0");
    const { navigation } = props;
    this.item = navigation.getParam("item");

    this.unsubscribe = null;
    this.reviewsUnsubscribe = null;
    this.savedListingUnsubscribe = null;

    readFromClipboard = async () => {
      //To get the text from clipboard
      const clipboardContent = await Clipboard.getString();
      this.setState({ clipboardContent });
    };
    writeToClipboard = async () => {
      //To copy the text to clipboard
      await Clipboard.setString(this.state.data.shopAddress);
      alert("Copied to Clipboard!");
    };

    this.state = {
      activeSlide: 0,
      data: this.item ? this.item : {},
      photo: this.item.photo,
      reviews: [],
      saved: false,
      user: {},
      reviewModalVisible: false,
      isProfileModalVisible: false,
      didFinishAnimation: false,
      latMarker: null,
      longMarker: null,
    };

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
    this.props.navigation.setParams({
      onDelete: this.onDelete,
      onPressReview: this.onPressReview,
      onPressSave: this.onPressSave,
      saved: this.state.saved,
      onPersonalMessage: this.onPersonalMessage,
      onProfileModal: this.onProfileModal,
      isAdmin: this.props.isAdmin,
      author: this.state.data.author,
      isUser: this.props.user.id === this.state.data.authorID,
    });

    // console.log("Zfrom search list:", this.state.data.shopAddress)
    Geocoder.from(this.state.data.shopAddress)
      .then((json) => {
        var location = json.results[0].geometry.location;
        this.setState({ latMarker: location.lat, longMarker: location.lng });
      })
      .catch((error) => console.warn(error));

    setTimeout(() => {
      this.setState({ didFinishAnimation: true });
    }, 500);

    this.upDateUserInfo();
    this.unsubscribe = firebaseListing.subscribeListings(
      { docId: this.item.id },
      this.onDocUpdate
    );
    this.reviewsUnsubscribe = firebaseReview.subscribeReviews(
      this.item.id,
      this.onReviewsUpdate
    );
    this.savedListingsUnsubscribe = firebaseListing.subscribeSavedListings(
      this.props.user.id,
      this.onSavedListingsCollectionUpdate,
      this.item.id
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
    this.unsubscribe();
    this.reviewsUnsubscribe();
    this.savedListingsUnsubscribe();
    this.didFocusSubscription && this.didFocusSubscription.remove();
    this.willBlurSubscription && this.willBlurSubscription.remove();
  }

  onBackButtonPressAndroid = () => {
    const customLeft = this.props.navigation.getParam("customLeft");
    const routeName = this.props.navigation.getParam("routeName");

    if (customLeft) {
      this.props.navigation.navigate(routeName);
    } else {
      this.props.navigation.goBack();
    }

    return true;
  };

  upDateUserInfo = async () => {
    const res = await firebaseUser.getUserData(this.state.data.authorID);
    if (res.success) {
      this.setState({
        author: res.data,
      });
    }
  };

  onPersonalMessage = () => {
    const viewer = this.props.user;
    const viewerID = viewer.id || viewer.userID;
    const vendorID = this.state.data.authorID || this.state.data.authorID;
    let channel = {
      id: viewerID < vendorID ? viewerID + vendorID : vendorID + viewerID,
      participants: [this.state.data.author],
    };
    this.props.navigation.navigate("PersonalChat", {
      channel,
      appStyles: DynamicAppStyles,
    });
  };

  onDocUpdate = (doc) => {
    const listing = doc.data();

    this.setState({
      data: { ...listing, id: doc.id },
      loading: false,
    });
  };

  updateReviews = (reviews) => {
    this.setState({
      reviews: reviews,
    });
  };

  onReviewsUpdate = (querySnapshot, usersRef) => {
    const data = [];
    const updateReviews = this.updateReviews;

    const state = this.state;
    querySnapshot.forEach((doc) => {
      const review = doc.data();
      data.push(review);
    });
    updateReviews(data);
  };

  onSavedListingsCollectionUpdate = (querySnapshot) => {
    const savedListingdata = [];
    querySnapshot.forEach((doc) => {
      const savedListing = doc.data();
      savedListingdata.push(savedListing);
    });

    this.setState({
      saved: savedListingdata.length > 0,
    });

    this.props.navigation.setParams({
      saved: this.state.saved,
    });
  };

  onPressReview = () => {
    this.setState({ reviewModalVisible: true });
  };

  onDelete = () => {
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
  };

  removeListing = () => {
    const self = this;
    const customLeft = this.props.navigation.getParam("customLeft");
    const routeName = this.props.navigation.getParam("routeName");

    firebaseListing.removeListing(this.state.data.id, ({ success }) => {
      if (success) {
        alert(IMLocalized("The listing was successfully deleted."));
        if (customLeft) {
          self.props.navigation.navigate(routeName);
        } else {
          self.props.navigation.goBack();
        }
        return;
      }
      alert(IMLocalized("There was an error deleting listing!"));
    });
  };

  onReviewCancel = () => {
    this.setState({ reviewModalVisible: false });
  };

  onProfileModal = (isVisible) => {
    this.setState({ [isVisible]: !this.state[isVisible] });
  };

  onPressSave = () => {
    const item = { ...this.state.data, saved: this.state.saved };

    firebaseListing.saveUnsaveListing(item, this.props.user.id);
  };

  renderItem = ({ item }) => {
    // if (!item) {
    //   return null;
    // }
    console.log("profile image");
    return (
      <View style={{ alignItems: "center", marginTop: 10 }}>
        {console.log("image", item)}

        <Image
          source={
            item ? { uri: item } : require("../CoreAssets/default-avatar.jpg")
          }
          style={styles.photoItem}
        />
        {/*     
            <Image 
            source={require('../CoreAssets/default-avatar.jpg')}
          style={styles.photoItem}
          />
         */}
      </View>
    );
  };

  renderSeparator = () => {
    return (
      <View
        style={{
          width: 10,
          height: "100%",
        }}
      />
    );
  };

  renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.info}>
        <FastImage
          style={styles.userPhoto}
          resizeMode={FastImage.resizeMode.cover}
          source={
            item.profilePictureURL
              ? { uri: item.profilePictureURL }
              : { uri: defaultAvatar }
          }
        />
        <View style={styles.detail}>
          <Text style={styles.username}>
            {item.firstName && item.firstName} {item.lastName && item.lastName}
          </Text>
          <Text style={styles.reviewTime}>{timeFormat(item.createdAt)}</Text>
        </View>
        <StarRating
          containerStyle={(styles.starRatingContainer, { color: "#d4af37" })}
          disabled={true}
          maxStars={5}
          starSize={22}
          starStyle={styles.starStyle}
          emptyStar={AppIcon.images.starNoFilled}
          fullStar={AppIcon.images.starFilled}
          halfStarColor={DynamicAppStyles.colorSet.mainThemeForegroundColor}
          rating={item.starCount}
        />
      </View>
      <Text style={styles.reviewContent}>{item.content}</Text>
    </View>
  );

  readFromClipboard = async () => {
    //To get the text from clipboard
    const clipboardContent = await Clipboard.getString();
    this.setState({ clipboardContent });
  };
  writeToClipboard = async () => {
    //To copy the text to clipboard
    await Clipboard.setString(this.state.data.shopAddress);
    alert("Copied to Clipboard!");
  };

  toLinkSite = () => {
    url = "https://" + this.state.data.site;
    Linking.openURL(url);
  };
  toLinkMap = () => {
    url =
      "https://www.google.com/maps/search/?api=1&query=" +
      this.state.data.shopAddress;
    Linking.openURL(url);
  };

  makeCall = () => {
    let phoneNumber = "";
    if (Platform.OS === "android") {
      phoneNumber = "tel:${" + this.state.data.workPhone + "}";
    } else {
      phoneNumber = "telprompt:${" + this.state.data.workPhone + "}";
    }
    Linking.openURL(phoneNumber);
  };

  makeEmail = () => {
    const to = [this.state.data.workEmail]; // string or array of email addresses
    email(to, {
      // Optional additional arguments
      // cc: ['bazzy@moo.com', 'doooo@daaa.com'], // string or array of email addresses
      // bcc: 'mee@mee.com', // string or array of email addresses
      subject: "Via BlackMD Cares:",
      body: "Via BlackMD Cares \n",
    }).catch(console.error);
  };

  render() {
    var extraInfoArr = null;
    if (this.state.data.filters) {
      const filters = this.state.data.filters;
      extraInfoArr = Object.keys(filters).map(function(key) {
        if (filters[key] != "Any" && filters[key] != "All") {
          return (
            <View style={styles.extraRow}>
              <Text style={styles.extraKey}>{key}</Text>
              <Text style={styles.extraValue}>{filters[key]}</Text>
            </View>
          );
        }
      });
    }

    const { activeSlide } = this.state;
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.carousel}>
          <Carousel
            ref={(c) => {
              this._slider1Ref = c;
            }}
            data={this.state.data.photos}
            renderItem={this.renderItem}
            sliderWidth={viewportWidth}
            itemWidth={viewportWidth}
            // hasParallaxImages={true}
            inactiveSlideScale={1}
            inactiveSlideOpacity={1}
            firstItem={0}
            loop={false}
            // loopClonesPerSide={2}
            autoplay={false}
            autoplayDelay={500}
            autoplayInterval={3000}
            onSnapToItem={(index) => this.setState({ activeSlide: index })}
          />
          <Pagination
            dotsLength={this.state.data.photos && this.state.data.photos.length}
            activeDotIndex={activeSlide}
            containerStyle={styles.paginationContainer}
            dotColor={"rgba(255, 255, 255, 0.92)"}
            dotStyle={styles.paginationDot}
            inactiveDotColor="white"
            inactiveDotOpacity={0.4}
            inactiveDotScale={0.6}
            carouselRef={this._slider1Ref}
            tappableDots={!!this._slider1Ref}
          />
        </View>

        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "flex-start",
            top: 10,
            right: 10,
            position: "absolute",
          }}
        >
          {(this.props.navigation.state.params.isAdmin ||
            this.props.navigation.state.params.isUser) && (
            <View
              style={{
                backgroundColor: "black",
                borderRadius: 20,
                alignItems: "center",
                height: 30,
                width: 30,
                justifyContent: "center",
              }}
            >
              <HeaderButton
                customStyle={styles.headerIconContainer}
                iconStyle={[
                  styles.headerIcon,
                  {
                    tintColor: "#e2362d",
                    height: 20,
                    width: 20,
                    resizeMode: "contain",
                    marginLeft: 10,
                  },
                ]}
                icon={AppIcon.images.delete}
                onPress={() => {
                  this.props.navigation.state.params.onDelete();
                }}
              />
            </View>
          )}
        </View>

        {!this.props.navigation.state.params.isUser &&
          this.props.navigation.state.params.author &&
          isBarber &&
          global.isProfileComplete && (
            <View
              style={{
                position: "absolute",
                justifyContent: "center",
                alignItems: "center",
                top: 80,
                right: 10,
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "black",
              }}
            >
              <HeaderButton
                customStyle={styles.headerIconContainer}
                iconStyle={[
                  {},
                  {
                    tintColor: "rgb(231, 193, 146)",
                    height: 20,
                    width: 20,
                    resizeMode: "contain",
                    marginLeft: 10,
                  },
                ]}
                icon={AppIcon.images.communication}
                onPress={() => {
                  this.props.navigation.state.params.onPersonalMessage();
                }}
              />
            </View>
          )}

        {/* Title */}
        <View
          style={{
            backgroundColor: "white",
            margin: 10,
            borderRadius: 10,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgb(152,152,152)",
          }}
        >
          <Text style={styles.title}>{this.state.data.title} </Text>
          <Text style={styles.itemContainer}>
            Specializes in {this.state.data.categoryTitle}
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: "rgb(152,152,152)",
              marginTop: 10,
              marginBottom: 20,
            }}
          />

          <Text
            style={{
              fontFamily: AppStyles.fontName.bold,
              fontWeight: "bold",
              color: "rgb(152, 152, 152)",
              fontSize: 18,
              padding: 10,
              paddingBottom: 5,
            }}
          >
            {this.state.data.title}{" "}
          </Text>
          <Text
            style={{
              fontFamily: AppStyles.fontName.bold,
              fontWeight: "bold",
              color: AppStyles.color.title,
              fontSize: 16,
              paddingLeft: 10,
              marginBottom: 3,
            }}
          >
            Specializes in {this.state.data.categoryTitle}
          </Text>
          <View style={{ marginTop: 10 }}>
            {this.state.data.description ? (
              <Text style={styles.descriptionText}>
                {this.state.data.description}
              </Text>
            ) : null}
            {this.state.data.featureTxt ? (
              <Text style={styles.descriptionText}>
                {this.state.data.featureTxt}
              </Text>
            ) : null}
            <Text></Text>
            {this.state.data.site ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: AppStyles.fontName.bold,
                    fontWeight: "bold",
                    color: "rgb(152, 152, 152)",
                    fontSize: 16,
                    paddingLeft: 10,
                    marginBottom: 3,
                  }}
                >
                  Website:{" "}
                </Text>
                <View>
                  <TouchableOpacity onPress={this.toLinkSite}>
                    <Text
                      style={{
                        color: "blue",
                        fontSize: 15,
                        paddingLeft: 10,
                        fontFamily: AppStyles.fontName.main,
                      }}
                    >
                      {this.state.data.site}{" "}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {this.state.data.workPhone ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: AppStyles.fontName.bold,
                    fontWeight: "bold",
                    color: "rgb(152, 152, 152)",
                    fontSize: 16,
                    paddingLeft: 10,
                    marginBottom: 3,
                  }}
                >
                  Phone:{" "}
                </Text>
                <View>
                  <TouchableOpacity onPress={this.makeCall}>
                    <Text
                      style={{
                        color: "blue",
                        fontSize: 15,
                        paddingLeft: 10,
                        fontFamily: AppStyles.fontName.main,
                      }}
                    >
                      {this.state.data.workPhone}{" "}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {this.state.data.workEmail ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: AppStyles.fontName.bold,
                    fontWeight: "bold",
                    color: "rgb(152, 152, 152)",
                    fontSize: 16,
                    paddingLeft: 10,
                    marginBottom: 3,
                  }}
                >
                  Email:{" "}
                </Text>
                <View>
                  <TouchableOpacity onPress={this.makeEmail}>
                    <Text
                      style={{
                        color: "blue",
                        fontSize: 15,
                        paddingLeft: 10,
                        fontFamily: AppStyles.fontName.main,
                      }}
                    >
                      {this.state.data.workEmail}{" "}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* <Text style={{ color: "blue" }} onPress={this.toLinkSite(this.state.data.site)}> {this.state.data.site} </Text> */}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontFamily: AppStyles.fontName.bold,
                fontWeight: "bold",
                color: "rgb(152, 152, 152)",
                fontSize: 18,
                padding: 10,
                paddingBottom: 5,
              }}
            >
              {IMLocalized("Location")}{" "}
            </Text>
            {/* {
          this.state.data.hours ? (
            <Text style={styles.itemContainer}>{this.state.data.hours}</Text>)
            : null
        } */}
            {/* {this.state.data.shopAddress ? (
          <Text style={styles.description}> {IMLocalized("Shop Address:")} </Text>)
          : null
        } */}
            {this.state.data.shopAddress ? (
              <TouchableOpacity onPress={this.toLinkMap}>
                <Text
                  style={{
                    color: "blue",
                    fontSize: 16,
                    paddingLeft: 10,
                    fontFamily: AppStyles.fontName.main,
                    width: Dimensions.get("window").width / 1.5,
                  }}
                >
                  {this.state.data.shopAddress}{" "}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Text></Text>
        {this.state.latMarker && this.state.didFinishAnimation ? (
          <View style={{ alignItems: "center" }}>
            <MapView
              style={styles.mapView}
              initialRegion={{
                latitude: this.state.latMarker,
                longitude: this.state.longMarker,
                latitudeDelta: LATITUDEDELTA,
                longitudeDelta: LONGITUDEDELTA,
              }}
            >
              <Marker
                coordinate={{
                  latitude: this.state.latMarker,
                  longitude: this.state.longMarker,
                }}
              />
            </MapView>
          </View>
        ) : (
          <View style={[styles.mapView, styles.loadingMap]}>
            <ActivityIndicator size="small" color={AppStyles.color.main} />
          </View>
        )}
        {extraInfoArr && (
          <View>
            <Text
              style={{
                fontFamily: AppStyles.fontName.bold,
                fontWeight: "bold",
                color: "rgb(152, 152, 152)",
                fontSize: 18,
                padding: 10,
                paddingBottom: 5,
              }}
            >
              {IMLocalized("Extra info")}{" "}
            </Text>
            <View style={styles.extra}>{extraInfoArr}</View>
          </View>
        )}
        {this.state.data.addtlInsurance ? (
          <View>
            <Text
              style={{
                fontFamily: AppStyles.fontName.bold,
                fontWeight: "bold",
                color: "rgb(152, 152, 152)",
                fontSize: 18,
                padding: 10,
                paddingBottom: 5,
              }}
            >
              Additional Insurances:{" "}
            </Text>
            <Text style={styles.itemContainer}>
              {this.state.data.addtlInsurance}
            </Text>
          </View>
        ) : null}
        <Text></Text>
        {this.state.reviews.length > 0 && (
          <Text
            style={{
              fontFamily: AppStyles.fontName.bold,
              fontWeight: "bold",
              color: "rgb(152, 152, 152)",
              fontSize: 18,
              padding: 10,
              paddingBottom: 5,
            }}
          >
            {" "}
            {IMLocalized("Reviews")}{" "}
          </Text>
        )}
        <FlatList
          data={this.state.reviews}
          renderItem={this.renderReviewItem}
          keyExtractor={(item) => `${item.id}`}
          initialNumToRender={5}
        />
        {this.state.reviewModalVisible && (
          <ReviewModal
            listing={this.state.data}
            onCancel={this.onReviewCancel}
            onDone={this.onReviewCancel}
          />
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  headerIconContainer: {
    marginRight: 10,
    color: "white",
  },
  headerIcon: {
    tintColor: "white",
    height: 25,
    width: 25,
    paddingLeft: 30,
  },
  container: {
    backgroundColor: "#fafafa",
    flex: 1,
  },
  title: {
    fontFamily: AppStyles.fontName.bold,
    fontWeight: "bold",
    color: "rgb(152, 152, 152)",
    fontSize: 18,
    padding: 10,
    paddingBottom: 5,
    textAlign: "center",
  },
  itemContainer: {
    fontFamily: AppStyles.fontName.bold,
    fontWeight: "bold",
    color: AppStyles.color.title,
    fontSize: 16,
    paddingLeft: 10,
    marginBottom: 3,
    textAlign: "center",
  },
  descriptionText: {
    fontFamily: AppStyles.fontName.main,
    color: AppStyles.color.title,
    fontSize: 18,
    paddingLeft: 10,
    marginBottom: 3,
  },
  reviewTitle: {
    paddingTop: 0,
  },
  description: {
    fontFamily: AppStyles.fontName.bold,
    padding: 10,
    color: AppStyles.color.description,
  },
  photoItem: {
    backgroundColor: "white", //AppStyles.color.grey,
    height: 210,
    //  resizeMode:'contain',
    width: 210,
    borderRadius: 100,
  },
  paginationContainer: {
    flex: 1,
    position: "absolute",
    alignSelf: "center",
    paddingVertical: 8,
    marginTop: viewportHeight / 2.2,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 0,
  },
  mapView: {
    width: "90%",
    height: 200,
    // backgroundColor: AppStyles.color.grey
  },
  loadingMap: {
    justifyContent: "center",
    alignItems: "center",
  },
  extra: {
    padding: 30,
    paddingTop: 10,
    paddingBottom: 0,
  },
  extraRow: {
    flexDirection: "row",
    paddingBottom: 10,
  },
  extraKey: {
    flex: 2,
    color: AppStyles.color.title,
    fontWeight: "bold",
    fontFamily: AppStyles.fontName.main,
  },
  extraValue: {
    flex: 1,
    paddingLeft: 20,
    color: "#474747",
    fontFamily: AppStyles.fontName.main,
  },
  reviewItem: {
    padding: 10,
    marginLeft: 10,
  },
  info: {
    flexDirection: "row",
  },
  userPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  detail: {
    paddingLeft: 10,
    flex: 1,
  },
  username: {
    color: AppStyles.color.title,
    fontWeight: "bold",
    fontFamily: AppStyles.fontName.main,
  },
  reviewTime: {
    color: "#bcbfc7",
    fontSize: 12,
    fontFamily: AppStyles.fontName.main,
  },
  starRatingContainer: {
    padding: 10,
  },
  starStyle: {
    tintColor: "#84C1BA",
  },
  reviewContent: {
    color: AppStyles.color.title,
    marginTop: 10,
    fontFamily: AppStyles.fontName.main,
  },
});

const mapStateToProps = (state) => ({
  user: state.auth.user,
  isAdmin: state.auth.user.isAdmin,
});

export default connect(mapStateToProps)(DetailsScreen);
