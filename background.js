// Set up context menu at install time.
chrome.runtime.onInstalled.addListener(function() {
    var context = "selection";
    var title = "Eigo Monogatari / 英語物語";
    chrome.contextMenus.create({"title": title, "contexts": [context], "id": "root"});
    chrome.contextMenus.create({
                                "title": "Add to Favorites",
                                "contexts": [context],
                                "parentId": "root",
                                "id": "child"
                                });
});

// add click event
chrome.contextMenus.onClicked.addListener(onClickHandler);

// The onClicked callback function.
function onClickHandler(info, tab) {
    // var url = "https://diktoapi.appspot.com/api/v1/favorite";
    var url = "http://localhost:8080/api/v1/favorite";
    var sText = info.selectionText;
    var data = {id: sText, userid: "20001", password: "3829"};
    $.ajax({
        url:url,
        type:"POST",
        data:JSON.stringify(data),
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: function(){
            alert('You added ' + sText + ' to your favorites!');
        }
    })
};