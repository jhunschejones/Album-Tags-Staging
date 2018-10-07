// ---------- BEGIN UTILITIES ------------
console.log('The custom script for the update page is running');

function scrollToTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

// using regular expression to make first letter of each
// word upper case, even if it is seperated with a "-"
function toTitleCase(str) {
    return str.replace(/\b\w+/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// removes accidental double spaces
function removeExtraSpace(str) {
    return str.replace(/\s\s+/g, ' ');
}

// replaces back slash with underscore
function replaceBackSlashWithUnderscore(str) {
    return str.replace(/\//g, '_');
}

function replaceUnderscoreWithBackSlash(str) {
    return str.replace(/_/g, "/");
};

// I'm using this variable and function to reformat the date provided in Apple's API
// into a fully written-out and formated date
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function makeNiceDate(uglyDate) {
    let year = uglyDate.slice(0, 4);
    let day = uglyDate.slice(8, 10);
    let uglyMonth = uglyDate.slice(5, 7); 
    let niceMonth = months[uglyMonth-1];
    return(`${niceMonth} ${day}, ${year}`);
};

// ---------------- END UTILITIES ---------------


// This is really messy, but the album Id is stored in the ejs file in a hidden 
// element. It comes in as a string so I'm converting it to a number to use in
// my logic below
var albumId = $(".heres_the_album_id").text();
albumId = parseInt(albumId);
var currentTags = [];
var currentAuthors = [];
// var tagsForThisAlbum
var totalAuthors
var artist
var album
var newEntry = false;


function populateAlbumInfo() {
    $.getJSON ( '/api/v1/apple/albumdetails/' + albumId, function(rawData) {
        artist = rawData.data[0].attributes.artistName;
        album = rawData.data[0].attributes.name;
        var label = rawData.data[0].attributes.recordLabel;
        // the replaceing at the end here is setting the width and height of the image
        var cover = rawData.data[0].attributes.artwork.url.replace('{w}', 500).replace('{h}', 500);
        var applemusicurl = rawData.data[0].attributes.url;
        // calling my makeNiceDate function from below to format the date
        var release = makeNiceDate(rawData.data[0].attributes.releaseDate);
        
        $('.albumdetails_artist').append(`<span onclick="moreByThisArtist('${artist}')" data-toggle="tooltip" data-placement="right" title="Search This Artist" data-trigger="hover" style="cursor:pointer;">${artist}</span>`);
        // $('.albumdetails_album').append(album, '<br>');
        $('.albumdetails_album').append(`<span id="the_album_name" data-toggle="tooltip" data-placement="right" title="Click to Show Album ID" data-trigger="hover" onclick="showAlbumID()" style="cursor:pointer;">${album}</span><span id="the_album_id" class="text-secondary" data-toggle="tooltip" data-placement="right" title="Select & Copy Album ID" data-trigger="hover" style="display:none;">${albumId}</span>`);
        $('.albumdetails_details img').attr("src", cover, '<br');
        // adding path to apple music to button
        $('.applemusicurl').attr("href", applemusicurl, '<br>');
        $('.albumdetails_label').append(label, '<br>');
        $('.albumdetails_release').append(release, '<br>');
    });
};

// this populates the Tags card with any tags stored in the mongodb database
// and retrieved by the router stored at the URL listed with the album number
function populateTags(reason) {

    // console.log("populate tags called")
    $.getJSON ( '/api/v1/tags/' + albumId, function(rawData) {
        if (typeof(rawData[0]) != "undefined") {
            $('.tag_results').text('');
            currentTags = [];
            currentAuthors = [];
            var thisAlbumData = rawData[0].createdBy

            for (let index = 0; index < thisAlbumData.length; index++) {
                var element = thisAlbumData[index];
                var tag = element.tag
                var author = element.author

                tag = replaceUnderscoreWithBackSlash(tag);
                currentTags.push(tag);
                currentAuthors.push(author);

                // creating a unique tag for each element, solving the problem of number tags not allowed
                // by adding some letters to the start of any tag that can be converted to a number
                // then using a regular expression to remove all spaces in each tag
                if (parseInt(tag)) {
                    var addLetters = "tag_";
                    var tagName = addLetters.concat(tag).replace(/\s/g,'');
                } else {                  
                    var tagName = tag.replace(/\s/g,'');
                }

                // Here we add the tags as elements on the DOM, with an onclick function that uses a unique
                // tag to toggle a badge-success class name and change the color
                // NOTE: rel is set to the index of this specific element in the author and tag arrays
                // this update was made to allow deletion of a specific element when there are duplciates
                $('.tag_results').append(`<tr class="album_details_tags update_tags author-${author}"><td>${tag}</td><td><a href="#" class="deletetaglink" rel="${index}">Delete</a></td></tr>`);              
            }
            $(".update_tags").hide();
        } else {
            // create database entry if none exists
            // postTags();
            newEntry = true; 
        };
    }).then(function(){
        let tagsForThisAlbum = $(".update_tags")
        for (let index = 0; index < tagsForThisAlbum.length; index++) {
            let thisTag = tagsForThisAlbum[index];
            // console.log(thisTag)
    
            if($(thisTag).hasClass(`author-${userID}`)) {
                // console.log("tag belongs to this author")
                $(thisTag).show()
            } else {
                // console.log("tag does not belong to this author")
                $(thisTag).hide()
            }
        }
    }).then(function() {
        if (reason == "add" & currentAuthors.length != (totalAuthors + 1)){
            // console.log("Repeating function to add")
            populateTags("add");
        } else if (reason == "delete" & currentAuthors.length != (totalAuthors - 1)){
            // console.log("Repeating function to delete")
            populateTags("delete");
        } else {
            // this is not a request to update or delete a tag, do not re-run the function
        }
    })
};



function addTag() {
    event.preventDefault();
    totalAuthors = currentAuthors.length

    // if (newEntry == true) { 
    //     postTags();
    //     newEntry = false;
    // }

    if ($('#new_tag').val()) {
        var newTag = $('#new_tag').val();
        newTag = removeExtraSpace(toTitleCase(replaceBackSlashWithUnderscore(newTag))).trim();
        var newAuthor = userID;

        // isThisADuplicate will have a value of -1 if tag is not a duplicate 
        // at all, otherwise will check if index matchs index of current user 
        // in currentAuthors meaning this user already created this tag. If 
        // tag exists from another userwill let current user add their own tag 
        // with same name
        var isThisADuplicate = currentTags.indexOf(newTag);

        if (isThisADuplicate == -1 || currentAuthors[isThisADuplicate] != newAuthor) {
            currentTags.push(newTag);
            currentAuthors.push(newAuthor);
            $(".warning_label").text('')
        } else {
            $(".warning_label").text(`You already added the '${newTag}' tag to this album.`);
            $('#new_tag').val('');
            // leave function before posting
            return
        };
        
        // MAKE TAG-AUTHOR OBJECTS
        var createdByObject = []
        for (let index = 0; index < currentTags.length; index++) {
            let tag = currentTags[index];
            let author = currentAuthors[index];
            
            let newTagAuthorObject = 
            {
                "tag": tag,
                "author": author
            }
            createdByObject.push(newTagAuthorObject)
        }
    
        // PUT TO NEW TAGS
        $.ajax(`/api/v1/tags/${albumId}`, {
            method: 'PUT',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(
            { 
                "tags" : currentTags, 
                "createdBy" : createdByObject,
                "artistName" : artist,
                "albumName" : album
            })
        }).then(populateTags("add"))
    } else {
        $(".warning_label").text("Please enter a non-empty tag.")
    } 

    $('#new_tag').val('');
};

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
    event.preventDefault();
    var confirmation = confirm('Are you sure you want to delete a tag?');

    if (confirmation === true) {
        totalAuthors = currentAuthors.length

        var index = $(this).attr('rel')
        currentTags.splice(index, 1);
        currentAuthors.splice(index, 1);

        var createdByObject = []
        for (let index = 0; index < currentTags.length; index++) {
            let tag = currentTags[index];
            let author = currentAuthors[index];
            
            let newTagAuthorObject = 
            {
                "tag": tag,
                "author": author
            }
            createdByObject.push(newTagAuthorObject)
        }

        $.ajax(`/api/v1/tags/${albumId}`, {
            method: 'PUT',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(
            { 
                "tags" : currentTags, 
                "createdBy" : createdByObject,
                "artistName" : artist,
                "albumName" : album
            })
        }).then(populateTags("delete"))
    }
};

//
// REMOVING POST FUNCTIONALITY, USING UPSERT 
// IN PUT REQUEST AT NEW API ROUT INSTEAD
//
// function postTags() {
//     // Use AJAX to post the new record in the database   
//     $.ajax(`/api/v1/tags`, {
//         method: 'POST',
//         contentType: 'application/json',
//         processData: false,
//         // have to convert albumId to string so it works with the rest of app logic
//         data: JSON.stringify(
//         {
//             "albumId" : albumId.toString(), 
//             "tags" : [], 
//             "createdBy" : [],
//             "artistName" : artist,
//             "albumName" : album
//         })
//     })
// };


function moreByThisArtist(artist) {
    sessionStorage.setItem('artist', artist);
    window.location.href = '/search'
}

function scrollDown() {
    if (isTouchDevice == true & screen.width < 570) {
        window.scrollTo(0,document.body.scrollHeight)
    }
}

// long functions called here, waiting for page to load before calling
// the api and database calls
$( document ).ready( function() {
    populateAlbumInfo();
    // callng this in user auth script
    // populateTags("start");
})

// event listener called when enter is pressed with value in text form
$("form").submit(function (e) {
    e.preventDefault();
    addTag();
});

// event listener for clicking delete link
$('#tags_table tbody').on('click', 'td a.deletetaglink', deleteTag);

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
    }, 1000);
})
// combine with data-trigger="hover" in html element 
// for desired behavior
// -------------- end tooltips section --------------
