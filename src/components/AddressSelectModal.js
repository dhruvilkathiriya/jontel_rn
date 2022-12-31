import React from "react";
import { StyleSheet, View, Modal, TouchableOpacity, SafeAreaView } from "react-native";
import MapView, { Marker } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Icon from "react-native-vector-icons/FontAwesome";

class AddressSelectModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: null,
      longitude: null,
      latitudeDelta: parseFloat(0.01),
      longitudeDelta: parseFloat(0.0009),
      data: null
    };
  }

  componentDidMount() {
    Geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => { },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
      }
    );
  }


  render() {
    return (
      <Modal
        visible={true}
        animationType={"slide"}
        transparent={false}
        onRequestClose={this.props.onCancel}
      >
        <View style={styles.container}>
          <MapView
            initialRegion={{
              latitude: parseFloat(this.state.latitude || '0'),
              longitude: parseFloat(this.state.longitude || '0'),
              latitudeDelta: parseFloat(this.state.latitudeDelta),
              longitudeDelta: parseFloat(this.state.longitudeDelta),
            }}
            style={styles.container}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(this.state.latitude || '0'),
                longitude: parseFloat(this.state.longitude || '0'),
              }}
            />
          </MapView>
          <SafeAreaView style={styles.inputMainContainer}>
            <TouchableOpacity
              onPress={this.props.onCancel}
              hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
              style={styles.backButtonContainer}
            >
              <Icon
                name="angle-left"
                size={30}
                color={"white"}
              />
            </TouchableOpacity>
            <GooglePlacesAutocomplete
              placeholder={'Search'}
              styles={{
                container: styles.autoCompleteContainer,
                textInputContainer: styles.autoCompleteInputContainer,
                listView: styles.autoCompleteListContainer,
                row: styles.autoCompleteRowContainer,
              }}
              fetchDetails={true}
              onPress={(data) => {
                this.props?.onPlaceSelect(data?.description || '')
              }}
              query={{
                key: 'AIzaSyCGGbIsLI1X4REmr6BOwczK3hTrGbLq2eE',
                language: 'en',
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  autoCompleteContainer: {
    marginLeft: '5%',
    marginRight: '5%',
  },
  autoCompleteInputContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  autoCompleteListContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  autoCompleteRowContainer: {
    backgroundColor: '#fff',
  },
  backButtonContainer: {
    marginLeft: '5%',
    marginTop: 6,
  },
  inputMainContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: '5%',
  },
});

export default AddressSelectModal;
