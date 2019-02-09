// ------- START UTILITIES SECTION ----------
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js list.script.js --js_output_file list.script.min.js`
// ======
function truncate(str, len){
  // set up the substring
  var subString = str.substr(0, len-1)
  
  return (
    // add elipse after last complete word
    subString.substr(0, subString.lastIndexOf(' '))
    // trim trailing comma
    .replace(/(^[,\s]+)|([,\s]+$)/g, '') + '...'
  )
}

function removeDash(str) {
  return str.replace(/-/g, '');
}

function bubbleSort(arr, prop) {
  var swapped;
  do {
    swapped = false
    for (var i = 0; i < arr.length - 1; i++) {
      if (parseInt(removeDash(arr[i][prop])) > parseInt(removeDash(arr[i + 1][prop]))) {
        var temp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
}
// ------- END UTILITIES SECTION ----------

let listData
const listID = window.location.pathname.replace('/list/', '')
let isFavoritesList = false

function getList() {
  if (listID.length < 25) {
    $.ajax({
      method: "GET",
      url: "/api/v1/list/" + listID,
      success: function(data) {
        listData = data
        $('#loader').hide()
        populateList()
      }
    })
  } else {
    isFavoritesList = true
    $.ajax({
      method: "GET",
      url: "/api/v1/list/favorites/" + listID,
      success: function(data) {
        listData = data
        $('#loader').hide()
        populateList()
      }
    })
  }
}

function createCard(cardNumber) {
  $('#albums').append(`<div id="card${cardNumber}" class="card albumCard"><a class="album_details_link" href=""><img class="card-img-top" src="" alt=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album"><span class="text-primary">Loading Album Details...</span></span></div></div>`)
}

function populateCard(album, cardNumber) {
  // set up album and artist trunction
  let smallArtist = album.artist
  let largeArtist = album.artist
  let smallAlbum = album.title
  let largeAlbum = album.title
  if (smallArtist.length > 32) { smallArtist = truncate(smallArtist, 32) } 
  if (smallAlbum.length > 44) { smallAlbum = truncate(smallAlbum, 44) } 

  if (largeArtist.length > 49) { largeArtist = truncate(largeArtist, 49) } 
  if (largeAlbum.length > 66) { largeAlbum = truncate(largeAlbum, 66) }
  
  // artist name
  $(`#card${cardNumber} .card-body h4`).html(`<span class="large_artist">${largeArtist}</span><span class="small_artist">${smallArtist}</span>`)
  // album name
  $(`#card${cardNumber} .card-body .album`).html(`<span class="large_album">${largeAlbum}</span><span class="small_album">${smallAlbum}</span>`) 
  // album cover
  $(`#card${cardNumber} img`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260))
  // add album-details-link to album cover
  $(`#card${cardNumber} .album_details_link`).attr('href', `/album/${album.appleAlbumID}`)
  
  $(`#card${cardNumber}`).append(`<span class="album-delete-button" data-album-id="${album.appleAlbumID}" data-toggle="tooltip" data-placement="right" title="Remove from list" data-trigger="hover">&#10005;</span></li>`)

  // checks each time through in case login is slow
  if (userID && !isFavoritesList) {
    $('.album-delete-button').show()
  } else {
    $('.album-delete-button').hide()
  }
}

function populateList() {
  $('.page-info-button').hide();
  $("#no-albums-message").hide();
  $('#albums').html('');

  let listCreator = listData.displayName
  if (!listCreator || listCreator.trim === "") { listCreator = "Unknown" }
  $('#list-title').text(`${listData.title}`)
  $('#list-title').append('<small class="text-secondary pl-2 page-info-button" data-toggle="modal" style="display:none;" data-target="#pageInfoModal">&#9432;</small>')
  $('#list-creator').text("by: " + listCreator)

  if (listData.albums && listData.albums.length > 0) {
    let albumArray = listData.albums
    bubbleSort(albumArray, "releaseDate")
    // reverse shows newer albums first (mostly)
    albumArray = albumArray.reverse()
    let card = 0
    albumArray.forEach(albumObject => {
      card = card + 1
      createCard(card)
      populateCard(albumObject.album || albumObject, card)
    })
  
    // ====== add event listener to delete buttons =====
    $(".album-delete-button").on("click", function() { 
      removeAlbum($(this).attr("data-album-id")) 
    })
  } else {
    $("#no-albums-message").show()
  }

  if (!isFavoritesList && userID) { 
    $('#edit-button').show(); 
    $('#add-album-button').show();
    $('.page-info-button').show();
  }
}

function removeAlbum(albumID) {
  let thisAlbum = listData.albums.find(x => x.appleAlbumID === albumID)
  let confirmed = confirm(`Are you sure you want to remove "${thisAlbum.title}" from this list? You cannot undo this operation.`)
  
  if (confirmed) {
    let deleteObject = {
      method: "remove album",
      appleAlbumID: thisAlbum.appleAlbumID,
      title: thisAlbum.title,
      artist: thisAlbum.artist,
      releaseDate: thisAlbum.releaseDate,
      cover: thisAlbum.cover
    }
    
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + listID,
      contentType: 'application/json',
      data: JSON.stringify(deleteObject),
      success: function(data) {
        listData = data
        populateList()
      }
    })
  }
}

function editDisplayName() {
  let newDisplayName = $("#list-display-name-input").val().trim()

  // pass basic data validation
  if (newDisplayName === listData.displayName) {
    alert(`The display name for this list is already set as "${listData.displayName}"`);
    return;
  }
  if (newDisplayName.length > 30) {
    alert("Display names must be shorter than 30 characters in length.")
    return;
  } 

  // start updating list
  let updateObject = {
    method: "change display name",
    displayName: newDisplayName
  }
  $.ajax({
    method: "PUT",
    url: "/api/v1/list/" + listID,
    contentType: 'application/json',
    data: JSON.stringify(updateObject),
    success: function(data) {
      if (!data.message) {
        listData = data
        populateList()
        $('#list-update-success').text("List info updated!");
        setTimeout(function(){ $('#list-update-success').html('&nbsp;'); }, 3000);
      } else {
        alert(data.message);
      }
    }
  })
}

function editListTitle() {
  let newListTitle = $("#list-title-input").val().trim()

  // pass basic data validation
  if (newListTitle === listData.title) {
    alert(`The title for this list is already "${listData.title}"`);
    return;
  }
  if (newListTitle.length > 60) {
    alert("List titles must be shorter than 60 characters in length.")
    return;
  } 

  // start updating list
  if (newListTitle && newListTitle.length > 0) {
    let updateObject = {
      method: "change title",
      title: newListTitle
    }
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + listID,
      contentType: 'application/json',
      data: JSON.stringify(updateObject),
      success: function(data) {
        if (!data.message) {
          listData = data
          populateList()
          $('#list-update-success').text("List info updated!");
          setTimeout(function(){ $('#list-update-success').html('&nbsp;'); }, 3000);
        } else {
          alert(data.message);
        }
      }
    })
  } else {
    alert("A non-blank title is required for every list.")
    $('#list-title-input').val(listData.title)
  }
}

let addAlbumResults = [];
function populateAddToListModalResults(data) {
  $('#add-album-search-results').html('');
  $('#add-album-card-body .new-loader').hide();
  if (data.albums) {
    for (let index = 0; index < data.albums.length; index++) {
      const album = data.albums[index];
      const cardNumber = index;
      createAddAlbumModalCard(album, cardNumber);
      populateAddAlbumModalCard(album, cardNumber);
    }
    // this adds an empty space at the end so the user can scroll 
    // all the way to the right to see the last album
    createAddAlbumModalCard(data.albums.length + 1);

    // store search results
    addAlbumResults = data.albums;
  }
}

function createAddAlbumModalCard(album, cardNumber) {
  $('#add-album-search-results').append(`<div id="addAlbumModalCard${cardNumber}" class="search-modal-card" data-result-index="${cardNumber}"><img class="search-modal-card-image" src="" alt=""><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`)
}

function populateAddAlbumModalCard(album, cardNumber) {
  // set up album and artist trunction
  let smallArtist = album.artist;
  let largeArtist = album.artist;
  let smallAlbum = album.title;
  let largeAlbum = album.title;
  if (smallArtist.length > 32) { smallArtist = truncate(smallArtist, 32); } 
  if (smallAlbum.length > 44) { smallAlbum = truncate(smallAlbum, 44); } 

  if (largeArtist.length > 49) { largeArtist = truncate(largeArtist, 49); } 
  if (largeAlbum.length > 66) { largeAlbum = truncate(largeAlbum, 66); }
  
  // artist name
  $(`#addAlbumModalCard${cardNumber} .search-modal-card-title`).html(`<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`);
  // album name
  $(`#addAlbumModalCard${cardNumber} .search-modal-card-album`).html(`<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`);
  // album cover
  $(`#addAlbumModalCard${cardNumber} .search-modal-card-image`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260));

  $(`#addAlbumModalCard${cardNumber}`).click(function(event) {
    event.preventDefault();
    // connect to this album
    const selectedAlbumIndex = $(this).data("result-index");
    const selectedAlbum = addAlbumResults[selectedAlbumIndex];
    addToList(selectedAlbum);
  })
}

function addToList(selectedAlbum) {
  if (selectedAlbum) {
    let alreadyInList = listData.albums.find(x => x.appleAlbumID === selectedAlbum.appleAlbumID);

    if (alreadyInList) {
      alert(`"${selectedAlbum.title}" is already in this list.`);
      return;
    }

    let addAlbumToListBody = {
      method: "add album",
      appleAlbumID: selectedAlbum.appleAlbumID,
      title: selectedAlbum.title,
      artist: selectedAlbum.artist,
      releaseDate: selectedAlbum.releaseDate,
      cover: selectedAlbum.cover
    };
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + listData._id,
      contentType: 'application/json',
      data: JSON.stringify(addAlbumToListBody),
      success: function(data) {
        if (!data.message) {
          listData = data;
          populateList();
          $('#editListModal').modal('hide');
        } else {
          alert(data.message);
        }
      }
    });
  }
}

function toggleActiveInfoTab(element) {
  $('#editListModal .active').removeClass("active").addClass("inactive-list-edit-tab");
  $(element).removeClass("inactive-list-edit-tab").addClass("active");
  $('.edit-list-card-body').hide();
  const selectedCard = element.data('card');
  $(`#${selectedCard}-card-body`).show();
}

$('#add-album-modal-button').click(function(event) {
  event.preventDefault();
  const search = $('#add-album-modal-input').val().trim().replace(/[^\w\s]/gi, '');
  $('#add-album-search-results').html('');
  $('#add-album-card-body .new-loader').show();
  executeSearch(search, "add to list");
})

// execute search when enter key is pressed
$("#add-album-modal-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-album-modal-button").click();
  }
});

$('#edit-button').click(function(event) {
  event.preventDefault();
  toggleActiveInfoTab($('#edit-list-modal-nav-tab'));
  $('#editListModal').modal('show');
  $('#list-title-input').val(listData.title);
  $('#list-display-name-input').val(listData.displayName || "Unknown");
});
$('#add-album-button').click(function(event) {
  event.preventDefault();
  toggleActiveInfoTab($('#add-album-modal-nav-tab'));
  $('#editListModal').modal('show');
  $('#list-title-input').val(listData.title);
  $('#list-display-name-input').val(listData.displayName || "Unknown");
});
$('.add-album-refrence').click(function(event) {
  event.preventDefault();
  $('#pageInfoModal').modal('hide');
  $("#add-album-button").click();
});
$('.edit-list-refrence').click(function(event) {
  event.preventDefault();
  $('#pageInfoModal').modal('hide');
  $('#edit-button').click();
});
$("#list-title-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#update-list-title").click();
  }
});
$("#list-display-name-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#update-list-display-name").click();
  }
});

document.getElementById("update-list-display-name").addEventListener("click", editDisplayName)
document.getElementById("update-list-title").addEventListener("click", editListTitle)

$('#editListModal .nav-link').click(function(event) {
  event.preventDefault();
  toggleActiveInfoTab($(this));
});

// make hover scrollbar always visible on touchscreens
$(document).ready(function() {
  let isTouchDevice = false;
  if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
  if (isTouchDevice) {
    const searchResultsBox = document.getElementById("add-album-search-results");
    searchResultsBox.style.paddingBottom="0px";
    searchResultsBox.style.overflowX="scroll";
  }
});

// ----- START FIREBASE AUTH SECTION ------
const config = {
  apiKey: "AIzaSyAoadL6l7wVMmMcjqqa09_ayEC8zwnTyrc",
  authDomain: "album-tags-v1d1.firebaseapp.com",
  projectId: "album-tags-v1d1",
}
const defaultApp = firebase.initializeApp(config)
let userID = false
// checking if user is logged in or logs in during session
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    userID = firebase.auth().currentUser.uid;
    getList();

    $('#full_menu_login_logout_container').show();
    $('#login_button').hide();
    $('#full_menu_login_button').hide();
    $('#logout_button').show();
    $('#full_menu_logout_button').show();

    // $('#edit-button').show();
    // $('#add-album-button').show();
    // $('.album-delete-button').show();
  } else {   
    // no user logged in
    userID = false;

    getList();

    $('#full_menu_login_logout_container').show();
    $('#login_button').show();
    $('#full_menu_login_button').show();
    $('#logout_button').hide();
    $('#full_menu_logout_button').hide();
    $('#loader').hide();

    $('#edit-button').hide();
    $('#add-album-button').hide();
    $('.album-delete-button').hide();
  }
});

function logIn() {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  // local persistance remains if browser is closed
  .then(function() {
    var provider = new firebase.auth.GoogleAuthProvider()
    return firebase.auth().signInWithPopup(provider)
  })
  .then(function(result) {
    userID = user.uid;
    getList();

    $('#full_menu_login_logout_container').show();
    $('#login_button').hide();
    $('#full_menu_login_button').hide();
    $('#logout_button').show();
    $('#full_menu_logout_button').show();

    $('#edit-button').show();
    $('#add-album-button').show();
    $('.album-delete-button').show();
  }).catch(function(error) {
    // Handle Errors here.
  });
}

function logOut() {
  firebase.auth().signOut().then(function() {
    userID = false;
    // log out functionality
    $('#full_menu_login_logout_container').show();
    $('#login_button').show();
    $('#full_menu_login_button').show();
    $('#logout_button').hide();
    $('#full_menu_logout_button').hide();

    $('#edit-button').hide();
    $('#add-album-button').hide();
    $('.album-delete-button').hide();
  }).catch(function(error) {
  // An error happened.
  });
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