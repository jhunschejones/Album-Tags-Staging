// ------- START UTILITIES SECTION ----------
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js list.script.js --js_output_file list.script.min.js`
// ======
function truncate(str, len){
  // set up the substring
  const subString = str.substr(0, len-1);
  
  return (
    // add elipse after last complete word
    subString.substr(0, subString.lastIndexOf(' '))
    // trim trailing comma
    .replace(/(^[,\s]+)|([,\s]+$)/g, '') + '...'
  );
}

function removeDash(str) { return str.replace(/-/g, ''); }

function bubbleSort(arr, prop) {
  let swapped;
  do {
    swapped = false;
    for (let i = 0; i < arr.length - 1; i++) {
      if (parseInt(removeDash(arr[i][prop])) > parseInt(removeDash(arr[i + 1][prop]))) {
        const temp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
}

function scrollToTop() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function textToClassName(str) { return str.replace(/[^\w\s]/gi, '').replace(/\s\s+/g, ' ').replace(/ /g, '_').toLowerCase(); }

function isGenre(str) {
  const myGenres = ['Metalcore', 'Pop Punk', 'Emo', 'Rock', 'Post-Hardcore', 'Accoustic', 'Screamo', 'Metal', 'Nu Metal', 'Alt Metal', 'Djent', 'Accoustic', 'Jazz', 'Ska', 'Rap-Rock', 'Progressive', 'Punk', 'Rap'];
  return myGenres.indexOf(str) !== -1;
}

function removeFromArray(arr, ele){
  if (arr.indexOf(ele) !== -1) {
    arr.splice(arr.indexOf(ele), 1);
  }
}

function addToArray(arr, ele){
  if (arr.indexOf(ele) === -1) {
    arr.push(ele);
  }
}

function removeDuplicates(inputArray){
  let outputArray = []
  for(let i = 0;i < inputArray.length; i++){
    if(outputArray.indexOf(inputArray[i]) == -1){
      outputArray.push(inputArray[i])
    }
  }
  return outputArray
}
// ------- END UTILITIES SECTION ----------

let listData;
const listType = (new URL(document.location)).searchParams.get("type");
const listID = (new URL(document.location)).searchParams.get("id");

function getList() {
  if (listType === "favorites") {
    // GET FAVORITES LIST
    $.ajax({
      method: "GET",
      url: "/api/v1/list/favorites/" + listID,
      success: function(data) {
        listData = data;
        $('#main-page-loader').hide();
        populateList();
      }
    });
  } else {
    // GET CUSTOM USER LIST
    $.ajax({
      method: "GET",
      url: "/api/v1/list/" + listID,
      success: function(data) {
        listData = data;
        $('#main-page-loader').hide();
        populateList();
      }
    });
  }
}

function createCard(cardNumber) {
  $('#albums').append(`<div id="card${cardNumber}" class="card list-card"><a class="album-details-link" href=""><img class="card-img-top" src=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album-title"></span></div></div>`);
}

function populateCard(album, cardNumber) {
  let smallArtist = album.artist.length > 32 ? truncate(album.artist, 32) : album.artist;
  let largeArtist = album.artist.length > 49 ? truncate(album.artist, 49) : album.artist;
  let smallAlbum = album.title.length > 44 ? truncate(album.title, 44) : album.title;
  let largeAlbum = album.title.length > 66 ? truncate(album.title, 66): album.title;
  
  // artist name
  $(`#card${cardNumber} .card-body h4`).html(`<span class="large_artist">${largeArtist}</span><span class="small_artist">${smallArtist}</span>`);
  // album name
  $(`#card${cardNumber} .card-body .album-title`).html(`<span class="large_album">${largeAlbum}</span><span class="small_album">${smallAlbum}</span>`); 
  // album cover
  $(`#card${cardNumber} .card-img-top`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260));
  // add album-details-link to album cover
  $(`#card${cardNumber} .album-details-link`).attr('href', `/album/${album.appleAlbumID}`);
  // remove album from list button
  $(`#card${cardNumber}`).append(`<span class="album-delete-button" data-album-id="${album.appleAlbumID}" data-toggle="tooltip" data-placement="right" title="Remove from list" data-trigger="hover">&#10005;</span></li>`);

  // sets remove album button visibility
  if (listData.user === userID && listType !== "favorites") {
    $('.album-delete-button').show();
  } else {
    $('.album-delete-button').hide();
  }
}

function populateList() {
  $('#page-info-button').hide();
  $("#no-albums-message").hide();
  $('#albums').html('');

  let listCreator = listData.displayName;
  if (!listCreator || listCreator.trim === "") { listCreator = "Unknown"; }
  $('#list-title').text(`${listData.title}`);
  $('#list-title').after('<h5 id="page-info-button" class="text-secondary" data-toggle="modal" data-target="#pageInfoModal">&#9432;</h5>');
  if (listType !== "userlist") { $('#page-info-button').hide(); }
  $('#list-creator').text("by: " + listCreator);

  if (listData.albums && listData.albums.length > 0) {
    const albumArray = filterAlbums();

    if (albumArray.length > 0) {
      $('#no-albums-message').hide();
    } else {
      $('#no-albums-message').show();
    }

    let card = 0;
    albumArray.forEach(albumObject => {
      card = card + 1;
      createCard(card);
      populateCard(albumObject, card);
    });
  
    // ====== add event listener to delete buttons =====
    $(".album-delete-button").on("click", function() { 
      if (listData.user !== userID) {
        alert("Sorry! Only the list creator can delete albums.");
        return;
      } else if (listType === "userlist") {
        removeAlbum($(this).attr("data-album-id")); 
      } else {
        alert("Sorry! This type of list won't let you delete albums.");
        return;
      }
    });
    populateFilters(albumArray);
  } else {
    $("#no-albums-message").show();
    populateFilters([]);
  }
  displayButtons(); // show user control buttons for this list type
}

function removeAlbum(albumID) {
  if (listData.user !== userID) { alert("Sorry, only the list creator can delete albums from a list."); return; }
  let thisAlbum = listData.albums.find(x => x.appleAlbumID === albumID);
  let confirmed = confirm(`Are you sure you want to remove "${thisAlbum.title}" from this list? You cannot undo this operation.`);
  
  if (confirmed) {
    let deleteObject = {
      method: "remove album",
      appleAlbumID: thisAlbum.appleAlbumID,
      title: thisAlbum.title,
      artist: thisAlbum.artist,
      releaseDate: thisAlbum.releaseDate,
      cover: thisAlbum.cover
    };
    
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + listID,
      contentType: 'application/json',
      data: JSON.stringify(deleteObject),
      success: function(data) {
        listData = data;
        populateList();
      }
    });
  }
}

function editDisplayName() {
  let newDisplayName = $("#list-display-name-input").val().trim();

  // pass basic data validation
  if (newDisplayName === listData.displayName) {
    alert(`The display name for this list is already set as "${listData.displayName}"`);
    return;
  }
  if (newDisplayName.length > 30) {
    alert("Display names must be shorter than 30 characters in length.");
    return;
  } 

  // start updating list
  let updateObject = {
    method: "change display name",
    displayName: newDisplayName
  };
  $.ajax({
    method: "PUT",
    url: "/api/v1/list/" + listID,
    contentType: 'application/json',
    data: JSON.stringify(updateObject),
    success: function(data) {
      if (!data.message) {
        listData = data;
        populateList();
        $('#list-update-success').text("List info updated!");
        setTimeout(function(){ $('#list-update-success').html('&nbsp;'); }, 3000);
      } else {
        alert(data.message);
      }
    }
  });
}

function editListTitle() {
  let newListTitle = $("#list-title-input").val().trim();

  // pass basic data validation
  if (newListTitle === listData.title) {
    alert(`The title for this list is already "${listData.title}"`);
    return;
  }
  if (newListTitle.length > 60) {
    alert("List titles must be shorter than 60 characters in length.");
    return;
  } 

  // start updating list
  if (newListTitle && newListTitle.length > 0) {
    let updateObject = {
      method: "change title",
      title: newListTitle
    };
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + listID,
      contentType: 'application/json',
      data: JSON.stringify(updateObject),
      success: function(data) {
        if (!data.message) {
          listData = data;
          populateList();
          $('#list-update-success').text("List info updated!");
          setTimeout(function(){ $('#list-update-success').html('&nbsp;'); }, 3000);
        } else {
          alert(data.message);
        }
      }
    });
  } else {
    alert("A non-blank title is required for every list.");
    $('#list-title-input').val(listData.title);
  }
}

let addAlbumResults = [];
function populateAddToListModalResults(data) {
  $('#add-album-search-results').html('');
  $('#add-album-card-body .new-loader').hide();
  if (data.albums && data.albums.length > 0) {
    for (let index = 0; index < data.albums.length; index++) {
      const album = data.albums[index];
      const cardNumber = index;
      createAddAlbumModalCard(cardNumber);
      populateAddAlbumModalCard(album, cardNumber);
    }
    // this adds an empty space at the end so the user can scroll 
    // all the way to the right to see the last album
    $('#add-album-search-results').append('<div id="add-search-modal-placeholder">&nbsp;</div>');

    // store search results globally
    addAlbumResults = data.albums;
  } else {
    $('#add-album-search-results').after('<div id="no-results-message" class="text-primary" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>');
  }
}

function createAddAlbumModalCard(cardNumber) {
  $('#add-album-search-results').append(`<div id="addAlbumModalCard${cardNumber}" class="search-modal-card" data-result-index="${cardNumber}"><img class="search-modal-card-image" src="" alt=""><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`);
}

function populateAddAlbumModalCard(album, cardNumber) {
  let smallArtist = album.artist.length > 32 ? truncate(album.artist, 32) : album.artist;
  let largeArtist = album.artist.length > 49 ? truncate(album.artist, 49) : album.artist;
  let smallAlbum = album.title.length > 44 ? truncate(album.title, 44) : album.title;
  let largeAlbum = album.title.length > 66 ? truncate(album.title, 66): album.title;
  
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
  });
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


// ====== START FILTER FUNCTIONALITY ======
function getCleanAlbumArray(arr) {
  let cleanArray = [];
  arr.forEach(ele => {
    if (ele.album) {
      cleanArray.push(ele.album);
    } else {
      cleanArray.push(ele);
    }
  });

  cleanArray.forEach(album => {
    if (album.tagObjects) {
      album.tagObjects.forEach(tagObject => {
        // check if the tag is created by the same person who created the list
        if (tagObject.creator === listData.user && isGenre(tagObject.tag) && album.genres.indexOf(tagObject.tag) === -1) {
          album.genres.push(tagObject.tag);
        }
      });
    }
    album.year = album.releaseDate.slice(0,4);
    // if (album.genres) { album.genres = album.genres.join('||').toLowerCase().split('||'); }
  });
  return cleanArray;
}

function getFilterObject() {
  return {
    "year": (new URL(document.location)).searchParams.get("year"),
    "artist": (new URL(document.location)).searchParams.get("artist"),
    "genre": (new URL(document.location)).searchParams.get("genre")
  };
}

function filterAlbums() {
  const filterObject = getFilterObject();
  let albumArray = getCleanAlbumArray(listData.albums);
  
  if (!!filterObject.genre) { // `!!` forces a boolean value
    albumArray = albumArray.filter(album => {
      return !album.genres ? false : album.genres.indexOf(filterObject.genre) !== -1;
    });
  }
  if (!!filterObject.artist) {
    albumArray = albumArray.filter(album => !!album.artist && album.artist === filterObject.artist);
  }
  if (!!filterObject.year) {
    albumArray = albumArray.filter(album => !!album.year && album.year === filterObject.year);
  }
  bubbleSort(albumArray, "releaseDate");
  albumArray = albumArray.reverse(); // reverse shows newer albums first (generally)
  return albumArray;
}

function populateFilters(albumArray) {
  const filterObject = getFilterObject();
  $('#year-filter-dropdown').html('');
  $('#artist-filter-dropdown').html('');
  $('#genre-filter-dropdown').html('');

  if (albumArray.length < 1) {
    $('.remove-if-no-albums').hide();
    return;
  } else {
    $('.remove-if-no-albums').show();
  }

  // YEAR FILTERS
  let yearFilters = [];
  albumArray.forEach(album => { addToArray(yearFilters, album.releaseDate.slice(0,4)); });
  yearFilters.sort();
  yearFilters.forEach(year => {
    if (!!filterObject.year && year === filterObject.year) {
      $('#year-filter-dropdown').append(`<span class="badge badge-primary year-filter" data-year="${year}">${year}</span>`);
    } else {
      $('#year-filter-dropdown').append(`<span class="badge badge-light year-filter" data-year="${year}">${year}</span>`);
    }
  });
  $('.year-filter').click(function(event) {
    event.preventDefault();
    toggleFilter("year", $(this).data("year"));
  })

  // ARTIST FILTERS
  let artistFilters = [];
  albumArray.forEach(album => { addToArray(artistFilters, album.artist); });
  artistFilters.sort();
  artistFilters.forEach(artist => {
    if (!!filterObject.artist && artist === filterObject.artist) {
      $('#artist-filter-dropdown').append(`<span class="badge badge-primary artist-filter" data-artist="${artist}">${artist.length > 32 ? truncate(artist, 32) : artist}</span>`);
    } else {
      $('#artist-filter-dropdown').append(`<span class="badge badge-light artist-filter" data-artist="${artist}">${artist.length > 32 ? truncate(artist, 32) : artist}</span>`);
    }
  });
  $('.artist-filter').click(function(event) {
    event.preventDefault();
    toggleFilter("artist", $(this).data("artist"));
  })

  // GENRE FILTERS
  let genreFilters = [];
  albumArray.forEach(album => { if (album.genres) { 
    album.genres.forEach(genre => {
      if (isGenre(genre)) { addToArray(genreFilters, genre); }
      else { console.log(`Ignored genre: '${genre}'`); }
    });
  }});

  genreFilters.sort();
  genreFilters.forEach(genre => {
    if (!!filterObject.genre && genre === filterObject.genre) {
      $('#genre-filter-dropdown').append(`<span class="badge badge-primary genre-filter" data-genre="${genre}">${genre}</span>`);
    } else {
      $('#genre-filter-dropdown').append(`<span class="badge badge-light genre-filter" data-genre="${genre}">${genre}</span>`);
    }
  });
  $('.genre-filter').click(function(event) {
    event.preventDefault();
    toggleFilter("genre", $(this).data("genre"));
  })
}

function toggleFilter(type, filter) {
  let url = new URL(document.location);
  if (url.searchParams.get(type) == filter) {
    url.searchParams.delete(type); // toggle off if already set
  } else {
    url.searchParams.set(type, filter); // add if not set
  }
  history.pushState({}, '', url); // url update works with page `back` navigation
  populateList();
}

function clearFilters() {
  let url = new URL(document.location);
  url.searchParams.delete("year");
  url.searchParams.delete("artist");
  url.searchParams.delete("genre");
  history.pushState({}, '', url); // url update works with page `back` navigation
  populateList();
}

$('#clear-filters-button').click(clearFilters);
// ====== END FILTER FUNCTIONALITY ======


// ====== START EVENT LISTENERS ======
$('#add-album-modal-button').click(function(event) {
  event.preventDefault();
  const search = $('#add-album-modal-input').val().trim().replace(/[^\w\s]/gi, '');
  $('#add-album-search-results').html('');
  $('#no-results-message').remove();
  $('#add-album-card-body .new-loader').show();
  executeSearch(search, "add to list");
});
// execute search when enter key is pressed
$("#add-album-modal-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-album-modal-button").click();
  }
});
$('#edit-button').click(function(event) {
  event.preventDefault();
  if (listData.user !== userID) {
    alert("Sorry! Only the list creator can edit the information for this list.");
    return;
  }
  toggleActiveInfoTab($('#edit-list-modal-nav-tab'));
  $('#editListModal').modal('show');
  $('#list-title-input').val(listData.title);
  $('#list-display-name-input').val(listData.displayName || "Unknown");
});
$('#add-album-button').click(function(event) {
  event.preventDefault();
  if (listData.user !== userID) {
    alert("Sorry! Only the list creator can add albums to this list.");
    return;
  }
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
document.getElementById("update-list-display-name").addEventListener("click", editDisplayName);
document.getElementById("update-list-title").addEventListener("click", editListTitle);
$('#editListModal .nav-link').click(function(event) {
  event.preventDefault();
  toggleActiveInfoTab($(this));
});
$('#to-top-button').click(scrollToTop);
// closes filter dropdowns when page is scrolling
$(document).on( 'scroll', function(){
  $('#year-filter-dropdown').removeClass('show');
  $('#genre-filter-dropdown').removeClass('show');
  $('#artist-filter-dropdown').removeClass('show');
});
// ====== END EVENT LISTENERS ======


// ----- START FIREBASE AUTH SECTION ------
const config = {
  apiKey: "AIzaSyAoadL6l7wVMmMcjqqa09_ayEC8zwnTyrc",
  authDomain: "album-tags-v1d1.firebaseapp.com",
  projectId: "album-tags-v1d1",
};
const defaultApp = firebase.initializeApp(config);
let userID = false;
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
  } else {   
    // no user logged in
    userID = false;
    getList();

    $('#full_menu_login_logout_container').show();
    $('#login_button').show();
    $('#full_menu_login_button').show();
    $('#logout_button').hide();
    $('#full_menu_logout_button').hide();
    $('#main-page-loader').hide();
  }
});

function logIn() {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  // local persistance remains if browser is closed
  .then(function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider);
  })
  .then(function(result) {
    userID = user.uid;
    populateList();

    $('#full_menu_login_logout_container').show();
    $('#login_button').hide();
    $('#full_menu_login_button').hide();
    $('#logout_button').show();
    $('#full_menu_logout_button').show();
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

    displayButtons();
  }).catch(function(error) {
  // An error happened.
  });
}

function displayButtons() {
  if (listData.user === userID && listType === "userlist") {
    $('#edit-button').show(); 
    $('#add-album-button').show();
    $('#page-info-button').show();
  } else {
    $("#page-info-button").hide();
    $('#edit-button').hide();
    $('#add-album-button').hide();
    $('.album-delete-button').hide();
  }
}

// add event listener to log in and out buttons
const loginButton = document.getElementById("login_button");
const loginButton2 = document.getElementById("full_menu_login_button");
const logoutButton = document.getElementById("logout_button");
const logoutButton2 = document.getElementById("full_menu_logout_button");
loginButton.addEventListener("click", logIn);
loginButton2.addEventListener("click", logIn);
logoutButton.addEventListener("click", logOut);
logoutButton2.addEventListener("click", logOut);
$('.login_button').on('click', logIn);
// ----- END FIREBASE AUTH SECTION ------


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