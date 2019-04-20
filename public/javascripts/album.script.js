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

function removeSelectedElement(selector) {
  if (selector[0] === ".") {
    const c = document.querySelectorAll(selector);
    for (let i = 0; i < c.length; i++) { 
      c[i].parentNode.removeChild(c[i]);
    }
  } else if (selector[0] === "#") {
    const e = document.getElementById(selector.substring(1));
    if (e) { e.parentNode.removeChild(e); }
  } else {
    console.error("removeSelectedElement() was passed an invalid selector");
  }
}

function addClassEventListener(selector, eventType, myFunction) {
  const c = document.getElementsByClassName(selector);
  for (let i = 0; i < c.length; i++) {
    c[i].addEventListener(eventType, myFunction);
  }
}

function stringToNode(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild;
}

function showClass(selector) {
  const otherLists = document.getElementsByClassName(selector);
  for (let i = 0; i < otherLists.length; i++) {
    otherLists[i].classList.remove('hide_me');
  }
}

function hideClass(selector) {
  const otherLists = document.getElementsByClassName(selector);
  for (let i = 0; i < otherLists.length; i++) {
    otherLists[i].classList.add('hide_me');
  }
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

      const searchModal = new Modal(document.getElementById('searchModal'));
      searchModal.show();

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
  populateListsWithAlbum(userLoggedIn);
  if (userLoggedIn) { 
    updateTagDisplay(userLoggedIn); 
    updateConnectionDisplay(userLoggedIn);
  } else {
    if (!app.album.tags || app.album.tags.length === 0) { 
      document.getElementById('current-tags').appendChild(stringToNode('<div class="text-primary text-center"><small>There are currently no tags for this album. Log in to start adding your own tags!</small></div>'));
    }
    if (!app.album.connections || app.album.connections.length === 0) { 
      document.getElementById('connected-albums').appendChild(stringToNode('<div class="text-primary text-center"><small>There are currently no connections for this album. Log in to start adding your own connections!</small><br/><br/></div>'));
    }
  }
}

async function addToFavorites() {
  if (app.album.favorites && !!app.album.favorites.find(x => x.userID === app.userID)) {
    populateUserLists();
    return alert("This album is already in your \"My Favorites\" list.");
  }

  let response = await fetch('/api/v1/favorite', {
    method: 'post',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      "user" : app.userID,
      "album" : app.album
    })
  });
  if (!response.ok) throw Error(response.statusText);
  let data = await response.json();

  const updateListModal = new Modal(document.getElementById('updateListModal'));
  updateListModal.hide();
  if (!app.album.favorites) { app.album.favorites = []; }
  app.album.favorites.push({"userID": app.userID});
  populateListsWithAlbum();
  updateListDisplay();
  // $('#list-options').get(0).selectedIndex = 0;
  document.getElementById("list-options").selectedIndex = 0;

  // $.ajax('/api/v1/favorite', {
  //   method: 'POST',
  //   contentType: 'application/json',
  //   data: JSON.stringify({ 
  //     "user" : app.userID,
  //     "album" : app.album
  //   }),
  //   success: function(response) {
  //     // bootstrap native
  //     const updateListModal = new Modal(document.getElementById('updateListModal'));
  //     updateListModal.hide();
  //     // bootstrap regular
  //     // $('#updateListModal').modal('hide');
  //     if (!app.album.favorites) { app.album.favorites = []; }
  //     app.album.favorites.push({"userID": app.userID});
  //     populateListsWithAlbum();
  //     updateListDisplay();
  //     // $('#list-options').get(0).selectedIndex = 0;
  //     document.getElementById("list-options").selectedIndex = 0;
  //   }
  // });
}

async function removeFromFavorites() {
  let confirmed = confirm(`Are you sure you want to remove this album from the 'My Favorites' list? You cannot undo this operation.`);
  if (confirmed) {
    let response = await fetch('/api/v1/favorite', {
      method: 'delete',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        "user" : app.userID,
        "appleAlbumID" : app.album.appleAlbumID,
        "returnData": "album"
      })
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();
    app.album = data;
    populateListsWithAlbum();
    updateListDisplay();

    // $.ajax('/api/v1/favorite', {
    //   method: 'DELETE',
    //   contentType: 'application/json',
    //   data: JSON.stringify({ 
    //     "user" : app.userID,
    //     "appleAlbumID" : app.album.appleAlbumID,
    //     "returnData": "album"
    //   }),
    //   success: function(response) {
    //     app.album = response;
    //     populateListsWithAlbum();
    //     updateListDisplay();
    //   }
    // });
  }
}

async function getUserLists() {
  let response = await fetch("/api/v1/list/user/" + app.userID);
  if (!response.ok) throw Error(response.statusText);
  let data = await response.json();
  // message returned here means no lists for this user
  if (data.message) { app.userLists = []; } 
  else { app.userLists = data; }
  populateUserLists();
  // $.ajax({
  //   method: "GET",
  //   url: "/api/v1/list/user/" + app.userID,
  //   success: function(data) {
  //     // message returned here means no lists for this user
  //     if (data.message) { app.userLists = []; } 
  //     else { app.userLists = data; }
  //     populateUserLists();
  //   }
  // });
}

function populateListsWithAlbum(userLoggedIn) {
  document.getElementById('all-lists').innerHTML = '';
  removeSelectedElement('.list-message');
  // $('.list-message').remove();

  // check if album is favorited
  if (app.userID && app.album.favorites && !!app.album.favorites.find(x => x.userID === app.userID)) { 
    document.getElementById("all-lists").appendChild(stringToNode(`<li class="list my-list" data-creator="${app.userID}"><a href="/list?type=myfavorites">&#9825; My Favorites</a><span class="text-secondary"> by: You!</span><span class="remove-from-list-button" data-list-type="myfavorites">&#10005;</span></li>`));
    // $('#all-lists').append(`<li class="list my-list" data-creator="${app.userID}"><a href="/list?type=myfavorites">&#9825; My Favorites</a><span class="text-secondary"> by: You!</span><span class="remove-from-list-button" data-list-type="myfavorites">&#10005;</span></li>`);
  }
  if (app.album.lists) {
    app.album.lists = app.album.lists.sort((a, b) => (a.title > b.title) ? 1 : -1);
    app.album.lists.forEach(list => {
      if(!list.isPrivate) {
        let listCreator = list.displayName;
        if (!listCreator || listCreator.trim === "") { listCreator = "Unknown"; }
  
        if (list.user === app.userID) {
          document.getElementById("all-lists").appendChild(stringToNode(`<li class="list my-list" data-creator="${list.user}"><a href="/list?type=userlist&id=${list.id}">${list.title}</a><span class="text-secondary"> by: ${listCreator}</span><span class="remove-from-list-button" data-list-id="${list.id}" data-list-type="userlist">&#10005;</span></li>`));
        } else {
          document.getElementById("all-lists").appendChild(stringToNode(`<li class="list other-list" data-creator="${list.user}"><a href="/list?type=userlist&id=${list.id}">${list.title}</a><span class="text-secondary" data-list-type="userlist"> by: ${listCreator}</span></li>`));
        }
      }
    });
  }
  addClassEventListener('remove-from-list-button', 'click', function() {
    if (this.dataset.listType === "myfavorites") return removeFromFavorites();
    removeFromList(parseInt(this.dataset.listId));
  });

  if (userLoggedIn) return updateListDisplay();

  if (document.getElementsByClassName("list").length === 0) { 
    removeSelectedElement('.list-message');
    document.getElementById("all-lists").appendChild(stringToNode('<div class="text-primary text-center list-message"><small>This album is not in any public user lists yet. Log in to get started working with lists!</small><br/><br/></div>'));
  } 
}

function populateUserLists() {
  document.getElementById('list-options').innerHTML = '';
  document.getElementById("list-options").appendChild(stringToNode('<option selected>Add to a list...</option>'));
  document.getElementById("list-options").appendChild(stringToNode('<option value="myfavorites">&#9825; My Favorites</option>'));
  app.userLists = app.userLists.sort((a, b) => (a.title > b.title) ? 1 : -1);
  app.userLists.forEach(list => {
    document.getElementById("list-options").appendChild(stringToNode(`<option value="${list.id}">${list.title}</option>`));
  });
}

async function addToList(chosenList) {
  if (chosenList) {
    if (chosenList === "myfavorites") return addToFavorites();

    if (app.album.lists) {
      let alreadyInList = app.album.lists.find(x => x.id === chosenList);
      if (alreadyInList) {
        // $('#list-options').get(0).selectedIndex = 0;
        document.getElementById("list-options").selectedIndex = 0;
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
    let response = await fetch("/api/v1/list/" + chosenList, {
      method: 'put',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addAlbumToListBody)
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    if (!app.album.lists) { app.album.lists = []; }
    app.album.lists.push(data);
    populateListsWithAlbum();
    updateListDisplay();

    const updateListModal = new Modal(document.getElementById('updateListModal'));
    updateListModal.hide();
    document.getElementById("list-options").selectedIndex = 0;
    // $('#list-options').get(0).selectedIndex = 0;    

    // $.ajax({
    //   method: "PUT",
    //   url: "/api/v1/list/" + chosenList,
    //   contentType: 'application/json',
    //   data: JSON.stringify(addAlbumToListBody),
    //   success: function(data) {
    //     if (!app.album.lists) { app.album.lists = []; }
    //     app.album.lists.push(data);
    //     populateListsWithAlbum();
    //     updateListDisplay();
    //     // bootstrap native
    //     const updateListModal = new Modal(document.getElementById('updateListModal'));
    //     updateListModal.hide();
    //     // bootstrap regular        
    //     // $('#updateListModal').modal('hide');
    //     document.getElementById("list-options").selectedIndex = 0;
    //     // $('#list-options').get(0).selectedIndex = 0;
    //   },
    //   error: function(err) {
    //     console.log(err);
    //   }
    // });
  }
}

async function addToNewList(listTitle, displayName) {

  // check to see if this user has a list with the same name
  let confirmed = true;
  let listExists = app.userLists.find(x => x.title.toUpperCase() === listTitle.toUpperCase());
  if (listExists) { confirmed = confirm(`You already have a list called "${listExists.title}". Choose "ok" to create a new list, "cancel" to go back and add this album to an existing list.`); }

  // user either said okay to create a duplicate list, or there
  // is no other list with this name by this user
  if (confirmed) {
    let privateList = false;
    // if ($('#private-checkbox').is(":checked")) { privateList = true; }
    if (document.getElementById("private-checkbox") && 
        document.getElementById("private-checkbox").checked) { privateList = true; }
   
    if (listTitle && displayName) {
      let newList = {
        user: app.userID,
        displayName: displayName,
        title: listTitle,
        isPrivate: privateList,
        albums: [app.album]
      };
      let response = await fetch("/api/v1/list/", {
        method: 'post',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList)
      });
      if (!response.ok) throw Error(response.statusText);
      let data = await response.json();

      if(!data.message) {
        app.userLists.push(data);
        if (!app.album.lists) { app.album.lists = []; }
        app.album.lists.push(data);
        populateUserLists();
        populateListsWithAlbum();
        updateListDisplay();

        const updateListModal = new Modal(document.getElementById('updateListModal'));
        updateListModal.hide();
        document.getElementById('new-list-title').value = '';
        document.getElementById('new-display-name').value = '';
      } else {
        alert(data.message);
      }      
      // $.ajax({
      //   method: "POST",
      //   url: "/api/v1/list/",
      //   contentType: 'application/json',
      //   data: JSON.stringify(newList),
      //   success: function(data) {
      //     // update the UI without making any additional API calls
      //     if(!data.message) {
      //       app.userLists.push(data);
      //       if (!app.album.lists) { app.album.lists = []; }
      //       app.album.lists.push(data);
      //       populateUserLists();
      //       populateListsWithAlbum();
      //       updateListDisplay();
      //       // bootstrap native
      //       const updateListModal = new Modal(document.getElementById('updateListModal'));
      //       updateListModal.hide();
      //       // bootstrap regular            
      //       // $('#updateListModal').modal('hide');
      //       document.getElementById('new-list-title').value = '';
      //       // $('#new-list-title').val('');
      //       document.getElementById('new-display-name').value = '';
      //       // $('#new-display-name').val('');
      //     } else {
      //       alert(data.message);
      //     }
      //   }
      // });
    }
  } 
}

async function removeFromList(listID) {
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

    let response = await fetch("/api/v1/list/" + thisList.id, {
      method: 'post',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deleteObject)
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    let index = app.album.lists.indexOf(thisList);
    app.album.lists.splice(index, 1);
    populateListsWithAlbum();
    updateListDisplay();    
    
    // $.ajax({
    //   method: "PUT",
    //   url: "/api/v1/list/" + thisList.id,
    //   contentType: 'application/json',
    //   data: JSON.stringify(deleteObject),
    //   success: function(data) {
    //     let index = app.album.lists.indexOf(thisList);
    //     app.album.lists.splice(index, 1);
    //     populateListsWithAlbum();
    //     updateListDisplay();
    //   }
    // });
  }
}

function updateListDisplay() {
  const whatListsToShow = sessionStorage.getItem('lists');
  return whatListsToShow === 'My Lists' ? displayMyLists() : displayAllLists();
}

function displayAllLists() {
  if (document.getElementById('lists-toggle').innerHTML.length === 0) {
    document.getElementById('lists-toggle').innerHTML = '<img src="/images/toggle_on.png" id="show-all-lists" class="toggle-switch" style="height:22px;margin-left:10px;"><img src="/images/toggle_off.png" id="show-my-lists" class="hide_me toggle-switch" style="height:22px;margin-left:10px;">';
  } else {
    document.getElementById('show-my-lists').classList.add('hide_me');
    // $('#show-my-lists').hide();
    document.getElementById('show-all-lists').classList.remove('hide_me');
    // $('#show-all-lists').show();
  }
  showClass('my-list');
  showClass('other-list');
  document.getElementById('list-title-modifier').innerHTML = 'All <span class="large-button-text">user </span>';
  removeSelectedElement('.list-message');

  if (document.getElementsByClassName('list').length === 0) { 
    // replacing $('#all-lists').after() jQuery call
    document.getElementById('all-lists').parentNode.insertBefore(stringToNode('<div class="text-primary text-center list-message"><small>This album is not in any public user lists. Click "Add to a list" below to get started!</small><br/><br/></div>'), document.getElementById('all-lists').nextSibling);
  }

  document.getElementById('show-all-lists').addEventListener('click', function() {
    sessionStorage.setItem('lists', 'My Lists');
    updateListDisplay();
  });
}

function displayMyLists() {
  if (document.getElementById('lists-toggle').innerHTML.length === 0) {
    document.getElementById('lists-toggle').innerHTML = '<img src="/images/toggle_off.png" id="show-my-lists" class="toggle-switch" style="height:22px;margin-left:10px;"><img src="/images/toggle_on.png" id="show-all-lists" class="hide_me toggle-switch" style="height:22px;margin-left:10px;">';
  } else {
    document.getElementById('show-all-lists').classList.add('hide_me');
    // $('#show-all-lists').hide();
    document.getElementById('show-my-lists').classList.remove('hide_me');
    // $('#show-my-lists').show();
  }
  const myLists = document.getElementsByClassName('my-list');
  for (let i = 0; i < myLists.length; i++) {
    myLists[i].classList.remove('hide_me');
  }
  // $('.my-list').show();
  const otherLists = document.getElementsByClassName('other-list');
  for (let i = 0; i < otherLists.length; i++) {
    otherLists[i].classList.add('hide_me');
  }
  // $('.other-list').hide();
  document.getElementById('list-title-modifier').innerText = 'Your ';

  removeSelectedElement('.list-message');
  // $('.list-message').remove();
  if (document.getElementsByClassName('my-list').length === 0) { 
    // replacing $('#all-lists').after() jQuery call
    document.getElementById('all-lists').parentNode.insertBefore(stringToNode('<div class="text-primary text-center list-message"><small>You have not added this album to any lists. Click "Add to a list" below to get started!</small><br/><br/></div>'), document.getElementById('all-lists').nextSibling);
  }

  document.getElementById('show-my-lists').addEventListener('click', function() {
    sessionStorage.setItem('lists', 'All Lists');
    updateListDisplay();
  });
}

function populateConnections() {
  if (app.album.connections) {
    document.getElementById('connected-albums').innerHTML = '';

    for (let index = 0; index < app.album.connections.length; index++) {
      const connectedAlbum = app.album.connections[index];

      if (connectedAlbum.appleAlbumID != app.album.appleAlbumID) {
        const cover = connectedAlbum.cover.replace('{w}', 105).replace('{h}', 105);
        const smallTitle = connectedAlbum.title.length > 20 ? truncate(connectedAlbum.title, 20) : connectedAlbum.title;

        if (connectedAlbum.creator === app.userID) {
          document.getElementById('connected-albums').appendChild(stringToNode(`<a href="/album/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection my-connection" data-creator="${connectedAlbum.creator}"><img class="connection-cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="${smallTitle}" data-trigger="hover"><span class="delete-connection-button" data-connected-album-id="${connectedAlbum.appleAlbumID}">&#10005;</span></a>`));
        } else {
          document.getElementById('connected-albums').appendChild(stringToNode(`<a href="/album/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection other-connection" data-creator="${connectedAlbum.creator}"><img class="connection-cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="${smallTitle}" data-trigger="hover"></a>`));
        }
      }
    }
    addClassEventListener('delete-connection-button', 'click', function(event) {
      event.preventDefault();
      deleteConnection(this.dataset.connectedAlbumId);
    });
    // $('.delete-connection-button').click(function(event) {
    //   event.preventDefault();
    //   deleteConnection($(this).data("connected-album-id"));
    // }); 

    // ------ enable tooltips ------
    var isTouchDevice = false;
    if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
    if (!isTouchDevice) { 
      const elementsTooltip = document.querySelectorAll('[title]');
      for (let i = 0; i < elementsTooltip.length; i++){
        new Tooltip(elementsTooltip[i], {
          placement: 'top', //string
          animation: 'hide', // CSS class
          delay: 10, // integer
        })
      }
      // $('[data-toggle="tooltip"]').tooltip(); 
    }
  } 
}

async function addConnection(selectedAlbum) {
  // make sure object passed in looks like an album object
  if (selectedAlbum && selectedAlbum.title) {
    let response = await fetch('/api/v1/connection', {
      method: 'post',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        "albumOne": app.album,
        "albumTwo": selectedAlbum,
        "creator": app.userID
      })
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    const updateConnectionModal = new Modal(document.getElementById('updateConnectionModal'));
    updateConnectionModal.hide();
    app.album.connections = data;
    populateConnections();
    updateConnectionDisplay();
    // $.ajax('/api/v1/connection', {
    //   method: 'POST',
    //   contentType: 'application/json',
    //   data: JSON.stringify({ 
    //     "albumOne": app.album,
    //     "albumTwo": selectedAlbum,
    //     "creator": app.userID
    //   }),
    //   success: function(result) {
    //     // bootstrap native
    //     const updateConnectionModal = new Modal(document.getElementById('updateConnectionModal'));
    //     updateConnectionModal.hide();
    //     // bootstrap regular        
    //     // $('#updateConnectionModal').modal('hide');
    //     app.album.connections = result;
    //     populateConnections();
    //     updateConnectionDisplay();
    //   }
    // });
    document.getElementById('add-connection-input').value = '';
  }
} 
    
function populateConnectionModalResults(data) {
  document.getElementById('connection-search-results').innerHTML = '';
  document.getElementById('connection-loader').classList.add('hide_me');
  // $('#connection-loader').hide();
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
    document.getElementById('connection-search-results').appendChild(stringToNode('<div id="connection-search-modal-placeholder">&nbsp;</div>'));
  } else {
    // replacing jQuery $('#connection-search-results').after() call
    document.getElementById('connection-search-results').parentNode.insertBefore(stringToNode('<div id="no-results-message" class="text-primary mb-3" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>'), document.getElementById('connection-search-results').nextSibling);
  }
}

function createConnectionModalCard(album, cardNumber) {
  document.getElementById('connection-search-results').appendChild(stringToNode(`<div id="connectionModalCard${cardNumber}" class="search-modal-card" data-apple-album-id="${album.appleAlbumID}"><a class="search-modal-card-album-link" href=""><img class="search-modal-card-image" src="" alt=""><a/><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`));
}

function populateConnectionModalCard(album, cardNumber) {
  // set up album and artist trunction
  const smallArtist = album.artist.length > 32 ? truncate(album.artist, 32) : album.artist;
  const largeArtist = album.artist.length > 49 ? truncate(album.artist, 49) : album.artist;
  const smallAlbum = album.title.length > 44 ? truncate(album.title, 44) : album.title;
  const largeAlbum = album.title.length > 66 ? truncate(album.title, 66): album.title;
  
  // artist name
  document.querySelector(`#connectionModalCard${cardNumber} .search-modal-card-title`).innerHTML = `<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`;
  // $(`#connectionModalCard${cardNumber} .search-modal-card-title`).html(`<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`);
  // album name
  document.querySelector(`#connectionModalCard${cardNumber} .search-modal-card-album`).innerHTML = `<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`;
  // $(`#connectionModalCard${cardNumber} .search-modal-card-album`).html(`<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`);
  // album cover
  document.querySelector(`#connectionModalCard${cardNumber} .search-modal-card-image`).src = album.cover.replace('{w}', 260).replace('{h}', 260);
  // $(`#connectionModalCard${cardNumber} .search-modal-card-image`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260));

  document.getElementById(`connectionModalCard${cardNumber}`).addEventListener('click', function(event) {
  // $(`#connectionModalCard${cardNumber}`).click(function(event) {
    event.preventDefault();
    // connect to this album
    const selectedAlbumID = this.dataset.appleAlbumId;
    // const selectedAlbumID = $(this).data("apple-album-id");
    const selectedAlbum = app.connectionSearchResults.find(x => x.appleAlbumID === selectedAlbumID.toString());
    addConnection(selectedAlbum);
  });
}

async function deleteConnection(connectedAlbum) {
  const confirmation = confirm('Are you sure you want to delete a connection? You cannot undo this operation.');
  if (confirmation) {
    let response = await fetch('/api/v1/connection', {
      method: 'delete',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        "albumTwo" : connectedAlbum.toString(),
        "albumOne": app.album.appleAlbumID.toString(),
        "creator": app.userID
      })
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();
    app.album.connections = data;
    populateConnections();
    updateConnectionDisplay();

    // $.ajax('/api/v1/connection', {
    //   method: 'DELETE',
    //   contentType: 'application/json',
    //   data: JSON.stringify({ 
    //     "albumTwo" : connectedAlbum.toString(),
    //     "albumOne": app.album.appleAlbumID.toString(),
    //     "creator": app.userID
    //   }),
    //   success: function(result) {
    //     app.album.connections = result;
    //     populateConnections();
    //     updateConnectionDisplay();
    //   },
    //   error: function(err) {
    //     if (err.responseJSON && err.responseJSON.message) return alert(err.responseJSON.message);
    //   }
    // });
  }
}

function updateConnectionDisplay() {
  const whatConnectionsToShow = sessionStorage.getItem('connections');
  return whatConnectionsToShow === 'My Connections' ? displayMyConnections() : displayAllConnections();
}

function displayAllConnections() {
  if (document.getElementById('connections-toggle').innerHTML.length === 0) {
  // if ($("#connections-toggle").html().length === 0) {
    document.getElementById('connections-toggle').innerHTML = '<img src="/images/toggle_on.png" id="show-all-connections" class="toggle-switch" style="height:22px;margin-left:10px;"><img src="/images/toggle_off.png" id="show-my-connections" class="hide_me toggle-switch" style="height:22px;margin-left:10px;">';
    // $("#connections-toggle").html('<img src="/images/toggle_on.png" id="show-all-connections" style="height:22px;margin-left:10px;"><img src="/images/toggle_off.png" id="show-my-connections" style="height:22px;margin-left:10px;display:none;">');
  } else {
    document.getElementById('show-my-connections').classList.add('hide_me');
    // $('#show-my-connections').hide();
    document.getElementById('show-all-connections').classList.remove('hide_me');
    // $('#show-all-connections').show();
  }
  
  showClass('my-connection');
  // $('.my-connection').show();
  showClass('other-connection');
  // $('.other-connection').show();
  document.getElementById('connection-title-modifier').innerText = 'all users';
  // $('#connection-title-modifier').text('all users');

  removeSelectedElement('.no-my-connections');
  // $('#no-my-connections').remove();
  removeSelectedElement('.no-other-connections');
  // $('#no-other-connections').remove();
  if (document.getElementsByClassName('connection').length === 0) { 
    document.getElementById('connected-albums').innerHTML = '<div class="no-other-connections text-primary text-center"><small>There are currently no connections for this album. Click "Add connections" below to get started!</small><br/><br/></div>';
    // $('#connected-albums').html('<div id="no-other-connections" class="text-primary text-center"><small>There are currently no connections for this album. Click "Add connections" below to get started!</small><br/><br/></div>'); 
  }

  document.getElementById('show-all-connections').addEventListener('click', function() {
    sessionStorage.setItem('connections', 'My Connections');
    updateConnectionDisplay();
  });
}

function displayMyConnections() {
  if (document.getElementById('connections-toggle').innerHTML.length === 0) {
    document.getElementById('connections-toggle').innerHTML = '<img src="/images/toggle_off.png" id="show-my-connections" class="toggle-switch" style="height:22px;margin-left:10px;"><img src="/images/toggle_on.png" id="show-all-connections" class="hide_me toggle-switch" style="height:22px;margin-left:10px;">';
    // $("#connections-toggle").html('<img src="/images/toggle_off.png" id="show-my-connections" style="height:22px;margin-left:10px;"><img src="/images/toggle_on.png" id="show-all-connections" style="height:22px;margin-left:10px;display:none;">');
  } else {
    document.getElementById('show-all-connections').classList.add('hide_me');
    // $('#show-all-connections').hide();
    document.getElementById('show-my-connections').classList.remove('hide_me');
    // $('#show-my-connections').show();
  }
  showClass('my-connection');
  // $('.my-connection').show();
  hideClass('other-connection');
  // $('.other-connection').hide();
  document.getElementById('connection-title-modifier').innerText = 'you';
  // $('#connection-title-modifier').text('you');

  removeSelectedElement('.no-my-connections');
  // $('#no-my-connections').remove();
  removeSelectedElement('.no-other-connections');
  // $('#no-other-connections').remove();
  if (document.getElementsByClassName('my-connection').length === 0) { 
    document.getElementById('connected-albums').appendChild(stringToNode('<div class="no-my-connections text-primary text-center"><small>You have not created any connections for this album. Click "Add connections" below to get started!</small><br/><br/></div>'));
    // $('#connected-albums').append('<div id="no-my-connections" class="text-primary text-center"><small>You have not created any connections for this album. Click "Add connections" below to get started!</small><br/><br/></div>'); 
  }

  document.getElementById('show-my-connections').addEventListener('click', function() {
    sessionStorage.setItem('connections', 'All Connections');
    updateConnectionDisplay();
  });
}

function populateTags() {
  clearTagArray();
  if (app.album.tagObjects) {
    app.album.tagObjects = app.album.tagObjects.sort((a, b) => (a.text > b.text) ? 1 : -1);
    document.getElementById('current-tags').innerHTML = '';
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
        document.getElementById('current-tags').appendChild(stringToNode(`<a href="" id="${tagName}-${creator}" class="badge badge-light album-tag my-tag" data-creator="${creator}" data-rawtag="${escapeHtml(app.album.tagObjects[index].text)}" data-custom-genre="${app.album.tagObjects[index].customGenre || false}"><span>${tag}</span><span class="delete-tag-button ml-1" data-tag-id="${tagName}-${creator}">&#10005;</span></a>`));
        // $('#current-tags').append(`<a href="" id="${tagName}-${creator}" class="badge badge-light album-tag my-tag" data-creator="${creator}" data-rawtag="${escapeHtml(app.album.tagObjects[index].text)}" data-custom-genre="${app.album.tagObjects[index].customGenre || false}"><span>${tag}</span><span class="delete-tag-button ml-1" data-tag-id="${tagName}-${creator}">&#10005;</span></a>`);
      } else {
        // tags are stored escaped and displayed raw
        document.getElementById('current-tags').appendChild(stringToNode(`<a href="" id="${tagName}-${creator}" class="badge badge-light album-tag other-tag" data-creator="${creator}" data-rawtag="${escapeHtml(app.album.tagObjects[index].text)}" data-custom-genre="${app.album.tagObjects[index].customGenre || false}"><span>${tag}</span></a>`));
        // $('#current-tags').append(`<a href="" id="${tagName}-${creator}" class="badge badge-light album-tag other-tag" data-creator="${creator}" data-rawtag="${escapeHtml(app.album.tagObjects[index].text)}" data-custom-genre="${app.album.tagObjects[index].customGenre || false}"><span>${tag}</span></a>`);
      }
    }
    // ------ tag delete button event listener -----
    addClassEventListener('delete-tag-button', 'click', function() {
      deleteTag(this.dataset.tagId);
    });

    // in case the user misses the delete button on the right edge
    addClassEventListener('album-tag', 'click', function(event) {
      event.preventDefault();
      selectTag(document.getElementById(this.id), event);
    })
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

async function deleteTag(tagID) {
  
  const creator = document.getElementById(`${tagID}`).dataset.creator;
  const customGenre = document.getElementById(`${tagID}`).dataset.customGenre;
  const tag = document.getElementById(`${tagID}`).dataset.rawtag;

  let confirmation = confirm(`Are you sure you want to delete the "${tag}" tag? You cannot undo this operation.`);

  if (confirmation) {
    let response = await fetch('/api/v1/tag/', {
      method: 'delete',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        // tags are stored escaped and displayed raw, converting to string
        // in case the raw tag is just a number (like a year)
        "text": escapeHtml(tag.toString()),
        "creator": creator,
        "appleAlbumID": app.album.appleAlbumID,
        "customGenre": customGenre
      })
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();
    if (!data.message) {
      app.album = data;
      populateTags();
      updateTagDisplay(); 
    } else {
      alert(data.message);
    }

    // $.ajax('/api/v1/tag/', {
    //   method: 'DELETE',
    //   contentType: 'application/json',
    //   data: JSON.stringify({ 
    //     // tags are stored escaped and displayed raw, converting to string
    //     // in case the raw tag is just a number (like a year)
    //     "text": escapeHtml(tag.toString()),
    //     "creator": creator,
    //     "appleAlbumID": app.album.appleAlbumID,
    //     "customGenre": customGenre
    //   }),
    //   success: function(response) {
    //     if (!response.message) {
    //       app.album = response;
    //       populateTags();
    //       updateTagDisplay(); 
    //     } else {
    //       alert(response.message);
    //     }
    //   }
    // });
  }
}

async function addTag() {
  let newTag = document.getElementById('add-tag-input').value.trim();

  if (newTag) {
    if ((newTag.includes("<") && newTag.includes(">")) || newTag.includes(".") || newTag.includes("{") || newTag.includes("}")) {
      alert("Some characters are not allowed in tags, sorry!");
      document.getElementById('add-tag-input').value = '';
      document.getElementById('custom-genre-checkbox').checked = false;
      // $("#custom-genre-checkbox").prop("checked", false);
      return;
    }

    if (newTag.length > 30) {
      alert("Tags cannot be longer than 30 characters. Check out the \"All tags\" page for some examples!");
      document.getElementById('add-tag-input').value = '';
      document.getElementById('custom-genre-checkbox').checked = false;
      // $("#custom-genre-checkbox").prop("checked", false);
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
        document.getElementById('add-tag-input').value = '';
        document.getElementById('custom-genre-checkbox').checked = false;
        // $("#custom-genre-checkbox").prop("checked", false);
        return alert(`You already added the "${newTag}" tag to this album!`);
      }   

      // check for duplicates overall, option to proceed
      let someoneElsesTag = app.album.tagObjects.find(x => x.text === newTag);
      if (someoneElsesTag) { 
        const confirmed = confirm(`Someone else already added the "${newTag}" tag to this album. Choose "ok" to add your tag, or "cancel" to avoid duplicates.`); 
        document.getElementById('add-tag-input').value = '';
        document.getElementById('custom-genre-checkbox').checked = false;
        // $("#custom-genre-checkbox").prop("checked", false);
        if (!confirmed) return;
      }
    }  

    // const customGenre = $('#custom-genre-checkbox').is(":checked");
    const customGenre = document.getElementById('custom-genre-checkbox').checked

    let response = await fetch('/api/v1/tag/', {
      method: 'post',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        "album": app.album,
        "creator": app.userID,
        "tag": newTag,
        "customGenre": customGenre
      })
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    if (!data.message) {
      if (!data.songNames || !data.genres) {
        data.songNames = app.album.songNames;
        data.genres = app.album.genres;
      }
      app.album = data;
      populateTags();
      updateTagDisplay();
      document.getElementById('tag-success').innerHTML = "Added! &#10003;";
      setTimeout(function(){ 
        document.getElementById('tag-success').innerHTML = '&nbsp;'
      }, 3000);
    } else {
      return alert(data.message);
    }

    // ADD NEW TAG TO THE DATABASE
    // $.ajax('/api/v1/tag/', {
    //   method: 'POST',
    //   contentType: 'application/json',
    //   data: JSON.stringify({
    //     "album": app.album,
    //     "creator": app.userID,
    //     "tag": newTag,
    //     "customGenre": customGenre
    //   }),
    //   success: function (result) {
    //     if (!result.message) {
    //       if (!result.songNames || !result.genres) {
    //         result.songNames = app.album.songNames;
    //         result.genres = app.album.genres;
    //       }
    //       app.album = result;
    //       populateTags();
    //       updateTagDisplay();
    //       document.getElementById('tag-success').innerHTML = "Added! &#10003;";
    //       setTimeout(function(){ 
    //         document.getElementById('tag-success').innerHTML = '&nbsp;'
    //       }, 3000);
    //     } else {
    //       return alert(result.message);
    //     }
    //   },
    //   error: function (err) {
    //     console.log(err);
    //   }
    // });
  } else {
    alert("Please enter a non-empty tag.");
  } 

  document.getElementById('add-tag-input').value = '';
  document.getElementById('custom-genre-checkbox').checked = false;
  // $("#custom-genre-checkbox").prop("checked", false);
}

function toggleActiveInfoTab(element) {
  const activeTab = document.querySelector('#info-card .active');
  activeTab.classList.remove('active');
  activeTab.classList.add('inactive-info-tab');
  // $('#info-card .active').removeClass("active").addClass("inactive-info-tab");
  document.getElementById(element).classList.remove('inactive-info-tab');
  document.getElementById(element).classList.add('active');
  // $(element).removeClass("inactive-info-tab").addClass("active");
  hideClass('info-card-body');
  // $('.info-card-body').hide();
  const selectedCard = document.getElementById(element).dataset.card;
  // const selectedCard = element.data('card');
  document.getElementById(`${selectedCard}-info-card-body`).classList.remove('hide_me');
  // $(`#${selectedCard}-info-card-body`).show();
}

function clearTagArray() {
  if (document.getElementsByClassName('selected-tag').length > 0) {
    const selectedTags = document.getElementsByClassName('selected-tag');
    for (let i = 0; i < selectedTags.length; i++) {
      const selectedTag = selectedTags[i];
      selectedTag.classList.toggle("badge-primary");
      selectedTag.classList.toggle("selected-tag");
      selectedTag.classList.toggle("badge-light");
    }
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
    if (document.getElementById('tags-toggle').innerHTML.length === 0) {
      document.getElementById('tags-toggle').innerHTML = '<img src="/images/toggle_on.png" id="show-all-tags" class="toggle-switch" style="height:22px;margin-left:10px;"><img src="/images/toggle_off.png" id="show-my-tags" class="hide_me toggle-switch" style="height:22px;margin-left:10px;">';
      // $("#tags-toggle").html('<img src="/images/toggle_on.png" id="show-all-tags" style="height:22px;margin-left:10px;"><img src="/images/toggle_off.png" id="show-my-tags" style="height:22px;margin-left:10px;display:none;">'); 
    } else {
      document.getElementById('show-my-tags').classList.add('hide_me');
      // $('#show-my-tags').hide();
      document.getElementById('show-all-tags').classList.remove('hide_me');
      // $('#show-all-tags').show();
    }
  }
  // hideClass('my-tag');
  // $('.my-tag').show();
  showClass('other-tag');
  // $('.other-tag').show();
  document.getElementById('tag-title-modifier').innerText = 'all users';
  // $('#tag-title-modifier').text('all users');

  removeSelectedElement('.no-all-tags');
  // $('#no-all-tags').remove();
  removeSelectedElement('.no-my-tags');
  // $('#no-my-tags').remove();
  if (document.getElementsByClassName('album-tag').length === 0) { 
    document.getElementById('current-tags').innerHTML = '<div class="no-all-tags text-primary text-center"><small>There are currently no tags for this album. Click "Add tags" below to get started!</small></div>';
    // $('#current-tags').html('<div id="no-all-tags" class="text-primary text-center"><small>There are currently no tags for this album. Click "Add tags" below to get started!</small></div>'); 
  }

  if (userIsLoggedIn) {
    document.getElementById('show-all-tags').addEventListener('click', function() {
      sessionStorage.setItem('tags', 'My Tags');
      updateTagDisplay(userIsLoggedIn);
    });
  }
}

function displayMyTags(userIsLoggedIn) {
  if (document.getElementById('tags-toggle').innerHTML.length === 0) {
    document.getElementById('tags-toggle').innerHTML = '<img src="/images/toggle_off.png" id="show-my-tags" class="toggle-switch" style="height:22px;margin-left:10px;"><img src="/images/toggle_on.png" id="show-all-tags" class="hide_me toggle-switch" style="height:22px;margin-left:10px;">'
    // $("#tags-toggle").html('<img src="/images/toggle_off.png" id="show-my-tags" style="height:22px;margin-left:10px;"><img src="/images/toggle_on.png" id="show-all-tags" style="height:22px;margin-left:10px;display:none;">');
  } else {
    document.getElementById('show-all-tags').classList.add("hide_me");
    // $('#show-all-tags').hide();
    document.getElementById('show-my-tags').classList.remove("hide_me");
    // $('#show-my-tags').show();
  }
  showClass('my-tag');
  // $('.my-tag').show();
  hideClass('other-tag');
  // $('.other-tag').hide();
  document.getElementById('tag-title-modifier').innerText = 'you';
  // $('#tag-title-modifier').text('you');

  removeSelectedElement('.no-all-tags');
  // $('#no-all-tags').remove();
  removeSelectedElement('.no-my-tags');
  // $('#no-my-tags').remove();
  if (document.getElementsByClassName('my-tag').length === 0) { 
    document.getElementById('current-tags').appendChild(stringToNode('<div class="no-my-tags text-primary text-center"><small>You have not created any tags for this album. Click "Add tags" below to get started!</small></div>'));
    // $('#current-tags').append('<div id="no-my-tags" class="text-primary text-center"><small>You have not created any tags for this album. Click "Add tags" below to get started!</small></div>'); 
  }

  document.getElementById('show-my-tags').addEventListener('click', function() {
    sessionStorage.setItem('tags', 'All Tags');
    updateTagDisplay(userIsLoggedIn);
  });
}

// ------ INITIALIZE PAGE MODALS ------
document.getElementById('tag-update-button').addEventListener('click', function() {
  const updateTagModal = new Modal(document.getElementById('updateTagModal'));
  updateTagModal.show();
});
document.getElementById('connection-update-button').addEventListener('click', function() {
  const updateConnectionModal = new Modal(document.getElementById('updateConnectionModal'));
  updateConnectionModal.show();
});
document.getElementById('list-update-button').addEventListener('click', function() {
  const updateListModal = new Modal(document.getElementById('updateListModal'));
  updateListModal.show();
})
addClassEventListener('page-info-button', 'click', function() {
  const pageInfoModalLabel = new Modal(document.getElementById('pageInfoModal'));
  pageInfoModalLabel.show();
});

// ------ START GENERAL EVENT LISTENERS ------
document.getElementById('new-list-title').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-to-new-list-button').click();
  }
});
document.getElementById('new-display-name').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-to-new-list-button').click();
  }
});
document.getElementById('list-options').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-to-list-button').click();
  }
});
// $('#info-card .nav-link').click(function(event) {
//   event.preventDefault();
//   toggleActiveInfoTab($(this));
// });
const infoCardTabs = document.querySelectorAll('#info-card .nav-link');
for (let i = 0; i < infoCardTabs.length; i++) {
  infoCardTabs[i].addEventListener('click', function() {
    event.preventDefault();
    toggleActiveInfoTab(this.id);
  });
}
document.getElementById('tag-search-button').addEventListener('click', function(event) {
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
document.getElementById('clear-tag-button').addEventListener('click', function(event) {
  event.preventDefault();
  clearTagArray();
});
document.getElementById('add-tag-button').addEventListener('click', addTag);
document.getElementById('add-tag-input').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-tag-button').click();
  }
});
document.getElementById('custom-genre-checkbox').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-tag-button').click();
  }
});
document.getElementById('custom-genre-checkbox-text').addEventListener('click', function() {
  document.getElementById('custom-genre-checkbox').click();
  document.getElementById('custom-genre-checkbox').select();
});
document.getElementById('add-connection-button').addEventListener('click', function() {
  const search = document.getElementById('add-connection-input').value.trim();
  removeSelectedElement('#no-results-message');
  document.getElementById('connection-search-results').innerHTML = '';
  document.getElementById('connection-loader').classList.remove('hide_me');
  // $('#connection-loader').show();
  executeSearch(search, "connection");
});
document.getElementById('add-connection-input').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-connection-button').click();
  }
});
document.getElementById('add-to-list-button').addEventListener('click', function() {
  let listOptions = document.getElementById("list-options");
  let chosenList = listOptions[listOptions.selectedIndex].value;
  if (chosenList === "&#9825; My Favorites") return addToFavorites();
  if (chosenList !== "Add to a list...") { addToList(chosenList); } 
});
document.getElementById('add-to-new-list-button').addEventListener('click', function() {
  let listTitle = document.getElementById("new-list-title").value.trim();
  let displayName = document.getElementById("new-display-name").value.trim() || "Unknown";
  
  // at least a list title should be present
  if (!listTitle) return alert("All lists require a title!");

  // check for characters that will cause trouble but aren't that useful
  if ((listTitle.includes("<") && listTitle.includes(">")) || listTitle.includes(".") || listTitle.includes("{") || listTitle.includes("}")) {
    document.getElementById('new-list-title').value = '';
    return alert("Some characters are not allowed in tags, sorry!");
  } 
  
  if ((displayName.includes("<") && displayName.includes(">")) || displayName.includes(".") || displayName.includes("{") || displayName.includes("}")) {
    document.getElementById('new-list-title').value = '';
    return alert("Some characters are not allowed in tags, sorry!");
  }

  // enforce reserved list name 
  if (listTitle.toUpperCase() === "MY FAVORITES") {
    document.getElementById('new-list-title').value = '';
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
document.addEventListener('DOMContentLoaded', function() {
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
  hideClass('hide_when_logged_in');
  // $('.hide_when_logged_in').addClass('hide_me');
  showClass('hide_when_logged_out');
  // $('.hide_when_logged_out').removeClass('hide_me');
  document.getElementById('full_menu_login_logout_container').classList.remove('hide_me');
  // $('#full_menu_login_logout_container').show();
  document.getElementById('login_button').classList.add('hide_me');
  // $('#login_button').hide();
  document.getElementById('full_menu_login_button').classList.add('hide_me');
  // $('#full_menu_login_button').hide();
  document.getElementById('logout_button').classList.remove('hide_me');
  // $('#logout_button').show();
  document.getElementById('full_menu_logout_button').classList.remove('hide_me');
  // $('#full_menu_logout_button').show();

  hideClass('info-card-login-button');
  // $('.info-card-login-button').hide();
  document.getElementById('tag-update-button').classList.remove('hide_me');
  // $('#tag-update-button').show();
  document.getElementById('connection-update-button').classList.remove('hide_me');
  // $('#connection-update-button').show();
  document.getElementById('list-update-button').classList.remove('hide_me');
  // $('#list-update-button').show();

  getAlbumDetails(true);
}

function userIsLoggedOut() {
  hideClass('hide_when_logged_out');
  // $('.hide_when_logged_out').addClass('hide_me');
  showClass('hide_when_logged_in');
  // $('.hide_when_logged_in').removeClass('hide_me');
  document.getElementById('full_menu_login_logout_container').classList.remove('hide_me');
  // $('#full_menu_login_logout_container').show();
  document.getElementById('login_button').classList.remove('hide_me');
  // $('#login_button').show();
  document.getElementById('full_menu_login_button').classList.remove('hide_me');
  // $('#full_menu_login_button').show();
  document.getElementById('logout_button').classList.add('hide_me');
  // $('#logout_button').hide();
  document.getElementById('full_menu_logout_button').classList.add('hide_me');
  // $('#full_menu_logout_button').hide();

  showClass('info-card-login-button');
  // $('.info-card-login-button').show();
  document.getElementById('tag-update-button').classList.add('hide_me');
  // $('#tag-update-button').hide();
  document.getElementById('connection-update-button').classList.add('hide_me');
  // $('#connection-update-button').hide();
  document.getElementById('list-update-button').classList.add('hide_me');
  // $('#list-update-button').hide();

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
addClassEventListener('info-card-login-button', 'click', logIn);
// ----- END FIREBASE AUTH SECTION ------