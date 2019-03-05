// ====== START UTILITY SECTION ======
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js album.script.js --js_output_file album.script.min.js`
// ======
function makeNiceDate(uglyDate) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let year = uglyDate.slice(0, 4);
  let day = uglyDate.slice(8, 10);
  let uglyMonth = uglyDate.slice(5, 7);
  let niceMonth = months[uglyMonth-1];
  return(`${niceMonth} ${day}, ${year}`);
}

function escapeHtml(text) {
  var map = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&sol;',
    '\\': '&#92;',
    '{': '&#123;',
    '}': '&#125;'
  };
  return text.replace(/[<>"'/\\{}]/g, function(m) { return map[m]; });
}

// removes accidental double spaces
function removeExtraSpace(str) {
  return str.replace(/\s\s+/g, ' ');
}

function truncate(str, len){
  // set up the substring
  var subString = str.substr(0, len-1);
  
  return (
    // add elipse after last complete word
    subString.substr(0, subString.lastIndexOf(' '))
    // trim trailing comma
    .replace(/(^[,\s]+)|([,\s]+$)/g, '') + '...'
  );
}
// using regular expression to make first letter of each
// word upper case, even if it is seperated with a "-"
function toTitleCase(str) {
  return str.replace(/\b\w+/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

var isEqual = function (value, other) {
  // source: https://gomakethings.com/check-if-two-arrays-or-objects-are-equal-with-javascript/
  // Get the value type
  var type = Object.prototype.toString.call(value);

  // If the two objects are not the same type, return false
  if (type !== Object.prototype.toString.call(other)) return false;

  // If items are not an object or array, return false
  if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

  // Compare the length of the length of the two items
  var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
  var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
  if (valueLen !== otherLen) return false;

  // Compare two items
  var compare = function (item1, item2) {

    // Get the object type
    var itemType = Object.prototype.toString.call(item1);

    // If an object or array, compare recursively
    if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
      if (!isEqual(item1, item2)) return false;
    }

    // Otherwise, do a simple comparison
    else {

      // If the two items are not the same type, return false
      if (itemType !== Object.prototype.toString.call(item2)) return false;

      // Else if it's a function, convert to a string and compare
      // Otherwise, just compare
      if (itemType === '[object Function]') {
        if (item1.toString() !== item2.toString()) return false;
      } else {
        if (item1 !== item2) return false;
      }

    }
  };

  // Compare properties
  if (type === '[object Array]') {
    for (var i = 0; i < valueLen; i++) {
      if (compare(value[i], other[i]) === false) return false;
    }
  } else {
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        if (compare(value[key], other[key]) === false) return false;
      }
    }
  }

  // If nothing failed, return true
  return true;
};
// ====== END UTILITY SECTION ======

const albumID = window.location.pathname.replace('/album/', '');
let albumResult;
let selectedTags = [];
let userLists = [];
let listsWithAlbum = [];

function getAlbumDetails(userLoggedIn) {
  $.ajax('/api/v1/album/albumid/' + albumID, {
    method: 'GET',
    success: function(album) {
      // message returned here means no album in the database yet
      if (!album.message) {
        albumResult = album;
        populateAlbumPage(userLoggedIn);
      } else {
        $.getJSON ( '/api/v1/apple/details/' + albumID, function(appleAlbum) { 
          if (!appleAlbum.message) {
            albumResult = appleAlbum;
            populateAlbumPage(userLoggedIn);
          } else {
            // message returned here means no album in the database or apple music API
            alert(appleAlbum.message);
          }
        });
      }
    }
  });
}

function populateAlbumPage(userLoggedIn) {
  // ------ put info on page ------
  $('#album-title').text(albumResult.title);
  $('#band-name').text(albumResult.artist);
  $('#album-cover').attr('src', albumResult.cover.replace('{w}', 450).replace('{h}', 450));

  // hide cover loader when main album cover has loaded
  $('#album-cover').on('load', function(){
    $('#album-cover-loader').hide();
  });

  $('#release-date span').text(makeNiceDate(albumResult.releaseDate));
  $('#record-company span').text(albumResult.recordCompany);
  $('#track-titles').html('');
  albumResult.songNames.forEach(songName => {
    $('#track-titles').append(`<li>${songName}</li>`);
  });
  $('#apple-album-id span').text(albumResult.appleAlbumID);
  $('#more-by-this-artist').click(function(event) {
    event.preventDefault();

    // NEW SEARCH-MODAL ARTIST SEARCH
    $('#searchModal').modal('show');
    $('#search-modal-input').val(albumResult.artist);
    executeSearch(albumResult.artist);
  });
  $('#apple-music-link').click(function(event){
    event.preventDefault();
    const redirectWindow = window.open(albumResult.appleURL, '_blank');
    redirectWindow.location;
  });
  // ------ fill cards ------
  populateTags();
  populateConnections();
  getListsWithAlbum(userLoggedIn);
  getUserLists();
  checkFavorites();
  if (userLoggedIn) { 
    updateTagDisplay(userLoggedIn); 
    updateConnectionDisplay(userLoggedIn);
  } else {
    if ($('.album-tag').length === 0) { $('#current-tags').html('<div class="text-primary text-center"><small>There are currently no tags for this album. Log in to start adding your own tags!</small></div>'); }
    if ($('.connection').length === 0) { $('#connected-albums').html('<div class="text-primary text-center"><small>There are currently no connections for this album. Log in to start adding your own connections!</small><br/><br/></div>'); }
  }
}

function checkFavorites () {
  if (userID) {
    $('#favorite-title').show();
    // checks if album has a database result and if it has been favorited by this user
    if (!albumResult._id || albumResult.favoritedBy.indexOf(userID) === -1) {
      $('#favorited-icon').html(`<img src="../images/heart-unliked.png" height="30" id="add-to-favorites"><img src="../images/heart-liked.png" height="30" id="remove-from-favorites" style="display:none;">`);
    } else {
      $('#favorited-icon').html(`<img src="../images/heart-liked.png" height="30" id="remove-from-favorites"><img src="../images/heart-unliked.png" height="30" id="add-to-favorites" style="display:none;">`);
    }

    // ------ start event listeners for favorite buttons ------
    $('#remove-from-favorites').click(function(event) {
      event.preventDefault();
      removeFromFavorites();
      $('#remove-from-favorites').hide();
      $('#add-to-favorites').show();
    });
    $('#add-to-favorites').click(function(event) {
      event.preventDefault();
      addToFavorites();
      $('#add-to-favorites').hide();
      $('#remove-from-favorites').show();
    });
    // ------ end event listeners for favorite buttons ------
  } else {
    $('#favorite-title').hide();
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
      if (!album.message) {
        albumResult = album;
      } else {
        alert(album.message);
      }
    }
  });
}

function removeFromFavorites() {
  $.ajax(`/api/v1/album/favorites/${albumResult._id}`, {
    method: 'DELETE',
    contentType: 'application/json',
    data: JSON.stringify({ "user" : userID }),
    success: function(album) {
      if (!album.message) {
        albumResult = album;
      } else {
        alert(album.message);
      }
    }
  });
}

function getUserLists() {
  $.ajax({
    method: "GET",
    url: "/api/v1/list/user/" + userID,
    success: function(data) {
      // message returned here means no lists for this user
      if (data.message) { userLists = []; } 
      else { userLists = data; }
      populateUserLists();
    }
  });
}

function getListsWithAlbum(userLoggedIn) {
  $.ajax({
    method: "GET",
    url: "/api/v1/list/album/" + albumResult.appleAlbumID,
    success: function(data) {
      // message returned here means no lists with this album
      if (data.message) { listsWithAlbum = []; } 
      else { listsWithAlbum = data; }
      populateListsWithAlbum(userLoggedIn);
    }
  });
}

function populateListsWithAlbum(userLoggedIn) {
  $('#all-lists').html('');
  $('.list-message').remove();
  listsWithAlbum.forEach(list => {
    if(!list.isPrivate) {
      let listCreator = list.displayName;
      if (listCreator.trim === "") { listCreator = "Unknown"; }

      if (list.user === userID) {
        $('#all-lists').append(`<li class="list my-list" data-creator="${list.user}"><a href="/list?type=userlist&id=${list._id}">${list.title}</a><span class="text-secondary"> by: ${listCreator}</span><span class="remove-from-list-button" data-list-id="${list._id}">&#10005;</span></li>`);
      } else {
        $('#all-lists').append(`<li class="list other-list" data-creator="${list.user}"><a href="/list?type=userlist&id=${list._id}">${list.title}</a><span class="text-secondary"> by: ${listCreator}</span></li>`);
      }
    }
  });
  $('.remove-from-list-button').click(function(event) {
    event.preventDefault();
    removeFromList($(this).data('list-id'));
  });
  if (userLoggedIn) { updateListDisplay(); }
  else {
    if ($('.list').length === 0) { 
      $('.list-message').remove();
      $('#all-lists').after('<div class="text-primary text-center list-message"><small>This album is not in any public user lists yet. Log in to get started working with lists!</small><br/><br/></div>'); 
    }
  }
}

function populateUserLists() {
  $('#list-options').html('');
  $("<option selected>Add to a list...</option>").appendTo("#list-options");
  userLists.forEach(list => {
    $(`<option value="${list._id}">${list.title}</option>`).appendTo("#list-options");
  });
}

function addToList(chosenList) {
  if (chosenList) {
    let alreadyInList = listsWithAlbum.find(x => x._id === chosenList);

    if (alreadyInList) {
      $('#list-options').get(0).selectedIndex = 0;
      alert(`This album is already in your "${alreadyInList.title}" list.`);
      return;
    }

    let addAlbumToListBody = {
      method: "add album",
      appleAlbumID: albumResult.appleAlbumID,
      title: albumResult.title,
      artist: albumResult.artist,
      releaseDate: albumResult.releaseDate,
      cover: albumResult.cover,
      genres: albumResult.genres
    };
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + chosenList,
      contentType: 'application/json',
      data: JSON.stringify(addAlbumToListBody),
      success: function(data) {
        if (!data.message) {
          listsWithAlbum.push(data);
          populateListsWithAlbum();
          // alert(`Successfully added this album to your list: "${data.title}"`);
          $('#updateListModal').modal('hide');
          $('#list-options').get(0).selectedIndex = 0;
        } else {
          alert(data.message);
        }
      }
    });
  }
}

function addToNewList(listTitle, displayName) {

  // check to see if this user has a list with the same name
  let confirmed = true;
  let listExists = userLists.find(x => x.title.toUpperCase() === listTitle.toUpperCase());
  if (listExists) { confirmed = confirm(`You already have a list called "${listExists.title}". Choose "ok" to create a new list, "cancel" to go back and add this album to an existing list.`); }

  // user either said okay to create a duplicate list, or there
  // is no other list with this name by this user
  if (confirmed) {
    let privateList = false;
    if ($('#private-checkbox').is(":checked")) { privateList = true; }
    if (listTitle && displayName) {
      let newList = {
        user: userID,
        displayName: displayName,
        title: listTitle,
        isPrivate: privateList,
        albums: [albumResult]
      };
      $.ajax({
        method: "POST",
        url: "/api/v1/list/",
        contentType: 'application/json',
        data: JSON.stringify(newList),
        success: function(data) {
          // update the UI without making any additional API calls
          if(!data.message) {
            userLists.push(data);
            listsWithAlbum.push(data);
            populateUserLists();
            populateListsWithAlbum();
            // alert(`Successfully added list: "${data.title}"`);
            $('#updateListModal').modal('hide');
            $('#new-list-title').val('');
            $('#new-display-name').val('');
          } else {
            alert(data.message);
          }
        }
      });
    }
  } 
}

function removeFromList(listID) {
  let thisList = listsWithAlbum.find(x => x._id === listID);
  let confirmed = confirm(`Are you sure you want to remove this album from the "${thisList.title}" list? You cannot undo this operation.`);
  
  if (confirmed) {
    let deleteObject = {
      method: "remove album",
      appleAlbumID: albumResult.appleAlbumID,
      title: albumResult.title,
      artist: albumResult.artist,
      releaseDate: albumResult.releaseDate,
      cover: albumResult.cover
    };
    
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + thisList._id,
      contentType: 'application/json',
      data: JSON.stringify(deleteObject),
      success: function(data) {
        // `data` object returns the list that the album was 
        // removed from when successful
        if (!data.message) {
          let index = listsWithAlbum.indexOf(thisList);
          listsWithAlbum.splice(index, 1);
          populateListsWithAlbum();
        } else {
          alert(data.message);
        }
      }
    });
  }
}

function updateListDisplay() {
  const whatListsToShow = sessionStorage.getItem('lists');
  if (whatListsToShow === 'My Lists') {
    displayMyLists();
  } else {
    displayAllLists();
  }
}

function displayAllLists() {
  if ($("#lists-toggle").html().length === 0) {
    $("#lists-toggle").html('<img src="/images/toggle_on.png" id="show-all-lists" style="height:22px;margin-left:10px;"><img src="/images/toggle_off.png" id="show-my-lists" style="height:22px;margin-left:10px;display:none;">');
  } else {
    $('#show-my-lists').hide();
    $('#show-all-lists').show();
  }
  $('.my-list').show();
  $('.other-list').show();
  $('#list-title-modifier').html('All <span class="large-button-text">user </span>');

  $('.list-message').remove();
  if ($('.list').length === 0) { 
    $('#all-lists').after('<div class="text-primary text-center list-message"><small>This album is not in any public user lists. Click "Add to a list" below to get started!</small><br/><br/></div>'); 
  }

  $('#show-all-lists').click(function(event) {
    event.preventDefault();
    sessionStorage.setItem('lists', 'My Lists');
    updateListDisplay();
  });
}

function displayMyLists() {
  if ($("#lists-toggle").html().length === 0) {
    $("#lists-toggle").html('<img src="/images/toggle_off.png" id="show-my-lists" style="height:22px;margin-left:10px;"><img src="/images/toggle_on.png" id="show-all-lists" style="height:22px;margin-left:10px;display:none;">');
  } else {
    $('#show-all-lists').hide();
    $('#show-my-lists').show();
  }
  $('.my-list').show();
  $('.other-list').hide();
  $('#list-title-modifier').text('Your ');

  $('.list-message').remove();
  if ($('.my-list').length === 0) { 
    $('#all-lists').after('<div class="text-primary text-center list-message"><small>You have added this album to any lists. Click "Add to a list" below to get started!</small><br/><br/></div>'); 
  }

  $('#show-my-lists').click(function(event) {
    event.preventDefault();
    sessionStorage.setItem('lists', 'All Lists');
    updateListDisplay();
  });
}

function populateConnections() {
  if (albumResult.connectionObjects) {
    $('#connected-albums').html('');

    for (let index = 0; index < albumResult.connectionObjects.length; index++) {
      let connectedAlbum = albumResult.connectionObjects[index];

      if (connectedAlbum.appleAlbumID != albumResult.appleAlbumID) {
        const cover = connectedAlbum.cover.replace('{w}', 105).replace('{h}', 105);
        let smallTitle;
        if (connectedAlbum.title.length > 20) { 
          smallTitle = truncate(connectedAlbum.title, 20);
        } else {
          smallTitle = connectedAlbum.title;
        }

        if (connectedAlbum.creator === userID) {
          $('#connected-albums').append(`<a href="/album/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection my-connection" data-creator="${connectedAlbum.creator}"><img class="connection-cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="${smallTitle}" data-trigger="hover"><span class="delete-connection-button" data-connected-album-id="${connectedAlbum.databaseID}">&#10005;</span></a>`);
        } else {
          $('#connected-albums').append(`<a href="/album/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection other-connection" data-creator="${connectedAlbum.creator}"><img class="connection-cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="${smallTitle}" data-trigger="hover"></a>`);
        }
      }
    }
    $('.delete-connection-button').click(function(event) {
      event.preventDefault();
      deleteConnection($(this).data("connected-album-id"));
    }); 

    // ------ enable tooltips ------
    var isTouchDevice = false;
    if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
    if (!isTouchDevice) { $('[data-toggle="tooltip"]').tooltip(); }
  } else {
    //there are no connected albums
  }
}

function addConnection(selectedAlbum) {
  // make sure object passed in looks like an album object
  if (selectedAlbum && selectedAlbum.title) {
    $.ajax(`/api/v1/album/connections/${albumResult._id || "new"}`, {
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ 
        "albumOne": albumResult,
        "albumTwo": selectedAlbum,
        "creator": userID
      }),
      success: function(album) {
        if (!album.message) {
          // returns just this album with updates
          albumResult = album;
          populateConnections();
          $('#updateConnectionModal').modal('hide');
        } else {
          alert(album.message);
        }
      }
    });
    $('#add-connection-input').val('');
  }
} 
    



let connectionSearchResults = [];
function populateConnectionModalResults(data) {
  $('#connection-search-results').html('');
  $('#connection-loader').hide();
  if (data.albums && data.albums.length > 0) {
    for (let index = 0; index < data.albums.length; index++) {
      const album = data.albums[index];
      const cardNumber = index + 1;

      connectionSearchResults.push(album);

      createConnectionModalCard(album, cardNumber);
      populateConnectionModalCard(album, cardNumber);
    }
    // this adds an empty space at the end so the user can scroll 
    // all the way to the right to see the last album
    $('#connection-search-results').append('<div id="connection-search-modal-placeholder">&nbsp;</div>');
  } else {
    $('#connection-search-results').after('<div id="no-results-message" class="text-primary mb-3" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>');
  }
}



function createConnectionModalCard(album, cardNumber) {
  $('#connection-search-results').append(`<div id="connectionModalCard${cardNumber}" class="search-modal-card" data-apple-album-id="${album.appleAlbumID}"><a class="search-modal-card-album-link" href=""><img class="search-modal-card-image" src="" alt=""><a/><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`)
}

function populateConnectionModalCard(album, cardNumber) {
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
  $(`#connectionModalCard${cardNumber} .search-modal-card-title`).html(`<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`);
  // album name
  $(`#connectionModalCard${cardNumber} .search-modal-card-album`).html(`<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`);
  // album cover
  $(`#connectionModalCard${cardNumber} .search-modal-card-image`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260));

  $(`#connectionModalCard${cardNumber}`).click(function(event) {
    event.preventDefault();
    // connect to this album
    const selectedAlbumID = $(this).data("apple-album-id");
    const selectedAlbum = connectionSearchResults.find(x => x.appleAlbumID === selectedAlbumID.toString());
    addConnection(selectedAlbum);
  })
}

function deleteConnection(connectedAlbum) {
  const confirmation = confirm('Are you sure you want to delete a connection? You cannot undo this operation.');
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
        if (!album.message) {
          albumResult = album;
          populateConnections();
          updateConnectionDisplay();
        } else {
          alert(album.message);
        }
      }
    });
  }
}

function updateConnectionDisplay() {
  const whatConnectionsToShow = sessionStorage.getItem('connections');
  if (whatConnectionsToShow === 'My Connections') {
    displayMyConnections();
  } else {
    displayAllConnections();
  }
}

function displayAllConnections() {
  if ($("#connections-toggle").html().length === 0) {
    $("#connections-toggle").html('<img src="/images/toggle_on.png" id="show-all-connections" style="height:22px;margin-left:10px;"><img src="/images/toggle_off.png" id="show-my-connections" style="height:22px;margin-left:10px;display:none;">');
  } else {
    $('#show-my-connections').hide();
    $('#show-all-connections').show();
  }
  $('.my-connection').show();
  $('.other-connection').show();
  $('#connection-title-modifier').text('all users');

  $('#no-my-connections').remove();
  $('#no-other-connections').remove();
  if ($('.connection').length === 0) { $('#connected-albums').html('<div id="no-other-connections" class="text-primary text-center"><small>There are currently no connections for this album. Click "Add connections" below to get started!</small><br/><br/></div>'); }

  $('#show-all-connections').click(function(event) {
    event.preventDefault();
    sessionStorage.setItem('connections', 'My Connections');
    updateConnectionDisplay();
  });
}

function displayMyConnections() {
  if ($("#connections-toggle").html().length === 0) {
    $("#connections-toggle").html('<img src="/images/toggle_off.png" id="show-my-connections" style="height:22px;margin-left:10px;"><img src="/images/toggle_on.png" id="show-all-connections" style="height:22px;margin-left:10px;display:none;">');
  } else {
    $('#show-all-connections').hide();
    $('#show-my-connections').show();
  }
  $('.my-connection').show();
  $('.other-connection').hide();
  $('#connection-title-modifier').text('you');

  $('#no-my-connections').remove();
  $('#no-other-connections').remove();
  if ($('.my-connection').length === 0) { $('#connected-albums').append('<div id="no-my-connections" class="text-primary text-center"><small>You have not created any connections for this album. Click "Add connections" below to get started!</small><br/><br/></div>'); }

  $('#show-my-connections').click(function(event) {
    event.preventDefault();
    sessionStorage.setItem('connections', 'All Connections');
    updateConnectionDisplay();
  });
}

function populateTags() {
  clearTagArray();
  if (albumResult.tagObjects) {
    $('#current-tags').html('');
    for (let index = 0; index < albumResult.tagObjects.length; index++) {
      let tag = albumResult.tagObjects[index].tag;
      const creator = albumResult.tagObjects[index].creator;
      
      // add tags
      let tagName;
      if (parseInt(tag)) {
        const addLetters = "tag_";
        tagName = addLetters.concat(tag).replace(/[^A-Z0-9]+/ig,'');
      } else {                  
        tagName = tag.replace(/[^A-Z0-9]+/ig,'');
      }
    
      if (creator === userID) {
        // tags are stored escaped and displayed raw
        $('#current-tags').append(`<a href="" id="${tagName}-${creator}" class="badge badge-light album-tag my-tag" data-creator="${creator}" data-rawtag="${escapeHtml(albumResult.tagObjects[index].tag)}" data-custom-genre="${albumResult.tagObjects[index].customGenre || false}"><span>${tag}</span><span class="delete-tag-button ml-1" data-tag-id="${tagName}-${creator}">&#10005;</span></a>`);
      } else {
        // tags are stored escaped and displayed raw
        $('#current-tags').append(`<a href="" id="${tagName}-${creator}" class="badge badge-light album-tag other-tag" data-creator="${creator}" data-rawtag="${escapeHtml(albumResult.tagObjects[index].tag)}" data-custom-genre="${albumResult.tagObjects[index].customGenre || false}"><span>${tag}</span></a>`);
      }
    }
    // ------ tag delete button event listener -----
    $('.delete-tag-button').click(function(event) {
      event.preventDefault();
      deleteTag($(this).data('tag-id'));
    });

    // in case the user misses the delete button on the right edge
    $('.album-tag').click(function(event) {
      event.preventDefault();
      selectTag(document.getElementById($(this).attr('id')), event);
    });
  }
}

function selectTag(tagName, event) {
  if (event) { event.preventDefault(); }

  var thisTag = document.getElementById(tagName.id);
  thisTag.classList.toggle("badge-primary");
  thisTag.classList.toggle("selected-tag");
  thisTag.classList.toggle("badge-light");

  // tags are stored escaped and displayed raw
  modifySelectedTags(escapeHtml(thisTag.dataset.rawtag));
}

function modifySelectedTags(tag) {
  // this conditional returns -1 value if tag is not in array
  if ($.inArray(tag, selectedTags) === -1) {
    selectedTags.push(tag);
  } else {
    // cant use pop because it removes last item only
    // this finds the item being clicked and uses that
    // index with splice() to remove 1 item only
    let index = selectedTags.indexOf(tag);
    selectedTags.splice(index, 1);
  }
}

function fixShortTagsArray() {
  let newTags = []
  albumResult.tagObjects.forEach(tagObject => {
    newTags.push(tagObject.tag)
  })
  newTags.forEach(tag => {
    let updateObject = 
    {
      "tag": tag,
      "method": "fix short tags array"
    }
    $.ajax({
      method: "POST",
      url: '/api/v1/album/tags/' + albumResult._id,
      data: JSON.stringify(updateObject),
      contentType: "application/json",
      success: function(album) {
        if (!album.message) {
          albumResult = album;
          populateTags();
          updateTagDisplay(); 
        } else {
          alert(album.message);
        }
      }
    })
  })
}

function deleteTag(tagID) {
  const creator = $(`#${tagID}`).data('creator');
  const tag = $(`#${tagID}`).data('rawtag');
  const customGenre = $(`#${tagID}`).data('custom-genre');

  let confirmation = confirm(`Are you sure you want to delete the "${tag}" tag? You cannot undo this operation.`);

  if (confirmation) {
    $.ajax(`/api/v1/album/tags/${albumResult._id}`, {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ 
        // tags are stored escaped and displayed raw, converting to string
        // in case the raw tag is just a number (like a year)
        "tag": escapeHtml(tag.toString()),
        "creator": creator,
        "customGenre": customGenre
      }),
      success: function(album) {
        if (!album.message) {
          albumResult = album;
          populateTags();
          updateTagDisplay(); 
          if (albumResult.tagObjects.length > albumResult.tags.length) { fixShortTagsArray(); }
        } else {
          alert(album.message);
        }
      }
    });
  }
}

function addTag() {
  let newTag = $('#add-tag-input').val().trim();

  if (newTag) {
    if ((newTag.includes("<") && newTag.includes(">")) || newTag.includes(".") || newTag.includes("{") || newTag.includes("}")) {
      alert("Some characters are not allowed in tags, sorry!");
      $('#add-tag-input').val("");
      $("#custom-genre-checkbox").prop("checked", false);
      return;
    }

    if (newTag.length > 30) {
      alert("Tags cannot be longer than 30 characters. Check out the \"All tags\" page for some examples!");
      $('#add-tag-input').val("");
      $("#custom-genre-checkbox").prop("checked", false);
      return;
    }
    // tags are stored escaped and displayed raw
    newTag = removeExtraSpace(toTitleCase(newTag)).trim();
    newTag = escapeHtml(newTag);

    // only run these two checks if there are other tags
    if (albumResult.tagObjects) {

      // check for duplicates by this user, hard fail
      let duplicates = 0;
      albumResult.tagObjects.forEach(tagObject => {
        if (isEqual(tagObject, { "tag": newTag, "creator": userID })) { duplicates++; }
      });
      if (duplicates > 0) {
        alert(`You already added the "${newTag}" tag to this album!`);
        $('#add-tag-input').val("");
        $("#custom-genre-checkbox").prop("checked", false);
        return;
      }   

      // check for duplicates overall, option to proceed
      if (albumResult.tags.indexOf(newTag) != -1) { 
        let confirmed = confirm(`Someone else already added the "${newTag}" tag to this album. Choose "ok" to add your tag, or "cancel" to avoid duplicates.`); 
        $('#add-tag-input').val("");
        $("#custom-genre-checkbox").prop("checked", false);
        if (!confirmed) { return; }
      }
    }  

    let customGenre = false;
    if ($('#custom-genre-checkbox').is(":checked")) { customGenre = true; }

    // ADD NEW TAG OR NEW ALBUM TO THE DATABASE
    $.ajax(`/api/v1/album/tags/${albumResult._id || "new"}`, {
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        "album": albumResult,
        "creator": userID,
        "tag": newTag,
        "customGenre": customGenre
      }),
      success: function (album) {
        if (!album.message) {
          albumResult = album;
          populateTags();
          $('#tag-success').html("Added! &#10003;");
          setTimeout(function(){ $('#tag-success').html('&nbsp;'); }, 3000);
        } else {
          alert(album.message);
          return;
        }
      }
    });
  } else {
    alert("Please enter a non-empty tag.");
  } 

  $('#add-tag-input').val("");
  $("#custom-genre-checkbox").prop("checked", false);
}

function toggleActiveInfoTab(element) {
  $('#info-card .active').removeClass("active").addClass("inactive-info-tab");
  $(element).removeClass("inactive-info-tab").addClass("active");
  $('.info-card-body').hide();
  const selectedCard = element.data('card');
  $(`#${selectedCard}-info-card-body`).show();
}

function clearTagArray(event) {
  if (event) { event.preventDefault(); }
  
  if ($(".selected-tag").length > 0) {
    $(".selected-tag").toggleClass( "badge-primary" );
    $(".selected-tag").toggleClass( "badge-light" );
    $(".selected-tag").toggleClass( "selected-tag" );

    selectedTags = [];
  }
}

function updateTagDisplay(data) {
  let userIsLoggedIn = false;
  if (data || userID) { userIsLoggedIn = true; }

  const whatTagsToShow = sessionStorage.getItem('tags');
  if (whatTagsToShow === 'My Tags' && userIsLoggedIn) {
    displayMyTags(userIsLoggedIn);
  } else {
    displayAllTags(userIsLoggedIn);
  }
}

function displayAllTags(userIsLoggedIn) {
  if (userIsLoggedIn) { 
    if ($("#tags-toggle").html().length === 0) {
      $("#tags-toggle").html('<img src="/images/toggle_on.png" id="show-all-tags" style="height:22px;margin-left:10px;"><img src="/images/toggle_off.png" id="show-my-tags" style="height:22px;margin-left:10px;display:none;">'); 
    } else {
      $('#show-my-tags').hide();
      $('#show-all-tags').show();
    }
  }
  $('.my-tag').show();
  $('.other-tag').show();
  $('#tag-title-modifier').text('all users');

  $('#no-all-tags').remove();
  $('#no-my-tags').remove();
  if ($('.album-tag').length === 0) { $('#current-tags').html('<div id="no-all-tags" class="text-primary text-center"><small>There are currently no tags for this album. Click "Add tags" below to get started!</small></div>'); }

  if (userIsLoggedIn) {
    $('#show-all-tags').click(function(event) {
      event.preventDefault();
      sessionStorage.setItem('tags', 'My Tags');
      updateTagDisplay(userIsLoggedIn);
    });
  }
}

function displayMyTags(userIsLoggedIn) {
  if ($("#tags-toggle").html().length === 0) {
    $("#tags-toggle").html('<img src="/images/toggle_off.png" id="show-my-tags" style="height:22px;margin-left:10px;"><img src="/images/toggle_on.png" id="show-all-tags" style="height:22px;margin-left:10px;display:none;">');
  } else {
    $('#show-all-tags').hide();
    $('#show-my-tags').show();
  }
  $('.my-tag').show();
  $('.other-tag').hide();
  $('#tag-title-modifier').text('you');

  $('#no-all-tags').remove();
  $('#no-my-tags').remove();
  if ($('.my-tag').length === 0) { $('#current-tags').append('<div id="no-my-tags" class="text-primary text-center"><small>You have not created any tags for this album. Click "Add tags" below to get started!</small></div>'); }

  $('#show-my-tags').click(function(event) {
    event.preventDefault();
    sessionStorage.setItem('tags', 'All Tags');
    updateTagDisplay(userIsLoggedIn);
  });
}

// ------ START GENERAL EVENT LISTENERS ------
$('#favorites-link').click(function(event) {
  event.preventDefault();
  const favoritesURL = window.location.protocol + "//" + window.location.host + "/myfavorites";
  const redirectWindow = window.open(favoritesURL, '_blank');
  redirectWindow.location;
});
$("#new-list-title").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-to-new-list-button").click();
  }
});
$("#new-display-name").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-to-new-list-button").click();
  }
});
$("#list-options").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-to-list-button").click();
  }
});
$('#search-for-second-album').click(function () {
  const searchURL = window.location.protocol + "//" + window.location.host + "/search";
  const redirectWindow = window.open(searchURL, '_blank');
  redirectWindow.location;
});
$('#info-card .nav-link').click(function(event) {
  event.preventDefault();
  toggleActiveInfoTab($(this));
});
$('#tag-search-button').click(function(event) {
  event.preventDefault();
  if (selectedTags.length > 0) {
    // var win = window.location = (`/search/tags/${selectedTags}`);
    let listURL = new URL(document.location);
    listURL.pathname = "/list";
    listURL.searchParams.set("type", "tagsearch");
    listURL.searchParams.set("search", selectedTags);
    window.location = (listURL.href);
  } else {
    alert("Select one or more tags to preform a tag search");
  }
});
$('#clear-tag-button').click(function(event) {
  event.preventDefault();
  clearTagArray(event);
});
$('#add-tag-button').click(function(event) {
  event.preventDefault();
  addTag();
});
$("#add-tag-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-tag-button").click();
  }
});
$("#add-connection-button").click(function(event) {
  event.preventDefault();
  const search = $('#add-connection-input').val().trim();
  $('#no-results-message').remove();
  $('#connection-search-results').html('');
  $('#connection-loader').show();
  executeSearch(search, "connection")
});
$("#add-connection-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-connection-button").click();
  }
});
$('#add-to-list-button').click(function(event) {
  event.preventDefault();
  let listOptions = document.getElementById("list-options");
  let chosenList = listOptions[listOptions.selectedIndex].value;
  if (chosenList === "Add to a list...") {
    // nothing should happen in this case
  } else {
    addToList(chosenList);
  }
});
$('#add-to-new-list-button').click(function(event) {
  event.preventDefault();
  let listTitle = document.getElementById("new-list-title").value.trim();
  let displayName = document.getElementById("new-display-name").value.trim() || "Unknown";
  
  // at least a list title should be present
  if (!listTitle) {
    alert("All lists require a title!");
    return;
  }

  // check for characters that will cause trouble but aren't that useful
  if ((listTitle.includes("<") && listTitle.includes(">")) || listTitle.includes(".") || listTitle.includes("{") || listTitle.includes("}")) {
    alert("Some characters are not allowed in tags, sorry!");
    $('#new-list-title').val("");
    return;
  } else if ((displayName.includes("<") && displayName.includes(">")) || displayName.includes(".") || displayName.includes("{") || displayName.includes("}")) {
    alert("Some characters are not allowed in tags, sorry!");
    $('#new-display-name').val("");
    return;
  }

  // enforce reserved list name 
  if (listTitle.toUpperCase() === "MY FAVORITES") {
    alert("'My Favorites' is a reserved list name. Give the existing 'My Favorites' functionality a shot or choose a different title.");
    $('#new-list-title').val("");
    return;
  }

  // enforce character length limits
  if (listTitle.length > 60) {
    alert("List titles must be shorter than 60 characters in length.");
    return;
  } else if (displayName.length > 30) {
    alert("Display names must be shorter than 30 characters in length.");
    return;
  } else {
    // storing title and display name as escaped html, displaying raw
    addToNewList(escapeHtml(listTitle), escapeHtml(displayName));
    document.getElementById("new-display-name").value = "";
    document.getElementById("new-list-title").value = "";
  }
});
$('#custom-genre-checkbox-text').click(function(event) {
  event.preventDefault();
  $('#custom-genre-checkbox').click()
})

// make hover scrollbar always visible on touchscreens
$(document).ready(function() {
  let isTouchDevice = false;
  if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
  if (isTouchDevice) {
    const searchResultsBox = document.getElementById("connection-search-results");
    searchResultsBox.style.paddingBottom="0px";
    searchResultsBox.style.overflowX="scroll";
  }
});

// ----- START FIREBASE AUTH SECTION ------
function userIsLoggedIn() {
  $('.hide_when_logged_in').addClass('hide_me');
  $('.hide_when_logged_out').removeClass('hide_me');
  $('#full_menu_login_logout_container').show();
  $('#login_button').hide();
  $('#full_menu_login_button').hide();
  $('#logout_button').show();
  $('#full_menu_logout_button').show();

  $('.info-card-login-button').hide();
  $('#tag-update-button').show();
  $('#connection-update-button').show();
  $('#list-update-button').show();
  $('#favorite-title').show();

  getAlbumDetails(true);
}

function userIsLoggedOut() {
  $('.hide_when_logged_out').addClass('hide_me');
  $('.hide_when_logged_in').removeClass('hide_me');
  $('#full_menu_login_logout_container').show();
  $('#login_button').show();
  $('#full_menu_login_button').show();
  $('#logout_button').hide();
  $('#full_menu_logout_button').hide();

  $('.info-card-login-button').show();
  $('#tag-update-button').hide();
  $('#connection-update-button').hide();
  $('#list-update-button').hide();
  $('#favorite-title').hide();

  getAlbumDetails(false);
}

// == New Config, November 2018 == 
const config = {
  apiKey: "AIzaSyAoadL6l7wVMmMcjqqa09_ayEC8zwnTyrc",
  authDomain: "album-tags-v1d1.firebaseapp.com",
  projectId: "album-tags-v1d1",
};
const defaultApp = firebase.initializeApp(config);

// checking if user is logged in or logs in during session
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    userID = firebase.auth().currentUser.uid;
    userIsLoggedIn();
  } 
  if (!user) {   
    // no user logged in 
    userID = false;
    userIsLoggedOut();
  }
});

let userID;
function logIn() {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  // local persistance remains if browser is closed
  .then(function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider);
  })
  .then(function(result) {
    userID = user.uid;
    userIsLoggedIn();

  }).catch(function(error) {
    // Handle Errors here.
  });
}

function logOut() {
  firebase.auth().signOut().then(function() {
    // log out functionality
    // userID = false;
    // userIsLoggedOut();
    location.reload();

  }).catch(function(error) {
  // An error happened.
  });
}

// add event listener to log in and out buttons
document.getElementById("login_button").addEventListener("click", logIn);
document.getElementById("full_menu_login_button").addEventListener("click", logIn);
document.getElementById("logout_button").addEventListener("click", logOut);
document.getElementById("full_menu_logout_button").addEventListener("click", logOut);
$(".info-card-login-button").on("click", logIn); 
// ----- END FIREBASE AUTH SECTION ------