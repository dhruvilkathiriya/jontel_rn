import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  BackHandler,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import StarRating from "react-native-star-rating";
import { firebaseListing } from "../firebase";
import { AppStyles, AppIcon, TwoColumnListStyle } from "../AppStyles";
import { connect } from "react-redux";
import SavedButton from "../components/SavedButton";
import { Configuration } from "../Configuration";
import DynamicAppStyles from "../DynamicAppStyles";
import { IMLocalized } from "../Core/localization/IMLocalization";
import Icon from "react-native-vector-icons/FontAwesome";

class SavedListingScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listings: [],
      savedListings: [],
      loading: true,
      error: null,
      refreshing: false,
    };

    this.didFocusSubscription = props.navigation.addListener("didFocus", () =>
      BackHandler.addEventListener(
        "hardwareBackPress",
        this.onBackButtonPressAndroid
      )
    );
  }

  // static navigationOptions = ({ navigation }) => ({
  //   title: IMLocalized("Saved Listings"),
  //   headerStyle: {
  //     backgroundColor: "#11877A",
  //   },
  // });

  static navigationOptions = ({ screenProps, navigation }) => {
    const currentTheme =
      DynamicAppStyles?.navThemeConstants[screenProps?.theme];
    return {
      title: IMLocalized("Saved Listings"),
      headerStyle: {
        backgroundColor: "#11877A",
      },
      headerLeft: (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <View style={{ margin: 10 }}>
            <Icon name="angle-left" color="white" size={30} />
          </View>
        </TouchableOpacity>
      ),
      headerRight: <View style={{ width: 35 }} />,
      headerTitleStyle: {
        color: "#FFFFFF",
        textAlign: "center",
        alignItems: "center",
        flex: 1,
      },
      headerStyle: { backgroundColor: "black" },
      headerTintColor: currentTheme.fontColor,
    };
  };

  componentDidMount() {
    this.savedListingsUnsubscribe = firebaseListing.subscribeSavedListings(
      this.props.user.id,
      this.onSavedListingsCollectionUpdate
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

    if (this.listingsUnsubscribe) this.listingsUnsubscribe();
    this.listingsUnsubscribe = firebaseListing.subscribeListings(
      {},
      this.onListingsCollectionUpdate
    );

    this.setState({
      savedListings: savedListingdata,
      loading: false,
    });
  };

  onListingsCollectionUpdate = (querySnapshot) => {
    const data = [];
    querySnapshot.forEach((doc) => {
      const listing = doc.data();
      if (this.state.savedListings.findIndex((k) => k == doc.id) >= 0) {
        listing.saved = true;
        data.push({ ...listing, id: doc.id });
      }
    });

    this.setState({
      listings: data,
      loading: false,
    });
  };

  onPressListingItem = (item) => {
    this.props.navigation.navigate("MyListingDetailModal", { item });
  };

  onPressSavedIcon = (item) => {
    this.setState({ loading: true });
    firebaseListing.saveUnsaveListing(item, this.props.user.id);
  };

  renderListingItem = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => this.onPressListingItem(item)}>
        {/* <View style={TwoColumnListStyle.listingItemContainer}>
          <FastImage
            style={[TwoColumnListStyle.listingPhoto, {height:210, borderBottomLeftRadius:10, borderBottomRightRadius:10}]}
            source={{ uri: item.photo }}
          />
          <SavedButton
            style={TwoColumnListStyle.savedIcon}
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
        <FlatList
          vertical
          showsVerticalScrollIndicator={false}
          numColumns={2}
          data={this.state.listings}
          renderItem={this.renderListingItem}
          keyExtractor={(item) => `${item.id}`}
        />
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
    tintColor: "rgb(231, 193, 146)",
  },
});

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(SavedListingScreen);
