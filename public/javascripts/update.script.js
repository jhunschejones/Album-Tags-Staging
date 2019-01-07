// ---------- BEGIN UTILITIES ------------
function scrollToTop() {
  document.body.scrollTop = 0 // For Safari
  document.documentElement.scrollTop = 0 // For Chrome, Firefox, IE and Opera
}

// using regular expression to make first letter of each
// word upper case, even if it is seperated with a "-"
function toTitleCase(str) {
  return str.replace(/\b\w+/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();})
}

// removes accidental double spaces
function removeExtraSpace(str) {
  return str.replace(/\s\s+/g, ' ')
}

// replaces back slash with html character
function replaceBackSlashWithHtml(str) {
  return str.replace(/\//g, '&sol;')
}

// function replaceUnderscoreWithBackSlash(str) {
//   return str.replace(/_/g, "/")
// }

// I'm using this variable and function to reformat the date provided in Apple's API
// into a fully written-out and formated date
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
function makeNiceDate(uglyDate) {
  let year = uglyDate.slice(0, 4)
  let day = uglyDate.slice(8, 10)
  let uglyMonth = uglyDate.slice(5, 7) 
  let niceMonth = months[uglyMonth-1]
  return(`${niceMonth} ${day}, ${year}`)
}

function safeParse(content) {
  // replace characters with html equivalents
  //prevents some basic cross site scripting attacks
  content = content.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\//g, "&#47;").replace(/\\/g, "&#92;").replace(/\(/g, "&#40;").replace(/\)/, "&#41;").replace(/\./g, "&#46;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/\=/g, "&#61;")
  return content
}

function hideDOMelement(elementId) {
  try {
    let element = document.getElementById(elementId)
    element.style.display = "none"
  } catch (error) {
    // this element does not exist yere
  }
}

function showDOMelement(elementId) {
  try {
  let element = document.getElementById(elementId)
  element.style.display = "block"
  } catch (error) {
    // this element does not exist yere
  }
}

var isEqual = function (value, other) {
  // source: https://gomakethings.com/check-if-two-arrays-or-objects-are-equal-with-javascript/
  // Get the value type
  var type = Object.prototype.toString.call(value)

  // If the two objects are not the same type, return false
  if (type !== Object.prototype.toString.call(other)) return false

  // If items are not an object or array, return false
  if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false

  // Compare the length of the length of the two items
  var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length
  var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length
  if (valueLen !== otherLen) return false

  // Compare two items
  var compare = function (item1, item2) {

    // Get the object type
    var itemType = Object.prototype.toString.call(item1)

    // If an object or array, compare recursively
    if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
      if (!isEqual(item1, item2)) return false
    }

    // Otherwise, do a simple comparison
    else {

      // If the two items are not the same type, return false
      if (itemType !== Object.prototype.toString.call(item2)) return false

      // Else if it's a function, convert to a string and compare
      // Otherwise, just compare
      if (itemType === '[object Function]') {
        if (item1.toString() !== item2.toString()) return false
      } else {
        if (item1 !== item2) return false
      }

    }
  }

  // Compare properties
  if (type === '[object Array]') {
    for (var i = 0; i < valueLen; i++) {
      if (compare(value[i], other[i]) === false) return false
    }
  } else {
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        if (compare(value[key], other[key]) === false) return false
      }
    }
  }

  // If nothing failed, return true
  return true
}

function scrollDown() {
  let isTouchDevice
  if ("ontouchstart" in document.documentElement) {
    isTouchDevice = true
  }

  if (isTouchDevice == true & screen.width < 570) {
    window.scrollTo(0,document.body.scrollHeight)
  }
}
// ---------------- END UTILITIES ---------------

// ====== SET UP GLOBALS =====
// store album ID
const albumId = window.location.pathname.replace('/update/', '')
// store album data object
var albumResult = false
// used to see if a tag is an exact duplicate without
// looping through the `albumResult` each time
var currentTags = []
var currentAuthors = []

// this function actually makes the database calls
function getAlbumDetails() {
  $.getJSON ( '/api/v1/album/albumid/' + albumId, function(album) {
    if (album.message) { 
      $.getJSON ( '/api/v1/apple/details/' + albumId, function(album) { 
        // store result globally 
        albumResult = album
        populateAlbumInfo(album)
        populateTags(album)
        findDirectConnections()
        return
      })
    } else {
      // store result globally 
      albumResult = album
      populateAlbumInfo(album)
      populateTags(album)
      findDirectConnections()
      return
    }
  })
}


function populateAlbumInfo(inputAlbum) {
  var artist = inputAlbum.artist
  var album = inputAlbum.title
  var label = inputAlbum.recordCompany
  // the replaceing at the end here is setting the width and height of the image
  var cover = inputAlbum.cover.replace('{w}', 370).replace('{h}', 370)
  var applemusicurl = inputAlbum.appleURL
  // calling my makeNiceDate function from below to format the date
  var release = makeNiceDate(inputAlbum.releaseDate)
  
  $('.albumdetails_artist').append(`<span onclick="moreByThisArtist('${artist}')" data-toggle="tooltip" data-placement="right" title="Search This Artist" data-trigger="hover" style="cursor:pointer;">${artist}</span>`)
  // $('.albumdetails_album').append(album, '<br>')
  $('.albumdetails_album').append(`<span id="the_album_name" data-toggle="tooltip" data-placement="right" title="Click to Show Album ID" data-trigger="hover" onclick="showAlbumID()" style="cursor:pointer;">${album}</span><span id="the_album_id" class="text-secondary" data-toggle="tooltip" data-placement="right" title="Select & Copy Album ID" data-trigger="hover" style="display:none;">${albumId}</span>`)
  // favorites icons
  $('.albumdetails_artist').append(`<img src="../images/heart-unliked.png" height="30" id="add_to_favorites" style="cursor:pointer;margin-left:10px;" data-toggle="tooltip" title="Add To Favorites" data-trigger="hover">`)
  $('.albumdetails_artist').append(`<img src="../images/heart-liked.png" height="30" id="remove_from_favorites" style="cursor:pointer;margin-left:10px;" data-toggle="tooltip" title="Remove From Favorites" data-trigger="hover">`)
  $('.albumdetails_cover').attr("src", cover, '<br')
  // adding path to apple music to button
  $('.applemusicurl').attr("href", applemusicurl, '<br>')
  $('.albumdetails_label').append(label, '<br>')
  $('.albumdetails_release').append(release, '<br>')

  if (albumResult.favoritedBy && albumResult.favoritedBy.indexOf(userID) != -1) { 
    $('#remove_from_favorites').show()
    $('#add_to_favorites').hide()
  } else {
    $('#remove_from_favorites').hide()
    $('#add_to_favorites').show()
  }

  document.getElementById("add_to_favorites").addEventListener("click", addToFavorites)
  document.getElementById("remove_from_favorites").addEventListener("click", removeFromFavorites)
}

// this populates the Tags card with any tags stored in the mongodb database
// and retrieved by the router stored at the URL listed with the album number
function populateTags(album) {
  // clear out tag table
  $('.tag_results').text('')
  // reset global arrays used to check for duplicates
  currentTags = []
  currentAuthors = []

  if (album.tagObjects) {
    for (let index = 0; index < album.tagObjects.length; index++) {
      const tag = album.tagObjects[index].tag
      const author = album.tagObjects[index].creator
  
      currentTags.push(tag)
      currentAuthors.push(author)
  
      // NOTE: rel is set to the index of this specific element in the author and tag arrays
      // this update was made to allow deletion of a specific element when there are duplciates
      if (author === userID) {
        $('.tag_results').append(`<tr class="album_details_tags update_tags author-${author}"><td>${safeParse(tag)}</td><td><a href="#" class="deletetaglink" rel="${index}">Delete</a></td></tr>`)
      }
    }
  }
}


function addTag() {
  let newTag = $('#new_tag').val().trim()

  if (newTag) {
    if (newTag.includes("<") && newTag.includes(">") || newTag.includes(".") || newTag.includes("{") || newTag.includes("}")) {
      alert("Some characters are not allowed in tags, sorry!")
      $('#new_tag').val("")
      return
    }

    newTag = removeExtraSpace(replaceBackSlashWithHtml(toTitleCase(newTag))).trim()
    const newAuthor = userID

    // isThisADuplicate will have a value of -1 if tag is not a duplicate 
    // at all, otherwise will check if index matches index of current user 
    // in currentAuthors meaning this user already created this tag. If 
    // tag exists from another user will let current user add their own tag 
    // with exact same name
    var isThisADuplicate = currentTags.indexOf(newTag)

    if (isThisADuplicate === -1 || currentAuthors[isThisADuplicate] != newAuthor) {
      currentTags.push(newTag)
      currentAuthors.push(newAuthor)
      $(".warning_label").text('')
    } else {
      // $(".warning_label").text(`You already added the '${newTag}' tag to this album.`)
      alert(`You already added the '${newTag}' tag to this album!`)
      $('#new_tag').val('')
      return
    }
    
    // ADD NEW TAG OR NEW ALBUM TO THE DATABASE
    $.ajax(`/api/v1/album/tags/${albumResult._id || "new"}`, {
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        "album": albumResult,
        "creator": userID,
        "tag": newTag
      }),
      success: function (album) {
        // update global object
        albumResult = album
        populateTags(album)
      }
    })
  } else {
    alert("Please enter a non-empty tag.")
  } 

  $('#new_tag').val('')
}

function showAlbumID() {
  $('#the_album_id').tooltip('disable')
  showDOMelement("the_album_id")
  hideDOMelement("the_album_name")
  setTimeout(showAlbumName, 7000)
}

function showAlbumName() {
  $('#the_album_name').tooltip('disable')
  showDOMelement("the_album_name")
  hideDOMelement("the_album_id")
}


function deleteTag(event) {
  event.preventDefault()
  var confirmation = confirm('Are you sure you want to delete a tag?')

  if (confirmation === true) {

    const index = $(this).attr('rel')
    const deleteTag = currentTags[index]
    const deleteCreator = currentAuthors[index]
    currentTags.splice(index, 1)
    currentAuthors.splice(index, 1)

    $.ajax(`/api/v1/album/tags/${albumResult._id}`, {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ 
        "tag": deleteTag,
        "creator": deleteCreator
      }),
      success: function(album) {
        // update global object
        albumResult = album
        populateTags(album)
      }
    })
  }
}

function moreByThisArtist(artist) {
  sessionStorage.setItem('artist', artist)
  window.location.href = '/search'
}

// drills through full connectionObjects array to pull out connections made by this user
function findDirectConnections() {
  let directConnections = []
  // console.log("findDirectConnections called")
  
  if (albumResult.connectionObjects) {
    for (let index = 0; index < albumResult.connectionObjects.length; index++) {
      var connectionObject = albumResult.connectionObjects[index]
      
      // avoids js errors for undefined values
      // only shows connections created by this user
      if (connectionObject && connectionObject.creator === userID) {
        directConnections.push(connectionObject)
      }
    }
  }
  // console.log("populateConnections called with body ", directConnections)
  populateConnections(directConnections)
}

// drills through directConnections to pull out connected albums and show them on the page
function populateConnections(directConnections) {
  $(".connection_results").text('')

  if (directConnections.length > 0) {
    showDOMelement("connections_card")

    for (let index = 0; index < directConnections.length; index++) {
      let connection = directConnections[index]

      if (connection != albumId) {
        const cover = connection.cover.replace('{w}', 75).replace('{h}', 75)
        $('.connection_results').append(`<div class="connection"><a href="/albumdetails/${connection.appleAlbumID}" data-toggle="tooltip" data-placement="right" title="Album Details" data-trigger="hover"><img class="small_cover" src="${cover}"></a><div><span class="connection-delete-button" data-connection-id="${connection.databaseID}" data-toggle="tooltip" data-placement="right" title="Delete Connection" data-trigger="hover">&#10005;</span></div></div>`)
      }            
    }
  }
  // ====== add event listener to delete buttons =====
  $(".connection-delete-button").on("click", function() { 
    deleteConnection($(this).attr("data-connection-id")) 
  })

  // ====== turning on tool tips for newly populated connections =====
  let isTouchDevice
  if ("ontouchstart" in document.documentElement) { isTouchDevice = true }
  if(isTouchDevice == false) { $('[data-toggle="tooltip"]').tooltip() }
}

function validateNewConnection() {
  const newAlbumID = parseInt($('#new_connection').val().trim())
  if (newAlbumID && newAlbumID.toString().length > 0) {
    if (newAlbumID.toString() === albumResult.appleAlbumID.toString()) {
      alert("You cannot connect an album to itself.")
      $('#new_connection').val('')
      return
    } else {
      if (albumResult.connectionObjects) {

        let myConnectionsOnPage = []
        albumResult.connectionObjects.forEach(connectionObject => {
          if (connectionObject.creator === userID){
            myConnectionsOnPage.push(connectionObject.appleAlbumID)
          }
        })

        if (myConnectionsOnPage.indexOf(newAlbumID.toString()) === -1) { 
          addConnection(newAlbumID) 
        } else { 
          alert("You cannot add a duplicate connection.")
          $('#new_connection').val('')
          return
        }
      } else {
        addConnection(newAlbumID)
      }
    }
  } else {
    // the album id field is not a valid album ID
    alert("Please enter an Apple album Id value to make a connection.")
    $('#new_connection').val('')
  }
}

function addConnection(newAlbumID) {
  $.getJSON ('/api/v1/apple/details/' + newAlbumID, function(appleAlbum) {
    // check if this is a valid album id
    if (!appleAlbum.message) {
      $.getJSON ('/api/v1/album/albumid/' + newAlbumID, function(databaseAlbum) {
        if (!databaseAlbum.message) {
          // ALBUM EXISTS IN DATABASE, SEND PUT REQUEST WITH BOTH ALBUM OBJECTS
          $.ajax(`/api/v1/album/connections/${albumResult._id || "new"}`, {
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
              "albumOne": albumResult,
              "albumTwo": databaseAlbum,
              "creator": userID
            }),
            success: function(album) {
              // returns just this album with updates
              albumResult = album
              findDirectConnections()
            }
          })
        } else {
          // ALBUM DOES NOT EXIST IN THE DATABASE POST A NEW ALBUM WITH THE CONNECTION IN IT
          $.ajax(`/api/v1/album/connections/${albumResult._id || "new"}`, {
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
              "albumOne": albumResult,
              "albumTwo": appleAlbum,
              "creator": userID
            }),
            success: function(album) {
              // returns just this album with updates
              albumResult = album
              findDirectConnections()
            }
          })
        }
      })
    } else {
      alert("Sorry, Apple says that's not an album ID.")
    }
    $('#new_connection').val('')
  })
}

function deleteConnection(connectedAlbum) {
  const confirmation = confirm('Are you sure you want to delete a connection?')
  if (confirmation === true) {
    // connectedAlbum is a database ID
    // DELETE CONNECTION FROM CURRENT ALBUM
    // DELETE CURRENT ALBUM FROM CONNECTED ALBUM
    $.ajax(`/api/v1/album/connections/${albumResult._id}`, {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ 
        "albumTwo" : connectedAlbum.toString(),
        "albumOne": albumResult._id.toString(),
        "creator": userID
      }),
      success: function(album) {
        // update global object
        albumResult = album
        findDirectConnections()
      }
    })
  }
}

function addToFavorites() {
  $.ajax(`/api/v1/album/favorites/${albumResult._id || "new"}`, {
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ 
      "user" : userID,
      "albumData" : albumResult
    }),
    success: function(album) {
      // returns just this album with updates
      albumResult = album

      if (albumResult.favoritedBy && albumResult.favoritedBy.indexOf(userID) != -1) { 
        $('#remove_from_favorites').show()
        $('#add_to_favorites').hide()
      } else {
        $('#remove_from_favorites').hide()
        $('#add_to_favorites').show()
      }
    }
  })
}

function removeFromFavorites() {
  $.ajax(`/api/v1/album/favorites/${albumResult._id}`, {
    method: 'DELETE',
    contentType: 'application/json',
    data: JSON.stringify({ "user" : userID }),
    success: function(album) {
      // returns just this album with updates
      albumResult = album

      if (albumResult.favoritedBy && albumResult.favoritedBy.indexOf(userID) != -1) { 
        $('#remove_from_favorites').show()
        $('#add_to_favorites').hide()
      } else {
        $('#remove_from_favorites').hide()
        $('#add_to_favorites').show()
      }
    }
  })
}

// ----- START FIREBASE AUTH SECTION ------
// === OLD CONFIG ===
// var config = {
//   apiKey: "AIzaSyD1Hts7zVBvDXUf-sCb89hcPesJkrUKyUc",
//   authDomain: "album-tag-auth.firebaseapp.com",
//   projectId: "album-tag-auth",
// }
// == New Config, November 2018 == 
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
    getAlbumDetails()
    // populateTags(albumResult)
    // findDirectConnections()

    $('#login-message').hide()
    $('#all_the_things').show()
    $('#full_menu_login_logout_container').show()
    $('#login_button').hide()
    $('#full_menu_login_button').hide()
    $('#logout_button').show()
    $('#full_menu_logout_button').show()
    $('#log_in_message').hide()
  } else {   
    // no user logged in
    $('#all_the_things').hide()
    // $('#all_cards').html('')
    $('#login-message').show()
    $('#full_menu_login_logout_container').show()
    $('#login_button').show()
    $('#full_menu_login_button').show()
    $('#logout_button').hide()
    $('#full_menu_logout_button').hide()
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
    getAlbumDetails()
    // populateTags(albumResult)
    // findDirectConnections()

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

// event listener for clicking delete link
$('#tags_table tbody').on('click', 'td a.deletetaglink', deleteTag)

// ------------- start tooltips section -----------
var isTouchDevice = false

$(function () {
  setTimeout(function(){ 
    if ("ontouchstart" in document.documentElement) {
      isTouchDevice = true
    }
    
    if(isTouchDevice == false) {
      $('[data-toggle="tooltip"]').tooltip()
    }
  }, 1000)
})
// for desired behavior
// -------------- end tooltips section --------------

// Start the page!
// getAlbumDetails()

// ====== ADD GENERAL EVENT LISTENERS ======
// document.getElementById("back-button").addEventListener("click", function(event) {
//   // note: the update page should only be reachable from the album details page
//   // the `back` button on this page redirects to album details with a page refresh
//   // instead of window.location.back() so it can load the newly updated album information
//   const newURL = window.location.href.replace('update', 'albumdetails')
//   window.location.replace(newURL) 
// })
document.getElementById("add_tag_button").addEventListener("click", function(event) {
  event.preventDefault()
  addTag()
})
document.getElementById("add_connection_button").addEventListener("click", function(event) {
  event.preventDefault()
  validateNewConnection()
})
$('.login_button').on('click', logIn)

// when enter is pressed, fire appropriate function if one 
// of the two search inputs is sellected
$('input[type=search]').on('keydown', function(e) {
  if (e.which == 13) {
    e.preventDefault();
    if ($("#new_connection").is(":focus")) {
      validateNewConnection()
    }
    if ($("#new_tag").is(":focus")) {
      addTag()
    }
  }
})

// ====== messing with keyboard shortcuts ======
Mousetrap.bind('ctrl+t', function(e) { $("#new_tag").focus(); return false; });
Mousetrap.bind('ctrl+c', function(e) { $("#new_connection").focus(); return false; });