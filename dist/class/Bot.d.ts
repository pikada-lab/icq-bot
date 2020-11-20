import { HttpClient } from "./ICQHttpClient";
import { Self } from "../interfaces/Entities/Self";
import { Chat } from "../interfaces/Entities/Chat";
import { ICQBot, ICQOptions, MembersItem } from "../interfaces/ICQBot";
import { ResponseEvent } from "../interfaces/Events/Event";
import { Dispatcher } from "../interfaces/Dispatcher";
import { ResponseMessage } from "../interfaces/Response/ResponseMessage";
import { ResponseUploadFile, ResponseSendFile } from "../interfaces/Response/ResponseSendFile";
import { ResponseUploadVoice, ResponseSendVoice } from "../interfaces/Response/ResponseSendVoice";
import { ResponseAdmin } from "../interfaces/Response/ResponseAdmin";
import { ResponseFileInfo } from "../interfaces/Response/ResponseFileInfo";
import { ResponseMembers } from "../interfaces/Response/ResponseMembers";
import { ResponseUsers } from "../interfaces/Response/ResponseUsers";
import { ICQButton } from "./ICQButton";
export declare class Bot implements ICQBot {
    private token;
    private uin;
    private running;
    private dispatcher;
    private lastEventId;
    private timeoutS;
    private pollTimeS;
    private version;
    private name;
    /** Номер таймера для возможной отмены. В версии не используется */
    private pollingThread;
    private apiBaseUrl;
    private http;
    constructor(token: string, options?: ICQOptions);
    getDispatcher(): Dispatcher;
    getUNI(): number;
    getUserAgent(): string;
    setHttpSession(http: HttpClient): void;
    startPolling(): ICQBot;
    private polling();
    stop(): ICQBot;
    eventsGet(pollTimeS: number, lastEventId: number): Promise<ResponseEvent>;
    selfGet(): Promise<Self>;
    sendText(chatId: string, text: String, replyMsgId?: String, forwardChatId?: String, forwardMsgId?: String, inlineKeyboardMarkup?: ICQButton | ICQButton[] | ICQButton[][]): Promise<ResponseMessage>;
    private getICQButtonList(inlineKeyboardMarkup);
    sendFile(chatId: string, fileId: string, file?: string, caption?: String, replyMsgId?: String, forwardChatId?: String, forwardMsgId?: String, inlineKeyboardMarkup?: ICQButton | ICQButton[] | ICQButton[][]): Promise<ResponseUploadFile | ResponseSendFile>;
    sendVoice(chatId: string, fileId: string, file: string, replyMsgId: String, forwardChatId: String, forwardMsgId: String, inlineKeyboardMarkup?: ICQButton | ICQButton[] | ICQButton[][]): Promise<ResponseUploadVoice | ResponseSendVoice>;
    editText(chatId: string, msgId: string, text: String, inlineKeyboardMarkup?: ICQButton[]): Promise<Response>;
    deleteMessages(chatId: string, msgId: string | string[]): Promise<Response>;
    answerCallbackQuery(queryId: string, text: string, showAlert: boolean, url: string): Promise<Response>;
    sendActions(chatId: string, actions: 'looking' | 'typing'): Promise<Response>;
    getChatInfo(chatId: string): Promise<Chat>;
    getChatAdmins(chatId: string): Promise<ResponseAdmin>;
    getFileInfo(fileId: string): Promise<ResponseFileInfo>;
    pinMessage(chatId: string, msgId: string): Promise<Response>;
    unpinMessage(chatId: string, msgId: string): Promise<Response>;
    setTitle(chatId: string, title: string): Promise<Response>;
    setAbout(chatId: string, text: string): Promise<Response>;
    setRules(chatId: string, rules: string): Promise<Response>;
    setAvatar(chatId: string, file: string): Promise<Response>;
    getMembers(chatId: string, cursor?: string): Promise<ResponseMembers>;
    deleteMembers(chatId: string, members: MembersItem[]): Promise<Response>;
    getBlockedUsers(chatId: string): Promise<ResponseUsers>;
    getPendingUsers(chatId: string): Promise<ResponseUsers>;
    blockUser(chatId: string, userId: string, delLastMessages?: boolean): Promise<Response>;
    unblockUser(chatId: string, userId: string): Promise<Response>;
    resolvePending(chatId: string, approve: boolean, userId?: string, everyone?: boolean): Promise<Response>;
}
