let allLists

function getAllLists() {
  $.ajax({
    method: "GET",
    // url: "/api/v1/list/user/" + userID,
    url: "/api/v1/list/user/Ol5d5mjWi9eQ7HoANLhM4OFBnso2",
    success: function(data) {
      allLists = data
      $('#loader').hide()
      populateAllLists()
    }
  })
}

function populateAllLists() {
  $('#all-lists').html('')
  allLists.forEach(list => {
    let listCreator = list.displayName
    if (listCreator.trim === "") { listCreator = "Unknown" }
    $('#all-lists').append(`<li><a href="/list/${list._id}">${list.title}</a><span class="text-secondary"> by: ${listCreator}</span></li>`)
  })
}
// ----- START FIREBASE AUTH SECTION ------
const config = {
  apiKey: "AIzaSyAoadL6l7wVMmMcjqqa09_ayEC8zwnTyrc",
  authDomain: "album-tags-v1d1.firebaseapp.com",
  projectId: "album-tags-v1d1",
}
const defaultApp = firebase.initializeApp(config)

// checking if user is logged in or logs in during session
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    userID = firebase.auth().currentUser.uid
    getAllLists()

    $('#full_menu_login_logout_container').show()
    $('#login_button').hide()
    $('#full_menu_login_button').hide()
    $('#logout_button').show()
    $('#full_menu_logout_button').show()
    $('#log_in_message').hide()
  } else {   
    // no user logged in
    $('#all_cards').html('')
    $('#full_menu_login_logout_container').show()
    $('#login_button').show()
    $('#full_menu_login_button').show()
    $('#logout_button').hide()
    $('#full_menu_logout_button').hide()
    $('#loader').hide()
    $('#log_in_message').show()   
  }
})

let userID
function logIn() {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  // local persistance remains if browser is closed
  .then(function() {
    var provider = new firebase.auth.GoogleAuthProvider()
    return firebase.auth().signInWithPopup(provider)
  })
  .then(function(result) {
    userID = user.uid
    getAllLists()

    $('#full_menu_login_logout_container').show()
    $('#login_button').hide()
    $('#full_menu_login_button').hide()
    $('#logout_button').show()
    $('#full_menu_logout_button').show()

  }).catch(function(error) {
    // Handle Errors here.
  })
}

function logOut() {
  firebase.auth().signOut().then(function() {
    // log out functionality
    $('#full_menu_login_logout_container').show()
    $('#login_button').show()
    $('#full_menu_login_button').show()
    $('#logout_button').hide()
    $('#full_menu_logout_button').hide()

  }).catch(function(error) {
  // An error happened.
  })
}

// add event listener to log in and out buttons
const loginButton = document.getElementById("login_button")
const loginButton2 = document.getElementById("full_menu_login_button")
const logoutButton = document.getElementById("logout_button")
const logoutButton2 = document.getElementById("full_menu_logout_button")
loginButton.addEventListener("click", logIn)
loginButton2.addEventListener("click", logIn)
logoutButton.addEventListener("click", logOut)
logoutButton2.addEventListener("click", logOut)
$('.login_button').on('click', logIn)
// ----- END FIREBASE AUTH SECTION ------