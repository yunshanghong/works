$(document).ready(function () {
  // 建立聊天室的參考物件
  // 有人輸入內容時產生動畫
  // 當typing的值 發生改變的時候 秀出動畫
  var chatroomRef = db.doc("/chatrooms/jG4TjqR7Md7Qsp8Bq4yQ");

  chatroomRef.onSnapshot(function (snapshot) {
    var chatroom = snapshot.data();
    if (chatroom.typing) {
      $("#typing").removeClass("d-none");
    } else {
      $("#typing").addClass("d-none");
    }
  });
  chatroomRef.collection("users").onSnapshot(function (snapshot) {
    snapshot.docChanges.forEach(function (change) {
      if (change.type === "added") {
        // console.log(change.doc.data());
        var user = change.doc.data();
        var html = `
        <img src="https://media.giphy.com/media/26tP0j6zKn94ZyE1y/giphy.gif" width="40px" class="rounded-circle mb-3" ">: ${user.displayName} 上線囉~~`;
        $("<li>").html(html).appendTo($("#chats"));
      }
      if (change.type === "removed") {
        // console.log(change.doc.data());
        var user = change.doc.data();
        var html = `
        <img src="https://media.giphy.com/media/26tP0j6zKn94ZyE1y/giphy.gif" width="40px" class="rounded-circle mb-3" ">: ${user.displayName} 下線囉~~`;
        $("<li>").html(html).appendTo($("#chats"));
      }
    });
  });
  // 建立聊天訊息集合參考
  var chatsRef = db.collection("/chatrooms/jG4TjqR7Md7Qsp8Bq4yQ/chats");
  chatsRef.onSnapshot(function (snapshot) {
    snapshot.docChanges.forEach(function (change) {
      if (change.type === "added") {
        // console.log(change.doc.data());
        var chat = change.doc.data();
        var html = `
        <img src="${chat.user.photoURL}" width="40px" class="rounded-circle mb-3" alt="${chat.user.displayName}">: ${chat.message}`;
        $("<li>").html(html).appendTo($("#chats"));
      }
    });
  });

  // 用google登入
  var provider = new firebase.auth.GoogleAuthProvider();
  var currentUser;
  $('#login').click(function () {
    firebase.auth().signInWithPopup(provider).then(function (result) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      currentUser = JSON.parse(JSON.stringify(result.user));
      // console.log(currentUser);
      // ...
    }).catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      // ...
    });
  })
  // 登出
  $("#logout").click(function () {
    firebase.auth().signOut().then(function () {
      // console.log(currentUser.uid);
      db.doc(`chatrooms/jG4TjqR7Md7Qsp8Bq4yQ/users/${currentUser.uid}`).delete()
      currentUser = null;
      $("#message").unbind("keypress");
    }).catch(function (error) {
      // An error happened.
    });
  })

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in.
      currentUser = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      };
      chatroomRef.collection("users").doc(`${user.uid}`).set(currentUser);
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      $("#userphoto").attr("src", photoURL);
      $("#username").text(displayName);
      $("#userphoto").removeClass("d-none");
      $("#username").removeClass("d-none");
      $("#login").addClass("d-none");
      $("#login").removeClass("d-block");
      $("#logout").removeClass("d-none");
      // console.log("ok");
      // 當有人打字的時候，修改chatroom.typing的狀態
      $("#message").keypress(function (e) {
        // console.log(e.keyCode);
        var index = new Date().getTime().toString();
        chatroomRef.update({
          typing: true
        });
        // console.log(index);
        if (e.keyCode === 13) {
          // 把訊息送到firebase
          chatsRef.doc(index).set({
            message: $(this).val(),
            user: currentUser
          });
          chatroomRef.update({
            typing: false
          });
          $(this).val("");
        }
      })
    } else {
      // 登入者沒有登入->顯示登入按鈕 隱藏登出
      // console.log(user);
      $("#login").removeClass("d-none");
      $("#login").addClass("d-block");
      $("#logout").addClass("d-none");
      $("#userphoto").addClass("d-none");
      $("#username").addClass("d-none");
      chatroomRef.update({
        typing: false
      })
    }
  });
})
