// Set up context menu at install time.
chrome.runtime.onInstalled.addListener(function() {
    var context = "selection";
    var title = "Eigo Monogatari / 英語物語";
    chrome.contextMenus.create({"title": title,
                                "contexts": [context],
                                "id": "root"});
    chrome.contextMenus.create({
                                "title": "Add 「 %s 」 to Favorites",
                                "contexts": [context],
                                "parentId": "root",
                                "id": "child"
                                });
});

// add click event
chrome.contextMenus.onClicked.addListener(onClickHandler);

// The onClicked callback function.
function onClickHandler(info, tab) {
    console.log("Add Favorite button clicked!");
    
    // var url = "https://2-dot-diktoapi.appspot.com/api/v1/favorite"
    var sText = info.selectionText;
    chrome.storage.sync.get("loggedInUser",function(result){
        console.log('loggedInUser' in result);
        if('loggedInUser' in result) {
            
            var data = {id: sText, userid: result["loggedInUser"].id + "", password: result["loggedInUser"].password + ""};
            var url = "https://diktoapi.appspot.com/api/v1/favorite";
            console.log('data: ', data);
            $.ajax({
                url: url,
                type:"POST",
                data:JSON.stringify(data),
                contentType:"application/json; charset=utf-8",
                dataType:"json"
            }).then(function(res){
                alert('You added ' + sText + ' to your favorites!');
            }).catch(function(err){
                console.log(err);
            });
        } else {
            alert('Please login before you can add to your favorites!');
        }
    });
};