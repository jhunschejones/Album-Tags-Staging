// ====== START UTILITY FUNCTIONS ======
function removeByID(arr, ID) {
  return arr.filter(function(ele){
    return ele._id != ID
  })
}

// ====== END UTILITY FUNCTIONS ======

let allLists

function getAllLists() {
  $.ajax({
    method: "GET",
    url: "/api/v1/list/user/" + userID,
    // url: "/api/v1/list/user/Ol5d5mjWi9eQ7HoANLhM4OFBnso2",
    success: function(data) {
      allLists = data
      $('#loader').hide()
      populateAllLists()
    }
  })
}

function removeList(listID) {
  let thisList = allLists.find(x => x._id === listID)
  let confirmed = confirm(`Are you sure you want to delete your list "${thisList.title}"? You cannot undo this operation.`)

  if (confirmed) {
    $.ajax({
      method: "DELETE",
      url: "/api/v1/list/" + listID,
      success: function() {
        allLists = removeByID(allLists, listID)
        populateAllLists()
      }
    })
  } 
}

function populateAllLists() {
  $("#no-lists-message").hide()
  $('#all-lists').html('')
  if (allLists.length > 0) {
    allLists.forEach(list => {
      let listCreator = list.displayName
      if (listCreator.trim === "") { listCreator = "Unknown" }
      $('#all-lists').append(`<li class="list"><a href="/list/${list._id}">${list.title}</a><span class="text-secondary"> by: ${listCreator}</span><span class="list-delete-button" data-list-id="${list._id}" data-toggle="tooltip" data-placement="right" title="Delete this list" data-trigger="hover">&#10005;</span></li>`)
    })
  
    // ====== add event listener to delete buttons =====
    $(".list-delete-button").on("click", function() { 
      removeList($(this).attr("data-list-id")) 
    })
  } else {
    $("#no-lists-message").show()
  }
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

    $('#page-title').show()
    $('#login-message').hide()
    $('#all-lists').show()
  } else {   
    // no user logged in
    $('#full_menu_login_logout_container').show()
    $('#login_button').show()
    $('#full_menu_login_button').show()
    $('#logout_button').hide()
    $('#full_menu_logout_button').hide()

    $('#loader').hide()  
    $('#login-message').show()
    $('#page-title').hide()
    $('#all-lists').hide()
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

    $('#login-message').hide()
    $('#page-title').show()
    $('#all-lists').show()

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

    $('#login-message').show()
    $('#page-title').hide()
    $('#all-lists').hide()

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