import React from "react";
import {
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Text,
  View,
  Alert,
  Dimensions,
  TouchableHighlight,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import ModalSelector from "react-native-modal-selector";
import { AppStyles, ModalHeaderStyle, ModalSelectorStyle } from "../AppStyles";
import TextButton from "react-native-button";
import FastImage from "react-native-fast-image";
import { Configuration } from "../Configuration";
import { connect } from "react-redux";
import ImagePicker from "react-native-image-picker";
import Icon from "react-native-vector-icons/FontAwesome";
import FilterViewModal from "../components/FilterViewModal";
import SelectLocationModal from "../components/SelectLocationModal";
import ActionSheet from "react-native-actionsheet";
import Geocoder from "react-native-geocoding";
import ServerConfiguration from "../ServerConfiguration";
import { firebaseStorage } from "../Core/firebase/storage";
import ListingAppConfig from "../ListingAppConfig";
import { firebaseListing } from "../firebase";
import { IMLocalized } from "../Core/localization/IMLocalization";
import DynamicAppStyles from "../DynamicAppStyles";
import { toTime } from "i18n-js";
import AddressSelectModal from "./AddressSelectModal";

class PostModal extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: "Home",
    headerStyle: {
      backgroundColor: "#11877A",
      height: 80,
    },
    headerTitleStyle: {
      color: "#FFFFFF",
      fontFamily: AppStyles.fontName.main,
    },
    headerLeft: (
      <View>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS == "ios") {
              navigation.navigate("Home");
            } else navigation.goBack();
          }}
        >
          <View style={{ marginLeft: 10 }}>
            <Icon
              name="angle-left"
              size={30}
              color={"rgb(231, 193, 146)"}
              style={{ marginLeft: 10 }}
              onPress={() => {
                navigation.navigate("Home");
              }}
            />
          </View>
        </TouchableOpacity>
      </View>
    ),
  });

  constructor(props) {
    super(props);

    // Geocoder.init("AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0");

    //Geocoder.init("AIzaSyAwt4h2oy-AxDgxrePP5YwBTmSmMZTlqrI");

    Geocoder.init("AIzaSyBuR9zL50buuHhgoJeqCz1g9mouFFW8fd0");

    const { selectedItem, categories, onCancel } = this.props;
    let category = { name: IMLocalized("choose from here") };
    let title = "";
    let description = "";
    let instagram = "";
    let site = "";
    let booking = "";
    let categoryTitle = "";
    let shopAddress = "";
    let stateGeo = "";
    let zipCode = "";
    let location = {
      latitude: Configuration.map.origin.latitude,
      longitude: Configuration.map.origin.longitude,
    };
    let localPhotos = [];
    let photoUrls = [];
    let price = "";
    let textInputValue = "";
    let filter = {};
    let filterValue = IMLocalized("choose from here");
    let address = "Checking...";

    // if (categories.length > 0) category = categories[0];
    if (selectedItem) {
      const {
        name,
        latitude,
        longitude,
        photos,
        filters,
        //instagram,
        //site,
        booking,
        //shopAddress,
        //stateGeo,
        place,
      } = selectedItem;

      category = categories.find(
        (category) => selectedItem.categoryID === category.id
      );
      title = selectedItem.title || name;
      description = selectedItem.description;
      instagram = selectedItem.featureTxt || "";
      site = selectedItem.site || "";
      booking;
      stateGeo = selectedItem.stateGeo || "";
      shopAddress = selectedItem.shopAddress || "";
      zipCode = selectedItem.zipCode || "";
      location = {
        latitude,
        longitude,
      };
      localPhotos = photos;
      photoUrls = photos;
      price = selectedItem.hours;
      workPhone = selectedItem.workPhone || "";
      workEmail = selectedItem.workEmail || "";
      filter = filters;
      address = place;
    }
    this.state = {
      categories: categories,
      category: category,
      title,
      categoryTitle,
      description: IMLocalized("choose from here"),
      instagram,
      site,
      booking,
      stateGeo,
      shopAddress,
      zipCode,
      location,
      localPhotos,
      photoUrls,
      from: "",
      to: "",
      fromTime: "AM",
      toTime: "PM",
      price,
      textInputValue,
      filter,
      filterValue,
      address,
      workPhone: selectedItem ? selectedItem.workPhone : "",
      workEmail: selectedItem ? selectedItem.workEmail : "",
      filterModalVisible: false,
      locationModalVisible: false,
      loading: false,
      latMarker: null,
      longMarker: null,
      isSubmitButtonClicked: false,
      nav: this.props,
      providerAddressModal: false,
    };
  }

  componentDidMount() {
    this.setFilterString(this.state.filter);
    Geolocation.getCurrentPosition(
      (position) => {
        this.setState({ location: position.coords });
        this.onChangeLocation(position.coords);
      },
      (error) => console.log(error.message),
      {
        enableHighAccuracy: Platform.OS === "android" ? false : true,
        timeout: 20000,
      }
    );
  }

  selectLocation = () => {
    this.setState({ locationModalVisible: true });
  };

  onChangeLocation = (location) => {
    Geocoder.from(location.latitude, location.longitude)
      .then((json) => {
        const addressComponent = json.results[0].formatted_address;
        this.setState({ address: addressComponent });
      })
      .catch((error) => {
        console.log(error);
        this.setState({ address: "Place Marker on Map" });
      });
  };

  setFilterString = (filter) => {
    let filterValue = "";
    Object.keys(filter).forEach(function(key) {
      if (filter[key] != "Any" && filter[key] != "All") {
        filterValue += " " + filter[key];
      }
    });

    if (filterValue == "") {
      if (Object.keys(filter).length > 0) {
        filterValue = "Any";
      } else {
        filterValue = IMLocalized("choose from here");
      }
    }

    this.setState({ filterValue: filterValue });
  };

  onSelectLocationDone = (location) => {
    this.setState({ location: location });
    this.setState({ locationModalVisible: false });
    this.onChangeLocation(location);
  };

  onSelectLocationCancel = () => {
    this.setState({ locationModalVisible: false });
  };

  selectFilter = () => {
    if (!this.state.category.id) {
      alert(IMLocalized("You must choose a category first."));
    } else {
      this.setState({ filterModalVisible: true });
    }
  };

  onSelectFilterCancel = () => {
    this.setState({ filterModalVisible: false });
  };

  onSelectFilterDone = (filter) => {
    this.setState({ filter: filter });
    this.setState({ filterModalVisible: false });
    this.setFilterString(filter);
  };

  onPressAddPhotoBtn = () => {
    // More info on all the options is below in the API Reference... just some common use cases shown here
    const options = {
      title: IMLocalized("Select a photo"),
      storageOptions: {
        skipBackup: true,
        path: "images",
      },
    };

    /**
     * The first arg is the options object for customization (it can also be null or omitted for default options),
     * The second arg is the callback which sends object: response (more info in the API Reference)
     */
    ImagePicker.showImagePicker(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.error) {
        alert(response.error);
        console.log("ImagePicker Error: ", response.error);
      } else if (response.customButton) {
        console.log("User tapped custom button: ", response.customButton);
      } else {
        this.setState({
          localPhotos: [...this.state.localPhotos, response.uri],
        });
      }
    });
  };

  onCancel = () => {
    this.props.onCancel();
  };

  onPost = () => {
    const self = this;
    const onCancel = self.onCancel;
    console.log("zipcode", this.state.zipCode);
    if (
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.state.workEmail)
    ) {
      // alert(IMLocalized("Work Email Is Not Valid!"));
      // return;
    }

    if (this.state.isSubmitButtonClicked) {
      alert(IMLocalized("Your listing is pending approval"));
      return;
    }

    if (!self.state.title) {
      alert(IMLocalized("Provider Name was not provided."));
      return;
    }
    if (!self.state.description) {
      alert(IMLocalized("Description was not set."));
      return;
    }
    if (!self.state.shopAddress) {
      alert(IMLocalized("Address was not set."));
      return;
    }
    if (!self.state.stateGeo) {
      alert(IMLocalized("City and state was not set."));
      return;
    }
    // if (!self.state.zipCode) {
    //   alert(IMLocalized("Zip code was not set."));
    //   return;
    // }
    // if (!self.state.site) {
    //   alert(IMLocalized("Website was not set."));
    //   return;
    // }
    if (self.state.localPhotos.length == 0) {
      alert(IMLocalized("Please provide at least one photo."));
      return;
    }
    if (Object.keys(self.state.filter).length == 0) {
      alert(IMLocalized("Please set the filters."));
      return;
    }

    self.setState({ loading: true });

    let photoUrls = [];

    if (self.props.selectedItem) {
      photoUrls = [...self.props.selectedItem.photos];
    }

    Geocoder.from(self.state.shopAddress)
      .then((json) => {
        var location = json.results[0].geometry.location;
        console.log("location====>>>", location);
        this.setState({ latMarker: location.lat, longMarker: location.lng });

        //Added here because latlong not generated

        let uploadPromiseArray = [];
        self.state.localPhotos.forEach((uri) => {
          if (!uri.startsWith("https://")) {
            uploadPromiseArray.push(
              new Promise((resolve, reject) => {
                firebaseStorage.uploadImage(uri).then((response) => {
                  if (response.downloadURL) {
                    photoUrls.push(response.downloadURL);
                  }
                  resolve();
                });
              })
            );
          }
        });

        Promise.all(uploadPromiseArray)
          .then((values) => {
            const location = {
              latitude: self.state.location.latitude,
              longitude: self.state.location.longitude,
            };
            const uploadObject = {
              completedReg: true,
              isApproved: !ServerConfiguration.isApprovalProcessEnabled,
              authorID: self.props.user.id,
              author: self.props.user,
              categoryID: self.state.category.id,
              categoryTitle: self.state.category.name,
              description: self.state.description,
              shopAddress: self.state.shopAddress,
              zipCode: self.state.zipCode,
              site: self.state.site || "",
              stateGeo: self.state.stateGeo,
              featureTxt: self.state.instagram,
              addtlInsurance: self.state.booking,
              latitude: self.state.latMarker,
              longitude: self.state.longMarker,
              // latitude: self.state.location.latitude,
              // longitude: self.state.location.longitude,
              filters: self.state.filter,
              title: self.state.title,
              // price: self.state.price,
              hours:
                self.state.from +
                self.state.fromTime +
                "-" +
                self.state.to +
                self.state.toTime,
              workPhone: self.state.workPhone,
              workEmail: self.state.workEmail,
              //TODO:
              place: self.state.shopAddress,
              photo: photoUrls.length > 0 ? photoUrls[0] : null,
              photos: photoUrls,
              photoURLs: photoUrls,
            };
            firebaseListing.postListing(
              self.props.selectedItem,
              uploadObject,
              photoUrls,
              location,

              ({ success }) => {
                if (success) {
                  Alert.alert(IMLocalized("Profile Submitted Successfully!"));
                  self.setState(
                    {
                      loading: false,
                      isSubmitButtonClicked: true,
                    },
                    () => {
                      onCancel();
                    }
                  );
                } else {
                  self.setState({ loading: false });
                  alert(error);
                }
              }
            );
          })
          .catch((reason) => {
            self.setState({ loading: false });
            console.log("post listing error ", reason);
          });
      })
      .catch((error) => {
        self.setState({ loading: false });
        console.warn(error);
      });

    // uploadPromiseArray = [];
    // self.state.localPhotos.forEach(uri => {
    //   if (!uri.startsWith("https://")) {
    //     uploadPromiseArray.push(
    //       new Promise((resolve, reject) => {
    //         firebaseStorage.uploadImage(uri).then(response => {
    //           if (response.downloadURL) {
    //             photoUrls.push(response.downloadURL);
    //           }
    //           resolve();
    //         });
    //       })
    //     );
    //   }
    // });

    // Promise.all(uploadPromiseArray)
    //   .then(values => {
    //     const location = {
    //       latitude: self.state.location.latitude,
    //       longitude: self.state.location.longitude
    //     };
    //     const uploadObject = {
    //       completedReg: true,
    //       isApproved: !ServerConfiguration.isApprovalProcessEnabled,
    //       authorID: self.props.user.id,
    //       author: self.props.user,
    //       categoryID: self.state.category.id,
    //       categoryTitle: self.state.category.name,
    //       description: self.state.description,
    //       shopAddress: self.state.shopAddress,
    //       site: self.state.site || '',
    //       stateGeo: self.state.stateGeo,
    //       featureTxt: self.state.instagram,
    //       addtlInsurance: self.state.booking,
    //       latitude: self.state.latMarker,
    //       longitude: self.state.longMarker,
    //       // latitude: self.state.location.latitude,
    //       // longitude: self.state.location.longitude,
    //       filters: self.state.filter,
    //       title: self.state.title,
    //       // price: self.state.price,
    //       hours: self.state.price,
    //       workPhone: self.state.workPhone,
    //       workEmail: self.state.workEmail,
    //       //TODO:
    //       place: self.state.shopAddress,
    //       photo: photoUrls.length > 0 ? photoUrls[0] : null,
    //       photos: photoUrls,
    //       photoURLs: photoUrls
    //     };
    //     firebaseListing.postListing(
    //       self.props.selectedItem,
    //       uploadObject,
    //       photoUrls,
    //       location,

    //       ({ success }) => {
    //         if (success) {
    //           self.setState({ loading: false }, () => {
    //             onCancel();
    //           });
    //         } else {
    //           alert(error);
    //         }
    //       }
    //     );
    //   })
    //   .catch(reason => {
    //     console.log(reason);
    //   });
  };

  showActionSheet = (index) => {
    this.setState({
      selectedPhotoIndex: index,
    });
    this.ActionSheet.show();
  };

  onActionDone = (index) => {
    if (index == 0) {
      var array = [...this.state.localPhotos];
      array.splice(this.state.selectedPhotoIndex, 1);
      this.setState({ localPhotos: array });
    }
  };

  onProviderAddressPress = () => this.setState({ providerAddressModal: true });

  render() {
    var categoryData = this.state.categories.map((category, index) => ({
      key: category.id,
      label: category.name,
    }));
    categoryData.unshift({ key: "section", label: "Category", section: true });

    var providerTypeData = [
      {
        key: 1,
        label: "Physician",
      },
      {
        key: 2,
        label: "Dentist",
      },
      {
        key: 3,
        label: "Licensed Clinical Social Worker",
      },
      {
        key: 4,
        label: "Physician Assistant",
      },
      {
        key: 5,
        label: "Nurse Practitioner",
      },
      {
        key: 6,
        label: "Occupational Therapist",
      },
      {
        key: 7,
        label: "Physical Therapist",
      },
      {
        key: 8,
        label: "Midwife",
      },
      {
        key: 9,
        label: "Nurse Anesthetist",
      },
      {
        key: 10,
        label: "Advanced Practice Nurse",
      },
      {
        key: 11,
        label: "Psychologist",
      },
      {
        key: 12,
        label: "Speech Therapist",
      },
      {
        key: 14,
        label: "Licensed Professional Counselor",
      },
      {
        key: 15,
        label: "Optometrist",
      },
    ];
    providerTypeData.unshift({
      key: "section",
      label: "Category",
      section: true,
    });

    const photos = this.state.localPhotos.map((photo, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => {
          this.showActionSheet(index);
        }}
      >
        <FastImage style={styles.photo} source={{ uri: photo }} />
      </TouchableOpacity>
    ));

    return (
      <Modal
        visible={this.props.isVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={this.onCancel}
      >
        {/* <View style={ModalHeaderStyle.bar}>
          <TouchableOpacity
          style={{height:80, width:100, backgroundColor:'red'}}
          onPress={()=>{
             alert('pressedd!')
              this.onCancel()
            }}>
            <Icon name='angle-left' size={30} color={'rgb(231, 193, 146)'} style={{marginLeft : 10 }} />
          </TouchableOpacity>
          <Text style={[ModalHeaderStyle.title, {marginTop:10}]} >Add Provider</Text>
          
        </View> */}

        {this.state.providerAddressModal && (
          <AddressSelectModal
            onPlaceSelect={(address) => {
              this.setState({
                providerAddressModal: false,
                shopAddress: address,
              });
            }}
            onCancel={() => this.setState({ providerAddressModal: false })}
          />
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            height: Platform.OS == "ios" ? 80 : 50,
            backgroundColor: "#000000",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => this.onCancel()}
            hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
          >
            <Icon
              name="angle-left"
              size={30}
              color={"white"}
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
          <Text style={[ModalHeaderStyle.title]}>{"Add Provider"}</Text>
          <View style={{ width: 20, height: 20 }} />
        </View>

        <ScrollView style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Name</Text>
            <View style={{ alignItems: "center" }}>
              <TextInput
                style={[styles.input, { color: "black" }]}
                value={this.state.title}
                autoCapitalize="words"
                onChangeText={(text) => {
                  if (/^[a-zA-Z\s]+$/.test(text) || text == "")
                    this.setState({ title: text });
                }}
                placeholder="ex. Marcus Smith MD"
                placeholderTextColor={AppStyles.color.placeholder}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Type</Text>
            {/* <View style={{ alignItems: "center" }}>
              <TextInput
                multiline={true}
                numberOfLines={2}
                style={styles.input}
                onChangeText={(text) => this.setState({ description: text })}
                value={this.state.description}
                placeholder="Start typing"
                placeholderTextColor={AppStyles.color.placeholder}
                underlineColorAndroid="transparent"
              />
            </View> */}

            <ModalSelector
              touchableActiveOpacity={0.9}
              data={providerTypeData}
              sectionTextStyle={ModalSelectorStyle.sectionTextStyle}
              optionTextStyle={ModalSelectorStyle.optionTextStyle}
              optionContainerStyle={ModalSelectorStyle.optionContainerStyle}
              cancelContainerStyle={ModalSelectorStyle.cancelContainerStyle}
              cancelTextStyle={ModalSelectorStyle.cancelTextStyle}
              selectedItemTextStyle={ModalSelectorStyle.selectedItemTextStyle}
              backdropPressToClose={true}
              cancelText={IMLocalized("Cancel")}
              initValue={this.state.description}
              onChange={(option) => {
                this.setState({ description: option?.label });
                // this.setState((prevState) => ({
                //   category: { id: option.key, name: option.label },
                //   categoryTitle: option.label,
                //   filterValue:
                //     prevState.category.id === option.key
                //       ? this.state.filterValue
                //       : IMLocalized("choose from here"),
                //   filter:
                //     prevState.category.id === option.key
                //       ? this.state.filter
                //       : {},
                // }));
              }}
            >
              <View
                style={[
                  styles.row,
                  {
                    borderBottomWidth: 1,
                    borderColor: "rgb(152,152,152)",
                    width: "90%",
                    alignSelf: "center",
                    justifyContent: "space-between",
                    paddingLeft: 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.value,
                    {
                      borderColor: "rgb(152,152,152)",
                      textAlign: "left",
                      color: "rgb(152,152,152)",
                    },
                  ]}
                >
                  {this.state.description}
                </Text>
                <Icon
                  name="angle-down"
                  size={20}
                  color={"#84C1BA"}
                  style={{}}
                />
              </View>
            </ModalSelector>
          </View>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credentials</Text>
            <View style={{ alignItems: "center" }}>
              <TextInput
                multiline={true}
                numberOfLines={2}
                style={styles.input}
                onChangeText={(text) => this.setState({ instagram: text })}
                value={this.state.instagram}
                placeholder="MD, DO, OD..."
                placeholderTextColor={AppStyles.color.placeholder}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Website</Text>
            <View style={{ alignItems: "center" }}>
              <TextInput
                multiline={true}
                numberOfLines={2}
                style={styles.input}
                autoCapitalize="none"
                onChangeText={(text) => this.setState({ site: text })}
                value={this.state.site}
                placeholder="Type here"
                placeholderTextColor={AppStyles.color.placeholder}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Address</Text>
            <TouchableOpacity
              style={styles.providerAddressContainer}
              activeOpacity={1}
              onPress={this.onProviderAddressPress}
            >
              <Text
                numberOfLines={2}
                ellipsizeMode={"tail"}
                style={[
                  styles.input,
                  {
                    color:
                      this.state.shopAddress?.length > 0
                        ? AppStyles.color.main
                        : AppStyles.color.placeholder,
                    paddingBottom: Platform.OS === "ios" ? 0 : 10,
                    width: "100%",
                  },
                ]}
              >
                {this.state.shopAddress?.length > 0
                  ? this.state.shopAddress
                  : "ex. 614 W Morgan St, Durham NC"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{"Provider address line 2"}</Text>
            <View style={{ alignItems: "center" }}>
              <TextInput
                multiline={true}
                numberOfLines={2}
                style={styles.input}
                onChangeText={(text) => this.setState({ stateGeo: text })}
                value={this.state.stateGeo}
                placeholder="ex. New York - 77479"
                placeholderTextColor={AppStyles.color.placeholder}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zip code</Text>
            <View style={{ alignItems: "center" }}>
              <TextInput
                multiline={true}
                numberOfLines={1}
                style={styles.input}
                onChangeText={(text) => {
                  // if(text.length <7)
                  this.setState({ zipCode: text });
                }}
                keyboardType={"number-pad"}
                value={this.state.zipCode}
                placeholder="ex. 77479"
                placeholderTextColor={AppStyles.color.placeholder}
                underlineColorAndroid="transparent"
              />
            </View>
          </View> */}
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Info</Text>
            <View style={styles.row}>
              <Text style={styles.title}>Hours</Text>
              {/* <TextInput
                style={styles.priceInput}
                value={this.state.price}
                onChangeText={text => this.setState({ price: text })}
                placeholderTextColor={AppStyles.color.placeholder}
                placeholder="ex. 10am-5pm"
                underlineColorAndroid="transparent"
              /> */}
              {/* <View style={{flexDirection:'row', alignItems:'center'}}> */}
              <TextInput
                style={{
                  borderBottomWidth: 1,
                  borderColor: "rgb(152,152,152)",
                  width: 35,
                  color: "black",
                }}
                value={this.state.from}
                onChangeText={(text) => this.setState({ from: text })}
                placeholderTextColor={AppStyles.color.placeholder}
                placeholder="8:00"
                underlineColorAndroid="transparent"
              />
              <View
                style={{
                  height: 30,
                  width: 70,
                  borderWidth: 1,
                  borderColor: "#84C1BA",
                  borderRadius: 20,
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginLeft: 10,
                  marginRight: 10,
                }}
              >
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor:
                      this.state.fromTime == "AM" ? "#84C1BA" : "transparent",
                    color: "white",
                    borderRadius: 20,
                    width: 40,
                  }}
                >
                  <Text
                    style={{
                      color:
                        this.state.fromTime == "AM"
                          ? "white"
                          : "rgb(152,152,152)",
                    }}
                    onPress={() => this.setState({ fromTime: "AM" })}
                  >
                    AM{" "}
                  </Text>
                </View>
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor:
                      this.state.fromTime == "PM" ? "#84C1BA" : "transparent",
                    color: "white",
                    borderRadius: 20,
                    width: 40,
                  }}
                >
                  <Text
                    style={{
                      color:
                        this.state.fromTime == "PM"
                          ? "white"
                          : "rgb(152,152,152)",
                    }}
                    onPress={() => this.setState({ fromTime: "PM" })}
                  >
                    {" "}
                    PM
                  </Text>
                </View>
              </View>
              <Text style={{ color: "rgb(152,152,152)" }}> To </Text>
              <TextInput
                style={{
                  borderBottomWidth: 1,
                  borderColor: "rgb(152,152,152)",
                  width: 35,
                  color: "black",
                }}
                value={this.state.to}
                onChangeText={(text) => this.setState({ to: text })}
                placeholderTextColor={AppStyles.color.placeholder}
                placeholder="8:00"
                underlineColorAndroid="transparent"
              />
              <View
                style={{
                  height: 30,
                  width: 70,
                  borderWidth: 1,
                  borderColor: "#84C1BA",
                  borderRadius: 20,
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginLeft: 10,
                  marginRight: 10,
                }}
              >
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor:
                      this.state.toTime == "AM" ? "#84C1BA" : "transparent",
                    color: "white",
                    borderRadius: 20,
                    width: 40,
                  }}
                >
                  <Text
                    style={{
                      color:
                        this.state.toTime == "AM"
                          ? "white"
                          : "rgb(152,152,152)",
                    }}
                    onPress={() => this.setState({ toTime: "AM" })}
                  >
                    AM{" "}
                  </Text>
                </View>
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor:
                      this.state.toTime == "PM" ? "#84C1BA" : "transparent",
                    color: "white",
                    borderRadius: 20,
                    width: 40,
                  }}
                >
                  <Text
                    style={{
                      color:
                        this.state.toTime == "PM"
                          ? "white"
                          : "rgb(152,152,152)",
                    }}
                    onPress={() => this.setState({ toTime: "PM" })}
                  >
                    {" "}
                    PM
                  </Text>
                </View>
              </View>
              {/* </View> */}
            </View>
            {/* <View style={styles.row}>
              <Text style={styles.title}>Work Number</Text>
              <TextInput
                style={{
                  color: "black",
                  fontFamily: AppStyles.fontName.main,
                  borderBottomWidth: 1,
                  borderColor: "rgb(152,152,152)",
                  width: Dimensions.get("window").width / 2,
                }}
                value={this.state.workPhone}
                keyboardType="number-pad"
                onChangeText={(text) => {
                  if (text.length < 11) this.setState({ workPhone: text });
                }}
                placeholderTextColor={AppStyles.color.placeholder}
                placeholder="ex. +1 9191234567"
                underlineColorAndroid="transparent"
              />
            </View> */}
            <View style={styles.row}>
              <Text style={styles.title}>Work Email</Text>
              <TextInput
                // style={styles.priceInput}
                style={{
                  color: "black",
                  fontFamily: AppStyles.fontName.main,
                  borderBottomWidth: 1,
                  borderColor: "rgb(152,152,152)",
                  width: Dimensions.get("window").width / 2,
                }}
                autoCapitalize="none"
                value={this.state.workEmail}
                onChangeText={(text) => {
                  this.setState({ workEmail: text });
                }}
                placeholderTextColor={AppStyles.color.placeholder}
                placeholder="ex. me@blackMD.com"
                underlineColorAndroid="transparent"
              />
            </View>
            <ModalSelector
              touchableActiveOpacity={0.9}
              data={categoryData}
              sectionTextStyle={ModalSelectorStyle.sectionTextStyle}
              optionTextStyle={ModalSelectorStyle.optionTextStyle}
              optionContainerStyle={ModalSelectorStyle.optionContainerStyle}
              cancelContainerStyle={ModalSelectorStyle.cancelContainerStyle}
              cancelTextStyle={ModalSelectorStyle.cancelTextStyle}
              selectedItemTextStyle={ModalSelectorStyle.selectedItemTextStyle}
              backdropPressToClose={true}
              cancelText={IMLocalized("Cancel")}
              initValue={this.state.category.name}
              onChange={(option) => {
                this.setState((prevState) => ({
                  category: { id: option.key, name: option.label },
                  categoryTitle: option.label,
                  filterValue:
                    prevState.category.id === option.key
                      ? this.state.filterValue
                      : IMLocalized("choose from here"),
                  filter:
                    prevState.category.id === option.key
                      ? this.state.filter
                      : {},
                }));
              }}
            >
              <View style={styles.row}>
                <Text style={styles.title}>
                  {IMLocalized("Choose your Speciality")}
                </Text>
                <View
                  style={[
                    styles.row,
                    { borderBottomWidth: 1, borderColor: "rgb(152,152,152)" },
                  ]}
                >
                  <Text
                    style={[
                      styles.value,
                      {
                        borderColor: "rgb(152,152,152)",
                        width: Dimensions.get("window").width / 2 - 50,
                        textAlign: "left",
                        color: "rgb(152,152,152)",
                      },
                    ]}
                  >
                    {this.state.category.name}
                  </Text>
                  <Icon
                    name="angle-down"
                    size={20}
                    color="#84C1BA"
                    style={{}}
                  />
                </View>
              </View>
            </ModalSelector>
            <TouchableOpacity onPress={this.selectFilter}>
              <View style={styles.row}>
                <Text style={styles.title}>
                  {IMLocalized("Filters & Insurances")}
                </Text>
                <View
                  style={[
                    styles.row,
                    { borderBottomWidth: 1, borderColor: "rgb(152,152,152)" },
                  ]}
                >
                  <Text
                    style={[
                      styles.value,
                      {
                        borderColor: "rgb(152,152,152)",
                        width: Dimensions.get("window").width / 2 - 50,
                        textAlign: "left",
                        color: "rgb(152,152,152)",
                      },
                    ]}
                  >
                    {this.state.filterValue}
                  </Text>
                  <Icon
                    name="angle-down"
                    size={20}
                    color="#84C1BA"
                    style={{}}
                  />
                </View>
              </View>
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={this.selectLocation}>
              <View style={styles.row}>
                <Text style={styles.title}>{IMLocalized("Office Location")}</Text>
                <View style={styles.location}>
                  <Text style={styles.value}>{this.state.address}</Text>
                </View>
              </View>
            </TouchableOpacity> */}
          </View>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Insurances</Text>
            <View style={{ alignItems: "center" }}>
              <TextInput
                multiline={true}
                numberOfLines={2}
                style={styles.input}
                onChangeText={(text) => this.setState({ booking: text })}
                value={this.state.booking}
                placeholder="Insurances offered that were not listed above. Seperate by comma."
                placeholderTextColor={AppStyles.color.placeholder}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
          {/* <Text style={styles.addPhotoTitle}>{IMLocalized("Add Photos")}</Text> */}
          <View
            style={{ alignItems: "center", marginTop: 20, marginBottom: 10 }}
          >
            <TouchableOpacity onPress={this.onPressAddPhotoBtn.bind(this)}>
              <View
                style={{
                  height: 35,
                  width: 210,
                  borderWidth: 1,
                  borderColor: "#84C1BA",
                  borderRadius: 20,
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "row",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 14,
                    color: "#84C1BA",
                  }}
                >
                  Add Photos
                </Text>
                <Image
                  source={require("../CoreAssets/camera_new.png")}
                  style={{
                    height: 24,
                    width: 30,
                    tintColor: "#84C1BA",
                    resizeMode: "contain",
                    marginLeft: 10,
                  }}
                />
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.photoList} horizontal={true}>
            {photos}
            {/* <TouchableOpacity onPress={this.onPressAddPhotoBtn.bind(this)}>
                <View style={[styles.addButton, styles.photo]}>
                  <Icon name="camera" size={50} color={AppStyles.color.background} />
                </View>
              </TouchableOpacity> */}
          </ScrollView>

          {this.state.filterModalVisible && (
            <FilterViewModal
              value={this.state.filter}
              onCancel={this.onSelectFilterCancel}
              onDone={this.onSelectFilterDone}
              category={this.state.category}
            />
          )}
          {this.state.locationModalVisible && (
            <SelectLocationModal
              location={this.state.location}
              onCancel={this.onSelectLocationCancel}
              onDone={this.onSelectLocationDone}
            />
          )}

          {this.state.loading ? (
            <View style={styles.activityIndicatorContainer}>
              <ActivityIndicator size="large" color={"#84C1BA"} />
            </View>
          ) : (
            <View
              style={{ alignItems: "center", marginBottom: 20, marginTop: 10 }}
            >
              {Platform.OS == "ios" ? (
                <TouchableOpacity onPress={() => this.onPost()}>
                  <View
                    style={{
                      backgroundColor:
                        DynamicAppStyles.colorSet.mainThemeForegroundColor,
                      // padding: 25,
                      width: Dimensions.get("window").width - 100,
                      borderRadius: 40,
                      height: 55,
                      justifyContent: "center",
                      alignItems: "center",
                      // color:'white'
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 15,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    >
                      Submit
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TextButton
                  containerStyle={styles.addButtonContainer}
                  onPress={this.onPost}
                  style={styles.addButtonText}
                >
                  {IMLocalized("SUBMIT")}
                </TextButton>
              )}
            </View>
          )}
        </ScrollView>

        <ActionSheet
          ref={(o) => (this.ActionSheet = o)}
          title={IMLocalized("Confirm to delete?")}
          options={[IMLocalized("Confirm"), IMLocalized("Cancel")]}
          cancelButtonIndex={1}
          destructiveButtonIndex={0}
          onPress={(index) => {
            this.onActionDone(index);
          }}
        />
      </Modal>
    );
  }
}
const actionSheetStyles = {
  titleBox: {
    backgroundColor: "pink",
  },
  titleText: {
    fontSize: 20,
    color: "#000fff",
  },
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: "white",
  },
  divider: {
    backgroundColor: "white",
    height: 1,
  },
  container: {
    justifyContent: "center",
    height: 65,
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: AppStyles.color.grey,
    backgroundColor: "black",
  },
  rightButton: {
    marginRight: 10,
  },
  sectionTitle: {
    textAlign: "left",
    alignItems: "center",
    color: "rgb(23, 23, 23)",
    fontSize: 14,
    padding: 10,
    paddingTop: 15,
    paddingBottom: 7,
    fontFamily: AppStyles.fontName.bold,
    fontWeight: "bold",
    backgroundColor: "white",
    marginLeft: 10,
    // borderBottomWidth: 2,
    // borderBottomColor: AppStyles.color.grey
  },
  input: {
    width: "90%",
    fontSize: 16,
    padding: 10,
    paddingBottom: 0,
    paddingRight: 0,
    textAlignVertical: "center",
    justifyContent: "flex-start",
    fontFamily: AppStyles.fontName.main,
    color: AppStyles.color.black,
    backgroundColor: "white",
    maxHeight: 410,
    borderBottomWidth: 1,
    borderColor: "rgb(152,152,152)",
    paddingLeft: 0,
  },
  priceInput: {
    flex: 1,
    borderRadius: 5,
    borderColor: AppStyles.color.background,
    borderWidth: 0.5,
    width: "100%",
    height: 40,
    textAlign: "right",
    paddingRight: 5,
    fontFamily: AppStyles.fontName.main,
    color: AppStyles.color.white,
  },
  title: {
    flex: 2,
    textAlign: "left",
    alignItems: "center",
    color: AppStyles.color.black,
    fontSize: 15,
    fontFamily: AppStyles.fontName.bold,
    fontWeight: "bold",
  },
  value: {
    textAlign: "right",
    color: AppStyles.color.background,
    fontFamily: AppStyles.fontName.main,
  },
  section: {
    backgroundColor: "white",
    marginBottom: 10,
  },
  row: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 10,
    backgroundColor: "white",
  },
  addPhotoTitle: {
    color: AppStyles.color.background,
    fontSize: 19,
    paddingLeft: 10,
    padding: 10,
    fontFamily: AppStyles.fontName.bold,
    fontWeight: "bold",
    backgroundColor: "white",
  },
  photoList: {
    height: 70,

    backgroundColor: "white",
  },
  location: {
    alignItems: "stretch",
    width: "80%",
  },
  photo: {
    marginLeft: 10,
    width: 70,
    height: 70,
    borderRadius: 10,
  },

  addButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  photoIcon: {
    width: 50,
    height: 50,
  },
  addButtonContainer: {
    backgroundColor: DynamicAppStyles.colorSet.mainThemeForegroundColor,
    padding: 25,
    width: "80%",
    borderRadius: 40,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  },
  activityIndicatorContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 30,
    backgroundColor: "white",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  providerAddressContainer: {
    alignItems: "center",
    alignSelf: "center",
    borderBottomWidth: Platform.OS === "android" ? 0 : 1,
    borderBottomColor: AppStyles.color.placeholder,
    width: "90%",
  },
});

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(PostModal);
