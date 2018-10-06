// --------- START UTILITIES --------
console.log('The custom script for the userauth page is running');

function hideDOMelement(elementId) {
    try {
        var element = document.getElementById(elementId)
        
        try {
            element.style.display = "none";
        } catch (error) {
            function logError() {
                var newKey = firebase.database().ref().child('errors').push().key;
                firebase.database().ref('errors/' + newKey).update({
                    "error" : 
                    {
                        "elementId" : elementId,
                        "User" : userID,
                        "URL" : window.location.href,
                        "Date_Time" : new Date().toLocaleString(),
                        "Error" : JSON.stringify(error, Object.getOwnPropertyNames(error))
                    }
                });
            }
            logError()
        }
    } catch (error) {
        // this element does not exist here
        // console.log("element id: " + elementId + "\nerror: " + error);
    }
}

function showDOMelement(elementId) {
    try {
        var element = document.getElementById(elementId)
        
        try {
            element.style.display = "block";
        } catch (error) {
            function logError() {
                var newKey = firebase.database().ref().child('errors').push().key;
                firebase.database().ref('errors/' + newKey).update({
                    "error" : 
                    {
                        "elementId" : elementId,
                        "User" : userID,
                        "URL" : window.location.href,
                        "Date_Time" : new Date().toLocaleString(),
                        "Error" : JSON.stringify(error, Object.getOwnPropertyNames(error))
                    }
                });
            }
            logError()
        }
    } catch (error) {
        // this element does not exist here
        // console.log("element id: " + elementId + "\nerror: " + error);
    }
}

// --------- END UTILITIES --------

// Initialize Firebase
var config = {
    apiKey: "AIzaSyD1Hts7zVBvDXUf-sCb89hcPesJkrUKyUc",
    authDomain: "album-tag-auth.firebaseapp.com",
    databaseURL: "https://album-tag-auth.firebaseio.com/",
    projectId: "album-tag-auth",
    storageBucket: "album-tag-auth.appspot.com",
    messagingSenderId: "1048555394172"
};
const defaultApp = firebase.initializeApp(config);

const connectionsApp = firebase.initializeApp({
    apiKey: "AIzaSyD1Hts7zVBvDXUf-sCb89hcPesJkrUKyUc",
    databaseURL: "https://album-tag-connections.firebaseio.com/",
    projectId: "album-tag-auth"
}, 'app2');

const favoritesApp = firebase.initializeApp({
    apiKey: "AIzaSyD1Hts7zVBvDXUf-sCb89hcPesJkrUKyUc",
    databaseURL: "https://album-tag-favorites.firebaseio.com/",
    projectId: "album-tag-auth"
}, 'app3');

// Get a database instance for connectionsApp and favoritesApp
const connectionsDatabase = firebase.database(connectionsApp);
const favoritesDatabase = firebase.database(favoritesApp);

var loginButton = document.getElementById("login_button");
var loginButton2 = document.getElementById("full_menu_login_button")
var logoutButton = document.getElementById("logout_button");
var logoutButton2 = document.getElementById("full_menu_logout_button")
var logInMessage = document.getElementById("log_in_message");
var loader = document.getElementById("loader");
var userEmail = "";
var userName = "";
var user = firebase.auth().currentUser;
var userID;
var dbRefrence;

function signInFunctionality(user) {
    // new hide functionality
    $('.hide_when_logged_in').addClass('hide_me');
    $('.hide_when_logged_out').removeClass('hide_me');

    showDOMelement("full_menu_login_logout_container");

    // set our variables with this user's info
    userEmail = user.email;
    userName = user.displayName;
    userID = user.uid;

    // update favorite albums if page uses this functionality
    try {
        updateFavoriteAlbums();
    } catch (error) {
        // we're not on the my favorites page
    }

    try {
        updateConnectedAlbums()
    } catch (error) {
        // we're not on a connected albums page
    }

    try {
        populateUserData();
    } catch (error) {
        // we're not on contact page
    }

    try {
        populateTags("start");
    } catch (error) {
        // we're not on the update page
    }

    const allowedUsers = ["joshjones103@gmail.com", "znoffy5@gmail.com", "devon.curry891@gmail.com", "milesjohnsonmusic@gmail.com", "austinhuelsbeck@gmail.com"];
    if (allowedUsers.indexOf(userEmail) > -1) {
        // user is signed in and has admin permissions
        tagUpdatePermissionsGranted();

        var whatTagsToShow = sessionStorage.getItem('tags');
        if (whatTagsToShow == 'My Tags' || whatTagsToShow == undefined) {
            sessionStorage.setItem('tags', 'My Tags');
            filterDisplayedTags();
        } else if (whatTagsToShow == "All Tags") {
            sessionStorage.setItem('tags', 'All Tags');
            allTagsNoFilter()
        } 


        var whatConnectionsToShow = sessionStorage.getItem('connections');            
        if (whatConnectionsToShow == "My Connections" || whatConnectionsToShow == undefined){
            sessionStorage.setItem('connections', 'My Connections');
            filterDisplayedConnections();
        } else if (whatConnectionsToShow == "All Connections") {
            sessionStorage.setItem('connections', 'All Connections');
            allConnectionsNoFilter()
        }

    } 
    else {
        // user is signed in but does not have admin permissions
        tagUpdatePermissionsGranted();
        
        var whatTagsToShow = sessionStorage.getItem('tags');
        if (whatTagsToShow == 'My Tags' || whatTagsToShow == undefined) {
            sessionStorage.setItem('tags', 'My Tags');
            filterDisplayedTags();
        } else if (whatTagsToShow == "All Tags") {
            sessionStorage.setItem('tags', 'All Tags');
            allTagsNoFilter()
        } 


        var whatConnectionsToShow = sessionStorage.getItem('connections');            
        if (whatConnectionsToShow == "My Connections" || whatConnectionsToShow == undefined){
            sessionStorage.setItem('connections', 'My Connections');
            filterDisplayedConnections();
        } else if (whatConnectionsToShow == "All Connections") {
            sessionStorage.setItem('connections', 'All Connections');
            allConnectionsNoFilter()
        }
    }
}

var sessionId = JSON.parse(sessionStorage.getItem('sessionId'));
var sessionLogin = false
if (sessionId != null) {
    sessionLogin = true;
    console.log("Session storage login");
    signInFunctionality(sessionId);
}


// checking if user is logged in or logs in during session
firebase.auth().onAuthStateChanged(function(user) {
    // this makes the firebase login only fire when session login isn't stored
    if (sessionLogin === false) {
        // returns true if user is not null
        if (user) {
            sessionStorage.setItem('sessionId', JSON.stringify(user));
            console.log("Firebase login")
            signInFunctionality(user);

        } else {
            // No user is signed in.    
            noUserSignedIn();
        }
    }
});

function noUserSignedIn() {
    try {
        logInMessage.innerHTML = '<div class="container-fluid please_log_in"><p class="text-danger">Please sign in to access this feature</p> <button onclick="logIn()" class="btn btn-danger" id="login_link">Log In</button></div>';
    } catch (error) {
        // no login message container on this page
    }  
    // hide spinner
    hideDOMelement("loader");

    // new hide functionality
    $('.hide_when_logged_in').removeClass('hide_me');
    $('.hide_when_logged_out').addClass('hide_me');

    showDOMelement("full_menu_login_logout_container");

    try {
        populateSearchedTags();
    } catch (error) {
        // we're not on the tag search page
    }
}

function tagUpdatePermissionsGranted() {
    var whatTagsToShow = sessionStorage.getItem('tags');

    if (whatTagsToShow != 'My Tags' & whatTagsToShow != 'All Tags') {
        sessionStorage.setItem('tags', 'My Tags');
    }

    $("#update_button_container").html('<a href="" onclick="goToUpdatePage()" class="btn btn-sm btn-outline-secondary update_button hide_when_logged_out">Update<span class="button_text"> Tags</span></a>');

    $("#tags_toggle").html('<img src="/images/toggle_off.png" id="show_only_my_tags" class="hide_when_logged_out" style="height:22px;margin-left:10px;" onclick="showAllTags()" data-toggle="tooltip" data-placement="right" title="Show All Tags" data-trigger="hover"><img src="/images/toggle_on.png" class="hide_when_logged_out" id="show_all_tags" style="height:22px;margin-left:10px;" onclick="showOnlyMyTags()" data-toggle="tooltip" data-placement="right" title="Only Show My Tags" data-trigger="hover">');

    $("#connections_toggle").html('<img src="/images/toggle_off.png" id="show_only_my_connections" class="hide_when_logged_out" style="height:22px;margin-left:10px;" onclick="showAllConnections()" data-toggle="tooltip" data-placement="right" title="Show All Connections" data-trigger="hover"><img src="/images/toggle_on.png" class="hide_when_logged_out" id="show_all_connections" style="height:22px;margin-left:10px;" onclick="showOnlyMyConnections()" data-toggle="tooltip" data-placement="right" title="Only Show My Connections" data-trigger="hover">');

    $("#connection_button_container").html('<a href="" onclick="goToUpdatePage()" class="btn btn-sm btn-outline-secondary update_button hide_when_logged_out">Update Connections</a>');

    try {
        logInMessage.innerHTML = "";
    } catch (error) {
        // console.log(error)
    }
    try {
        checkUserDisplayPrefrences(); 
    } catch (error) {
        // console.log(error)        
    }
}


function filterDisplayedTags() {
    try {
        var anyTagsOnPage = false
        tagsForThisAlbum = $(".album_details_tags")
        for (var index = 0; index < tagsForThisAlbum.length; index++) {
            var thisTag = tagsForThisAlbum[index];
    
            if($(thisTag).hasClass('author-' + userID)) {
                // console.log("tag belongs to this author")
                $(thisTag).show()
                anyTagsOnPage = true
            } else {
                // console.log("tag does not belong to this author")
                $(thisTag).hide()
            }
        }  
        if (anyTagsOnPage == true) {
            $(".tag_search_button").show() 
            $('#tag_results').show()
            $('#tag_results_message').html('')
        } else {
            $(".tag_search_button").hide()
            $('#tag_results').hide()
            $('#tag_results_message').html('<small class="text-primary">You currently have no tags for this album!</small>'); 
        }
    } catch (error) {
        // not on album details
    }
}

function allTagsNoFilter() {
    try {
        var anyTagsOnPage = false
        tagsForThisAlbum = $(".album_details_tags")
        
        if (tagsForThisAlbum.length > 0) { 
            anyTagsOnPage = true 
            for (var index = 0; index < tagsForThisAlbum.length; index++) {
                var thisTag = tagsForThisAlbum[index];
                $(thisTag).show()
            }  
        }

        if (anyTagsOnPage == true) {
            $(".tag_search_button").show() 
            $('#tag_results').show()
            $('#tag_results_message').html('')
        } else {
            $(".tag_search_button").hide()
            $('#tag_results').hide()
            $('#tag_results_message').html('<small class="text-primary">There are currently no tags for this album!</small>'); 
        }
    } catch (error) {
        // not on album details
    }

}


function filterDisplayedConnections() {
    try {
        var anyConnectionsOnPage = false
        connectionsForThisAlbum = $(".connection")
        for (var index = 0; index < connectionsForThisAlbum.length; index++) {
            var connection = connectionsForThisAlbum[index];
    
            if($(connection).hasClass('author-' + userID)) {
                // console.log("tag belongs to this author")
                $(connection).show()
                anyConnectionsOnPage = true
            } else {
                // console.log("tag does not belong to this author")
                $(connection).hide()
            }
        }  
        if (anyConnectionsOnPage == true) {
            // $(".tag_search_button").show() 
            $('#connection_results').show()
            $('#connection_results_message').html('')
        } else {
            // $(".tag_search_button").hide()
            $('#connection_results').hide()
            $('#connection_results_message').html('<small class="text-primary">You currently have no connections for this album!</small>'); 
        }
    } catch (error) {
        // not on album details
    }
}

function allConnectionsNoFilter() {
    try {
        var anyConnectionsOnPage = false
        connectionsForThisAlbum = $(".connection")
        
        if (connectionsForThisAlbum.length > 0) { 
            anyConnectionsOnPage = true 
            for (var index = 0; index < connectionsForThisAlbum.length; index++) {
                var thisConnection = connectionsForThisAlbum[index];
                $(thisConnection).show()
            }  
        }

        if (anyConnectionsOnPage == true) {
            // $(".tag_search_button").show() 
            $('#connection_results').show()
            $('#connection_results_message').html('')
        } else {
            // $(".tag_search_button").hide()
            $('#connection_results').show()
            $('#connection_results_message').html('<small class="text-primary">There are currently no connections for this album!</small>'); 
        }
    } catch (error) {
        // not on album details
    }
}

// log user in using google auth
function logIn() {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    // local persistance remains if browser is closed
    .then(function() {
      var provider = new firebase.auth.GoogleAuthProvider();
      return firebase.auth().signInWithPopup(provider);
    })
    .then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        userEmail = result.user.email;

    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    })
};

// directs user to update page for this album
function goToUpdatePage() {
    event.preventDefault();
    var url = window.location.href;
    url = url.replace("albumdetails", "update");
    window.location = url;
};

function logOut() {
    firebase.auth().signOut().then(function() {
        // Sign-out successful.  
        storage.removeItem('sessionId');      
        noUserSignedIn();
    }).catch(function(error) {
    // An error happened.
    });
};

// add event listener to log in and out buttons
loginButton.addEventListener("click", logIn);
loginButton2.addEventListener("click", logIn);
logoutButton.addEventListener("click", logOut);
logoutButton2.addEventListener("click", logOut);
