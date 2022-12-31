import firebase from 'react-native-firebase';
import { ErrorCode } from '../onboarding/utils/ErrorCode';
import { global } from "../../screens/global";

const usersRef = firebase
  .firestore()
  .collection("users");

export const retrievePersistedAuthUser = () => {
  return new Promise(resolve => {
    firebase.auth().onAuthStateChanged((user) => {
      global.fromAuthChange = user
      if (user) {
        usersRef
          .doc(user.uid)
          .get()
          .then(document => {
            resolve(document.data());
          })
          .catch(errror => {
            resolve(null);
          })
      } else {
        resolve(null);
      }
    });
  });
};

const signInWithCredential = (credential, appIdentifier) => {
  return new Promise((resolve, _reject) => {
    firebase
      .auth()
      .signInWithCredential(credential)
      .then(response => {
        const isNewUser = response.additionalUserInfo.isNewUser;
        const { first_name, last_name } = response.additionalUserInfo.profile;
        const { uid, email, phoneNumber, photoURL } = response.user._user;
        if (isNewUser) {
          const timestamp = firebase.firestore.FieldValue.serverTimestamp();
          const userData = {
            id: uid,
            email: email,
            firstName: first_name,
            lastName: last_name,
            phone: phoneNumber,
            profilePictureURL: photoURL,
            userID: uid,
            appIdentifier,
            created_at: timestamp,
            createdAt: timestamp,
            isBarber: false,
          };
          usersRef
            .doc(uid)
            .set(userData)
            .then(() => {
              resolve({ user: userData, accountCreated: true });
            })
        }
        usersRef
          .doc(uid)
          .get()
          .then(document => {
            resolve({ user: document.data(), accountCreated: false });
          })
      })
      .catch(_error => {
        resolve({ error: ErrorCode.serverError });
      })
  });
};

export const register = (userDetails, appIdentifier) => {
  const { email, firstName, lastName, password, phone, profilePictureURL, location, signUpLocation, isBarber } = userDetails;
  return new Promise(function (resolve, _reject) {
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(response => {
        console.log("IN AUTH: response", response)
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const uid = response.user.uid;
        const data = {
          id: uid,
          userID: uid, // legacy reasons
          email,
          firstName,
          lastName,
          phone,
          profilePictureURL,
          location,
          signUpLocation,
          appIdentifier,
          createdAt: timestamp,
          created_at: timestamp,
          isBarber,
        };
        usersRef
          .doc(uid)
          .set(data)
          .then(() => {
            resolve({ user: data });
          })
          .catch(error => {
            alert(error);
            resolve({ error: ErrorCode.serverError });
          })
      })
      .catch(error => {
        var errorCode = ErrorCode.serverError;
        if (error.code === 'auth/email-already-in-use') {
          errorCode = ErrorCode.emailInUse;
        }
        resolve({ error: errorCode });
      });
  });
};

export const loginWithEmailAndPassword = async (email, password) => {

  return new Promise(function (resolve, reject) {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(response => {
        const uid = response.user._user.uid;
        const userData = {
          email,
          password,
          id: uid
        };
        usersRef
          .doc(uid)
          .get()
          .then(function (firestoreDocument) {
            if (!firestoreDocument.exists) {
              resolve({ errorCode: ErrorCode.noUser });
              return;
            }
            const user = firestoreDocument.data();
            const newUserData = {
              ...userData,
              ...user
            };
            resolve({ user: newUserData });
          })
          .catch(function (_error) {
            resolve({ error: ErrorCode.serverError });
          });
      })
      .catch(error => {
        var errorCode = ErrorCode.serverError;
        switch (error.code) {
          case 'auth/wrong-password':
            errorCode = ErrorCode.invalidPassword;
            break;
          case 'auth/network-request-failed':
            errorCode = ErrorCode.serverError;
            break;
          case 'auth/user-not-found':
            errorCode = ErrorCode.noUser;
            break;
          default:
            errorCode = ErrorCode.serverError;
        }
        resolve({ error: errorCode });
      });
  });
};

export const forgetPasswordByEmail = (email) => {
  return new Promise(function (resolve, reject) {
    firebase.auth().sendPasswordResetEmail(email)
      .then(response => {
        console.log("Response", response)
        resolve(response)
      })
      .catch(error => {
        resolve('There is no user record corresponding to this identifier. The user may have been deleted.')
      })
  })
}

export const loginWithFacebook = (accessToken, appIdentifier) => {
  const credential = firebase.auth.FacebookAuthProvider.credential(accessToken);
  return new Promise((resolve, _reject) => {
    signInWithCredential(credential, appIdentifier)
      .then(response => {
        resolve(response)
      })
  });
};

export const logout = () => {
  firebase.auth().signOut();
};

export const retrieveUserByPhone = (phone) => {
  return new Promise(resolve => {
    usersRef
      .where("phone", "==", phone)
      .onSnapshot(querySnapshot => {
        // console.log("querySnapshot.docs", querySnapshot.docs)
        // let userData = querySnapshot.docs[0]._data;
        // let idForNumber = userData.id
        // fromMailNumber = idForNumber
        //console.log("newUserData", newUserData)
        if (querySnapshot.docs.length <= 0) {
          resolve({ error: true });
        } else {
          resolve({ success: true });
        }
      });
  });
};

export const sendSMSToPhoneNumber = phoneNumber => {
  return new Promise(function (resolve, _reject) {
    firebase
      .auth()
      .signInWithPhoneNumber(phoneNumber)
      .then(function (confirmationResult) {
        console.log('OTP status',confirmationResult)
        // SMS sent. Prompt user to type the code from the message, then sign the
        // user in with confirmationResult.confirm(code).
        resolve({ confirmationResult });
      })
      .catch(function (_error) {
        console.log('error in otp', _error);
        resolve({ error: ErrorCode.smsNotSent })
      });
  });
}

export const loginWithSMSCode = (smsCode, verificationID) => {
  console.log("VERIFICATION CODE:", verificationID)
  const credential = firebase.auth.PhoneAuthProvider.credential(verificationID, smsCode);
  console.log("credential", credential)
  return new Promise(function (resolve, _reject) {
    firebase
      .auth()
      .signInWithCredential(credential)
      .then(result => {
        const { user } = result;
        console.log("user loginWithSMSCode(AUTH: 236)", user)
        usersRef
          .doc(user.uid)
          //.doc(fromMailNumber)
          .get()
          .then(function (firestoreDocument) {
            console.log("Main number id:", firestoreDocument.data())
            if (!firestoreDocument.exists) {
              resolve({ errorCode: ErrorCode.noUser });
              return;
            }
            const userData = firestoreDocument.data();
            resolve({ user: userData });
            // if (!firestoreDocument.data()) {
            //   usersRef
            //     .doc(fromMailNumber)
            //     .get().then(function (firestoreDocument) {
            //       console.log("When custome number id:", firestoreDocument.data())
            //       if (!firestoreDocument.exists) {
            //         resolve({ errorCode: ErrorCode.noUser });
            //         return;
            //       }
            //       const userData = firestoreDocument.data();
            //       resolve({ user: userData });
            //     })
            // } else {
            //   if (!firestoreDocument.exists) {
            //     resolve({ errorCode: ErrorCode.noUser });
            //     return;
            //   }
            //   const userData = firestoreDocument.data();
            //   resolve({ user: userData });
            // }
          })
          .catch(function (_error) {
            resolve({ error: ErrorCode.serverError });
          });
      })
      .catch(_error => {
        resolve({ error: ErrorCode.invalidSMSCode })
      });
  });
}

export const registerWithPhoneNumber = (userDetails, smsCode, verificationID, appIdentifier) => {
  const { firstName, lastName, phone, profilePictureURL, location, signUpLocation, isBarber } = userDetails;
  const credential = firebase.auth.PhoneAuthProvider.credential(verificationID, smsCode);
  return new Promise(function (resolve, _reject) {
    firebase
      .auth()
      .signInWithCredential(credential)
      .then(response => {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const uid = response.user.uid;
        const data = {
          id: uid,
          userID: uid, // legacy reasons
          firstName,
          lastName,
          phone,
          profilePictureURL,
          location,
          signUpLocation,
          appIdentifier,
          created_at: timestamp,
          createdAt: timestamp,
          isBarber: false,
        };
        usersRef
          .doc(uid)
          .set(data)
          .then(() => {
            resolve({ user: data });
          })
      })
      .catch(error => {
        var errorCode = ErrorCode.serverError;
        if (error.code === 'auth/email-already-in-use') {
          errorCode = ErrorCode.emailInUse;
        }
        resolve({ error: errorCode });
      });
  });
};

export const updateProfilePhoto = (userID, profilePictureURL) => {
  return new Promise((resolve, _reject) => {
    usersRef
      .doc(userID)
      .update({ profilePictureURL: profilePictureURL })
      .then(() => {
        resolve({ success: true });
      })
      .catch(error => {
        resolve({ error: error });
      })
  });
}

export const fetchPushTokenIfPossible = async () => {
  const messaging = firebase.messaging();
  const hasPushPermissions = await messaging.hasPermission();
  if (hasPushPermissions) {
    return await messaging.getToken();
  }
  await messaging.requestPermission();
  return await messaging.getToken();
}

export const updateUser = async (userID, newData) => {
  const dataWithOnlineStatus = {
    ...newData,
    lastOnlineTimestamp: firebase.firestore.FieldValue.serverTimestamp()
  }
  return await usersRef.doc(userID).update({ ...dataWithOnlineStatus });
}
