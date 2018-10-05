// used to copy folder path to clipboard for modern browsers
function copyToClipboard() {
    var text = document.getElementById('userInput').value;


    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text); 

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}


function clearTextField() {
    document.getElementById('userInput').value='';
}

function populateUserData() {
    try {
        document.getElementById('userEmail').value = userEmail;    
    } catch (error) {
        // User not logged in
    }
    try {
        if (userID = 'undefined') {
            document.getElementById('userID').value = "No User ID Available";
        } else {
            document.getElementById('userID').value = userID;  
        }     
    } catch (error) {
        // User not logged in
    }
}

