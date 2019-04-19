// ====== START UTILITY FUNCTIONS ======
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js mylists.script.js --js_output_file mylists.script.min.js`
// ======
function removeByID(arr, ID) {
  return arr.filter(function(ele){
    return ele.id != ID;
  });
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

function stringToNode(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild;
}

function addClassEventListener(selector, eventType, myFunction) {
  const c = document.getElementsByClassName(selector);
  for (let i = 0; i < c.length; i++) {
    c[i].addEventListener(eventType, myFunction);
  }
}
// ====== END UTILITY FUNCTIONS ======

let allLists;

async function getAllLists() {
  let response = await fetch("/api/v1/list/user/" + userID);
  if (!response.ok) throw Error(response.statusText);
  let data = await response.json();
  if (data.message) {
    allLists = [];
  } else {
    allLists = data;
  }
  document.getElementById('main-page-loader').classList.add('hide_me');
  // $('#main-page-loader').hide();
  populateAllLists();

  // $.ajax({
  //   method: "GET",
  //   url: "/api/v1/list/user/" + userID,
  //   success: function(data) {
  //     if (data.message) {
  //       allLists = [];
  //     } else {
  //       allLists = data;
  //     }
  //     $('#main-page-loader').hide();
  //     populateAllLists();
  //   }
  // });
}

async function removeList(listID) {
  let thisList = allLists.find(x => x.id === parseInt(listID));
  let confirmed = confirm(`Are you sure you want to delete your list "${thisList.title}"? You cannot undo this operation.`);

  if (confirmed) {
    let response = await fetch("/api/v1/list/" + listID, {
      method: 'delete',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();
    allLists = removeByID(allLists, listID);
    populateAllLists();

    // $.ajax({
    //   method: "DELETE",
    //   url: "/api/v1/list/" + listID,
    //   success: function() {
    //     allLists = removeByID(allLists, listID);
    //     populateAllLists();
    //   }
    // });
  } 
}

function populateAllLists() {
  document.getElementById('no-lists-message').classList.remove('hide_me');
  // $("#no-lists-message").hide();
  document.getElementById('all-lists').innerHTML = '';
  if (allLists.length > 0) {
    allLists = allLists.sort((a, b) => (a.title > b.title) ? 1 : -1);
    for (let index = 0; index < allLists.length; index++) {
      const list = allLists[index];
      let listCreator = list.displayName;
      if (!listCreator || listCreator.trim === "") { listCreator = "Unknown"; }
      
      let listAlbumImages = [];
      if (list.albums) {
        for (let index = 0; index < list.albums.length && index < 4; index++) {
          const album = list.albums[index];
          listAlbumImages.push(album.cover.replace('{w}', 130).replace('{h}', 130));
        }
      }

      const shortTitle = list.title.length > 40 ? truncate(list.title, 40) : list.title;

      const listImage = `<div class="list-image-background"><div class="row no-gutters"><div class="col"><img src="${listAlbumImages[0] || ""}" class="list-image"></img></div><div class="col"><img src="${listAlbumImages[1] || ""}" class="list-image"></img></div></div><div class="row no-gutters"><div class="col"><img src="${listAlbumImages[2] || ""}" class="list-image"></img></div><div class="col"><img src="${listAlbumImages[3] || ""}" class="list-image"></img></div></div></div>`;

      document.getElementById('all-lists').appendChild(stringToNode(`<div><div id="card-${index}" class="card list-card">${listImage}<div class="list-card-text"><h5 class="card-title list-title"><span class="long-list-title">${list.title}</span><span class="short-list-title">${shortTitle}</span></h5><p class="card-text text-secondary list-creator">by: ${listCreator}</p></div></div><span class="list-delete-button" data-list-id="${list.id}" data-toggle="tooltip" data-placement="right" title="Delete this list" data-trigger="hover">&#10005;</span></div>`));
      // $('#all-lists').append(`<div><div id="card-${index}" class="card list-card">${listImage}<div class="list-card-text"><h5 class="card-title list-title"><span class="long-list-title">${list.title}</span><span class="short-list-title">${shortTitle}</span></h5><p class="card-text text-secondary list-creator">by: ${listCreator}</p></div></div><span class="list-delete-button" data-list-id="${list.id}" data-toggle="tooltip" data-placement="right" title="Delete this list" data-trigger="hover">&#10005;</span></div>`);

      document.getElementById(`card-${index}`).addEventListener('click', function(event) {
        event.preventDefault();
        window.location.href = `/list?type=userlist&id=${list.id}`;
      });
    }
  
    // ====== add event listener to delete buttons =====
    addClassEventListener('list-delete-button', 'click', function(event) {
      event.preventDefault();
      removeList(this.dataset.listId); 
    });
  } else {
    document.getElementById('no-lists-message').classList.remove('hide_me');
    // $("#no-lists-message").show();
  }
}

async function createNewList(listTitle, displayName) {
  // check to see if this user has a list with the same name
  let confirmed = true;
  let listExists = allLists.find(x => x.title.toUpperCase() === listTitle.toUpperCase());
  if (listExists) { confirmed = confirm(`You already have a list called "${listExists.title}". Choose "ok" to create a new list, "cancel" to go back.`); }

  // user either said okay to create a duplicate list, or there
  // is no other list with this name by this user
  if (confirmed) {
    if (listTitle && displayName) {
      let newList = {
        user: userID,
        displayName: displayName,
        title: listTitle,
        isPrivate: false,
        albums: []
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
        allLists.push(data);
        populateAllLists();
        new Modal(document.getElementById('updateListModal')).hide();
        // $('#updateListModal').modal('hide');
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
      //     if(!data.message) {
      //       allLists.push(data);
      //       populateAllLists();
      //       $('#updateListModal').modal('hide');
      //       $('#new-list-title').val('');
      //       $('#new-display-name').val('');
      //     } else {
      //       alert(data.message);
      //     }
      //   }
      // });
    }
  } 
}

document.getElementById('add-new-list-button').addEventListener('click', function(event) {
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
    document.getElementById('new-list-title').value = '';
    return;
  } else if ((displayName.includes("<") && displayName.includes(">")) || displayName.includes(".") || displayName.includes("{") || displayName.includes("}")) {
    alert("Some characters are not allowed in tags, sorry!");
    document.getElementById('new-display-name').value = '';
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
    createNewList(escapeHtml(listTitle), escapeHtml(displayName));
    document.getElementById("new-display-name").value = "";
    document.getElementById("new-list-title").value = "";
  }
});

document.getElementById('new-list-title').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-new-list-button').click();
  }
});
document.getElementById('new-display-name').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-new-list-button').click();
  }
});

// ----- START FIREBASE AUTH SECTION ------
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
    getAllLists();

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

    document.getElementById('login-message').classList.add('hide_me');
    // $('#login-message').hide();
    document.getElementById('all-lists').classList.remove('hide_me');
    // $('#all-lists').show();
    document.getElementById('launch-new-list-modal-button').classList.remove('hide_me');
    // $('#launch-new-list-modal-button').show();
    document.getElementById('info-modal-button').classList.remove('hide_me');
    // $('#info-modal-button').show();
  } else {   
    // no user logged in
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

    document.getElementById('main-page-loader').classList.add('hide_me');
    // $('#main-page-loader').hide();  
    document.getElementById('login-message').classList.remove('hide_me');
    // $('#login-message').show();
    document.getElementById('all-lists').classList.add('hide_me');
    // $('#all-lists').hide();
    document.getElementById('launch-new-list-modal-button').classList.add('hide_me');
    // $('#launch-new-list-modal-button').hide();
    document.getElementById('info-modal-button').classList.add('hide_me');
    // $('#info-modal-button').hide();
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
    getAllLists();

    document.getElementById('login-message').classList.add('hide_me');
    // $('#login-message').hide();
    document.getElementById('all-lists').classList.remove('hide_me');
    // $('#all-lists').show();
    document.getElementById('launch-new-list-modal-button').classList.remove('hide_me');
    // $('#launch-new-list-modal-button').show();
    document.getElementById('info-modal-button').classList.remove('hide_me');
    // $('#info-modal-button').show();

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

  }).catch(function(error) {
    // Handle Errors here.
  });
}

function logOut() {
  firebase.auth().signOut().then(function() {
    // log out functionality
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

    document.getElementById('login-message').classList.remove('hide_me');
    // $('#login-message').show();
    document.getElementById('all-lists').classList.add('hide_me');
    // $('#all-lists').hide();
    document.getElementById('launch-new-list-modal-button').classList.add('hide_me');
    // $('#launch-new-list-modal-button').hide();
    document.getElementById('info-modal-button').classList.add('hide_me');
    // $('#info-modal-button').hide();

  }).catch(function(error) {
  // An error happened.
  });
}

// add event listener to log in and out buttons
document.getElementById("login_button").addEventListener("click", logIn);
document.getElementById("full_menu_login_button").addEventListener("click", logIn);
document.getElementById("logout_button").addEventListener("click", logOut);
document.getElementById("full_menu_logout_button").addEventListener("click", logOut);
addClassEventListener('login_button', 'click', logIn);
// $('.login_button').on('click', logIn);
// ----- END FIREBASE AUTH SECTION ------