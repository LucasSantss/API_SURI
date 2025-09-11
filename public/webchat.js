window.cbAsyncInit = function () {
    CBM.ChatbotId = "cb83498626";

    CBM.StartWebChat().then(webChat => {

    }).catch(reason => {

    });
};
(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "https://webchat.chatbotmaker.io/cbm-jssdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'cbm-jssdk'));

// CREATE TABLE IF NOT EXISTS webhooks (
//   id SERIAL PRIMARY KEY,
//   payload JSONB NOT NULL,
//   received_at TIMESTAMP DEFAULT NOW()
// );
