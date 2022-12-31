import React from "react";
import {
  FlatList,
  Text,
  View,
  BackHandler,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import { ListItem, SearchBar } from "react-native-elements";
import { firebaseListing } from "../firebase";
import { ListStyle } from "../AppStyles";
import { Configuration } from "../Configuration";
import { IMLocalized } from "../Core/localization/IMLocalization";
import { timeFormat } from "../Core";
//import Geocoder from "react-native-geocoding"
import Geolocation from "@react-native-community/geolocation";
import Icon from "react-native-vector-icons/FontAwesome";
import HeaderButton from "../components/HeaderButton";
import DynamicAppStyles from "../DynamicAppStyles";
import {
  AppIcon,
  AppStyles,
  HeaderButtonStyle,
  TwoColumnListStyle,
} from "../AppStyles";

class SearchScreen extends React.Component {
  // static navigationOptions = ({ navigation }) => {
  //   headerStyle: {
  //     backgroundColor: "black"
  //   }
  //   const { params = {

  //   } } = navigation.state;

  // return {
  // header: (
  // <SearchBar
  //   containerStyle={{
  //     paddingTop: 10,
  //     paddingBottom: 5,
  //     backgroundColor: "black",
  //     borderBottomColor: "transparent",
  //     borderTopColor: "transparent",
  //     alignItems:'center'
  //   }}
  //   inputStyle={{
  //     backgroundColor: "#f5f5f5",
  //     borderRadius: 10,
  //     color: "#151723",
  //     fontSize: 14,
  //     width:Dimensions.get('window').width - 40
  //   }}
  //   showLoading
  //   clearIcon={true}
  //   searchIcon={true}
  //   onChangeText={text => params.handleSearch(text)}
  //   // onClear={alert('onClear')}
  //   placeholder={IMLocalized("Search a location for Black providers")}
  // />
  // <Icon name='angle-left' size={30} color={'rgb( 231, 193, 146)'} />
  //   <SearchBar
  //   inputStyle={{
  //         backgroundColor: "#f5f5f5",
  //         borderRadius: 10,
  //         color: "#151723",
  //         fontSize: 14,
  //         width:Dimensions.get('window').width - 120,
  //       }}
  //   showLoading
  //   placeholder={IMLocalized("Search a location for Black providers")}
  //   // clearIcon={true}
  //   onChangeText={text => params.handleSearch(text)}
  // />
  // )
  // headerLeft :
  // <Icon name='angle-left' size={30} color={'rgb( 231, 193, 146)'} />
  // }
  // }

  static navigationOptions = ({ navigation }) => ({
    // title: IMLocalized("BlackMD Cares"),
    headerStyle: {
      backgroundColor: "#000000",
      height: 80,
    },
    headerTitleStyle: {
      color: "#FFFFFF",
      // fontFamily: AppStyles.fontName.main
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
      <View
        style={{
          width: Dimensions.get("window").width - 80,
          flexDirection: "row",
          alignItems: "center",
          marginRight: 30,
          backgroundColor: "white",
          borderRadius: 8,
        }}
      >
        <TextInput
          placeholder={IMLocalized("Search a location for Black providers")}
          placeholderTextColor="grey"
          onChangeText={(text) => {
            navigation.state.params.handleSearch(text);
          }}
          style={{
            backgroundColor: "white",
            color: "black",
            borderRadius: 8,
            width: Dimensions.get("window").width - 135,
            marginLeft: 10,
          }}
        />
        <HeaderButton
          iconStyle={{ tintColor: "#000000" }}
          customStyle={{ marginRight: 15, color: "white" }}
          icon={DynamicAppStyles.iconSet.search}
          onPress={() => {
            // navigation.navigate("Search", { isProfileComplete: navigation.state.params.isProfileComplete });
          }}
        />
      </View>
    ),
  });

  constructor(props) {
    super(props);
    //Geocoder.init("AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0");
    this.unsubscribe = null;

    this.state = {
      data: [],
      page: 1,
      seed: 1,
      error: null,
      refreshing: true,
      myLong: "",
      myLat: "",
      isLoading: false,
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
  onSearch = (text) => {
    this.searchedText = text;

    this.unsubscribe = firebaseListing.subscribeListings(
      {},
      this.onCollectionUpdate
    );
  };

  // getLatLong = (shopAddress) => {
  //   var location = ''
  //   Geocoder.from(shopAddress)
  //     .then(json => {
  //       location = json.results[0].geometry.location
  //     }).catch(error => console.warn(error))
  // }

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

  onCollectionUpdate = (querySnapshot) => {
    const { myLat, myLong } = this.state;
    const data = [];
    let dista = null;
    querySnapshot.forEach((doc) => {
      const listing = doc.data();
      dista = this.distance(
        myLat,
        myLong,
        listing.latitude,
        listing.longitude,
        "M"
      );
      let distance = dista.toFixed(1);
      var text =
        this.searchedText != null ? this.searchedText.toLowerCase() : "";
      if (listing.stateGeo || listing.categoryTitle || listing.title) {
        var index = listing.stateGeo.toLowerCase().search(text);
        var indexCategory = listing.categoryTitle.toLowerCase().search(text);
        var indexName = listing.title.toLowerCase().search(text);
        if (index != -1) {
          data.push({ ...listing, id: doc.id, distance: distance });
        } else if (indexCategory != -1) {
          data.push({ ...listing, id: doc.id, distance: distance });
        } else if (indexName != -1) {
          data.push({ ...listing, id: doc.id, distance: distance });
        }
      }
    });

    this.setState({ data });
  };

  getCurrentPosition() {
    Geolocation.getCurrentPosition(
      (position) => {
        const myLat = JSON.stringify(position.coords.latitude);
        const myLong = JSON.stringify(position.coords.longitude);
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
  }

  async componentDidMount() {
    const location = await this.getCurrentPosition();
    this.unsubscribe = firebaseListing.subscribeListings(
      {},
      this.onCollectionUpdate
    );
    this.props.navigation.setParams({
      handleSearch: this.onSearch,
    });

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
    // BackHandler.exitApp();
    this.props.navigation.goBack();
    return true;
  };

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
    this.props.navigation.navigate("SearchDetail", {
      item: item,
      customLeft: true,
      headerLeft: null,
      routeName: "Search",
      isProfileComplete: this.props.navigation.state.params.isProfileComplete,
    });
  };

  renderItem = ({ item }) => {
    let url = "";
    if (item.photo && item.photo != "" && typeof item.photo === "string") {
      // console.log(" item phooto is ===", item.photo ? item.photo :'not available chandni ');
      url = { uri: item.photo };
    } else {
      url = {
        uri:
          "https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg",
      };
    }
    return (
      <ListItem
        key={item.id}
        title={item.title}
        titleStyle={ListStyle.title}
        subtitle={
          <View style={ListStyle.subtitleView}>
            <View style={ListStyle.leftSubtitle}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={ListStyle.time}>{timeFormat(item.createdAt)}</Text>
              </View>
              <Text style={ListStyle.place}>{item.place}</Text>
              <Text style={ListStyle.time}>{item.distance} Miles</Text>
            </View>
            {item.starCount ? (
              <Text numberOfLines={1} style={ListStyle.price}>
                {item.starCount} stars
              </Text>
            ) : null}
          </View>
        }
        onPress={() => this.onPress(item)}
        avatarStyle={ListStyle.avatarStyle}
        avatarContainerStyle={ListStyle.avatarStyle}
        avatar={url} //getting NSstring issue here
        containerStyle={{
          borderRadius: 18,
          shadowOpacity: 0.3,
          marginTop: 20,
          borderTopWidth: 0,
        }}
        hideChevron={false}
      />
    );
  };

  renderItemList = ({ item }) => {
    let url = "";
    if (item.photo && item.photo != "" && typeof item.photo === "string") {
      // console.log(" item phooto is ===", item.photo ? item.photo :'not available chandni ');
      url = { uri: item.photo };
    } else {
      url = {
        uri:
          "https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg",
      };
    }
    return (
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
                  source={url}
                  style={{ height: "90%", width: 80, borderRadius: 16 }}
                />
                {console.log(
                  "starrs above",
                  item.starCount,
                  typeof item.starCount
                )}
                {item.starCount ? (
                  <View style={{ alignItems: "center" }}>
                    {console.log(typeof item.starCount)}
                    {/* {alert(item.starCount)} */}
                    <View
                      style={{
                        height: 15,
                        width: 60,
                        backgroundColor: "#84C1BA",
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
                      color="#84C1BA"
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

  render() {
    const { data } = this.state;
    return (
      <View style={{ flex: 1 }}>
        {/* {console.log('data', data)} */}
        {data && !data.length ? (
          <View
            style={{ justifyContent: "center", alignItems: "center", flex: 1 }}
          >
            <ActivityIndicator size="small" color="#84C1BA" />
          </View>
        ) : data !== [] ? (
          <FlatList
            data={data.sort((a, b) => a.distance - b.distance)}
            renderItem={this.renderItemList}
            ListFooterComponent={() => <View style={{ height: 30 }} />}
            keyExtractor={(item) => `${item.id}`}
            initialNumToRender={5}
            refreshing={this.state.refreshing}
          />
        ) : (
          <View
            style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
          >
            <Text>No Data Found</Text>
          </View>
        )}
      </View>
    );
  }
}

export default SearchScreen;
