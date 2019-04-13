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

function removeExtraSpaces(str) { return str.replace(/\s\s+/g, ' ').trim(); }

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
// ====== END UTILITY SECTION ======

// ====== START VUE.JS SECTION ======
var app = new Vue({
  el: '#app',
  data: {
    userID: false,
    album: {},
    userLists: [],
    selectedTags: [],
    connectionSearchResults: [],
    coverLoaded: false
  },
  computed: {
    unescapedRecordCompany: function() {
      return this.album.recordCompany.replace("&amp;","&");
    },
    niceReleaseDate: function() {
      return makeNiceDate(this.album.releaseDate);
    },
    coverImage: function() {
      return this.album.cover.replace('{w}', 450).replace('{h}', 450);
    }
  },
  methods: {
    moreByThisArtist: function(event) {
      event.preventDefault();
      $('#searchModal').modal('show'); // NOTE: there is no easy way to do this witout jQuery
      document.getElementById("search-modal-input").value = app.album.artist;
      executeSearch(app.album.artist);
    },
    viewInAppleMusic: function(event) {
      event.preventDefault();
      const redirectWindow = window.open(app.album.appleURL, '_blank');
      return redirectWindow.location;
    }
  }
});
// ====== END VUE.JS SECTION ======

const albumID = window.location.pathname.replace('/album/', '');

async function getAlbumDetails(userLoggedIn) {
  let databaseResponse = await fetch('/api/v1/album/' + albumID);
  if (!databaseResponse.ok) throw Error(databaseResponse.statusText);
  let databaseData = await databaseResponse.json();

  if (databaseData.message && databaseData.message.slice(0,14) === "No album found") {
    let appleResponse = await fetch('/api/v1/apple/details/' + albumID);
    if (!appleResponse.ok) throw Error(appleResponse.statusText);
    let appleData = await appleResponse.json();
    // message returned here means no album in the database or apple music API
    if (appleData.message) return alert(appleData.message);

    app.album = appleData;
    populateAlbumPage(userLoggedIn);
  } else {
    app.album = databaseData;
    populateAlbumPage(userLoggedIn);
  }
}

function populateAlbumPage(userLoggedIn) {
  populateTags();
  populateConnections();
  getUserLists();
  if (userLoggedIn) { 
    updateTagDisplay(userLoggedIn); 
    updateConnectionDisplay(userLoggedIn);
    populateListsWithAlbum(userLoggedIn);
  } else {
    if ($('.album-tag').length === 0) { $('#current-tags').html('<div class="text-primary text-center"><small>There are currently no tags for this album. Log in to start adding your own tags!</small></div>'); }
    if ($('.connection').length === 0) { $('#connected-albums').html('<div class="text-primary text-center"><small>There are currently no connections for this album. Log in to start adding your own connections!</small><br/><br/></div>'); }
  }
}

function addToFavorites() {
  if (app.album.favorites && !!app.album.favorites.find(x => x.userID === app.userID)) {
    populateUserLists();
    return alert("This album is already in your \"My Favorites\" list.");
  }
  $.ajax('/api/v1/favorite', {
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ 
      "user" : app.userID,
      "album" : app.album
    }),
    success: function(response) {
      $('#updateListModal').modal('hide');
      if (!app.album.favorites) { app.album.favorites = []; }
      app.album.favorites.push({"userID": app.userID});
      populateListsWithAlbum();
      updateListDisplay();
      $('#list-options').get(0).selectedIndex = 0;
    }
  });
}

function removeFromFavorites() {
  let confirmed = confirm(`Are you sure you want to remove this album from the 'My Favorites' list? You cannot undo this operation.`);
  if (confirmed) {
    $.ajax('/api/v1/favorite', {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ 
        "user" : app.userID,
        "appleAlbumID" : app.album.appleAlbumID,
        "returnData": "album"
      }),
      success: function(response) {
        app.album = response;
        populateListsWithAlbum();
        updateListDisplay();
      }
    });
  }
}

function getUserLists() {
  $.ajax({
    method: "GET",
    url: "/api/v1/list/user/" + app.userID,
    success: function(data) {
      // message returned here means no lists for this user
      if (data.message) { app.userLists = []; } 
      else { app.userLists = data; }
      populateUserLists();
    }
  });
}

function populateListsWithAlbum(userLoggedIn) {
  $('#all-lists').html('');
  $('.list-message').remove();
  // check if album is favorited
  if (app.userID && app.album.favorites && !!app.album.favorites.find(x => x.userID === app.userID)) { 
    $('#all-lists').append(`<li class="list my-list" data-creator="${app.userID}"><a href="/list?type=myfavorites">&#9825; My Favorites</a><span class="text-secondary"> by: You!</span><span class="remove-from-list-button" data-list-type="myfavorites">&#10005;</span></li>`);
  }
  if (app.album.lists) {
    app.album.lists = app.album.lists.sort((a, b) => (a.title > b.title) ? 1 : -1);
    app.album.lists.forEach(list => {
      if(!list.isPrivate) {
        let listCreator = list.displayName;
        if (!listCreator || listCreator.trim === "") { listCreator = "Unknown"; }
  
        if (list.user === app.userID) {
          $('#all-lists').append(`<li class="list my-list" data-creator="${list.user}"><a href="/list?type=userlist&id=${list.id}">${list.title}</a><span class="text-secondary"> by: ${listCreator}</span><span class="remove-from-list-button" data-list-id="${list.id}" data-list-type="userlist">&#10005;</span></li>`);
        } else {
          $('#all-lists').append(`<li class="list other-list" data-creator="${list.user}"><a href="/list?type=userlist&id=${list.id}">${list.title}</a><span class="text-secondary" data-list-type="userlist"> by: ${listCreator}</span></li>`);
        }
      }
    });
  }
  $('.remove-from-list-button').click(function() {
    if ($(this).data('list-type') === "myfavorites") return removeFromFavorites();
    removeFromList($(this).data('list-id'));
  });
  if (userLoggedIn) return updateListDisplay();

  if ($('.list').length === 0) { 
    $('.list-message').remove();
    $('#all-lists').after('<div class="text-primary text-center list-message"><small>This album is not in any public user lists yet. Log in to get started working with lists!</small><br/><br/></div>'); 
  }
}

function populateUserLists() {
  $('#list-options').html('');
  $("<option selected>Add to a list...</option>").appendTo("#list-options");
  $("<option value='myfavorites'>&#9825; My Favorites</option>").appendTo("#list-options");
  app.userLists = app.userLists.sort((a, b) => (a.title > b.title) ? 1 : -1);
  app.userLists.forEach(list => {
    $(`<option value="${list.id}">${list.title}</option>`).appendTo("#list-options");
  });
}

function addToList(chosenList) {
  if (chosenList) {
    if (chosenList === "myfavorites") return addToFavorites();

    if (app.album.lists) {
      let alreadyInList = app.album.lists.find(x => x.id === chosenList);
      if (alreadyInList) {
        $('#list-options').get(0).selectedIndex = 0;
        return alert(`This album is already in your "${alreadyInList.title}" list.`);
      }
    }

    let addAlbumToListBody = {
      method: "add album",
      appleAlbumID: app.album.appleAlbumID,
      title: app.album.title,
      artist: app.album.artist,
      releaseDate: app.album.releaseDate,
      cover: app.album.cover,
      genres: app.album.genres,
      songNames: app.album.songNames,
      appleURL: app.album.appleURL,
      recordCompany: app.album.recordCompany,
    };
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + chosenList,
      contentType: 'application/json',
      data: JSON.stringify(addAlbumToListBody),
      success: function(data) {
        if (!app.album.lists) { app.album.lists = []; }
        app.album.lists.push(data);
        populateListsWithAlbum();
        updateListDisplay();
        $('#updateListModal').modal('hide');
        $('#list-options').get(0).selectedIndex = 0;
      },
      error: function(err) {
        console.log(err);
      }
    });
  }
}

function addToNewList(listTitle, displayName) {

  // check to see if this user has a list with the same name
  let confirmed = true;
  let listExists = app.userLists.find(x => x.title.toUpperCase() === listTitle.toUpperCase());
  if (listExists) { confirmed = confirm(`You already have a list called "${listExists.title}". Choose "ok" to create a new list, "cancel" to go back and add this album to an existing list.`); }

  // user either said okay to create a duplicate list, or there
  // is no other list with this name by this user
  if (confirmed) {
    let privateList = false;
    if ($('#private-checkbox').is(":checked")) { privateList = true; }
    if (listTitle && displayName) {
      let newList = {
        user: app.userID,
        displayName: displayName,
        title: listTitle,
        isPrivate: privateList,
        albums: [app.album]
      };
      $.ajax({
        method: "POST",
        url: "/api/v1/list/",
        contentType: 'application/json',
        data: JSON.stringify(newList),
        success: function(data) {
          // update the UI without making any additional API calls
          if(!data.message) {
            app.userLists.push(data);
            if (!app.album.lists) { app.album.lists = []; }
            app.album.lists.push(data);
            populateUserLists();
            populateListsWithAlbum();
            updateListDisplay();
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
  let thisList = app.album.lists.find(x => x.id === listID);
  let confirmed = confirm(`Are you sure you want to remove this album from the "${thisList.title}" list? You cannot undo this operation.`);
  
  if (confirmed) {
    let deleteObject = {
      method: "remove album",
      appleAlbumID: app.album.appleAlbumID,
      title: app.album.title,
      artist: app.album.artist,
      releaseDate: app.album.releaseDate,
      cover: app.album.cover
    };
    
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + thisList.id,
      contentType: 'application/json',
      data: JSON.stringify(deleteObject),
      success: function(data) {
        let index = app.album.lists.indexOf(thisList);
        app.album.lists.splice(index, 1);
        populateListsWithAlbum();
        updateListDisplay();
      }
    });
  }
}

function updateListDisplay() {
  const whatListsToShow = sessionStorage.getItem('lists');
  return whatListsToShow === 'My Lists' ? displayMyLists() : displayAllLists();
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

  $('#show-all-lists').click(function() {
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

  $('#show-my-lists').click(function() {
    sessionStorage.setItem('lists', 'All Lists');
    updateListDisplay();
  });
}

function populateConnections() {
  if (app.album.connections) {
    $('#connected-albums').html('');

    for (let index = 0; index < app.album.connections.length; index++) {
      const connectedAlbum = app.album.connections[index];

      if (connectedAlbum.appleAlbumID != app.album.appleAlbumID) {
        const cover = connectedAlbum.cover.replace('{w}', 105).replace('{h}', 105);
        const smallTitle = connectedAlbum.title.length > 20 ? truncate(connectedAlbum.title, 20) : connectedAlbum.title;

        if (connectedAlbum.creator === app.userID) {
          $('#connected-albums').append(`<a href="/album/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection my-connection" data-creator="${connectedAlbum.creator}"><img class="connection-cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="${smallTitle}" data-trigger="hover"><span class="delete-connection-button" data-connected-album-id="${connectedAlbum.appleAlbumID}">&#10005;</span></a>`);
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
  } 
}

function addConnection(selectedAlbum) {
  // make sure object passed in looks like an album object
  if (selectedAlbum && selectedAlbum.title) {
    $.ajax('/api/v1/connection', {
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ 
        "albumOne": app.album,
        "albumTwo": selectedAlbum,
        "creator": app.userID
      }),
      success: function(result) {
        $('#updateConnectionModal').modal('hide');
        app.album.connections = result;
        populateConnections();
        updateConnectionDisplay();
      }
    });
    $('#add-connection-input').val('');
  }
} 
    
function populateConnectionModalResults(data) {
  $('#connection-search-results').html('');
  $('#connection-loader').hide();
  if (data.albums && data.albums.length > 0) {
    for (let index = 0; index < data.albums.length; index++) {
      const album = data.albums[index];
      const cardNumber = index + 1;

      app.connectionSearchResults.push(album);

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
  $('#connection-search-results').append(`<div id="connectionModalCard${cardNumber}" class="search-modal-card" data-apple-album-id="${album.appleAlbumID}"><a class="search-modal-card-album-link" href=""><img class="search-modal-card-image" src="" alt=""><a/><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`);
}

function populateConnectionModalCard(album, cardNumber) {
  // set up album and artist trunction
  const smallArtist = album.artist.length > 32 ? truncate(album.artist, 32) : album.artist;
  const largeArtist = album.artist.length > 49 ? truncate(album.artist, 49) : album.artist;
  const smallAlbum = album.title.length > 44 ? truncate(album.title, 44) : album.title;
  const largeAlbum = album.title.length > 66 ? truncate(album.title, 66): album.title;
  
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
    const selectedAlbum = app.connectionSearchResults.find(x => x.appleAlbumID === selectedAlbumID.toString());
    addConnection(selectedAlbum);
  });
}

function deleteConnection(connectedAlbum) {
  const confirmation = confirm('Are you sure you want to delete a connection? You cannot undo this operation.');
  if (confirmation) {
    $.ajax('/api/v1/connection', {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ 
        "albumTwo" : connectedAlbum.toString(),
        "albumOne": app.album.appleAlbumID.toString(),
        "creator": app.userID
      }),
      success: function(result) {
        app.album.connections = result;
        populateConnections();
        updateConnectionDisplay();
      },
      error: function(err) {
        if (err.responseJSON && err.responseJSON.message) return alert(err.responseJSON.message);
      }
    });
  }
}

function updateConnectionDisplay() {
  const whatConnectionsToShow = sessionStorage.getItem('connections');
  return whatConnectionsToShow === 'My Connections' ? displayMyConnections() : displayAllConnections();
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

  $('#show-all-connections').click(function() {
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

  $('#show-my-connections').click(function() {
    sessionStorage.setItem('connections', 'All Connections');
    updateConnectionDisplay();
  });
}

function populateTags() {
  clearTagArray();
  if (app.album.tagObjects) {
    app.album.tagObjects = app.album.tagObjects.sort((a, b) => (a.text > b.text) ? 1 : -1);
    $('#current-tags').html('');
    for (let index = 0; index < app.album.tagObjects.length; index++) {
      let tag = app.album.tagObjects[index].text;
      const creator = app.album.tagObjects[index].creator;
      
      // add tags
      let tagName;
      if (parseInt(tag)) {
        const addLetters = "tag_";
        tagName = addLetters.concat(tag).replace(/[^A-Z0-9]+/ig,'');
      } else {                  
        tagName = tag.replace(/[^A-Z0-9]+/ig,'');
      }
    
      if (creator === app.userID) {
        // tags are stored escaped and displayed raw
        $('#current-tags').append(`<a href="" id="${tagName}-${creator}" class="badge badge-light album-tag my-tag" data-creator="${creator}" data-rawtag="${escapeHtml(app.album.tagObjects[index].text)}" data-custom-genre="${app.album.tagObjects[index].customGenre || false}"><span>${tag}</span><span class="delete-tag-button ml-1" data-tag-id="${tagName}-${creator}">&#10005;</span></a>`);
      } else {
        // tags are stored escaped and displayed raw
        $('#current-tags').append(`<a href="" id="${tagName}-${creator}" class="badge badge-light album-tag other-tag" data-creator="${creator}" data-rawtag="${escapeHtml(app.album.tagObjects[index].text)}" data-custom-genre="${app.album.tagObjects[index].customGenre || false}"><span>${tag}</span></a>`);
      }
    }
    // ------ tag delete button event listener -----
    $('.delete-tag-button').click(function() {
      deleteTag($(this).data('tag-id'));
    });

    // in case the user misses the delete button on the right edge
    $('.album-tag').click(function(event) {
      event.preventDefault();
      selectTag(document.getElementById($(this).attr('id')), event);
    });
  }
}

function selectTag(tagName) {
  const thisTag = document.getElementById(tagName.id);
  thisTag.classList.toggle("badge-primary");
  thisTag.classList.toggle("selected-tag");
  thisTag.classList.toggle("badge-light");

  // tags are stored escaped and displayed raw
  modifySelectedTags(escapeHtml(thisTag.dataset.rawtag));
}

function modifySelectedTags(tag) {
  return app.selectedTags.indexOf(tag) === -1 ? app.selectedTags.push(tag) : app.selectedTags.splice(app.selectedTags.indexOf(tag), 1);
}

function deleteTag(tagID) {
  const creator = $(`#${tagID}`).data('creator');
  const customGenre = $(`#${tagID}`).data('custom-genre');
  const tag = $(`#${tagID}`).data('rawtag');

  let confirmation = confirm(`Are you sure you want to delete the "${tag}" tag? You cannot undo this operation.`);

  if (confirmation) {
    $.ajax('/api/v1/tag/', {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ 
        // tags are stored escaped and displayed raw, converting to string
        // in case the raw tag is just a number (like a year)
        "text": escapeHtml(tag.toString()),
        "creator": creator,
        "appleAlbumID": app.album.appleAlbumID,
        "customGenre": customGenre
      }),
      success: function(response) {
        if (!response.message) {
          app.album = response;
          populateTags();
          updateTagDisplay(); 
        } else {
          alert(response.message);
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

    newTag = removeExtraSpaces(toTitleCase(newTag));
    // tags are stored html-escaped and displayed raw
    newTag = escapeHtml(newTag);

    // only run these two checks if there are already existing tags
    if (app.album.tagObjects) {
      // check for duplicates by this user, hard fail
      let duplicates = 0;
      app.album.tagObjects.forEach(tagObject => {
        if (tagObject.text === newTag && tagObject.creator === app.userID) { duplicates++; }
      });
      if (duplicates > 0) {
        $('#add-tag-input').val("");
        $("#custom-genre-checkbox").prop("checked", false);
        return alert(`You already added the "${newTag}" tag to this album!`);
      }   

      // check for duplicates overall, option to proceed
      let someoneElsesTag = app.album.tagObjects.find(x => x.text === newTag);
      if (someoneElsesTag) { 
        const confirmed = confirm(`Someone else already added the "${newTag}" tag to this album. Choose "ok" to add your tag, or "cancel" to avoid duplicates.`); 
        $('#add-tag-input').val("");
        $("#custom-genre-checkbox").prop("checked", false);
        if (!confirmed) return;
      }
    }  

    const customGenre = $('#custom-genre-checkbox').is(":checked");

    // ADD NEW TAG TO THE DATABASE
    $.ajax('/api/v1/tag/', {
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        "album": app.album,
        "creator": app.userID,
        "tag": newTag,
        "customGenre": customGenre
      }),
      success: function (result) {
        if (!result.message) {
          if (!result.songNames || !result.genres) {
            result.songNames = app.album.songNames;
            result.genres = app.album.genres;
          }
          app.album = result;
          populateTags();
          updateTagDisplay();
          $('#tag-success').html("Added! &#10003;");
          setTimeout(function(){ $('#tag-success').html('&nbsp;'); }, 3000);
        } else {
          return alert(result.message);
        }
      },
      error: function (err) {
        console.log(err);
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

function clearTagArray() {
  if ($(".selected-tag").length > 0) {
    $(".selected-tag").toggleClass( "badge-primary" );
    $(".selected-tag").toggleClass( "badge-light" );
    $(".selected-tag").toggleClass( "selected-tag" );
  }
  app.selectedTags = [];
}

function updateTagDisplay(data) {
  let userIsLoggedIn = false;
  if (data || app.userID) { userIsLoggedIn = true; }

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
    $('#show-all-tags').click(function() {
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

  $('#show-my-tags').click(function() {
    sessionStorage.setItem('tags', 'All Tags');
    updateTagDisplay(userIsLoggedIn);
  });
}

// ------ START GENERAL EVENT LISTENERS ------
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
$('#info-card .nav-link').click(function(event) {
  event.preventDefault();
  toggleActiveInfoTab($(this));
});
$('#tag-search-button').click(function(event) {
  event.preventDefault();
  if (app.selectedTags.length > 0) {
    let listURL = new URL(document.location);
    listURL.pathname = "/list";
    listURL.searchParams.set("type", "tagsearch");
    listURL.searchParams.set("search", app.selectedTags);
    window.location = (listURL.href);
  } else {
    alert("Select one or more tags to preform a tag search");
  }
});
$('#clear-tag-button').click(function(event) {
  event.preventDefault();
  clearTagArray();
});
$('#add-tag-button').click(addTag);
$("#add-tag-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-tag-button").click();
  }
});
$('#custom-genre-checkbox').keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-tag-button").click();
  }
});
$('#custom-genre-checkbox-text').click(function() {
  $('#custom-genre-checkbox').click();
  $('#custom-genre-checkbox').select();
});
$("#add-connection-button").click(function() {
  const search = $('#add-connection-input').val().trim();
  $('#no-results-message').remove();
  $('#connection-search-results').html('');
  $('#connection-loader').show();
  executeSearch(search, "connection");
});
$("#add-connection-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-connection-button").click();
  }
});
$('#add-to-list-button').click(function() {
  let listOptions = document.getElementById("list-options");
  let chosenList = listOptions[listOptions.selectedIndex].value;
  if (chosenList === "&#9825; My Favorites") return addToFavorites();
  if (chosenList !== "Add to a list...") { addToList(chosenList); } 
});
$('#add-to-new-list-button').click(function() {
  let listTitle = document.getElementById("new-list-title").value.trim();
  let displayName = document.getElementById("new-display-name").value.trim() || "Unknown";
  
  // at least a list title should be present
  if (!listTitle) return alert("All lists require a title!");

  // check for characters that will cause trouble but aren't that useful
  if ((listTitle.includes("<") && listTitle.includes(">")) || listTitle.includes(".") || listTitle.includes("{") || listTitle.includes("}")) {
    $('#new-list-title').val("");
    return alert("Some characters are not allowed in tags, sorry!");
  } 
  
  if ((displayName.includes("<") && displayName.includes(">")) || displayName.includes(".") || displayName.includes("{") || displayName.includes("}")) {
    $('#new-display-name').val("");
    return alert("Some characters are not allowed in tags, sorry!");
  }

  // enforce reserved list name 
  if (listTitle.toUpperCase() === "MY FAVORITES") {
    $('#new-list-title').val("");
    return alert("'My Favorites' is a reserved list name. Give the existing 'My Favorites' functionality a shot or choose a different title.");
  }

  // enforce character length limits
  if (listTitle.length > 60) return alert("List titles must be shorter than 60 characters in length.");
  if (displayName.length > 30) return alert("Display names must be shorter than 30 characters in length.");
    
  // storing title and display name as escaped html, displaying raw
  addToNewList(escapeHtml(listTitle), escapeHtml(displayName));
  document.getElementById("new-display-name").value = "";
  document.getElementById("new-list-title").value = "";
});

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
  // $('#favorite-title').show();

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
  // $('#favorite-title').hide();

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
    app.userID = firebase.auth().currentUser.uid;
    userIsLoggedIn();
  } 
  if (!user) {   
    // no user logged in 
    app.userID = false;
    userIsLoggedOut();
  }
});

function logIn() {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  // local persistance remains if browser is closed
  .then(function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider);
  })
  .then(function(result) {
    app.userID = user.uid;
    userIsLoggedIn();

  }).catch(function(error) {
    // Handle Errors here.
  });
}

function logOut() {
  firebase.auth().signOut().then(function() {
    // log out functionality
    // app.userID = false;
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