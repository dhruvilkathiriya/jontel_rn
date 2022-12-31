import React from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  BackHandler,
  Modal,
  Dimensions,
  ImageBackground,
  Image
} from "react-native";

import Button from "react-native-button";
import FastImage from "react-native-fast-image";
import { firebaseListing } from "../firebase";
import StarRating from "react-native-star-rating";
import { connect } from "react-redux";
import ActionSheet from "react-native-actionsheet";
import {
  AppIcon,
  AppStyles,
  TwoColumnListStyle
} from "../AppStyles";
import SavedButton from "../components/SavedButton";
import { Configuration } from "../Configuration";
import DynamicAppStyles from '../DynamicAppStyles';
import { IMLocalized } from "../Core/localization/IMLocalization";

class AdminDashboardScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: IMLocalized("Admin Dashboard"),
    headerStyle: {
      backgroundColor: '#fafafa'
    }
  });

  constructor(props) {
    super(props);

    this.listingsUnsubscribe = null;
    this.listingItemActionSheet = React.createRef();

    this.state = {
      activeSlide: 0,
      categories: [],
      listings: [],
      allListings: [],
      selectedCategoryName: "",
      savedListings: [],
      selectedItem: null,
      showedAll: false,
      postModalVisible: false,
      isSavedModalVisible: false,
      isAccountDetailModalVisible: false,
      isSettingsModalVisible: false,
      isContactModalVisible: false,
      isMyListingVisible: false,
      isAddListingVisible: false,
      loading: true,
      modalVisible: false
    };

    this.didFocusSubscription = props.navigation.addListener(
      "didFocus",
      payload =>
        BackHandler.addEventListener(
          "hardwareBackPress",
          this.onBackButtonPressAndroid
        )
    );
  }

  componentDidMount() {
    this.listingsUnsubscribe = firebaseListing.subscribeListings(
      { isApproved: false },
      this.onListingsCollectionUpdate
    );

    this.willBlurSubscription = this.props.navigation.addListener(
      "willBlur",
      payload =>
        BackHandler.removeEventListener(
          "hardwareBackPress",
          this.onBackButtonPressAndroid
        )
    );
  }

  componentWillUnmount() {
    this.listingsUnsubscribe();
    this.didFocusSubscription && this.didFocusSubscription.remove();
    this.willBlurSubscription && this.willBlurSubscription.remove();
  }

  onBackButtonPressAndroid = () => {
    this.props.navigation.goBack();

    return true;
  };

  onListingsCollectionUpdate = querySnapshot => {
    const data = [];
    querySnapshot.forEach(doc => {
      const listing = doc.data();
      if (this.state.savedListings.findIndex(k => k == doc.id) >= 0) {
        listing.saved = true;
      } else {
        listing.saved = false;
      }
      data.push({ ...listing, id: doc.id });
    });

    this.setState({
      listings: data.slice(0, Configuration.home.initial_show_count),
      allListings: data,
      loading: false,
      showedAll: data.length <= Configuration.home.initial_show_count
    });
  };

  onPressListingItem = item => {
    this.props.navigation.navigate("MyListingDetailModal", {
      item: item
    });
  };

  onLongPressListingItem = item => {
    this.setState({ selectedItem: item }, () => {
      this.listingItemActionSheet.current.show();
    });
  };

  onShowAll = () => {
    this.setState({
      showedAll: true,
      listings: this.state.allListings
    });
  };

  onLisingItemActionDone = index => {
    if (index === 0) {
      this.approveListing();
    }

    if (index == 1) {
      Alert.alert(
        "Delete Listing",
        "Are you sure you want to remove this listing?",
        [
          {
            text: "Yes",
            onPress: this.removeListing,
            style: "destructive"
          },
          { text: "No" }
        ],
        { cancelable: false }
      );
    }
  };

  removeListing = () => {
    this.setState({modalVisible: false})
    firebaseListing.removeListing(this.state.selectedItem.id, ({ success }) => {
      if (success) {
        return;
      }
      alert(IMLocalized("There was an error deleting listing!"));
    });
  };

  approveListing = () => {
    firebaseListing.approveListing(
      this.state.selectedItem.id,
      ({ success }) => {
        if (success) {
          this.setState({loading: true})
          this.onListingsCollectionUpdate
          alert("Listing successfully approved!");
          return;
        }
        alert("Error approving listing!");
      }
    );
  };

  onPressSavedIcon = item => {
    firebaseListing.saveUnsaveListing(item, this.props.user.id);
  };

  renderListingItem = ({ item }) => {
    return (
      // <TouchableOpacity
      //   onPress={() => this.onPressListingItem(item)}
      //   onLongPress={() => {
      //     this.setState({ selectedItem: item })
      //     this.setState({modalVisible: true})  
      //     // this.onLongPressListingItem(item)
      //   }}
      // >
      //   <View style={TwoColumnListStyle.listingItemContainer}>
      //     {/* <FastImage
      //       style={TwoColumnListStyle.listingPhoto}
      //       source={{ uri: item.photo }}
      //     /> */}
      //     <ImageBackground
      //     source={{ uri: item.photo }}
      //     >

      //     </ImageBackground>
      //     <SavedButton
      //       style={TwoColumnListStyle.savedIcon}
      //       onPress={() => this.onPressSavedIcon(item)}
      //       item={item}
      //     />
      //     <Text style={{ ...TwoColumnListStyle.listingName, maxHeight: 40 }}>
      //       {item.title}
      //     </Text>
      //     <Text style={TwoColumnListStyle.listingPlace}>{item.place}</Text>
      //   </View>
      // </TouchableOpacity>

      <TouchableOpacity
        onPress={() => this.onPressListingItem(item)}
        onLongPress={() => {
          this.setState({ selectedItem: item })
          this.setState({modalVisible: true})  
          // this.onLongPressListingItem(item)
        }}
      >
      <View style={{marginRight:20, flex:1, borderRadius:20, marginBottom:10}}>
      <ImageBackground
      style={{height:Dimensions.get('window').height /4, width:(Dimensions.get('window').width / 2) - 30, borderRadius:20, resizeMode:'contain', flex:1}}
      source={{ uri: item.photo }}
      imageStyle={{ borderTopRightRadius: 4, borderTopLeftRadius:4, borderBottomLeftRadius:10, borderBottomRightRadius:10,}}
      >
        
        <View style={{alignItems:'flex-end', margin:10,}}>
          <TouchableOpacity onPress={() => this.onPressSavedIcon(item)}>
            <View style={{height:25, width:25, backgroundColor:'black', borderRadius:20, alignItems:'center', justifyContent:'center'}}>
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
    <View style={{backgroundColor:'rgba(0,0,0,0.4)', borderBottomRightRadius:10, borderBottomLeftRadius:10, marginBottom:0, justifyContent:'flex-end', marginTop:Dimensions.get('window').height /4 - 115}}>
               <Text numberOfLines={1} style={{ ...TwoColumnListStyle.listingName, maxHeight: 40, fontFamily: AppStyles.fontName.main, textAlign:'center', color:'white' }}>
                 {item.title}
               </Text>
               <Text numberOfLines={1} style={[TwoColumnListStyle.listingPlace ,{textAlign:'center', color:'white'}]}>{item.categoryTitle}</Text>
               <View style={{alignItems:'center', paddingBottom:10}}>
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
        {IMLocalized("Show all")} ({this.state.allListings.length})
      </Button>
    );
  };

  render() {
    if (this.state.loading) {
      return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="small" color='rgb(231, 193, 146)' />
        </View>;
    }

    return (
      <View style={{ flex: 1 }}>
        <Text style={{ paddingTop: 10, alignSelf: "center", color: "#a0a0a0", fontFamily: AppStyles.fontName.main }}>
          Long Press to approve or remove listing
         </Text>
        {this.state.listings.length > 0 ? (
          <ScrollView style={styles.container}>
            <Text style={[styles.title, styles.listingTitle, { fontFamily: AppStyles.fontName.main }]}>
              {"Awaiting Approval"}
            </Text>
            <FlatList
              vertical
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                this.state.showedAll ? "" : this.renderListingFooter
              }
              numColumns={2}
              data={this.state.listings}
              renderItem={this.renderListingItem}
              keyExtractor={item => `${item.id}`}
            />
          </ScrollView>
        ) : (
            <View style={styles.container}>
              <Text style={[styles.noMessage, { fontFamily: AppStyles.fontName.main }]}>
                {IMLocalized("There are no listings awaiting approval.")}
              </Text>
            </View>
          )}
        <ActionSheet
          ref={this.listingItemActionSheet}
          title={"Confirm"}
          options={["Approve", "Delete", "Cancel"]}
          cancelButtonIndex={2}
          destructiveButtonIndex={1}
          onPress={index => {
            this.onLisingItemActionDone(index);
          }}
        />

<Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
           this.setState({modalVisible: false})
          }}>
            <View style={{flex:1, alignItems:'center', justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.5)'}}>
              <View style={{height: Dimensions.get('window').height / 3 + 100, width: Dimensions.get('window').width,backgroundColor:'white', alignItems:'center', justifyContent:'center' }}>
                    <Text style={{fontFamily: AppStyles.fontName.main, fontSize:20, lineHeight:19, fontWeight:'700', marginTop:10}}>Confirm</Text>
                    <TouchableOpacity onPress={()=>{
                     this.approveListing();
                    this.setState({modalVisible: false})

                    }}>
                    <View style={{height:55, width: Dimensions.get('window').width - 80, borderRadius:40, backgroundColor:'rgb(231, 193, 146)', alignItems:'center', justifyContent:'center', marginTop:30}}>
                    <Text style={{fontFamily: AppStyles.fontName.main, fontSize:16, lineHeight:19, color:'white'}}>Approve</Text>
                    </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=> {
                      Alert.alert(
                        "Delete Listing",
                        "Are you sure you want to remove this listing?",
                        [
                          {
                            text: "Yes",
                            onPress: this.removeListing,
                            style: "destructive"
                          },
                          { text: "No" ,
                          onPress:() => this.setState({modalVisible: false})
                        }
                        ],
                        { cancelable: false }
                      );
                      }}>
                    <View style={{height:55, width: Dimensions.get('window').width - 80, borderRadius:40, backgroundColor:'rgb(231, 193, 146)', alignItems:'center', justifyContent:'center', marginTop:10}}>
                    <Text style={{fontFamily: AppStyles.fontName.main, fontSize:16, lineHeight:19, color:'white'}}>Delete</Text>
                    </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=> this.setState({modalVisible: false})}>
                    <View style={{height:55, width: Dimensions.get('window').width - 80, borderRadius:40, backgroundColor:'rgb(231, 193, 146)', alignItems:'center', justifyContent:'center', marginTop:10}}>
                    <Text style={{fontFamily: AppStyles.fontName.main, fontSize:16, lineHeight:19, color:'white'}}>Cancel</Text>
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
    padding: Configuration.home.listing_item.offset
  },
  rightButton: {
    marginRight: 10,
    color: AppStyles.color.main
  },
  title: {
    fontFamily: AppStyles.fontName.bold,
    fontWeight: "bold",
    color: AppStyles.color.title,
    fontSize: 22
  },
  listingTitle: {
    marginTop: 10,
    marginBottom: 15
  },
  noMessage: {
    textAlign: "center",
    color: AppStyles.color.subtitle,
    fontSize: 18,
    padding: 15
  }
});

const mapStateToProps = state => ({
  user: state.auth.user
});

export default connect(mapStateToProps)(AdminDashboardScreen);
