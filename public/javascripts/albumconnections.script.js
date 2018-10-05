// --------- START UTILITIES --------
console.log('The custom script for album connections is running');

function hideDOMelement(elementId) {
    try {
        let element = document.getElementById(elementId)
        element.style.display = "none";
    } catch (error) {
        // this element does not exist here
    }
}

function showDOMelement(elementId) {
    try {
        let element = document.getElementById(elementId)
        element.style.display = "block";
    } catch (error) {
        // this element does not exist here
    }
}
// --------- END UTILITIES --------

// ----- START FIREBASE ALBUM CONNECTIONS SECTION ------
var connectedAlbums = [];
var directConnections = [];

function updateConnectedAlbums() {
    var connectionsRefrence = connectionsDatabase.ref().child(albumId);
    connectionsRefrence.on('value', snap => {
        connectedAlbums = snap.val() || [];

        populateConnections();
    });
}
// ----- END FIREBASE ALBUM CONNECTIONS SECTION ------


// drills through directConnections to pull out connected albums and show them on the page
function populateConnections() {
    $(".connection_results").text('');
    directConnections = [];

    if(connectedAlbums.length !=0) {
        
        for (let index = 0; index < connectedAlbums.length; index++) {
            let connected = connectedAlbums[index];
            let connection = connected.connection
            let author = connected.author;

            // curating a directConnections array for later use in finding indirectConnections
            directConnections.push(connection)

            if (connected.connection != albumId) {
                $.getJSON ( '/albumdetails/json/' + parseInt(connection), function(rawData) {
                    var cover = rawData.data[0].attributes.artwork.url.replace('{w}', 105).replace('{h}', 105);

                    $('.connection_results').append(`<a href="/albumdetails/${connection}" id="${connection}" class="connection author-${author}"><img class="small_cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="Album Details" data-trigger="hover"></a>`)
                }).then(function() {
                    // this check lets the call remain async but only calls checkConnectionDisplayPrefrences
                    // once when its done looping through all the connections
                    if ((index + 1) == connectedAlbums.length) {
                        checkConnectionDisplayPrefrences()
                    }
                });
            }
        }
    } else {
        //there are no connected albums
        checkConnectionDisplayPrefrences();
    }
}
