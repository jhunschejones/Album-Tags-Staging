// ====== START UTILITY SECTION ======
function makeNiceDate(uglyDate) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let year = uglyDate.slice(0, 4);
  let day = uglyDate.slice(8, 10);
  let uglyMonth = uglyDate.slice(5, 7);
  let niceMonth = months[uglyMonth-1];
  return(`${niceMonth} ${day}, ${year}`);
}

// function safeParse(content) {
//   // replace characters with html equivalents
//   //prevents some basic cross site scripting attacks
//   content = content.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\//g, "&#47;").replace(/\\/g, "&#92;").replace(/\(/g, "&#40;").replace(/\)/, "&#41;").replace(/\./g, "&#46;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/\=/g, "&#61;");
//   return content;
// }

function escapeHtml(text) {
  var map = {
    // '&': '&amp;',
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

function replaceBackSlashWithHtml(str) {
  return str.replace(/\//g, '&sol;');
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

function getAlbumDetails() {
  $.ajax('/api/v1/album/albumid/' + albumID, {
    method: 'GET',
    success: function(album) {
      if (!album.message) {
        albumResult = album;
        populateAlbumPage();
      } else {
        $.getJSON ( '/api/v1/apple/details/' + albumID, function(album) { 
          albumResult = album;
          populateAlbumPage();
        });
      }
    }
  });
}

function populateAlbumPage() {
  // ------ put info on page ------
  $('#album-title').text(albumResult.title);
  $('#band-name').text(albumResult.artist);
  $('#album-cover').attr('src', albumResult.cover.replace('{w}', 450).replace('{h}', 450));
  $('#release-date span').text(makeNiceDate(albumResult.releaseDate));
  $('#record-company span').text(albumResult.recordCompany);
  $('#track-titles').html('');
  albumResult.songNames.forEach(songName => {
    $('#track-titles').append(`<li><span>${songName}</span></li>`);
  });
  $('#apple-album-id span').text(albumResult.appleAlbumID);
  $('#more-by-this-artist').click(function(event) {
    event.preventDefault();
    sessionStorage.setItem('artist', albumResult.artist);
    window.location.href = '/search';
  });
  // ------ fill cards ------
  populateTags();
  populateConnections();
  getListsWithAlbum();
  getUserLists();
}

function getUserLists() {
  $.ajax({
    method: "GET",
    url: "/api/v1/list/user/" + userID,
    // url: "/api/v1/list/user/Ol5d5mjWi9eQ7HoANLhM4OFBnso2",
    success: function(data) {
      if (data.message) { userLists = []; } 
      else { userLists = data; }
      populateUserLists();
    }
  });
}

function getListsWithAlbum() {
  $.ajax({
    method: "GET",
    url: "/api/v1/list/album/" + albumResult.appleAlbumID,
    success: function(data) {
      if (data.message) { listsWithAlbum = []; } 
      else { listsWithAlbum = data; }
      populateListsWithAlbum();
    }
  });
}

function populateListsWithAlbum() {
  $('#list-options2').html('');
  $("<option selected>Remove from a list...</option>").appendTo("#list-options2");
  $('#all-lists').html('');
  listsWithAlbum.forEach(list => {
    if(!list.isPrivate) {
      let listCreator = list.displayName;
      if (listCreator.trim === "") { listCreator = "Unknown"; }

      if (list.user == userID) {
        $(`<option value="${list._id}">${list.title}</option>`).appendTo("#list-options2");
        $('#all-lists').append(`<li class="list" data-creator="${list.user}"><a href="/list/${list._id}">${list.title}</a><span class="text-secondary"> by: ${listCreator}</span><span class="remove-from-list-button" data-list-id="${list._id}">&#10005;</span></li>`);
      } else {
        $(`<option value="${list._id}">${list.title}</option>`).appendTo("#list-options2");
        $('#all-lists').append(`<li class="list" data-creator="${list.user}"><a href="/list/${list._id}">${list.title}</a><span class="text-secondary"> by: ${listCreator}</span></li>`);
      }
    }
  });
  $('.remove-from-list-button').click(function(event) {
    event.preventDefault();
    removeFromList($(this).data('list-id'))
  })
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
    let addAlbumToListBody = {
      method: "add album",
      appleAlbumID: albumResult.appleAlbumID,
      title: albumResult.title,
      artist: albumResult.artist,
      releaseDate: albumResult.releaseDate,
      cover: albumResult.cover
    };
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + chosenList,
      contentType: 'application/json',
      data: JSON.stringify(addAlbumToListBody),
      success: function(data) {
        listsWithAlbum.push(data);
        populateListsWithAlbum();
        alert(`Successfully added this album to your list: "${data.title}"`);
      }
    });
  }
}

function addToNewList(listTitle, displayName) {
  if (listTitle && displayName) {
    let newList = {
      user: userID,
      displayName: displayName,
      title: listTitle,
      albums: [albumResult]
    };
    $.ajax({
      method: "POST",
      url: "/api/v1/list/",
      contentType: 'application/json',
      data: JSON.stringify(newList),
      success: function(data) {
        // update the UI without making any additional API calls
        userLists.push(data);
        listsWithAlbum.push(data);
        populateUserLists();
        populateListsWithAlbum();
        alert(`Successfully added list: "${data.title}"`);
      }
    });
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
        let index = listsWithAlbum.indexOf(thisList);
        listsWithAlbum.splice(index, 1);
        populateListsWithAlbum();
      }
    });
  }
}

function isFavorite() {
  // checks if the album was favorited by this user
  // updates the UI accordingly
}

function addToFavorites() {
  // add an album to this users favorites
}

function removeFromFavorites() {
  // remove an album from this users favorites
}

function populateConnections() {
  if (albumResult.connectionObjects && albumResult.connectionObjects.length > 0) {
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

        if (connectedAlbum.creator == userID) {
          $('#connected-albums').append(`<a href="/album/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection" data-creator="${connectedAlbum.creator}"><img class="connection-cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="${smallTitle}" data-trigger="hover"><span class="delete-connection-button" data-connected-album-id="${connectedAlbum.databaseID}">&#10005;</span></a>`);
        } else {
          $('#connected-albums').append(`<a href="/album/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection" data-creator="${connectedAlbum.creator}"><img class="connection-cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="${smallTitle}" data-trigger="hover"></a>`);
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
              albumResult = album;
              populateConnections();
            }
          });
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
              albumResult = album;
              populateConnections();
            }
          });
        }
      });
    } else {
      alert("Sorry, Apple says that's not an album ID.");
    }
    $('#add-connection-input').val('');
  });
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
        albumResult = album;
        populateConnections();
      }
    });
  }
}

function populateTags() {
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
    
      if (creator == userID) {
        // tags are stored escaped and displayed raw
        $('#current-tags').append(`<a href="" id="${tagName}" class="badge badge-light album-tag" data-creator="${creator}" data-rawtag="${escapeHtml(albumResult.tagObjects[index].tag)}"><span>${tag}</span><span class="delete-tag-button ml-1" data-tag-id="${tagName}">&#10005;</span></a>`);
      } else {
        // tags are stored escaped and displayed raw
        $('#current-tags').append(`<a href="" id="${tagName}" class="badge badge-light album-tag" data-creator="${creator}" data-rawtag="${escapeHtml(albumResult.tagObjects[index].tag)}"><span>${tag}</span></a>`);
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

function deleteTag(tagID) {
  const creator = $(`#${tagID}`).data('creator');
  const tag = $(`#${tagID}`).data('rawtag');

  let confirmation = confirm(`Are you sure you want to delete the "${tag}" tag? You cannot undo this operation.`);

  if (confirmation) {
    $.ajax(`/api/v1/album/tags/${albumResult._id}`, {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ 
        // tags are stored escaped and displayed raw
        "tag": escapeHtml(tag),
        "creator": creator
      }),
      success: function(album) {
        albumResult = album;
        populateTags();
      }
    });
  }
}

function addTag() {
  let newTag = $('#add-tag-input').val().trim();

  if (newTag) {
    if (newTag.includes("<") && newTag.includes(">") || newTag.includes(".") || newTag.includes("{") || newTag.includes("}")) {
      alert("Some characters are not allowed in tags, sorry!");
      $('#add-tag-input').val("");
      return;
    }
    // tags are stored escaped and displayed raw
    newTag = removeExtraSpace(toTitleCase(newTag)).trim();
    newTag = escapeHtml(newTag);

    let duplicates = 0;
    albumResult.tagObjects.forEach(tagObject => {
      if (isEqual(tagObject, { "tag": newTag, "creator": userID })) { duplicates++; }
    });

    if (duplicates > 0) {
      alert(`You already added the "${newTag}" tag to this album!`);
      $('#add-tag-input').val("");
      return;
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
        albumResult = album;
        populateTags();
      }
    });
  } else {
    alert("Please enter a non-empty tag.");
  } 

  $('#add-tag-input').val("");
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

// ------ START GENERAL EVENT LISTENERS ------
$('#info-card .nav-link').click(function(event) {
  event.preventDefault();
  toggleActiveInfoTab($(this));
});
$('#tag-search-button').click(function(event) {
  event.preventDefault();
  if (selectedTags.length > 0) {
    var win = window.location = (`/search/tags/${selectedTags}`);
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
  const newAlbum = $('#add-connection-input').val().trim();
  if (newAlbum.length > 0) {
    addConnection(newAlbum);
  } else {
    alert("Add an apple album ID to connect two albums.");
  }
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
  
  if (listTitle) {
    addToNewList(listTitle, displayName);
    document.getElementById("new-display-name").value = "";
    document.getElementById("new-list-title").value = "";
  } else {
    alert("All lists require a title!");
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

  getAlbumDetails();
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

  getAlbumDetails();
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
    userIsLoggedOut();

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