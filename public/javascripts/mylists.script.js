// ====== START UTILITY FUNCTIONS ======
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js mylists.script.js --js_output_file mylists.script.min.js`
// ======
function removeByID(arr, ID) {
  return arr.filter(function(ele){
    return ele._id != ID;
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

// ====== END UTILITY FUNCTIONS ======

let allLists;

function getAllLists() {
  $.ajax({
    method: "GET",
    url: "/api/v1/list/user/" + userID,
    success: function(data) {
      allLists = data;
      $('#main-page-loader').hide();
      populateAllLists();
    }
  });
}

function removeList(listID) {
  let thisList = allLists.find(x => x._id === listID);
  let confirmed = confirm(`Are you sure you want to delete your list "${thisList.title}"? You cannot undo this operation.`);

  if (confirmed) {
    $.ajax({
      method: "DELETE",
      url: "/api/v1/list/" + listID,
      success: function() {
        allLists = removeByID(allLists, listID);
        populateAllLists();
      }
    });
  } 
}

function populateAllLists() {
  $("#no-lists-message").hide();
  $('#all-lists').html('');
  if (allLists.length > 0) {
    for (let index = 0; index < allLists.length; index++) {
      const list = allLists[index];
      let listCreator = list.displayName;
      if (listCreator.trim === "") { listCreator = "Unknown"; }
      
      let listAlbumImages = [];
      for (let index = 0; index < list.albums.length && index < 4; index++) {
        const album = list.albums[index];
        listAlbumImages.push(album.cover.replace('{w}', 130).replace('{h}', 130));
      }

      const shortTitle = list.title.length > 40 ? truncate(list.title, 40) : list.title;

      const listImage = `<div class="list-image-background"><div class="row no-gutters"><div class="col"><img src="${listAlbumImages[0] || ""}" class="list-image"></img></div><div class="col"><img src="${listAlbumImages[1] || ""}" class="list-image"></img></div></div><div class="row no-gutters"><div class="col"><img src="${listAlbumImages[2] || ""}" class="list-image"></img></div><div class="col"><img src="${listAlbumImages[3] || ""}" class="list-image"></img></div></div></div>`;

      $('#all-lists').append(`<div><div id="card-${index}" class="card list-card">${listImage}<div class="list-card-text"><h5 class="card-title list-title"><span class="long-list-title">${list.title}</span><span class="short-list-title">${shortTitle}</span></h5><p class="card-text text-secondary list-creator">by: ${listCreator}</p></div></div><span class="list-delete-button" data-list-id="${list._id}" data-toggle="tooltip" data-placement="right" title="Delete this list" data-trigger="hover">&#10005;</span></div>`);

      $(`#card-${index}`).click(function(event) {
        event.preventDefault();
        window.location.href = `/list?type=userlist&id=${list._id}`;
      });
    }
  
    // ====== add event listener to delete buttons =====
    $(".list-delete-button").on("click", function(event) { 
      event.preventDefault();
      removeList($(this).attr("data-list-id")); 
    });
  } else {
    $("#no-lists-message").show();
  }
}

function addToNewList(listTitle, displayName) {

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
      $.ajax({
        method: "POST",
        url: "/api/v1/list/",
        contentType: 'application/json',
        data: JSON.stringify(newList),
        success: function(data) {
          if(!data.message) {
            allLists.push(data);
            populateAllLists();
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

$('#add-new-list-button').click(function(event) {
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

$("#new-list-title").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-new-list-button").click();
  }
});
$("#new-display-name").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-new-list-button").click();
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

    $('#full_menu_login_logout_container').show();
    $('#login_button').hide();
    $('#full_menu_login_button').hide();
    $('#logout_button').show();
    $('#full_menu_logout_button').show();

    $('#page-title').show();
    $('#login-message').hide();
    $('#all-lists').show();
    $('#launch-new-list-modal-button').show();
    $('#info-modal-button').show();
  } else {   
    // no user logged in
    $('#full_menu_login_logout_container').show();
    $('#login_button').show();
    $('#full_menu_login_button').show();
    $('#logout_button').hide();
    $('#full_menu_logout_button').hide();

    $('#main-page-loader').hide();  
    $('#login-message').show();
    $('#page-title').hide();
    $('#all-lists').hide();
    $('#launch-new-list-modal-button').hide();
    $('#info-modal-button').hide();
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

    $('#login-message').hide();
    $('#page-title').show();
    $('#all-lists').show();
    $('#launch-new-list-modal-button').show();
    $('#info-modal-button').show();

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
    // log out functionality
    $('#full_menu_login_logout_container').show();
    $('#login_button').show();
    $('#full_menu_login_button').show();
    $('#logout_button').hide();
    $('#full_menu_logout_button').hide();

    $('#login-message').show();
    $('#page-title').hide();
    $('#all-lists').hide();
    $('#launch-new-list-modal-button').hide();
    $('#info-modal-button').hide();

  }).catch(function(error) {
  // An error happened.
  });
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