
var albumId = ""
var artist = ""
var album = ""
var currentTags = []
var currentAuthors = []
var allJSON = []
var step = -1

function pullOldTags() {

    $.getJSON ( '/utilities/oldtags', function(rawData) {     
        // OLD TAGS KEYS
        //  _id, 
        // albumId, 
        // tags, 
        // createdBy
        // author may come in as blank, Joshua Jones, or Ol5d5mjWi9eQ7HoANLhM4OFBnso2

        // let allIDs = []
        // for (let index = 0; index < rawData.length; index++) {
        //     let element = rawData[index];
        //     allIDs.push(element.albumId)
        // }

        // let duplicateRecords = []
        // for (let index = 0; index < allIDs.length; index++) {
        //     let element = allIDs[index];

        //     if (duplicateRecords.indexOf(element) != -1) {
        //         duplicateRecords.push(element)
        //     }
        // }

        // console.log(duplicateRecords)
        for (let index = 0; index < rawData.length; index++) {
            const element = rawData[index];
            allJSON.push(element)
        }

    })  
    
}



function stepTwo() {

    let oldTag = allJSON[step];
    albumId = oldTag.albumId
    currentTags = oldTag.tags
    currentAuthors = []
    
    if(oldTag.createdBy == undefined){
        // no authors array exists
        for (let index = 0; index < currentTags.length; index++) {
            currentAuthors.push("Ol5d5mjWi9eQ7HoANLhM4OFBnso2")
        }
    } else {
        currentAuthors = oldTag.createdBy
        let correctedAuthors = []
        for (let index = 0; index < currentAuthors.length; index++) {
            let element = currentAuthors[index];
            if (element == "Joshua Jones") {
                correctedAuthors.push("Ol5d5mjWi9eQ7HoANLhM4OFBnso2")
            } else {
                correctedAuthors.push(element)
            }
        }
        currentAuthors = correctedAuthors
    }
    // setTimeout(function(){ getArtistAlbum() }, 2000);
}

function getArtistAlbum() {
    $.getJSON ( '/utilities/apple/' + albumId, function(rawData) {
        artist = rawData.data[0].attributes.artistName;
        album = rawData.data[0].attributes.name;
    })

    // setTimeout(function(){ addTagInfo() }, 2000);
};





function postBlankTag() {

    // Use AJAX to post the new tag in the database   
    $.ajax(`newtags/database/${albumId}`, {
        method: 'POST',
        contentType: 'application/json',
        processData: false,
        // have to convert albumId to string so it works with the rest of app logic
        data: JSON.stringify(
        {
            "albumId" : albumId.toString(), 
            "tags" : [], 
            "createdBy" : [],
            "artistName" : artist,
            "albumName" : album
        })
    })

    // setTimeout(function(){ addTagInfo() }, 3000);
};


function addTagInfo() {

    // needs to come in with a currentTags and currentAuthors arrays
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

    // var confirmation = confirm(`Ready to post?
    //     { 
    //         "tags" : ${currentTags}, 
    //         "createdBy" : ${JSON.stringify(createdByObject)},
    //         "artistName" : ${artist},
    //         "albumName" : ${album}
    //     }`
    // );
    // if (confirmation === true) {
        // PUT TO NEW TAGS
        $.ajax(`newtags/database/${albumId}`, {
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
        })
    // }
};

function stepOne() {
    step = step + 1
}

function startEverything() {
    setInterval(function() {
        stepOne()
        setTimeout(function(){ stepTwo() }, 2000)
        setTimeout(function(){ getArtistAlbum() }, 4000)
        setTimeout(function(){ postBlankTag() }, 6000)
        setTimeout(function() { addTagInfo() }, 8000)      
    }, 10000);
}

pullOldTags() // once
// each loop
// stepOne()
// setTimeout(function(){ stepTwo() }, 1000)
// setTimeout(function(){ getArtistAlbum() }, 2000)
// setTimeout(function() { addTagInfo() }, 3000)