"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
var ICQHttpClient_1 = require("./ICQHttpClient");
var FormDataICQ_1 = require("./FormDataICQ");
var DispatcherMessage_1 = require("./DispatcherMessage");
var ICQEvent_1 = require("../class/ICQEvent");
var SkipDuplicateMessageHandler_1 = require("./SkipDuplicateMessageHandler");
var Bot = /** @class */ (function () {
    function Bot(token, options) {
        this.running = false;
        this.lastEventId = 0;
        if (!token)
            throw new Error("Нет токена");
        this.token = token;
        this.apiBaseUrl = (options && options.apiUrlBase ? options.apiUrlBase : "https://api.icq.net/bot/v1");
        this.name = options && options.name ? options.name : "NodeBot";
        this.version = (options && options.version) ? options.version : "0.0.1";
        this.timeoutS = options && options.timeoutS ? options.timeoutS : 20;
        this.pollTimeS = options && options.pollTimeS ? options.pollTimeS : 60;
        this.dispatcher = new DispatcherMessage_1.DispatcherMessage(this);
        this.uin = this.token.split(":")[this.token.split(":").length - 1];
        this.setHttpSession(new ICQHttpClient_1.ICQHttpClient());
        // Пропускает повторяющиеся сообщения (Хранит в кэщ)
        this.dispatcher.addHandler(new SkipDuplicateMessageHandler_1.SkipDuplicateMessageHandler({}));
    }
    Bot.prototype.getDispatcher = function () {
        return this.dispatcher;
    };
    Bot.prototype.getUNI = function () {
        return this.uin;
    };
    Bot.prototype.getUserAgent = function () {
        var libraryVersion = "2.0.0-beta";
        return this.name + "/" + this.version + " (uin=" + (this.uin ? this.uin : null) + ") bot-nodejs/" + libraryVersion;
    };
    Bot.prototype.setHttpSession = function (http) {
        this.http = http;
    };
    Bot.prototype.startPolling = function () {
        var _this = this;
        try {
            if (!this.running) {
                console.log("Starting polling.");
                this.running = true;
                this.pollingThread = setTimeout(function (_) { return _this.polling(); });
            }
        }
        catch (ex) {
            console.error("Starting polling.", ex);
        }
        return this;
    };
    Bot.prototype.polling = function () {
        var _this = this;
        if (this.running) {
            // Exceptions should not stop polling thread.
            // noinspection PyBroadException
            try {
                this.eventsGet(this.pollTimeS, this.lastEventId).then(function (response) {
                    for (var _i = 0, _a = response.events; _i < _a.length; _i++) {
                        var event_1 = _a[_i];
                        _this.dispatcher.dispatch(new ICQEvent_1.ICQEvent(event_1));
                    }
                    _this.polling();
                });
            }
            catch (ex) {
                console.error("Exception while polling!", ex);
            }
        }
    };
    Bot.prototype.stop = function () {
        if (this.running) {
            console.log("Stopping bot.");
            this.running = false;
        }
        return this;
    };
    Bot.prototype.eventsGet = function (pollTimeS, lastEventId) {
        var _this = this;
        return this.http.get(this.apiBaseUrl + "/events/get", {
            token: this.token,
            lastEventId: lastEventId,
            pollTime: pollTimeS
        }, { "user-agent": this.getUserAgent() }).then(function (response) {
            return new Promise(function (r, e) {
                if (response.events) {
                    response.events.forEach(function (event) {
                        _this.lastEventId = _this.lastEventId > event.eventId ? _this.lastEventId : event.eventId;
                    });
                }
                r(response);
            });
        });
    };
    Bot.prototype.selfGet = function () {
        return this.http.get(this.apiBaseUrl + "/self/get", { token: this.token }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.sendText = function (chatId, text, replyMsgId, forwardChatId, forwardMsgId, inlineKeyboardMarkup, format) {
        if (replyMsgId === void 0) { replyMsgId = ""; }
        if (forwardChatId === void 0) { forwardChatId = ""; }
        if (forwardMsgId === void 0) { forwardMsgId = ""; }
        var options = {
            token: this.token,
            chatId: chatId,
            text: text.toString()
        };
        if (replyMsgId)
            options['replyMsgId'] = replyMsgId;
        if (forwardChatId)
            options['forwardChatId'] = forwardChatId;
        if (forwardMsgId)
            options['forwardMsgId'] = forwardMsgId;
        if (inlineKeyboardMarkup) {
            var ICQButtonList = this.getICQButtonList(inlineKeyboardMarkup);
            if (ICQButtonList)
                options['inlineKeyboardMarkup'] = JSON.stringify(ICQButtonList);
        }
        if (format) {
            if (!format.mode) {
                options['format'] = JSON.stringify(format.range);
            }
            else { 
                options['parseMode'] = `${format.mode}`; 
            }
        }
        return this.http.get(this.apiBaseUrl + "/messages/sendText", options, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.getICQButtonList = function (inlineKeyboardMarkup) {
        if (!inlineKeyboardMarkup)
            return null;
        var ICQButtonList = [];
        if (Array.isArray(inlineKeyboardMarkup[0])) {
            for (var _i = 0, _a = inlineKeyboardMarkup; _i < _a.length; _i++) {
                var bts = _a[_i];
                var line = [];
                for (var _b = 0, bts_1 = bts; _b < bts_1.length; _b++) {
                    var bt = bts_1[_b];
                    line.push(bt.getQueryStructure());
                }
                ICQButtonList.push(line);
            }
            return ICQButtonList;
        }
        else if (Array.isArray(inlineKeyboardMarkup)) {
            for (var _c = 0, _d = inlineKeyboardMarkup; _c < _d.length; _c++) {
                var bt = _d[_c];
                ICQButtonList.push(bt.getQueryStructure());
            }
            return [ICQButtonList];
        }
        else {
            return [[inlineKeyboardMarkup.getQueryStructure()]];
        }
    };
    Bot.prototype.sendFile = function (chatId, fileId, file, caption, replyMsgId, forwardChatId, forwardMsgId, inlineKeyboardMarkup, format) {
        if (file) {
            var data = new FormDataICQ_1.FormDataICQ();
            data.append("token", this.token);
            data.append("chatId", chatId);
            if (caption)
                data.append("caption", caption);
            if (replyMsgId)
                data.append("replyMsgId", replyMsgId);
            if (forwardChatId)
                data.append("forwardChatId", forwardChatId);
            if (forwardMsgId)
                data.append("forwardMsgId", forwardMsgId);
            data.appendFile("file", file);
            if (inlineKeyboardMarkup) {
                var ICQButtonList = this.getICQButtonList(inlineKeyboardMarkup);
                if (ICQButtonList)
                    data.append('inlineKeyboardMarkup', ICQButtonList);
            }
            if (format) {
                if (!format.mode) {
                    data.append('format', JSON.stringify(format.range));
                }
                else {
                    data.append('parseMode', format.mode);
                }
            }
            return this.http.post(this.apiBaseUrl + "/messages/sendFile", data, { "user-agent": this.getUserAgent() });
        }
        else {
            var option = {
                token: this.token,
                chatId: chatId,
                fileId: fileId
            };
            if (caption)
                option['caption'] = caption;
            if (replyMsgId)
                option['replyMsgId'] = replyMsgId;
            if (forwardChatId)
                option['forwardChatId'] = forwardChatId;
            if (forwardMsgId)
                option['forwardMsgId'] = forwardMsgId;
            if (inlineKeyboardMarkup) {
                var ICQButtonList = this.getICQButtonList(inlineKeyboardMarkup);
                if (ICQButtonList)
                    option['inlineKeyboardMarkup'] = JSON.stringify(ICQButtonList);
            }
            if (format) {
                if (!format.mode) {
                    option['format'] = JSON.stringify(format.range);
                }
                else {
                    option['parseMode'] = format.mode;
                }
            }
            return this.http.get(this.apiBaseUrl + "/messages/sendFile", option, { "user-agent": this.getUserAgent() });
        }
    };
    Bot.prototype.sendVoice = function (chatId, fileId, file, replyMsgId, forwardChatId, forwardMsgId, inlineKeyboardMarkup) {
        if (file) {
            var data = new FormDataICQ_1.FormDataICQ();
            data.append("token", this.token);
            data.append("chatId", chatId);
            data.append("fileId", fileId);
            if (replyMsgId)
                data.append("replyMsgId", replyMsgId);
            if (forwardChatId)
                data.append("forwardChatId", forwardChatId);
            if (forwardMsgId)
                data.append("forwardMsgId", forwardMsgId);
            if (inlineKeyboardMarkup) {
                var ICQButtonList = this.getICQButtonList(inlineKeyboardMarkup);
                if (ICQButtonList)
                    data.append('inlineKeyboardMarkup', ICQButtonList);
            }
            data.appendFile("file", file);
            return this.http.post(this.apiBaseUrl + "/messages/sendVoice", data, { "user-agent": this.getUserAgent() });
        }
        else {
            var options = {
                token: this.token,
                chatId: chatId,
                fileId: fileId
            };
            if (replyMsgId)
                options['replyMsgId'] = replyMsgId;
            if (forwardChatId)
                options['forwardChatId'] = forwardChatId;
            if (forwardMsgId)
                options['forwardMsgId'] = forwardMsgId;
            if (inlineKeyboardMarkup) {
                var ICQButtonList = this.getICQButtonList(inlineKeyboardMarkup);
                if (ICQButtonList)
                    options['inlineKeyboardMarkup'] = JSON.stringify(ICQButtonList);
            }
            return this.http.get(this.apiBaseUrl + "/messages/sendVoice", options, { "user-agent": this.getUserAgent() });
        }
    };
    Bot.prototype.editText = function (chatId, msgId, text, inlineKeyboardMarkup, format) {
        var options = {
            "token": this.token,
            "chatId": chatId,
            "msgId": msgId,
            "text": text
        };
        if (inlineKeyboardMarkup) {
            var ICQButtonList = this.getICQButtonList(inlineKeyboardMarkup);
            if (ICQButtonList)
                options['inlineKeyboardMarkup'] = JSON.stringify(ICQButtonList);
        }
        if (format) {
            if (!format.mode) {
                options['format'] = JSON.stringify(format.range);
            }
            else {
                options['parseMode'] = format.mode;
            }
        }
        return this.http.get(this.apiBaseUrl + "/messages/editText", options, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.deleteMessages = function (chatId, msgId) {
        return this.http.get(this.apiBaseUrl + "/messages/deleteMessages", {
            "token": this.token,
            "chatId": chatId,
            "msgId": msgId
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.answerCallbackQuery = function (queryId, text, showAlert, url) {
        var options = {
            "token": this.token,
            "queryId": queryId,
            "text": text
        };
        if (showAlert)
            options['showAlert'] = showAlert;
        if (url)
            options['url'] = url;
        return this.http.get(this.apiBaseUrl + "/messages/answerCallbackQuery", options, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.sendActions = function (chatId, actions) {
        return this.http.get(this.apiBaseUrl + "/chats/sendActions", {
            "token": this.token,
            "chatId": chatId,
            "actions": actions
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.getChatInfo = function (chatId) {
        return this.http.get(this.apiBaseUrl + "/chats/getInfo", {
            "token": this.token,
            "chatId": chatId
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.getChatAdmins = function (chatId) {
        return this.http.get(this.apiBaseUrl + "/chats/getAdmins", {
            "token": this.token,
            "chatId": chatId
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.getFileInfo = function (fileId) {
        return this.http.get(this.apiBaseUrl + "/files/getInfo", {
            "token": this.token,
            "fileId": fileId
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.pinMessage = function (chatId, msgId) {
        return this.http.get(this.apiBaseUrl + "/chats/pinMessage", {
            "token": this.token,
            "chatId": chatId,
            "msgId": msgId
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.unpinMessage = function (chatId, msgId) {
        return this.http.get(this.apiBaseUrl + "/chats/unpinMessage", {
            "token": this.token,
            "chatId": chatId,
            "msgId": msgId
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.setTitle = function (chatId, title) {
        return this.http.get(this.apiBaseUrl + "/chats/setTitle", {
            "token": this.token,
            "chatId": chatId,
            "title": title
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.setAbout = function (chatId, text) {
        return this.http.get(this.apiBaseUrl + "/chats/setAbout", {
            "token": this.token,
            "chatId": chatId,
            "about": text
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.setRules = function (chatId, rules) {
        return this.http.get(this.apiBaseUrl + "/chats/setRules", {
            "token": this.token,
            "chatId": chatId,
            "rules": rules
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.setAvatar = function (chatId, file) {
        var data = new FormDataICQ_1.FormDataICQ();
        data.append("token", this.token);
        data.append("chatId", chatId);
        data.appendFile("image", file);
        return this.http.post(this.apiBaseUrl + "/chats/avatar/set", data, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.getMembers = function (chatId, cursor) {
        var options = {
            "token": this.token,
            "chatId": chatId
        };
        if (cursor)
            options['cursor'] = cursor;
        return this.http.get(this.apiBaseUrl + "/chats/getMembers", options, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.deleteMembers = function (chatId, members) {
        var options = {
            "token": this.token,
            "chatId": chatId,
            "members": JSON.stringify(members)
        };
        return this.http.get(this.apiBaseUrl + "/chats/members/delete", options, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.getBlockedUsers = function (chatId) {
        return this.http.get(this.apiBaseUrl + "/chats/getBlockedUsers", {
            "token": this.token,
            "chatId": chatId
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.getPendingUsers = function (chatId) {
        return this.http.get(this.apiBaseUrl + "/chats/getPendingUsers", {
            "token": this.token,
            "chatId": chatId
        }, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.blockUser = function (chatId, userId, delLastMessages) {
        var options = {
            "token": this.token,
            "chatId": chatId,
            "userId": userId
        };
        if (delLastMessages)
            options['delLastMessages'] = true;
        return this.http.get(this.apiBaseUrl + "/chats/blockUser", options, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.unblockUser = function (chatId, userId) {
        var options = {
            "token": this.token,
            "chatId": chatId,
            "userId": userId
        };
        return this.http.get(this.apiBaseUrl + "/chats/unblockUser", options, { "user-agent": this.getUserAgent() });
    };
    Bot.prototype.resolvePending = function (chatId, approve, userId, everyone) {
        var options = {
            "token": this.token,
            "chatId": chatId,
        };
        if (approve)
            options['approve'] = true;
        if (everyone)
            options['everyone'] = true;
        if (userId)
            options['userId'] = userId;
        if (everyone == !!userId)
            throw new Error("Должен быть указан один из двух параметров: userId или everyone. Эти параметры не могут быть указаны одновременно.");
        return this.http.get(this.apiBaseUrl + "/chats/resolvePending", options, { "user-agent": this.getUserAgent() });
    };
    return Bot;
}());
exports.Bot = Bot;
//# sourceMappingURL=Bot.js.map