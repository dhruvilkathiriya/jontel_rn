import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  BackHandler,
  AsyncStorage,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ListItem, SearchBar } from "react-native-elements";
import Geolocation from "@react-native-community/geolocation";
import { firebaseListing } from "../firebase";
import { AppIcon, AppStyles, ListStyle, HeaderButtonStyle } from "../AppStyles";
import HeaderButton from "../components/HeaderButton";
import { Configuration } from "../Configuration";
import MapView, { Marker } from "react-native-maps";
import FilterViewModal from "../components/FilterViewModal";
import DynamicAppStyles from "../DynamicAppStyles";
import { IMLocalized } from "../Core/localization/IMLocalization";
import { timeFormat } from "../Core";
import ListingAppConfig from "../ListingAppConfig";
import Geocoder from "react-native-geocoding";
import ActionSheet from "react-native-actionsheet";
import Icon from "react-native-vector-icons/FontAwesome";
import { Alert } from "react-native";

class ListingScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    // // return {
    //   title:
    //     typeof navigation.state.params == "undefined" ||
    //       typeof navigation.state.params.item == "undefined"
    //       ? IMLocalized("Listing")
    //       : navigation.state.params.item.name || navigation.state.params.item.title,

    //       headerTitleStyle: {
    //         color: "black",
    //         fontFamily: AppStyles.fontName.main
    //       },
    //       headeStyle: {
    //         backgroundColor: 'black'
    //       },
    //       headerLeft:
    //   <TouchableWithoutFeedback onPress={()=>navigation.goBack()}>
    //   <View style={{margin:10, marginRight:0}}>
    //     <Icon name='angle-left' color='rgb(231, 193, 146)' size={30} />
    //   </View>
    //   </TouchableWithoutFeedback>,
    //   headerRight: (
    //     <View style={HeaderButtonStyle.multi}>
    //       <HeaderButton
    //         customStyle={styles.toggleButton}
    //         style={{ tintColor: DynamicAppStyles.colorSet.mainThemeForegroundColor, resizeMode: 'contain' }}
    //         icon={
    //           navigation.state.params.mapMode
    //             ? AppIcon.images.list
    //             : AppIcon.images.map_new
    //         }
    //         onPress={() => {
    //           navigation.state.params.onChangeMode();
    //         }}
    //       />
    //       <HeaderButton
    //         customStyle={styles.filtersButton}
    //         style={{ tintColor: DynamicAppStyles.colorSet.mainThemeForegroundColor }}
    //         icon={AppIcon.images.filters}
    //         onPress={() => {
    //           navigation.state.params.onSelectFilter();
    //         }}
    //       />
    //     </View>
    //   )
    // // }

    title:
      typeof navigation.state.params == "undefined" ||
      typeof navigation.state.params.item == "undefined"
        ? IMLocalized("Listing")
        : navigation.state.params.item.name ||
          navigation.state.params.item.title,
    headerStyle: {
      backgroundColor: "black",
    },
    headerTitleStyle: {
      color: "white",
      textAlign: "center",
      alignItems: "center",
      flex: 1,
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
    headerRight: (
      <View style={HeaderButtonStyle.multi}>
        <HeaderButton
          customStyle={styles.toggleButton}
          style={{
            tintColor: DynamicAppStyles.colorSet.mainThemeForegroundColor,
            resizeMode: "contain",
          }}
          icon={
            navigation.state.params.mapMode
              ? AppIcon.images.list
              : AppIcon.images.map_new
          }
          onPress={() => {
            navigation.state.params.onChangeMode();
          }}
        />
        <HeaderButton
          customStyle={styles.filtersButton}
          style={{
            tintColor: DynamicAppStyles.colorSet.mainThemeForegroundColor,
          }}
          icon={AppIcon.images.filters}
          onPress={() => {
            navigation.state.params.onSelectFilter();
          }}
        />
      </View>
    ),
  });

  constructor(props) {
    super(props);
    Geocoder.init("AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0");
    const { navigation } = props;
    const item = navigation.getParam("item");

    this.state = {
      category: item,
      filter: {},
      data: [],
      dataBackup: [],
      mapMode: false,
      filterModalVisible: false,
      latitudeDelta: Configuration.map.delta.latitude,
      longitudeDelta: Configuration.map.delta.longitude,
      shouldUseOwnLocation: true, // Set this to false to hide the user's location
      milesIndex: -1,
      searchText: null,
    };
    this.MilesActionSheet = React.createRef();

    this.didFocusSubscription = props.navigation.addListener(
      "didFocus",
      (payload) =>
        BackHandler.addEventListener(
          "hardwareBackPress",
          this.onBackButtonPressAndroid
        )
    );

    this.unsubscribe = null;
  }

  componentDidMount() {
    this.unsubscribe = firebaseListing.subscribeListings(
      { categoryId: this.state.category.id },
      this.onCollectionUpdate
    );

    this.props.navigation.setParams({
      mapMode: this.state.mapMode,
      onChangeMode: this.onChangeMode,
      onSelectFilter: this.onSelectFilter,
    });

    AsyncStorage.getItem("currLatitude").then((res) => {
      this.setState({ latitude: JSON.parse(res) });
    });
    AsyncStorage.getItem("currLongitude").then((res) => {
      this.setState({ longitude: JSON.parse(res) });
    });

    if (this.state.shouldUseOwnLocation) {
      Geolocation.getCurrentPosition(
        (position) => {
          this.onChangeLocation(position.coords);
        },
        (error) => console.log(error.message),
        {
          enableHighAccuracy: Platform.OS === "android" ? false : true,
          timeout: 20000,
        }
      );
    }

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
    this.didFocusSubscription && this.didFocusSubscription.remove();
    this.willBlurSubscription && this.willBlurSubscription.remove();
  }

  onBackButtonPressAndroid = () => {
    this.props.navigation.goBack();

    return true;
  };

  onChangeLocation = (location) => {
    AsyncStorage.setItem("currLatitude", JSON.stringify(location.latitude));
    AsyncStorage.setItem("currLongitude", JSON.stringify(location.longitude));
    this.setState({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  onSelectFilter = () => {
    this.setState({ filterModalVisible: true });
  };

  onSelectFilterCancel = () => {
    this.setState({ filterModalVisible: false });
  };

  onSelectFilterDone = (filter) => {
    this.setState({ filter: filter });
    this.setState({ filterModalVisible: false });
    this.unsubscribe = firebaseListing.subscribeListings(
      { categoryId: this.state.category.id },
      this.onCollectionUpdate
    );
  };

  onChangeMode = () => {
    const newMode = !this.state.mapMode;
    this.setState({ mapMode: newMode });
    this.props.navigation.setParams({
      mapMode: newMode,
    });
  };

  onCollectionUpdate = (querySnapshot) => {
    const { latitude, longitude } = this.state;
    const data = [];
    let max_latitude = -400,
      min_latitude = 400,
      max_longitude = -400,
      min_logitude = 400;

    const filter = this.state.filter;
    querySnapshot.forEach((doc) => {
      const listing = doc.data();
      //console.log(listing.filters);
      let matched = true;
      Object.keys(filter).forEach(function(key) {
        if (
          filter[key] != "Any" &&
          filter[key] != "All" &&
          listing.filters[key] != filter[key]
        ) {
          matched = false;
        }
      });

      let zip = "";
      let dista = "";
      // console.log('listing address',listing)
      // fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + listing.shopAddress+ '&key=' + 'AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0')
      // .then((response) => response.json())
      // .then((responseJson) => {
      //   console.log('response===>', JSON.stringify(responseJson));
      //   var address = responseJson && responseJson.results && responseJson.results.length > 0 ? responseJson.results[0].address_components: []
      //var address = responseJson.results[0].address_components;
      // zip = this.getzipCode(address)
      dista = this.distance(
        latitude,
        longitude,
        listing.latitude,
        listing.longitude,
        "M"
      );
      let distance = dista.toFixed(1);

      if (!matched) return;

      if (max_latitude < listing.latitude) max_latitude = listing.latitude;
      if (min_latitude > listing.latitude) min_latitude = listing.latitude;
      if (max_longitude < listing.longitude) max_longitude = listing.longitude;
      if (min_logitude > listing.longitude) min_logitude = listing.longitude;
      data.push({
        ...listing,
        id: doc.id,
        zipCode: listing.zipCode,
        distance: distance,
      });
      //console.log("FOR DEMO:",{ ...listing, id: doc.id,zipCode:zip,distance:distance })
      // })

      // if (!matched) return;

      // if (max_latitude < listing.latitude)
      //   max_latitude = listing.latitude;
      // if (min_latitude > listing.latitude)
      //   min_latitude = listing.latitude;
      // if (max_longitude < listing.longitude)
      //   max_longitude = listing.longitude;
      // if (min_logitude > listing.longitude)
      //   min_logitude = listing.longitude;
      // data.push({ ...listing, id: doc.id });
    });

    if (!this.state.shouldUseOwnLocation || !this.state.latitude) {
      this.setState(
        {
          latitude: (max_latitude + min_latitude) / 2,
          longitude: (max_longitude + min_logitude) / 2,
          latitudeDelta: Math.abs(
            (max_latitude - (max_latitude + min_latitude) / 2) * 3
          ),
          longitudeDelta: Math.abs(
            (max_longitude - (max_longitude + min_logitude) / 2) * 3
          ),
          data,
        },
        () => {
          setTimeout(() => {
            this.initialMiles();
          }, 500);
        }
      );
    } else {
      this.setState(
        {
          dataBackup: data,
        },
        () => {
          setTimeout(() => {
            this.initialMiles();
          }, 500);
        }
      );
    }
  };

  initialMiles = () => {
    const { milesIndex } = this.state;
    let mile = milesIndex == -1 ? 10 : this.milesText(milesIndex);
    //console.log("milesIndex:::::::",milesIndex)
    let newFilerData = this.state.data.filter(function(item) {
      return item.distance <= mile;
    });
    this.setState({ data: newFilerData });
  };

  distance(lat1, lon1, lat2, lon2, unit) {
    if (lat1 == lat2 && lon1 == lon2) {
      return 0;
    } else {
      var radlat1 = (Math.PI * lat1) / 180;
      var radlat2 = (Math.PI * lat2) / 180;
      var theta = lon1 - lon2;
      var radtheta = (Math.PI * theta) / 180;
      var dist =
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
      return dist;
    }
  }

  // getCurrentPosition() {
  //   Geolocation.getCurrentPosition(
  //     position => {
  //       const myLat = JSON.stringify(position.coords.latitude);
  //       const myLong = JSON.stringify(position.coords.longitude);
  //       this.setState({
  //         myLat: myLat,
  //         myLong: myLong,
  //       });

  //     },
  //     error => Alert.alert('Error', JSON.stringify(error)),
  //     { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
  //   );
  // }

  // zipAddress(address) {
  //   fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + 20.6608513 + ',' + 78.7592781 + '&key=' + 'AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0')
  //     .then((response) => response.json())
  //     .then((responseJson) => {
  //       var address = responseJson.results[0].address_components;
  //       zip = this.getzipCode(address)
  //     })
  // }

  getzipCode(address) {
    var zipcode = "";
    console.log("address==>>", address);
    for (var i = 0; i < address.length; i++) {
      if (address[i].types.includes("postal_code")) {
        zipcode = address[i].short_name;
      }
    }
    return zipcode;
  }

  renderSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: "86%",
          backgroundColor: "#CED0CE",
          marginLeft: "14%",
        }}
      />
    );
  };

  onPress = (item) => {
    this.props.navigation.navigate("Detail", {
      item: item,
      customLeft: true,
      routeName: "Listing",
      isProfileComplete: this.props.navigation.state.params.isProfileComplete,
    });
  };

  renderItem = ({ item }) => {
    return (
      // <ListItem
      //   key={item.id}
      //   title={item.title}
      //   titleStyle={ListStyle.title}
      //   subtitle={
      //     <View style={ListStyle.subtitleView}>
      //       <View style={ListStyle.leftSubtitle}>
      //       <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      //         <Text style={ListStyle.time}>
      //           {timeFormat(item.createdAt)}
      //         </Text>
      //         <Text style={ListStyle.time}>
      //               {item.distance} Miles
      //         </Text>
      //         </View>
      //         <Text style={ListStyle.place}>{item.place}</Text>
      //       </View>
      //       { item.starCount ? (
      //       <Text numberOfLines={1} style={ListStyle.price}>
      //         {item.starCount} stars
      //       </Text> ) : null}
      //     </View>
      //   }
      //   onPress={() => this.onPress(item)}
      //   avatarStyle={ListStyle.avatarStyle}
      //   avatarContainerStyle={ListStyle.avatarStyle}
      //   avatar={{ uri: item.photo && typeof item.photo == 'string' && item.photo }}
      //   containerStyle={{ borderBottomWidth: 0 }}
      //   hideChevron={true}
      // />

      <View style={{ flex: 1, alignItems: "center" }}>
        <TouchableWithoutFeedback onPress={() => this.onPress(item)}>
          <View
            style={{
              width: Dimensions.get("window").width - 20,
              borderRadius: 20,
              backgroundColor: "white",
              shadowOpacity: 0.5,
              marginTop: 10,
              borderWidth: 0,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: 10,
                marginBottom: 0,
              }}
            >
              <View>
                <Image
                  source={{
                    uri:
                      item.photo && typeof item.photo == "string" && item.photo,
                  }}
                  style={{ height: "90%", width: 80, borderRadius: 16 }}
                />
                {/* <StarRating
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
                /> */}
                {console.log("stars", item.starCount)}
                {item.starCount ? (
                  <View style={{ alignItems: "center" }}>
                    {console.log(typeof item.starCount)}
                    {/* {alert(item.starCount)} */}
                    <View
                      style={{
                        height: 15,
                        width: 60,
                        backgroundColor: "rgb(231, 193, 146)",
                        marginTop: -10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {parseFloat(item.starCount) == 1.0 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                        </View>
                      ) : parseFloat(item.starCount) == 2.0 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                        </View>
                      ) : parseFloat(item.starCount) == 3.0 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                        </View>
                      ) : parseFloat(item.starCount) == 4.0 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                        </View>
                      ) : parseFloat(item.starCount) == 5.0 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                        </View>
                      ) : item.starCount > 1 && item.starCount < 2 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star-half-o" size={10} color={"white"} />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                        </View>
                      ) : item.starCount > 2 && item.starCount < 3 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star-half-o" size={10} color={"white"} />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                        </View>
                      ) : item.starCount > 3 && item.starCount < 4 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star-half-o" size={10} color={"white"} />
                          <Image
                            source={require("../CoreAssets/star_new.png")}
                            style={{ height: 10, width: 10 }}
                          />
                        </View>
                      ) : item.starCount > 4 && item.starCount < 5 ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star" size={10} color={"white"} />
                          <Icon name="star-half-o" size={10} color={"white"} />
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
              <View
                style={{
                  marginLeft: 10,
                  width: Dimensions.get("window").width - 40 / 2,
                }}
              >
                <Text style={ListStyle.title}>{item.title}</Text>
                <Text style={ListStyle.time}>{timeFormat(item.createdAt)}</Text>
                <Text numberOfLines={2} style={ListStyle.place_new}>
                  {item.place}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text style={ListStyle.time}>{item.distance} Miles</Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={ListStyle.moreInfo}>More Info</Text>
                    <Icon
                      name="angle-right"
                      size={15}
                      color="rgb(231, 193, 146)"
                      style={[ListStyle.arrow, { marginRight: 70 }]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  onPress = (item) => {
    this.props.navigation.navigate("Detail", {
      item: item,
      customLeft: true,
      routeName: "Listing",
      isProfileComplete: this.props.navigation.state.params.isProfileComplete,
    });
  };

  handleSearch = (text) => {
    console.log("text", text);
    this.setState({ searchText: text });
    const { data, dataBackup, milesIndex } = this.state;
    if (text) {
      // console.log('inside', JSON.stringify(data));
      const newData = data.filter(function(item) {
        console.log("item", item);
        //applying filter for the inserted text in search bar
        const itemData = item.zipCode
          ? item.zipCode.toUpperCase()
          : "".toUpperCase();
        const textData = text.toUpperCase();
        const address = item.shopAddress
          ? item.shopAddress.toUpperCase()
          : "".toUpperCase();
        const stateGeo = item.stateGeo
          ? item.stateGeo.toUpperCase()
          : "".toUpperCase();
        console.log(
          address.indexOf(textData),
          itemData.indexOf(textData),
          stateGeo.indexOf(textData)
        );
        if (address.indexOf(textData) > -1) {
          return address.indexOf(textData) > -1;
        } else if (itemData.indexOf(textData) > -1) {
          return itemData.indexOf(textData) > -1;
        } else if (stateGeo.indexOf(textData) > -1) {
          return stateGeo.indexOf(textData) > -1;
        } else {
          return false;
        }
        //return itemData.indexOf(textData) > -1;
      });

      // if(newData){
      //   let mile = this.milesText(milesIndex)
      //   this.onMilesSelections(mile)
      // }

      this.setState({ data: newData });
    } else {
      if (milesIndex == -1) {
        let newFilerData = dataBackup.filter(function(item) {
          return item.distance <= 10;
        });
        this.setState({ data: newFilerData });
      } else {
        this.setState({ data: dataBackup }, () => {
          let mile = this.milesText(milesIndex);
          this.onMilesSelections(mile);
        }); //its orignal
      }
    }
  };

  getLatLong = (address, callback) => {
    fetch(
      "https://maps.googleapis.com/maps/api/geocode/json?address=" +
        address +
        "&key=" +
        "AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0"
    )
      .then((response) => response.json())
      .then((responseJson) => {
        let location = responseJson.results[0].geometry.location;
        if (location.lat) {
          callback(location);
        } else {
          callback("Some");
        }
      });
  };

  onMilesSelections = (mile) => {
    const { dataBackup, milesIndex } = this.state;
    let newFilerData = dataBackup.filter(function(item) {
      return item.distance <= mile;
    });

    this.setState({ data: newFilerData });
  };

  onMilesActionDone = (index) => {
    let mile = this.milesText(index);
    this.setState({ milesIndex: index });
    this.onMilesSelections(mile);
  };

  milesText = (index) => {
    if (index == 0) return 25;
    else if (index == 1) return 50;
    else if (index == 2) return 75;
    else return 100;
  };

  Miles = () => {
    const { milesIndex } = this.state;
    return (
      <View
        style={{
          margin: 16,
          marginBottom: 8,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {/* <Text style={ListStyle.place}>Black providers within {milesIndex==-1?'10':this.milesText(milesIndex)} Miles</Text>
            <TouchableOpacity onPress={()=>this.MilesActionSheet.current.show()}>
              <Text style={[ListStyle.place,{color:'rgb(231, 193, 146)'}]}>Change Miles</Text>
            </TouchableOpacity> */}
      </View>
    );
  };

  globalSearch = () => {
    const { searchText } = this.state;
    console.log("searchtext", searchText);
    if (searchText) {
      //this.onMilesSelections(5000)

      const { data, dataBackup, milesIndex } = this.state;

      const newData = dataBackup.filter(function(item) {
        console.log("item", item);
        const itemData = item.zipCode
          ? item.zipCode.toUpperCase()
          : "".toUpperCase();
        const textData = searchText.toUpperCase();
        const address = item.shopAddress
          ? item.shopAddress.toUpperCase()
          : "".toUpperCase();
        const stateGeo = item.stateGeo
          ? item.stateGeo.toUpperCase()
          : "".toUpperCase();

        if (address.indexOf(textData) > -1) {
          return address.indexOf(textData) > -1;
        } else if (itemData.indexOf(textData) > -1) {
          return itemData.indexOf(textData) > -1;
        } else if (stateGeo.indexOf(textData) > -1) {
          return stateGeo.indexOf(textData) > -1;
        } else {
          return false;
        }
        //return itemData.indexOf(textData) > -1;
      });

      this.setState({ data: newData }, () => {
        if (newData.length == 0) {
          alert(`There are no BlackMD Cares Providers for ${searchText}`);
        }
      });
    } else {
      alert("Please add zip code or city in search box");
    }
  };

  render() {
    const { milesIndex } = this.state;
    console.log("marker", this.state.data.length);
    const markerArr = this.state.data.map((listing) => {
      return (
        <Marker
          title={listing.title}
          description={listing.description}
          onCalloutPress={() => {
            this.onPress(listing);
          }}
          coordinate={{
            latitude: listing.latitude,
            longitude: listing.longitude,
          }}
        />
      );
    });
    return (
      <View style={{ marginBottom: 16 }}>
        {/* <View style={{flex:1}}>
            <TextInput style={{height:44,backgroundColor:'#FFF',color:'#333',borderWidth:1,borderColor:'#333',padding:8,borderRadius:8,marginBottom:8}}/>
          </View> */}
        {this.state.mapMode && (
          <MapView
            style={styles.mapView}
            showsUserLocation={this.state.shouldUseOwnLocation}
            region={{
              latitude: this.state.latitude,
              longitude: this.state.longitude,
              latitudeDelta: this.state.latitudeDelta,
              longitudeDelta: this.state.longitudeDelta,
            }}
          >
            {markerArr}
          </MapView>
        )}
        {!this.state.mapMode && (
          <>
            {/* <View style={{flexDirection:'row',width:'100%',alignItems:'center'}}>
          <SearchBar
          containerStyle={{
           flex:1,
            paddingTop: 0,
            paddingBottom: 2,
            backgroundColor: "black",
            borderBottomColor: "transparent",
            borderTopColor: "transparent",
          }}
          inputStyle={{
            backgroundColor: "#f5f5f5",
            borderRadius: 10,
            color: "#151723",
            fontSize: 14,
          }}
          showLoading
          clearIcon={false}
          searchIcon={true}
          onChangeText={text => this.handleSearch(text)}
          // onClear={alert('onClear')}
          placeholder={"Search a location and zip code for Black providers"}
        />
        <TouchableOpacity style={{flex:0.4,backgroundColor:'rgb(231, 193, 146)',alignItems:'center',justifyContent:'center',padding:8,margin:8}}
            onPress={()=> this.globalSearch()}>
              <Text style={{color:'#FFF',fontSize:12}}>Search anywhere</Text>
        </TouchableOpacity>
          </View> */}

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  shadowOpacity: 0.8,
                  elevation: 2,
                  margin: 10,
                  borderWidth: 0,
                  borderRadius: 20,
                  backgroundColor: "white",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <TextInput
                  placeholder="Search Loaction By Pin Code"
                  placeholderTextColor="grey"
                  onChangeText={(text) => this.handleSearch(text)}
                  style={{
                    height: 45,
                    width: Dimensions.get("window").width / 2 - 50,
                    padding: 10,
                    color: "black",
                  }}
                />
                <TouchableOpacity onPress={() => this.globalSearch()}>
                  <Image
                    source={require("../CoreAssets/search.png")}
                    style={{
                      tintColor: "#84C1BA",
                      height: 20,
                      width: 20,
                      marginRight: 10,
                    }}
                  />
                </TouchableOpacity>
              </View>

              <View>
                <Text style={{ color: "rgb(152,152,152)", fontSize: 12 }}>
                  Providers within
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View>
                    <Text style={ListStyle.place}>
                      {milesIndex == -1 ? "10" : this.milesText(milesIndex)}{" "}
                      Miles
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      height: 30,
                      width: 70,
                      borderWidth: 0,
                      borderRadius: 20,
                      borderColor: "rgb(231, 193, 146)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: -50,
                    }}
                    onPress={() => {
                      this.MilesActionSheet.current.show();
                    }}
                  >
                    <View
                      style={{
                        height: 30,
                        width: 70,
                        borderWidth: 2,
                        borderRadius: 20,
                        borderColor: "#84C1BA",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: -50,
                        backgroundColor: "#84C1BA",
                      }}
                    >
                      <Text style={{ color: "white" }}>Change</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* <View style={{margin:16,flexDirection:'row'}}>
            <Text>Within 25 Miles</Text>
            <TouchableOpacity onPress={()=>this.MilesActionSheet.current.show()}>
              <Text>Select</Text>
            </TouchableOpacity>
          </View> */}
            <ActionSheet
              ref={this.MilesActionSheet}
              title={"Select miles"}
              options={[
                "25 Miles",
                "50 Miles",
                "75 Miles",
                "100 Miles",
                "Cancel",
              ]}
              cancelButtonIndex={4}
              destructiveButtonIndex={milesIndex}
              onPress={(index) => {
                this.onMilesActionDone(index);
              }}
            />
            <FlatList
              style={{ marginBottom: 16 }}
              ListHeaderComponent={this.Miles}
              data={this.state.data.sort((a, b) => a.distance - b.distance)}
              renderItem={this.renderItem}
              keyExtractor={(item) => `${item.id}`}
              initialNumToRender={5}
              refreshing={this.state.refreshing}
            />
          </>
        )}
        {!this.state.data.length > 0 && (
          <Text
            style={{
              padding: 15,
              fontSize: 16,
              lineHeight: 21,
              fontFamily: AppStyles.fontName.main,
            }}
          >
            We're sorry. There are no BlackMD Cares Providers specializing in{" "}
            {this.props.navigation.state.params.item.name} within
            <Text style={{ fontWeight: "bold" }}>
              {" "}
              {milesIndex == -1 ? "10" : this.milesText(milesIndex)} Miles.
            </Text>{" "}
            You can modify your search by changing miles{" "}
          </Text>
        )}
        {this.state.filterModalVisible && (
          <FilterViewModal
            value={this.state.filter}
            onCancel={this.onSelectFilterCancel}
            onDone={this.onSelectFilterDone}
            category={this.state.category}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mapView: {
    width: "100%",
    height: "100%",
    backgroundColor: AppStyles.color.grey,
  },
  filtersButton: {
    marginRight: 10,
  },
  toggleButton: {
    marginRight: 7,
  },
});

export default ListingScreen;
