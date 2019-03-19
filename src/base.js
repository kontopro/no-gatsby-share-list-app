import Rebase from "re-base";
import firebase from "firebase/app";
import 'firebase/database';

const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyBAsEUDgDXJgHOMXlyhPHrECVZWCMh7O8Y",
    authDomain: "my-family-rocks.firebaseapp.com",
    databaseURL: "https://my-family-rocks.firebaseio.com"
});

const base = Rebase.createClass(firebaseApp.database());

// This is a named export
export { firebaseApp };

// this is a default export
export default base;
