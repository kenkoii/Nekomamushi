// Set up context menu at install time.
chrome.runtime.onInstalled.addListener(function() {
  var context = "selection";
  var title = "Add to Favorites";
  var id = chrome.contextMenus.create({"title": title, "contexts":[context],
                                         "id": "context" + context});  
});

// add click event
chrome.contextMenus.onClicked.addListener(onClickHandler);

// The onClicked callback function.
function onClickHandler(info, tab) {
    var sText = info.selectionText;
//   var url = "https://www.google.com/search?q=" + encodeURIComponent(sText);  
    // var url = "https://diktoapi.appspot.com/api/v1/favorite";
    var url = "http://localhost:8080/api/v1/favorite";
//   window.open(url, '_blank');
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, false);
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.send(JSON.stringify(
        {id: sText,
	    userid: "20001",
	    password: "3829"}));
    // xhr.send(JSON.stringify(data));
    xhr.onreadystatechange = function() 
    { 
        // if(xhr.readyState == 4 && xhr.status == 204) 
        // { 
        //         //debugger;
        //         alert("Logged in");
        //         flag = 1;
        //         _callBack(xhr, xhr.readyState);
        // }
        if(xhr.readyState == 4 && xhr.status == 200) {
            alert('yahooo!!!!');
        } else {
            alert('failed!!!!');
        }
    }
};