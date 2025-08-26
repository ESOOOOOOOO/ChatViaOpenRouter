// ./components/SettingModel.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Tabs,
    Input,
    Button,
    Typography,
    Space,
    Divider,
    Avatar,
    Upload,
    Select,
    message,
    Card,
    Popconfirm,
    Empty,
    Tag,
} from 'antd';
import type { TabsProps, UploadProps } from 'antd';
import { Store } from '@tauri-apps/plugin-store';
import { UserOutlined, ReloadOutlined, PlusOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { emit } from '@tauri-apps/api/event';
import { SystemLanguageDto, UserInfo } from '../DTOs/systemLanguage.dto';
import { Shortcut } from '../DTOs/Shortcuts.dto';

type Props = {
    open: boolean;
    onCancel: () => void;
    setApiKeyReady: () => void;
    setToken: (token: string) => void;
    userInfo: UserInfo;
    setUserInfo: (info: UserInfo) => void;
};


const API_KEY_FIELD = 'api_key';
const USER_INFO_FIELD = 'user_info';
const SHORTCUTS_FIELD = 'shortcuts';
const PAGE_HEIGHT = 450; // 统一固定高度
const SHORTCUTS_MAX = 5;
const NAME_MAX_LEN = 30;
const PROMPT_MAX_LEN = 1000;

// -------- Language Options (≥20) --------

const { TextArea } = Input;


export const languageOptions: SystemLanguageDto[] = [
    {
        label: 'English (EN)', value: 'en-US',
        newChat: "newChat", imageTag: "image", audioTag: "audio", textTag: "text", fileTag: "file", webSearch: "web search",
        promptTag: "Prompts", modelTag: "Models", currentModel: "Current Model", select: "Select", releaseDate: "Release Date",
        systemPrompt: "System Prompt", clear: "clear", save: "save", apply: "apply", verify: "Verify",
        verifyLabel: "The credit information will be displayed after the API key is verified.",
        credit: "Credit", totalCredits: "Total Credits", usedCredits: "Used Credits", refresh: "Refresh", saveChanges: "Save Changes",
        delete: "Delete", addNew: "Add", shortcuts: "Shortcuts", shortcutName: "Shortcut Name", shortcutPrompt: "Shortcut Prompt",
        shortcutMaxCount: `You can only add up to 5 shortcuts`, shortcutSaved: "Shortcuts saved successfully",
        shortcutDeleted: "Shortcut deleted successfully", saveUserInfo: "Save User Info", userName: "User Name",
        languagePreference: "Language Preference", setAvatar: "Set Avatar", updateAvatar: "Update Avatar", setting: "Setting",
        userInfo: "User Info", apiKeyTab: "API Key", userInfoTab: "User Info", shortcutsTab: "Shortcuts", aboutTab: "About",
        getName: "Your Name/Nick Name", inputPlaceholder: "Please input here..", selectPlaceholder: "Set System Language",
        noShortcuts: "No shortcuts yet, click 'Add' to get started", maxShortcutWarning: `You can only add up to ${SHORTCUTS_MAX} shortcuts`,
        shortcutNamePlaceholder: "e.g. Translate to English", shortcutPromptPlaceholder: "Input your prompt...",
        nameMaxWarning: `Name cannot exceed ${NAME_MAX_LEN} characters`, confirmDelete: "Are you sure to delete this shortcut?",
        deleteText: "Delete", cancelText: "Cancel", chatHistory: "Chat History", clearChatHistory: "Clear Chat History",
        clearHistoryConfirm: "Are you sure to clear chat history? This action cannot be undone.", historyCleared: "Chat history cleared",
        pinChat: "Pin Chat", unpinChat: "Unpin Chat", expand: "Expand", collapse: "Collapse", selectModel: "Select Model",
        noModelAvailable: "No model available", modelReleasedOn: "Released on", modelInputSupport: "Input Support",
        modelSystemPrompt: "System Prompt", modelFreeOnly: "Free Models Only", modelMultiFormatSupport: "Multi-format Input Support",
        noModelMatch: "No model matches the filter", selectLanguage: "Select Language", myPrompts: "My Prompts",
        prefabPrompts: "Prefab Prompts", promptName: "Prompt Name", promptContent: "Prompt Content",
        promptMaxCount: `You can only add up to ${SHORTCUTS_MAX} prompts`, promptSaved: "Prompt saved successfully",
        promptDeleted: "Prompt deleted successfully", savePromptChanges: "Save Prompt Changes", promptNamePlaceholder: "e.g. Translate to English",
        promptContentPlaceholder: "Input your prompt...", promptNameMaxWarning: `Prompt name cannot exceed ${NAME_MAX_LEN} characters`,
        confirmDeletePrompt: "Are you sure to delete this prompt?", modelSettings: "Model Settings",
        modelSettingsSaved: "Model settings saved successfully", promptHolder: "Create system prompt for the assistant...",
        operation: "Operation", selected: "Selected", enterToSubmit: "press Enter to submit", verifyFirst: "Please verify the API key first.",
        pricing: "Pricing", contextLength: "Context Length", usernamePlaceHolder: "Ennter your name/nick name here..",
        statistics: "Statistics", sponsorship: "Sponsorship", buyMeACoffee: "Buy me a Coffee"
    },
    {
        label: '简体中文 (zh-CN)', value: 'zh-CN',
        newChat: "新建聊天", imageTag: "图片", audioTag: "音频", textTag: "文本", fileTag: "文件", webSearch: "网页搜索",
        promptTag: "提示词", modelTag: "模型", currentModel: "当前模型", select: "选择", releaseDate: "发布日期",
        systemPrompt: "系统提示", clear: "清除", save: "保存", apply: "应用", verify: "验证",
        verifyLabel: "API Key 验证后将显示额度信息。",
        credit: "额度", totalCredits: "总额度", usedCredits: "已用额度", refresh: "刷新", saveChanges: "保存更改",
        delete: "删除", addNew: "添加", shortcuts: "快捷指令", shortcutName: "指令名称", shortcutPrompt: "指令内容",
        shortcutMaxCount: `最多只能添加 5 个快捷指令`, shortcutSaved: "快捷指令保存成功",
        shortcutDeleted: "快捷指令删除成功", saveUserInfo: "保存用户信息", userName: "用户名",
        languagePreference: "语言偏好", setAvatar: "设置头像", updateAvatar: "更新头像", setting: "设置",
        userInfo: "用户信息", apiKeyTab: "API Key", userInfoTab: "用户信息", shortcutsTab: "快捷指令", aboutTab: "关于",
        getName: "您的姓名/昵称", inputPlaceholder: "请输入内容..", selectPlaceholder: "设置系统语言",
        noShortcuts: "暂无快捷指令，点击“添加”开始", maxShortcutWarning: `最多只能添加 ${SHORTCUTS_MAX} 个快捷指令`,
        shortcutNamePlaceholder: "例如：翻译成英文", shortcutPromptPlaceholder: "输入您的提示词...",
        nameMaxWarning: `名称不能超过 ${NAME_MAX_LEN} 个字符`, confirmDelete: "确定要删除此快捷指令吗？",
        deleteText: "删除", cancelText: "取消", chatHistory: "聊天记录", clearChatHistory: "清除聊天记录",
        clearHistoryConfirm: "确定要清除聊天记录吗？该操作不可撤销。", historyCleared: "聊天记录已清除",
        pinChat: "置顶聊天", unpinChat: "取消置顶", expand: "展开", collapse: "收起", selectModel: "选择模型",
        noModelAvailable: "暂无可用模型", modelReleasedOn: "发布于", modelInputSupport: "输入支持",
        modelSystemPrompt: "系统提示", modelFreeOnly: "仅限免费模型", modelMultiFormatSupport: "多格式输入支持",
        noModelMatch: "没有符合条件的模型", selectLanguage: "选择语言", myPrompts: "我的提示词",
        prefabPrompts: "预设提示词", promptName: "提示词名称", promptContent: "提示词内容",
        promptMaxCount: `最多只能添加 ${SHORTCUTS_MAX} 个提示词`, promptSaved: "提示词保存成功",
        promptDeleted: "提示词删除成功", savePromptChanges: "保存提示词更改", promptNamePlaceholder: "例如：翻译成英文",
        promptContentPlaceholder: "输入您的提示词...", promptNameMaxWarning: `提示词名称不能超过 ${NAME_MAX_LEN} 个字符`,
        confirmDeletePrompt: "确定要删除此提示词吗？", modelSettings: "模型设置",
        modelSettingsSaved: "模型设置保存成功", promptHolder: "为助手创建系统提示...",
        operation: "操作", selected: "已选择", enterToSubmit: "按 Enter 提交", verifyFirst: "请先验证 API Key。",
        pricing: "价格", contextLength: "上下文长度", usernamePlaceHolder: "请输入姓名/昵称..",
        statistics: "统计", sponsorship: "赞助", buyMeACoffee: "请我喝咖啡"
    },
    {
        label: '繁體中文 (zh-TW)', value: 'zh-TW',
        newChat: "新建聊天", imageTag: "圖片", audioTag: "音訊", textTag: "文字", fileTag: "檔案", webSearch: "網頁搜尋",
        promptTag: "提示詞", modelTag: "模型", currentModel: "當前模型", select: "選擇", releaseDate: "發布日期",
        systemPrompt: "系統提示", clear: "清除", save: "保存", apply: "套用", verify: "驗證",
        verifyLabel: "API Key 驗證後將顯示額度資訊。",
        credit: "額度", totalCredits: "總額度", usedCredits: "已用額度", refresh: "刷新", saveChanges: "保存變更",
        delete: "刪除", addNew: "新增", shortcuts: "快捷指令", shortcutName: "指令名稱", shortcutPrompt: "指令內容",
        shortcutMaxCount: `最多只能新增 5 個快捷指令`, shortcutSaved: "快捷指令保存成功",
        shortcutDeleted: "快捷指令刪除成功", saveUserInfo: "保存用戶資訊", userName: "用戶名",
        languagePreference: "語言偏好", setAvatar: "設定頭像", updateAvatar: "更新頭像", setting: "設定",
        userInfo: "用戶資訊", apiKeyTab: "API Key", userInfoTab: "用戶資訊", shortcutsTab: "快捷指令", aboutTab: "關於",
        getName: "您的姓名/暱稱", inputPlaceholder: "請輸入內容..", selectPlaceholder: "設定系統語言",
        noShortcuts: "暫無快捷指令，點擊「新增」開始", maxShortcutWarning: `最多只能新增 ${SHORTCUTS_MAX} 個快捷指令`,
        shortcutNamePlaceholder: "例如：翻譯成英文", shortcutPromptPlaceholder: "輸入您的提示詞...",
        nameMaxWarning: `名稱不能超過 ${NAME_MAX_LEN} 個字元`, confirmDelete: "確定要刪除此快捷指令嗎？",
        deleteText: "刪除", cancelText: "取消", chatHistory: "聊天記錄", clearChatHistory: "清除聊天記錄",
        clearHistoryConfirm: "確定要清除聊天記錄嗎？該操作無法撤銷。", historyCleared: "聊天記錄已清除",
        pinChat: "置頂聊天", unpinChat: "取消置頂", expand: "展開", collapse: "收起", selectModel: "選擇模型",
        noModelAvailable: "暫無可用模型", modelReleasedOn: "發布於", modelInputSupport: "輸入支援",
        modelSystemPrompt: "系統提示", modelFreeOnly: "僅限免費模型", modelMultiFormatSupport: "多格式輸入支援",
        noModelMatch: "沒有符合條件的模型", selectLanguage: "選擇語言", myPrompts: "我的提示詞",
        prefabPrompts: "預設提示詞", promptName: "提示詞名稱", promptContent: "提示詞內容",
        promptMaxCount: `最多只能新增 ${SHORTCUTS_MAX} 個提示詞`, promptSaved: "提示詞保存成功",
        promptDeleted: "提示詞刪除成功", savePromptChanges: "保存提示詞變更", promptNamePlaceholder: "例如：翻譯成英文",
        promptContentPlaceholder: "輸入您的提示詞...", promptNameMaxWarning: `提示詞名稱不能超過 ${NAME_MAX_LEN} 個字元`,
        confirmDeletePrompt: "確定要刪除此提示詞嗎？", modelSettings: "模型設定",
        modelSettingsSaved: "模型設定保存成功", promptHolder: "為助手建立系統提示...",
        operation: "操作", selected: "已選擇", enterToSubmit: "按 Enter 提交", verifyFirst: "請先驗證 API Key。",
        pricing: "價格", contextLength: "上下文長度", usernamePlaceHolder: "請輸入姓名/暱稱..",
        statistics: "統計", sponsorship: "贊助", buyMeACoffee: "請我喝咖啡"
    }, {
        label: '日本語 (ja-JP)', value: 'ja-JP',
        newChat: "新しいチャット", imageTag: "画像", audioTag: "音声", textTag: "テキスト", fileTag: "ファイル", webSearch: "ウェブ検索",
        promptTag: "プロンプト", modelTag: "モデル", currentModel: "現在のモデル", select: "選択", releaseDate: "リリース日",
        systemPrompt: "システムプロンプト", clear: "クリア", save: "保存", apply: "適用", verify: "確認",
        verifyLabel: "APIキー確認後にクレジット情報が表示されます。",
        credit: "クレジット", totalCredits: "総クレジット", usedCredits: "使用済み", refresh: "更新", saveChanges: "変更を保存",
        delete: "削除", addNew: "追加", shortcuts: "ショートカット", shortcutName: "名前", shortcutPrompt: "内容",
        shortcutMaxCount: `ショートカットは最大 5 件まで`, shortcutSaved: "ショートカットを保存しました",
        shortcutDeleted: "ショートカットを削除しました", saveUserInfo: "ユーザー情報を保存", userName: "ユーザー名",
        languagePreference: "言語設定", setAvatar: "アバター設定", updateAvatar: "アバター更新", setting: "設定",
        userInfo: "ユーザー情報", apiKeyTab: "APIキー", userInfoTab: "ユーザー情報", shortcutsTab: "ショートカット", aboutTab: "概要",
        getName: "名前/ニックネーム", inputPlaceholder: "ここに入力..", selectPlaceholder: "システム言語を設定",
        noShortcuts: "ショートカットがありません。「追加」をクリックしてください", maxShortcutWarning: `ショートカットは最大 ${SHORTCUTS_MAX} 件まで`,
        shortcutNamePlaceholder: "例: 英語に翻訳", shortcutPromptPlaceholder: "プロンプトを入力...",
        nameMaxWarning: `名前は ${NAME_MAX_LEN} 文字以内`, confirmDelete: "このショートカットを削除しますか？",
        deleteText: "削除", cancelText: "キャンセル", chatHistory: "チャット履歴", clearChatHistory: "履歴をクリア",
        clearHistoryConfirm: "チャット履歴を削除しますか？この操作は元に戻せません。", historyCleared: "履歴をクリアしました",
        pinChat: "ピン留め", unpinChat: "ピン解除", expand: "展開", collapse: "折りたたむ", selectModel: "モデル選択",
        noModelAvailable: "利用可能なモデルはありません", modelReleasedOn: "リリース日", modelInputSupport: "入力対応",
        modelSystemPrompt: "システムプロンプト", modelFreeOnly: "無料モデルのみ", modelMultiFormatSupport: "マルチ入力対応",
        noModelMatch: "一致するモデルはありません", selectLanguage: "言語を選択", myPrompts: "マイプロンプト",
        prefabPrompts: "プリセットプロンプト", promptName: "名前", promptContent: "内容",
        promptMaxCount: `プロンプトは最大 ${SHORTCUTS_MAX} 件まで`, promptSaved: "プロンプトを保存しました",
        promptDeleted: "プロンプトを削除しました", savePromptChanges: "変更を保存", promptNamePlaceholder: "例: 英語に翻訳",
        promptContentPlaceholder: "プロンプトを入力...", promptNameMaxWarning: `名前は ${NAME_MAX_LEN} 文字以内`,
        confirmDeletePrompt: "このプロンプトを削除しますか？", modelSettings: "モデル設定",
        modelSettingsSaved: "モデル設定を保存しました", promptHolder: "アシスタント用のシステムプロンプトを作成...",
        operation: "操作", selected: "選択済み", enterToSubmit: "Enter で送信", verifyFirst: "APIキーを先に確認してください。",
        pricing: "料金", contextLength: "コンテキスト長", usernamePlaceHolder: "名前/ニックネームを入力..",
        statistics: "統計", sponsorship: "スポンサー", buyMeACoffee: "コーヒーをおごる"
    },
    {
        label: '한국어 (ko-KR)', value: 'ko-KR',
        newChat: "새 채팅", imageTag: "이미지", audioTag: "오디오", textTag: "텍스트", fileTag: "파일", webSearch: "웹 검색",
        promptTag: "프롬프트", modelTag: "모델", currentModel: "현재 모델", select: "선택", releaseDate: "출시일",
        systemPrompt: "시스템 프롬프트", clear: "지우기", save: "저장", apply: "적용", verify: "검증",
        verifyLabel: "API 키 검증 후 크레딧 정보가 표시됩니다.",
        credit: "크레딧", totalCredits: "총 크레딧", usedCredits: "사용됨", refresh: "새로고침", saveChanges: "변경 저장",
        delete: "삭제", addNew: "추가", shortcuts: "바로가기", shortcutName: "이름", shortcutPrompt: "내용",
        shortcutMaxCount: `바로가기는 최대 5개까지`, shortcutSaved: "바로가기가 저장되었습니다",
        shortcutDeleted: "바로가기가 삭제되었습니다", saveUserInfo: "사용자 정보 저장", userName: "사용자 이름",
        languagePreference: "언어 설정", setAvatar: "아바타 설정", updateAvatar: "아바타 변경", setting: "설정",
        userInfo: "사용자 정보", apiKeyTab: "API 키", userInfoTab: "사용자 정보", shortcutsTab: "바로가기", aboutTab: "정보",
        getName: "이름/닉네임", inputPlaceholder: "여기에 입력..", selectPlaceholder: "시스템 언어 설정",
        noShortcuts: "바로가기가 없습니다. '추가'를 클릭하세요", maxShortcutWarning: `바로가기는 최대 ${SHORTCUTS_MAX}개까지`,
        shortcutNamePlaceholder: "예: 영어로 번역", shortcutPromptPlaceholder: "프롬프트 입력...",
        nameMaxWarning: `이름은 ${NAME_MAX_LEN}자를 초과할 수 없습니다`, confirmDelete: "이 바로가기를 삭제하시겠습니까?",
        deleteText: "삭제", cancelText: "취소", chatHistory: "채팅 기록", clearChatHistory: "채팅 기록 삭제",
        clearHistoryConfirm: "채팅 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.", historyCleared: "채팅 기록이 삭제되었습니다",
        pinChat: "채팅 고정", unpinChat: "고정 해제", expand: "펼치기", collapse: "접기", selectModel: "모델 선택",
        noModelAvailable: "사용 가능한 모델 없음", modelReleasedOn: "출시일", modelInputSupport: "입력 지원",
        modelSystemPrompt: "시스템 프롬프트", modelFreeOnly: "무료 모델만", modelMultiFormatSupport: "멀티 입력 지원",
        noModelMatch: "일치하는 모델 없음", selectLanguage: "언어 선택", myPrompts: "내 프롬프트",
        prefabPrompts: "프리셋 프롬프트", promptName: "이름", promptContent: "내용",
        promptMaxCount: `프롬프트는 최대 ${SHORTCUTS_MAX}개까지`, promptSaved: "프롬프트가 저장되었습니다",
        promptDeleted: "프롬프트가 삭제되었습니다", savePromptChanges: "변경 저장", promptNamePlaceholder: "예: 영어로 번역",
        promptContentPlaceholder: "프롬프트 입력...", promptNameMaxWarning: `이름은 ${NAME_MAX_LEN}자를 초과할 수 없습니다`,
        confirmDeletePrompt: "이 프롬프트를 삭제하시겠습니까?", modelSettings: "모델 설정",
        modelSettingsSaved: "모델 설정이 저장되었습니다", promptHolder: "어시스턴트용 시스템 프롬프트 만들기...",
        operation: "작업", selected: "선택됨", enterToSubmit: "Enter 키로 전송", verifyFirst: "먼저 API 키를 확인하세요.",
        pricing: "가격", contextLength: "컨텍스트 길이", usernamePlaceHolder: "이름/닉네임을 입력..",
        statistics: "통계", sponsorship: "후원", buyMeACoffee: "커피 사주기"
    },
    {
        label: 'Deutsch (de-DE)', value: 'de-DE',
        newChat: "Neuer Chat", imageTag: "Bild", audioTag: "Audio", textTag: "Text", fileTag: "Datei", webSearch: "Websuche",
        promptTag: "Prompts", modelTag: "Modelle", currentModel: "Aktuelles Modell", select: "Auswählen", releaseDate: "Veröffentlichungsdatum",
        systemPrompt: "System-Prompt", clear: "Löschen", save: "Speichern", apply: "Anwenden", verify: "Prüfen",
        verifyLabel: "Die Kreditinformationen werden nach Überprüfung des API-Schlüssels angezeigt.",
        credit: "Guthaben", totalCredits: "Gesamtguthaben", usedCredits: "Verwendet", refresh: "Aktualisieren", saveChanges: "Änderungen speichern",
        delete: "Löschen", addNew: "Hinzufügen", shortcuts: "Shortcuts", shortcutName: "Name", shortcutPrompt: "Inhalt",
        shortcutMaxCount: `Maximal 5 Shortcuts möglich`, shortcutSaved: "Shortcut erfolgreich gespeichert",
        shortcutDeleted: "Shortcut erfolgreich gelöscht", saveUserInfo: "Benutzerdaten speichern", userName: "Benutzername",
        languagePreference: "Sprache", setAvatar: "Avatar festlegen", updateAvatar: "Avatar aktualisieren", setting: "Einstellungen",
        userInfo: "Benutzerinfo", apiKeyTab: "API-Schlüssel", userInfoTab: "Benutzerinfo", shortcutsTab: "Shortcuts", aboutTab: "Über",
        getName: "Ihr Name/Spitzname", inputPlaceholder: "Hier eingeben..", selectPlaceholder: "Systemsprache festlegen",
        noShortcuts: "Noch keine Shortcuts, klicken Sie auf 'Hinzufügen'", maxShortcutWarning: `Maximal ${SHORTCUTS_MAX} Shortcuts möglich`,
        shortcutNamePlaceholder: "z. B. ins Englische übersetzen", shortcutPromptPlaceholder: "Prompt eingeben...",
        nameMaxWarning: `Name darf ${NAME_MAX_LEN} Zeichen nicht überschreiten`, confirmDelete: "Shortcut wirklich löschen?",
        deleteText: "Löschen", cancelText: "Abbrechen", chatHistory: "Chat-Verlauf", clearChatHistory: "Verlauf löschen",
        clearHistoryConfirm: "Chat-Verlauf wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.", historyCleared: "Chat-Verlauf gelöscht",
        pinChat: "Anheften", unpinChat: "Lösen", expand: "Erweitern", collapse: "Einklappen", selectModel: "Modell wählen",
        noModelAvailable: "Kein Modell verfügbar", modelReleasedOn: "Veröffentlicht am", modelInputSupport: "Eingabeunterstützung",
        modelSystemPrompt: "System-Prompt", modelFreeOnly: "Nur kostenlose Modelle", modelMultiFormatSupport: "Mehrformat-Eingabeunterstützung",
        noModelMatch: "Kein Modell gefunden", selectLanguage: "Sprache auswählen", myPrompts: "Meine Prompts",
        prefabPrompts: "Vorlagen", promptName: "Name", promptContent: "Inhalt",
        promptMaxCount: `Maximal ${SHORTCUTS_MAX} Prompts möglich`, promptSaved: "Prompt erfolgreich gespeichert",
        promptDeleted: "Prompt erfolgreich gelöscht", savePromptChanges: "Änderungen speichern", promptNamePlaceholder: "z. B. ins Englische übersetzen",
        promptContentPlaceholder: "Prompt eingeben...", promptNameMaxWarning: `Name darf ${NAME_MAX_LEN} Zeichen nicht überschreiten`,
        confirmDeletePrompt: "Prompt wirklich löschen?", modelSettings: "Modelleinstellungen",
        modelSettingsSaved: "Einstellungen gespeichert", promptHolder: "System-Prompt für Assistent erstellen...",
        operation: "Aktion", selected: "Ausgewählt", enterToSubmit: "Enter drücken zum Senden", verifyFirst: "Bitte zuerst API-Schlüssel prüfen.",
        pricing: "Preise", contextLength: "Kontextlänge", usernamePlaceHolder: "Namen/Spitznamen eingeben..",
        statistics: "Statistik", sponsorship: "Sponsoring", buyMeACoffee: "Spendieren Sie mir einen Kaffee"
    },
    {
        label: 'Français (fr-FR)', value: 'fr-FR',
        newChat: "Nouveau chat", imageTag: "Image", audioTag: "Audio", textTag: "Texte", fileTag: "Fichier", webSearch: "Recherche web",
        promptTag: "Prompts", modelTag: "Modèles", currentModel: "Modèle actuel", select: "Sélectionner", releaseDate: "Date de sortie",
        systemPrompt: "Invite système", clear: "Effacer", save: "Enregistrer", apply: "Appliquer", verify: "Vérifier",
        verifyLabel: "Les informations de crédit s'afficheront après la vérification de la clé API.",
        credit: "Crédit", totalCredits: "Crédit total", usedCredits: "Utilisé", refresh: "Rafraîchir", saveChanges: "Enregistrer les modifications",
        delete: "Supprimer", addNew: "Ajouter", shortcuts: "Raccourcis", shortcutName: "Nom", shortcutPrompt: "Contenu",
        shortcutMaxCount: `Vous pouvez ajouter jusqu'à 5 raccourcis`, shortcutSaved: "Raccourci enregistré avec succès",
        shortcutDeleted: "Raccourci supprimé avec succès", saveUserInfo: "Enregistrer les infos", userName: "Nom d'utilisateur",
        languagePreference: "Langue", setAvatar: "Définir l'avatar", updateAvatar: "Mettre à jour l'avatar", setting: "Paramètres",
        userInfo: "Infos utilisateur", apiKeyTab: "Clé API", userInfoTab: "Infos utilisateur", shortcutsTab: "Raccourcis", aboutTab: "À propos",
        getName: "Votre nom/pseudo", inputPlaceholder: "Veuillez entrer..", selectPlaceholder: "Définir la langue du système",
        noShortcuts: "Aucun raccourci, cliquez sur 'Ajouter'", maxShortcutWarning: `Vous pouvez ajouter jusqu'à ${SHORTCUTS_MAX} raccourcis`,
        shortcutNamePlaceholder: "ex: Traduire en anglais", shortcutPromptPlaceholder: "Entrez votre prompt...",
        nameMaxWarning: `Le nom ne peut pas dépasser ${NAME_MAX_LEN} caractères`, confirmDelete: "Supprimer ce raccourci ?",
        deleteText: "Supprimer", cancelText: "Annuler", chatHistory: "Historique", clearChatHistory: "Effacer l'historique",
        clearHistoryConfirm: "Effacer l'historique ? Cette action est irréversible.", historyCleared: "Historique effacé",
        pinChat: "Épingler", unpinChat: "Désépingler", expand: "Développer", collapse: "Réduire", selectModel: "Choisir un modèle",
        noModelAvailable: "Aucun modèle disponible", modelReleasedOn: "Publié le", modelInputSupport: "Support d'entrée",
        modelSystemPrompt: "Invite système", modelFreeOnly: "Modèles gratuits uniquement", modelMultiFormatSupport: "Support multi-format",
        noModelMatch: "Aucun modèle trouvé", selectLanguage: "Choisir la langue", myPrompts: "Mes prompts",
        prefabPrompts: "Prompts prédéfinis", promptName: "Nom", promptContent: "Contenu",
        promptMaxCount: `Vous pouvez ajouter jusqu'à ${SHORTCUTS_MAX} prompts`, promptSaved: "Prompt enregistré avec succès",
        promptDeleted: "Prompt supprimé avec succès", savePromptChanges: "Enregistrer les modifications", promptNamePlaceholder: "ex: Traduire en anglais",
        promptContentPlaceholder: "Entrez votre prompt...", promptNameMaxWarning: `Le nom ne peut pas dépasser ${NAME_MAX_LEN} caractères`,
        confirmDeletePrompt: "Supprimer ce prompt ?", modelSettings: "Paramètres du modèle",
        modelSettingsSaved: "Paramètres enregistrés", promptHolder: "Créer une invite système pour l'assistant...",
        operation: "Action", selected: "Sélectionné", enterToSubmit: "Appuyez sur Entrée pour envoyer", verifyFirst: "Veuillez d'abord vérifier la clé API.",
        pricing: "Tarifs", contextLength: "Longueur du contexte", usernamePlaceHolder: "Entrez votre nom/pseudo..",
        statistics: "Statistiques", sponsorship: "Parrainage", buyMeACoffee: "Offrez-moi un café"
    }, {
        label: 'Español (es-ES)',
        value: 'es-ES',
        newChat: "Nuevo chat", imageTag: "imagen", audioTag: "audio", textTag: "texto", fileTag: "archivo", webSearch: "búsqueda web",
        promptTag: "Indicaciones", modelTag: "Modelos", currentModel: "Modelo actual", select: "Seleccionar", releaseDate: "Fecha de lanzamiento",
        systemPrompt: "Mensaje del sistema", clear: "limpiar", save: "guardar", apply: "aplicar", verify: "Verificar",
        verifyLabel: "La información de crédito se mostrará tras verificar la clave API.",
        credit: "Crédito", totalCredits: "Créditos totales", usedCredits: "Créditos usados", refresh: "Actualizar", saveChanges: "Guardar cambios",
        delete: "Eliminar", addNew: "Añadir", shortcuts: "Atajos", shortcutName: "Nombre del atajo", shortcutPrompt: "Texto del atajo",
        shortcutMaxCount: `Solo puedes añadir hasta 5 atajos`, shortcutSaved: "Atajos guardados correctamente",
        shortcutDeleted: "Atajo eliminado correctamente", saveUserInfo: "Guardar info de usuario", userName: "Nombre de usuario",
        languagePreference: "Preferencia de idioma", setAvatar: "Configurar avatar", updateAvatar: "Actualizar avatar", setting: "Configuración",
        userInfo: "Información de usuario", apiKeyTab: "Clave API", userInfoTab: "Usuario", shortcutsTab: "Atajos", aboutTab: "Acerca de",
        getName: "Tu nombre/apodo", inputPlaceholder: "Escribe aquí..", selectPlaceholder: "Configurar idioma del sistema",
        noShortcuts: "Sin atajos aún, haz clic en 'Añadir' para empezar", maxShortcutWarning: `Solo puedes añadir hasta ${SHORTCUTS_MAX} atajos`,
        shortcutNamePlaceholder: "p. ej. Traducir al inglés", shortcutPromptPlaceholder: "Escribe tu prompt...",
        nameMaxWarning: `El nombre no puede exceder ${NAME_MAX_LEN} caracteres`, confirmDelete: "¿Seguro que deseas eliminar este atajo?",
        deleteText: "Eliminar", cancelText: "Cancelar", chatHistory: "Historial de chat", clearChatHistory: "Borrar historial",
        clearHistoryConfirm: "¿Seguro que deseas borrar el historial? Esta acción no se puede deshacer.", historyCleared: "Historial borrado",
        pinChat: "Fijar chat", unpinChat: "Desfijar chat", expand: "Expandir", collapse: "Colapsar", selectModel: "Seleccionar modelo",
        noModelAvailable: "Ningún modelo disponible", modelReleasedOn: "Lanzado en", modelInputSupport: "Soporte de entrada",
        modelSystemPrompt: "Mensaje del sistema", modelFreeOnly: "Solo modelos gratuitos", modelMultiFormatSupport: "Soporte multi-formato",
        noModelMatch: "Ningún modelo coincide con el filtro", selectLanguage: "Seleccionar idioma", myPrompts: "Mis indicaciones",
        prefabPrompts: "Indicaciones predefinidas", promptName: "Nombre de prompt", promptContent: "Contenido de prompt",
        promptMaxCount: `Solo puedes añadir hasta ${SHORTCUTS_MAX} indicaciones`, promptSaved: "Prompt guardado con éxito",
        promptDeleted: "Prompt eliminado con éxito", savePromptChanges: "Guardar cambios de prompt",
        promptNamePlaceholder: "p. ej. Traducir al inglés", promptContentPlaceholder: "Escribe tu prompt...",
        promptNameMaxWarning: `El nombre no puede superar ${NAME_MAX_LEN} caracteres`, confirmDeletePrompt: "¿Seguro que deseas eliminar este prompt?",
        modelSettings: "Configuración de modelo", modelSettingsSaved: "Configuración guardada con éxito",
        promptHolder: "Crear mensaje del sistema para el asistente...", operation: "Operación", selected: "Seleccionado",
        enterToSubmit: "pulsa Enter para enviar", verifyFirst: "Primero verifica la clave API.", pricing: "Precios",
        contextLength: "Longitud de contexto", usernamePlaceHolder: "Escribe tu nombre/apodo aquí..", statistics: "Estadísticas",
        sponsorship: "Patrocinio", buyMeACoffee: "Invítame un café"
    },
    {
        label: 'Português (pt-PT)',
        value: 'pt-PT',
        newChat: "Novo chat", imageTag: "imagem", audioTag: "áudio", textTag: "texto", fileTag: "ficheiro", webSearch: "pesquisa web",
        promptTag: "Prompts", modelTag: "Modelos", currentModel: "Modelo atual", select: "Selecionar", releaseDate: "Data de lançamento",
        systemPrompt: "Prompt do sistema", clear: "limpar", save: "guardar", apply: "aplicar", verify: "Verificar",
        verifyLabel: "A informação de crédito será exibida após verificar a chave API.",
        credit: "Crédito", totalCredits: "Créditos totais", usedCredits: "Créditos usados", refresh: "Atualizar", saveChanges: "Guardar alterações",
        delete: "Eliminar", addNew: "Adicionar", shortcuts: "Atalhos", shortcutName: "Nome do atalho", shortcutPrompt: "Prompt do atalho",
        shortcutMaxCount: `Só pode adicionar até 5 atalhos`, shortcutSaved: "Atalhos guardados com sucesso",
        shortcutDeleted: "Atalho eliminado com sucesso", saveUserInfo: "Guardar informação do utilizador", userName: "Nome de utilizador",
        languagePreference: "Preferência de idioma", setAvatar: "Definir avatar", updateAvatar: "Atualizar avatar", setting: "Configuração",
        userInfo: "Informações do utilizador", apiKeyTab: "Chave API", userInfoTab: "Utilizador", shortcutsTab: "Atalhos", aboutTab: "Sobre",
        getName: "O seu nome/apelido", inputPlaceholder: "Insira aqui..", selectPlaceholder: "Definir idioma do sistema",
        noShortcuts: "Ainda sem atalhos, clique 'Adicionar' para começar", maxShortcutWarning: `Só pode adicionar até ${SHORTCUTS_MAX} atalhos`,
        shortcutNamePlaceholder: "ex. Traduzir para inglês", shortcutPromptPlaceholder: "Insira o seu prompt...",
        nameMaxWarning: `O nome não pode exceder ${NAME_MAX_LEN} caracteres`, confirmDelete: "Tem certeza de eliminar este atalho?",
        deleteText: "Eliminar", cancelText: "Cancelar", chatHistory: "Histórico de chat", clearChatHistory: "Limpar histórico",
        clearHistoryConfirm: "Tem certeza de limpar o histórico? Esta ação não pode ser desfeita.", historyCleared: "Histórico limpo",
        pinChat: "Fixar chat", unpinChat: "Desafixar chat", expand: "Expandir", collapse: "Recolher", selectModel: "Selecionar modelo",
        noModelAvailable: "Nenhum modelo disponível", modelReleasedOn: "Lançado em", modelInputSupport: "Suporte de entrada",
        modelSystemPrompt: "Prompt do sistema", modelFreeOnly: "Apenas modelos gratuitos", modelMultiFormatSupport: "Suporte multi-formato",
        noModelMatch: "Nenhum modelo corresponde ao filtro", selectLanguage: "Selecionar idioma", myPrompts: "Meus prompts",
        prefabPrompts: "Prompts predefinidos", promptName: "Nome do prompt", promptContent: "Conteúdo do prompt",
        promptMaxCount: `Só pode adicionar até ${SHORTCUTS_MAX} prompts`, promptSaved: "Prompt guardado com sucesso",
        promptDeleted: "Prompt eliminado com sucesso", savePromptChanges: "Guardar alterações do prompt",
        promptNamePlaceholder: "ex. Traduzir para inglês", promptContentPlaceholder: "Insira o seu prompt...",
        promptNameMaxWarning: `O nome não pode exceder ${NAME_MAX_LEN} caracteres`, confirmDeletePrompt: "Tem certeza de eliminar este prompt?",
        modelSettings: "Configuração do modelo", modelSettingsSaved: "Configuração guardada com sucesso",
        promptHolder: "Criar prompt do sistema para o assistente...", operation: "Operação", selected: "Selecionado",
        enterToSubmit: "pressione Enter para enviar", verifyFirst: "Verifique primeiro a chave API.", pricing: "Preços",
        contextLength: "Comprimento de contexto", usernamePlaceHolder: "Insira o seu nome/apelido aqui..", statistics: "Estatísticas",
        sponsorship: "Patrocínio", buyMeACoffee: "Ofereça-me um café"
    },
    {
        label: 'Português (Brasil)',
        value: 'pt-BR',
        newChat: "Novo chat", imageTag: "imagem", audioTag: "áudio", textTag: "texto", fileTag: "arquivo", webSearch: "pesquisa web",
        promptTag: "Prompts", modelTag: "Modelos", currentModel: "Modelo atual", select: "Selecionar", releaseDate: "Data de lançamento",
        systemPrompt: "Prompt do sistema", clear: "limpar", save: "salvar", apply: "aplicar", verify: "Verificar",
        verifyLabel: "As informações de crédito serão exibidas após verificar a chave API.",
        credit: "Crédito", totalCredits: "Créditos totais", usedCredits: "Créditos usados", refresh: "Atualizar", saveChanges: "Salvar alterações",
        delete: "Excluir", addNew: "Adicionar", shortcuts: "Atalhos", shortcutName: "Nome do atalho", shortcutPrompt: "Prompt do atalho",
        shortcutMaxCount: `Você só pode adicionar até 5 atalhos`, shortcutSaved: "Atalhos salvos com sucesso",
        shortcutDeleted: "Atalho excluído com sucesso", saveUserInfo: "Salvar info do usuário", userName: "Nome do usuário",
        languagePreference: "Preferência de idioma", setAvatar: "Definir avatar", updateAvatar: "Atualizar avatar", setting: "Configuração",
        userInfo: "Informações do usuário", apiKeyTab: "Chave API", userInfoTab: "Usuário", shortcutsTab: "Atalhos", aboutTab: "Sobre",
        getName: "Seu nome/apelido", inputPlaceholder: "Digite aqui..", selectPlaceholder: "Definir idioma do sistema",
        noShortcuts: "Nenhum atalho ainda, clique em 'Adicionar' para começar", maxShortcutWarning: `Você só pode adicionar até ${SHORTCUTS_MAX} atalhos`,
        shortcutNamePlaceholder: "ex. Traduzir para inglês", shortcutPromptPlaceholder: "Digite seu prompt...",
        nameMaxWarning: `O nome não pode exceder ${NAME_MAX_LEN} caracteres`, confirmDelete: "Tem certeza de excluir este atalho?",
        deleteText: "Excluir", cancelText: "Cancelar", chatHistory: "Histórico do chat", clearChatHistory: "Limpar histórico",
        clearHistoryConfirm: "Tem certeza de limpar o histórico? Esta ação não pode ser desfeita.", historyCleared: "Histórico limpo",
        pinChat: "Fixar chat", unpinChat: "Desafixar chat", expand: "Expandir", collapse: "Recolher", selectModel: "Selecionar modelo",
        noModelAvailable: "Nenhum modelo disponível", modelReleasedOn: "Lançado em", modelInputSupport: "Suporte de entrada",
        modelSystemPrompt: "Prompt do sistema", modelFreeOnly: "Somente modelos gratuitos", modelMultiFormatSupport: "Suporte multi-formato",
        noModelMatch: "Nenhum modelo corresponde ao filtro", selectLanguage: "Selecionar idioma", myPrompts: "Meus prompts",
        prefabPrompts: "Prompts prontos", promptName: "Nome do prompt", promptContent: "Conteúdo do prompt",
        promptMaxCount: `Você só pode adicionar até ${SHORTCUTS_MAX} prompts`, promptSaved: "Prompt salvo com sucesso",
        promptDeleted: "Prompt excluído com sucesso", savePromptChanges: "Salvar alterações do prompt",
        promptNamePlaceholder: "ex. Traduzir para inglês", promptContentPlaceholder: "Digite seu prompt...",
        promptNameMaxWarning: `O nome não pode exceder ${NAME_MAX_LEN} caracteres`, confirmDeletePrompt: "Tem certeza de excluir este prompt?",
        modelSettings: "Configuração do modelo", modelSettingsSaved: "Configuração salva com sucesso",
        promptHolder: "Criar prompt do sistema para o assistente...", operation: "Operação", selected: "Selecionado",
        enterToSubmit: "pressione Enter para enviar", verifyFirst: "Verifique primeiro a chave API.", pricing: "Preços",
        contextLength: "Comprimento do contexto", usernamePlaceHolder: "Digite seu nome/apelido aqui..", statistics: "Estatísticas",
        sponsorship: "Patrocínio", buyMeACoffee: "Me pague um café"
    }, {
        label: 'Italiano (it-IT)',
        value: 'it-IT',
        newChat: "nuovaChat",
        imageTag: "immagine",
        audioTag: "audio",
        textTag: "testo",
        fileTag: "file",
        webSearch: "ricerca web",
        promptTag: "Prompt",
        modelTag: "Modelli",
        currentModel: "Modello Corrente",
        select: "Seleziona",
        releaseDate: "Data di rilascio",
        systemPrompt: "Prompt di sistema",
        clear: "cancella",
        save: "salva",
        apply: "applica",
        verify: "Verifica",
        verifyLabel: "Le informazioni sul credito saranno mostrate dopo la verifica della chiave API.",
        credit: "Credito",
        totalCredits: "Crediti Totali",
        usedCredits: "Crediti Usati",
        refresh: "Aggiorna",
        saveChanges: "Salva Modifiche",
        delete: "Elimina",
        addNew: "Aggiungi",
        shortcuts: "Scorciatoie",
        shortcutName: "Nome Scorciatoia",
        shortcutPrompt: "Prompt Scorciatoia",
        shortcutMaxCount: `Puoi aggiungere solo fino a 5 scorciatoie`,
        shortcutSaved: "Scorciatoie salvate con successo",
        shortcutDeleted: "Scorciatoia eliminata con successo",
        saveUserInfo: "Salva Info Utente",
        userName: "Nome Utente",
        languagePreference: "Lingua Preferita",
        setAvatar: "Imposta Avatar",
        updateAvatar: "Aggiorna Avatar",
        setting: "Impostazioni",
        userInfo: "Info Utente",
        apiKeyTab: "Chiave API",
        userInfoTab: "Info Utente",
        shortcutsTab: "Scorciatoie",
        aboutTab: "Info",
        getName: "Il tuo Nome/Nickname",
        inputPlaceholder: "Inserisci qui..",
        selectPlaceholder: "Imposta Lingua di Sistema",
        noShortcuts: "Nessuna scorciatoia ancora, clicca 'Aggiungi' per iniziare",
        maxShortcutWarning: `Puoi aggiungere solo fino a ${SHORTCUTS_MAX} scorciatoie`,
        shortcutNamePlaceholder: "es. Traduci in Italiano",
        shortcutPromptPlaceholder: "Inserisci il tuo prompt...",
        nameMaxWarning: `Il nome non può superare ${NAME_MAX_LEN} caratteri`,
        confirmDelete: "Sei sicuro di eliminare questa scorciatoia?",
        deleteText: "Elimina",
        cancelText: "Annulla",
        chatHistory: "Cronologia Chat",
        clearChatHistory: "Cancella Cronologia",
        clearHistoryConfirm: "Sei sicuro di cancellare la cronologia? Questa azione è irreversibile.",
        historyCleared: "Cronologia cancellata",
        pinChat: "Fissa Chat",
        unpinChat: "Sblocca Chat",
        expand: "Espandi",
        collapse: "Comprimi",
        selectModel: "Seleziona Modello",
        noModelAvailable: "Nessun modello disponibile",
        modelReleasedOn: "Rilasciato il",
        modelInputSupport: "Supporto Input",
        modelSystemPrompt: "Prompt di Sistema",
        modelFreeOnly: "Solo Modelli Gratuiti",
        modelMultiFormatSupport: "Supporto Input Multi-formato",
        noModelMatch: "Nessun modello corrisponde al filtro",
        selectLanguage: "Seleziona Lingua",
        myPrompts: "I miei Prompt",
        prefabPrompts: "Prompt Predefiniti",
        promptName: "Nome Prompt",
        promptContent: "Contenuto Prompt",
        promptMaxCount: `Puoi aggiungere solo fino a ${SHORTCUTS_MAX} prompt`,
        promptSaved: "Prompt salvato con successo",
        promptDeleted: "Prompt eliminato con successo",
        savePromptChanges: "Salva Modifiche Prompt",
        promptNamePlaceholder: "es. Traduci in Italiano",
        promptContentPlaceholder: "Inserisci il tuo prompt...",
        promptNameMaxWarning: `Il nome del prompt non può superare ${NAME_MAX_LEN} caratteri`,
        confirmDeletePrompt: "Sei sicuro di eliminare questo prompt?",
        modelSettings: "Impostazioni Modello",
        modelSettingsSaved: "Impostazioni modello salvate con successo",
        promptHolder: "Crea prompt di sistema per l'assistente...",
        operation: "Operazione",
        selected: "Selezionato",
        enterToSubmit: "premi Invio per inviare",
        verifyFirst: "Verifica prima la chiave API.",
        pricing: "Prezzi",
        contextLength: "Lunghezza Contesto",
        usernamePlaceHolder: "Inserisci qui nome/nickname..",
        statistics: "Statistiche",
        sponsorship: "Sponsorizzazione",
        buyMeACoffee: "Offrimi un Caffè"
    },
    {
        label: 'Русский (ru-RU)',
        value: 'ru-RU',
        newChat: "новыйЧат",
        imageTag: "изображение",
        audioTag: "аудио",
        textTag: "текст",
        fileTag: "файл",
        webSearch: "веб-поиск",
        promptTag: "Подсказки",
        modelTag: "Модели",
        currentModel: "Текущая модель",
        select: "Выбрать",
        releaseDate: "Дата выпуска",
        systemPrompt: "Системный промпт",
        clear: "очистить",
        save: "сохранить",
        apply: "применить",
        verify: "Проверить",
        verifyLabel: "Информация о кредите отобразится после проверки ключа API.",
        credit: "Кредит",
        totalCredits: "Всего кредитов",
        usedCredits: "Использовано",
        refresh: "Обновить",
        saveChanges: "Сохранить изменения",
        delete: "Удалить",
        addNew: "Добавить",
        shortcuts: "Ярлыки",
        shortcutName: "Имя ярлыка",
        shortcutPrompt: "Подсказка ярлыка",
        shortcutMaxCount: `Можно добавить только до 5 ярлыков`,
        shortcutSaved: "Ярлыки успешно сохранены",
        shortcutDeleted: "Ярлык успешно удалён",
        saveUserInfo: "Сохранить данные пользователя",
        userName: "Имя пользователя",
        languagePreference: "Язык",
        setAvatar: "Установить аватар",
        updateAvatar: "Обновить аватар",
        setting: "Настройки",
        userInfo: "Информация",
        apiKeyTab: "API ключ",
        userInfoTab: "Инфо",
        shortcutsTab: "Ярлыки",
        aboutTab: "О программе",
        getName: "Ваше имя/ник",
        inputPlaceholder: "Введите здесь..",
        selectPlaceholder: "Установить язык системы",
        noShortcuts: "Ярлыков нет, нажмите 'Добавить' для начала",
        maxShortcutWarning: `Можно добавить только до ${SHORTCUTS_MAX} ярлыков`,
        shortcutNamePlaceholder: "например Перевести на русский",
        shortcutPromptPlaceholder: "Введите ваш промпт...",
        nameMaxWarning: `Имя не может превышать ${NAME_MAX_LEN} символов`,
        confirmDelete: "Удалить этот ярлык?",
        deleteText: "Удалить",
        cancelText: "Отмена",
        chatHistory: "История чата",
        clearChatHistory: "Очистить историю",
        clearHistoryConfirm: "Вы уверены, что хотите очистить историю? Действие необратимо.",
        historyCleared: "История чата очищена",
        pinChat: "Закрепить чат",
        unpinChat: "Открепить чат",
        expand: "Развернуть",
        collapse: "Свернуть",
        selectModel: "Выбрать модель",
        noModelAvailable: "Нет доступных моделей",
        modelReleasedOn: "Выпущено",
        modelInputSupport: "Поддержка ввода",
        modelSystemPrompt: "Системный промпт",
        modelFreeOnly: "Только бесплатные модели",
        modelMultiFormatSupport: "Мульти-форматный ввод",
        noModelMatch: "Нет моделей по фильтру",
        selectLanguage: "Выбрать язык",
        myPrompts: "Мои подсказки",
        prefabPrompts: "Готовые подсказки",
        promptName: "Имя подсказки",
        promptContent: "Содержание подсказки",
        promptMaxCount: `Можно добавить только до ${SHORTCUTS_MAX} подсказок`,
        promptSaved: "Подсказка сохранена",
        promptDeleted: "Подсказка удалена",
        savePromptChanges: "Сохранить изменения",
        promptNamePlaceholder: "например Перевести на русский",
        promptContentPlaceholder: "Введите ваш промпт...",
        promptNameMaxWarning: `Имя не может превышать ${NAME_MAX_LEN} символов`,
        confirmDeletePrompt: "Удалить эту подсказку?",
        modelSettings: "Настройки модели",
        modelSettingsSaved: "Настройки сохранены",
        promptHolder: "Создайте системный промпт для ассистента...",
        operation: "Операция",
        selected: "Выбрано",
        enterToSubmit: "нажмите Enter для отправки",
        verifyFirst: "Сначала подтвердите API ключ.",
        pricing: "Тарифы",
        contextLength: "Длина контекста",
        usernamePlaceHolder: "Введите имя/ник здесь..",
        statistics: "Статистика",
        sponsorship: "Поддержка",
        buyMeACoffee: "Купи мне кофе"
    }, {
        label: 'Українська (uk-UA)',
        value: 'uk-UA',
        newChat: "новийЧат",
        imageTag: "зображення",
        audioTag: "аудіо",
        textTag: "текст",
        fileTag: "файл",
        webSearch: "веб-пошук",
        promptTag: "Промпти",
        modelTag: "Моделі",
        currentModel: "Поточна модель",
        select: "Вибрати",
        releaseDate: "Дата випуску",
        systemPrompt: "Системний промпт",
        clear: "очистити",
        save: "зберегти",
        apply: "застосувати",
        verify: "Перевірити",
        verifyLabel: "Інформація про кредит зʼявиться після перевірки API ключа.",
        credit: "Кредит",
        totalCredits: "Всього кредитів",
        usedCredits: "Використано",
        refresh: "Оновити",
        saveChanges: "Зберегти зміни",
        delete: "Видалити",
        addNew: "Додати",
        shortcuts: "Ярлики",
        shortcutName: "Назва ярлика",
        shortcutPrompt: "Промпт ярлика",
        shortcutMaxCount: `Можна додати лише до 5 ярликів`,
        shortcutSaved: "Ярлики успішно збережено",
        shortcutDeleted: "Ярлик успішно видалено",
        saveUserInfo: "Зберегти дані користувача",
        userName: "Ім’я користувача",
        languagePreference: "Мова",
        setAvatar: "Встановити аватар",
        updateAvatar: "Оновити аватар",
        setting: "Налаштування",
        userInfo: "Інформація",
        apiKeyTab: "API ключ",
        userInfoTab: "Дані",
        shortcutsTab: "Ярлики",
        aboutTab: "Про програму",
        getName: "Ваше ім’я/нік",
        inputPlaceholder: "Введіть тут..",
        selectPlaceholder: "Встановити мову системи",
        noShortcuts: "Немає ярликів, натисніть 'Додати', щоб почати",
        maxShortcutWarning: `Можна додати лише до ${SHORTCUTS_MAX} ярликів`,
        shortcutNamePlaceholder: "напр. Перекласти українською",
        shortcutPromptPlaceholder: "Введіть ваш промпт...",
        nameMaxWarning: `Назва не може перевищувати ${NAME_MAX_LEN} символів`,
        confirmDelete: "Видалити цей ярлик?",
        deleteText: "Видалити",
        cancelText: "Скасувати",
        chatHistory: "Історія чату",
        clearChatHistory: "Очистити історію",
        clearHistoryConfirm: "Ви впевнені, що хочете очистити історію? Дію неможливо скасувати.",
        historyCleared: "Історію чату очищено",
        pinChat: "Закріпити чат",
        unpinChat: "Відкріпити чат",
        expand: "Розгорнути",
        collapse: "Згорнути",
        selectModel: "Вибрати модель",
        noModelAvailable: "Немає доступних моделей",
        modelReleasedOn: "Випущено",
        modelInputSupport: "Підтримка вводу",
        modelSystemPrompt: "Системний промпт",
        modelFreeOnly: "Лише безкоштовні моделі",
        modelMultiFormatSupport: "Підтримка мульті-формату",
        noModelMatch: "Немає моделей за фільтром",
        selectLanguage: "Вибрати мову",
        myPrompts: "Мої промпти",
        prefabPrompts: "Готові промпти",
        promptName: "Назва промпта",
        promptContent: "Вміст промпта",
        promptMaxCount: `Можна додати лише до ${SHORTCUTS_MAX} промптів`,
        promptSaved: "Промпт збережено",
        promptDeleted: "Промпт видалено",
        savePromptChanges: "Зберегти зміни",
        promptNamePlaceholder: "напр. Перекласти українською",
        promptContentPlaceholder: "Введіть ваш промпт...",
        promptNameMaxWarning: `Назва не може перевищувати ${NAME_MAX_LEN} символів`,
        confirmDeletePrompt: "Видалити цей промпт?",
        modelSettings: "Налаштування моделі",
        modelSettingsSaved: "Налаштування збережено",
        promptHolder: "Створіть системний промпт для асистента...",
        operation: "Операція",
        selected: "Вибрано",
        enterToSubmit: "натисніть Enter для відправки",
        verifyFirst: "Спершу перевірте API ключ.",
        pricing: "Тарифи",
        contextLength: "Довжина контексту",
        usernamePlaceHolder: "Введіть ім’я/нік тут..",
        statistics: "Статистика",
        sponsorship: "Спонсорство",
        buyMeACoffee: "Пригости кавою"
    },
    {
        label: 'Polski (pl-PL)',
        value: 'pl-PL',
        newChat: "nowyCzat",
        imageTag: "obraz",
        audioTag: "audio",
        textTag: "tekst",
        fileTag: "plik",
        webSearch: "wyszukiwanie w sieci",
        promptTag: "Podpowiedzi",
        modelTag: "Modele",
        currentModel: "Bieżący model",
        select: "Wybierz",
        releaseDate: "Data wydania",
        systemPrompt: "Prompt systemowy",
        clear: "wyczyść",
        save: "zapisz",
        apply: "zastosuj",
        verify: "Zweryfikuj",
        verifyLabel: "Informacje o kredytach pojawią się po weryfikacji klucza API.",
        credit: "Kredyt",
        totalCredits: "Łączne kredyty",
        usedCredits: "Użyte kredyty",
        refresh: "Odśwież",
        saveChanges: "Zapisz zmiany",
        delete: "Usuń",
        addNew: "Dodaj",
        shortcuts: "Skróty",
        shortcutName: "Nazwa skrótu",
        shortcutPrompt: "Prompt skrótu",
        shortcutMaxCount: `Możesz dodać maks. 5 skrótów`,
        shortcutSaved: "Skróty zapisane pomyślnie",
        shortcutDeleted: "Skrót usunięty pomyślnie",
        saveUserInfo: "Zapisz dane użytkownika",
        userName: "Nazwa użytkownika",
        languagePreference: "Język",
        setAvatar: "Ustaw awatar",
        updateAvatar: "Aktualizuj awatar",
        setting: "Ustawienia",
        userInfo: "Informacje",
        apiKeyTab: "Klucz API",
        userInfoTab: "Dane",
        shortcutsTab: "Skróty",
        aboutTab: "O programie",
        getName: "Twoje imię/nick",
        inputPlaceholder: "Wpisz tutaj..",
        selectPlaceholder: "Ustaw język systemu",
        noShortcuts: "Brak skrótów, kliknij 'Dodaj', aby rozpocząć",
        maxShortcutWarning: `Możesz dodać maks. ${SHORTCUTS_MAX} skrótów`,
        shortcutNamePlaceholder: "np. Przetłumacz na polski",
        shortcutPromptPlaceholder: "Wpisz swój prompt...",
        nameMaxWarning: `Nazwa nie może przekroczyć ${NAME_MAX_LEN} znaków`,
        confirmDelete: "Czy na pewno usunąć ten skrót?",
        deleteText: "Usuń",
        cancelText: "Anuluj",
        chatHistory: "Historia czatu",
        clearChatHistory: "Wyczyść historię",
        clearHistoryConfirm: "Na pewno wyczyścić historię? Operacja nieodwracalna.",
        historyCleared: "Historia wyczyszczona",
        pinChat: "Przypnij czat",
        unpinChat: "Odepnij czat",
        expand: "Rozwiń",
        collapse: "Zwiń",
        selectModel: "Wybierz model",
        noModelAvailable: "Brak modeli",
        modelReleasedOn: "Wydano",
        modelInputSupport: "Obsługa wejścia",
        modelSystemPrompt: "Prompt systemowy",
        modelFreeOnly: "Tylko darmowe modele",
        modelMultiFormatSupport: "Obsługa multi-formatu",
        noModelMatch: "Brak modeli pasujących do filtru",
        selectLanguage: "Wybierz język",
        myPrompts: "Moje prompty",
        prefabPrompts: "Gotowe prompty",
        promptName: "Nazwa prompta",
        promptContent: "Treść prompta",
        promptMaxCount: `Możesz dodać maks. ${SHORTCUTS_MAX} promptów`,
        promptSaved: "Prompt zapisany",
        promptDeleted: "Prompt usunięty",
        savePromptChanges: "Zapisz zmiany",
        promptNamePlaceholder: "np. Przetłumacz na polski",
        promptContentPlaceholder: "Wpisz swój prompt...",
        promptNameMaxWarning: `Nazwa prompta nie może przekroczyć ${NAME_MAX_LEN} znaków`,
        confirmDeletePrompt: "Usunąć ten prompt?",
        modelSettings: "Ustawienia modelu",
        modelSettingsSaved: "Ustawienia zapisane",
        promptHolder: "Utwórz prompt systemowy dla asystenta...",
        operation: "Operacja",
        selected: "Wybrano",
        enterToSubmit: "naciśnij Enter, aby wysłać",
        verifyFirst: "Najpierw zweryfikuj klucz API.",
        pricing: "Cennik",
        contextLength: "Długość kontekstu",
        usernamePlaceHolder: "Wpisz imię/nick tutaj..",
        statistics: "Statystyki",
        sponsorship: "Wsparcie",
        buyMeACoffee: "Postaw kawę"
    },
    {
        label: 'Türkçe (tr-TR)',
        value: 'tr-TR',
        newChat: "yeniSohbet",
        imageTag: "görsel",
        audioTag: "ses",
        textTag: "metin",
        fileTag: "dosya",
        webSearch: "web arama",
        promptTag: "İstemler",
        modelTag: "Modeller",
        currentModel: "Geçerli Model",
        select: "Seç",
        releaseDate: "Yayın Tarihi",
        systemPrompt: "Sistem İstemi",
        clear: "temizle",
        save: "kaydet",
        apply: "uygula",
        verify: "Doğrula",
        verifyLabel: "API anahtarı doğrulandıktan sonra kredi bilgisi görüntülenecek.",
        credit: "Kredi",
        totalCredits: "Toplam Kredi",
        usedCredits: "Kullanılan Kredi",
        refresh: "Yenile",
        saveChanges: "Değişiklikleri Kaydet",
        delete: "Sil",
        addNew: "Ekle",
        shortcuts: "Kısayollar",
        shortcutName: "Kısayol Adı",
        shortcutPrompt: "Kısayol İstemi",
        shortcutMaxCount: `En fazla 5 kısayol ekleyebilirsiniz`,
        shortcutSaved: "Kısayollar kaydedildi",
        shortcutDeleted: "Kısayol silindi",
        saveUserInfo: "Kullanıcı Bilgilerini Kaydet",
        userName: "Kullanıcı Adı",
        languagePreference: "Dil Tercihi",
        setAvatar: "Avatar Ayarla",
        updateAvatar: "Avatar Güncelle",
        setting: "Ayarlar",
        userInfo: "Kullanıcı Bilgileri",
        apiKeyTab: "API Anahtarı",
        userInfoTab: "Bilgi",
        shortcutsTab: "Kısayollar",
        aboutTab: "Hakkında",
        getName: "Adınız/Takma adınız",
        inputPlaceholder: "Buraya yazın..",
        selectPlaceholder: "Sistem Dilini Ayarla",
        noShortcuts: "Henüz kısayol yok, başlamak için 'Ekle'ye tıklayın",
        maxShortcutWarning: `En fazla ${SHORTCUTS_MAX} kısayol ekleyebilirsiniz`,
        shortcutNamePlaceholder: "örn. Türkçeye çevir",
        shortcutPromptPlaceholder: "İsteminizi girin...",
        nameMaxWarning: `Ad ${NAME_MAX_LEN} karakteri geçemez`,
        confirmDelete: "Bu kısayolu silmek istediğinize emin misiniz?",
        deleteText: "Sil",
        cancelText: "İptal",
        chatHistory: "Sohbet Geçmişi",
        clearChatHistory: "Geçmişi Temizle",
        clearHistoryConfirm: "Geçmişi temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz.",
        historyCleared: "Geçmiş temizlendi",
        pinChat: "Sohbeti Sabitle",
        unpinChat: "Sohbeti Kaldır",
        expand: "Genişlet",
        collapse: "Daralt",
        selectModel: "Model Seç",
        noModelAvailable: "Model yok",
        modelReleasedOn: "Yayınlandı",
        modelInputSupport: "Girdi Desteği",
        modelSystemPrompt: "Sistem İstemi",
        modelFreeOnly: "Sadece Ücretsiz Modeller",
        modelMultiFormatSupport: "Çok formatlı giriş desteği",
        noModelMatch: "Filtreye uyan model yok",
        selectLanguage: "Dil Seç",
        myPrompts: "İstemlerim",
        prefabPrompts: "Hazır İstemler",
        promptName: "İstem Adı",
        promptContent: "İstem İçeriği",
        promptMaxCount: `En fazla ${SHORTCUTS_MAX} istem ekleyebilirsiniz`,
        promptSaved: "İstem kaydedildi",
        promptDeleted: "İstem silindi",
        savePromptChanges: "İstem Değişikliklerini Kaydet",
        promptNamePlaceholder: "örn. Türkçeye çevir",
        promptContentPlaceholder: "İsteminizi girin...",
        promptNameMaxWarning: `İstem adı ${NAME_MAX_LEN} karakteri geçemez`,
        confirmDeletePrompt: "Bu istemi silmek istediğinize emin misiniz?",
        modelSettings: "Model Ayarları",
        modelSettingsSaved: "Ayarlar kaydedildi",
        promptHolder: "Asistan için sistem istemi oluştur...",
        operation: "İşlem",
        selected: "Seçildi",
        enterToSubmit: "Enter ile gönder",
        verifyFirst: "Önce API anahtarını doğrulayın.",
        pricing: "Fiyatlandırma",
        contextLength: "Bağlam Uzunluğu",
        usernamePlaceHolder: "Adınızı/takma adınızı buraya girin..",
        statistics: "İstatistikler",
        sponsorship: "Sponsorluk",
        buyMeACoffee: "Bana kahve ısmarla"
    }, {
        label: 'Tiếng Việt (vi-VN)', value: 'vi-VN',
        newChat: "cuộc trò chuyện mới", imageTag: "hình ảnh", audioTag: "âm thanh", textTag: "văn bản", fileTag: "tệp",
        webSearch: "tìm kiếm web", promptTag: "Lời nhắc", modelTag: "Mô hình", currentModel: "Mô hình hiện tại",
        select: "Chọn", releaseDate: "Ngày phát hành", systemPrompt: "Lời nhắc hệ thống", clear: "xóa",
        save: "lưu", apply: "áp dụng", verify: "Xác minh", verifyLabel: "Thông tin tín dụng sẽ hiển thị sau khi xác minh API key.",
        credit: "Tín dụng", totalCredits: "Tổng tín dụng", usedCredits: "Đã sử dụng", refresh: "Làm mới",
        saveChanges: "Lưu thay đổi", delete: "Xóa", addNew: "Thêm", shortcuts: "Phím tắt", shortcutName: "Tên phím tắt",
        shortcutPrompt: "Lời nhắc phím tắt", shortcutMaxCount: `Chỉ có thể thêm tối đa 5 phím tắt`,
        shortcutSaved: "Lưu phím tắt thành công", shortcutDeleted: "Xóa phím tắt thành công",
        saveUserInfo: "Lưu thông tin người dùng", userName: "Tên người dùng", languagePreference: "Ngôn ngữ ưu tiên",
        setAvatar: "Đặt ảnh đại diện", updateAvatar: "Cập nhật ảnh đại diện", setting: "Cài đặt", userInfo: "Thông tin người dùng",
        apiKeyTab: "API Key", userInfoTab: "Thông tin", shortcutsTab: "Phím tắt", aboutTab: "Giới thiệu",
        getName: "Tên/Biệt danh của bạn", inputPlaceholder: "Nhập tại đây..", selectPlaceholder: "Chọn ngôn ngữ hệ thống",
        noShortcuts: "Chưa có phím tắt, nhấn 'Thêm' để bắt đầu",
        maxShortcutWarning: `Chỉ có thể thêm tối đa ${SHORTCUTS_MAX} phím tắt`,
        shortcutNamePlaceholder: "vd: Dịch sang tiếng Việt", shortcutPromptPlaceholder: "Nhập lời nhắc...",
        nameMaxWarning: `Tên không được vượt quá ${NAME_MAX_LEN} ký tự`, confirmDelete: "Bạn có chắc chắn xóa phím tắt này?",
        deleteText: "Xóa", cancelText: "Hủy", chatHistory: "Lịch sử trò chuyện", clearChatHistory: "Xóa lịch sử",
        clearHistoryConfirm: "Bạn có chắc chắn xóa lịch sử? Không thể hoàn tác.", historyCleared: "Đã xóa lịch sử",
        pinChat: "Ghim trò chuyện", unpinChat: "Bỏ ghim", expand: "Mở rộng", collapse: "Thu gọn",
        selectModel: "Chọn mô hình", noModelAvailable: "Không có mô hình", modelReleasedOn: "Phát hành ngày",
        modelInputSupport: "Hỗ trợ đầu vào", modelSystemPrompt: "Lời nhắc hệ thống", modelFreeOnly: "Chỉ mô hình miễn phí",
        modelMultiFormatSupport: "Hỗ trợ đa định dạng", noModelMatch: "Không có mô hình phù hợp",
        selectLanguage: "Chọn ngôn ngữ", myPrompts: "Lời nhắc của tôi", prefabPrompts: "Lời nhắc dựng sẵn",
        promptName: "Tên lời nhắc", promptContent: "Nội dung lời nhắc", promptMaxCount: `Chỉ thêm tối đa ${SHORTCUTS_MAX} lời nhắc`,
        promptSaved: "Đã lưu lời nhắc", promptDeleted: "Đã xóa lời nhắc", savePromptChanges: "Lưu thay đổi lời nhắc",
        promptNamePlaceholder: "vd: Dịch sang tiếng Việt", promptContentPlaceholder: "Nhập lời nhắc...",
        promptNameMaxWarning: `Tên lời nhắc không vượt quá ${NAME_MAX_LEN} ký tự`, confirmDeletePrompt: "Bạn có chắc muốn xóa lời nhắc này?",
        modelSettings: "Cài đặt mô hình", modelSettingsSaved: "Đã lưu cài đặt mô hình",
        promptHolder: "Tạo lời nhắc hệ thống cho trợ lý...", operation: "Thao tác", selected: "Đã chọn",
        enterToSubmit: "nhấn Enter để gửi", verifyFirst: "Vui lòng xác minh API key trước.", pricing: "Giá",
        contextLength: "Độ dài ngữ cảnh", usernamePlaceHolder: "Nhập tên/bí danh tại đây..",
        statistics: "Thống kê", sponsorship: "Tài trợ", buyMeACoffee: "Mua cà phê cho tôi"
    },
    {
        label: 'ภาษาไทย (th-TH)', value: 'th-TH',
        newChat: "แชทใหม่", imageTag: "รูปภาพ", audioTag: "เสียง", textTag: "ข้อความ", fileTag: "ไฟล์",
        webSearch: "ค้นหาเว็บ", promptTag: "พรอมพ์", modelTag: "โมเดล", currentModel: "โมเดลปัจจุบัน",
        select: "เลือก", releaseDate: "วันเผยแพร่", systemPrompt: "พรอมพ์ระบบ", clear: "ล้าง",
        save: "บันทึก", apply: "ใช้", verify: "ยืนยัน", verifyLabel: "จะแสดงข้อมูลเครดิตหลังจากตรวจสอบ API key แล้ว",
        credit: "เครดิต", totalCredits: "เครดิตรวม", usedCredits: "เครดิตที่ใช้", refresh: "รีเฟรช",
        saveChanges: "บันทึกการเปลี่ยนแปลง", delete: "ลบ", addNew: "เพิ่ม", shortcuts: "ทางลัด", shortcutName: "ชื่อทางลัด",
        shortcutPrompt: "พรอมพ์ทางลัด", shortcutMaxCount: `เพิ่มได้สูงสุด 5 ทางลัด`,
        shortcutSaved: "บันทึกทางลัดสำเร็จ", shortcutDeleted: "ลบทางลัดสำเร็จ",
        saveUserInfo: "บันทึกข้อมูลผู้ใช้", userName: "ชื่อผู้ใช้", languagePreference: "ภาษาที่ต้องการ",
        setAvatar: "ตั้งอวตาร", updateAvatar: "อัปเดตอวตาร", setting: "การตั้งค่า", userInfo: "ข้อมูลผู้ใช้",
        apiKeyTab: "API Key", userInfoTab: "ข้อมูลผู้ใช้", shortcutsTab: "ทางลัด", aboutTab: "เกี่ยวกับ",
        getName: "ชื่อ/ชื่อเล่นของคุณ", inputPlaceholder: "กรอกที่นี่..", selectPlaceholder: "เลือกภาษาระบบ",
        noShortcuts: "ยังไม่มีทางลัด กด 'เพิ่ม' เพื่อเริ่มต้น",
        maxShortcutWarning: `เพิ่มได้สูงสุด ${SHORTCUTS_MAX} ทางลัด`,
        shortcutNamePlaceholder: "เช่น แปลเป็นภาษาไทย", shortcutPromptPlaceholder: "กรอกพรอมพ์ของคุณ...",
        nameMaxWarning: `ชื่อต้องไม่เกิน ${NAME_MAX_LEN} ตัวอักษร`, confirmDelete: "คุณแน่ใจหรือไม่ที่จะลบทางลัดนี้?",
        deleteText: "ลบ", cancelText: "ยกเลิก", chatHistory: "ประวัติการแชท", clearChatHistory: "ล้างประวัติการแชท",
        clearHistoryConfirm: "คุณแน่ใจหรือไม่ที่จะล้างประวัติ? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
        historyCleared: "ล้างประวัติแล้ว", pinChat: "ปักหมุดแชท", unpinChat: "ยกเลิกปักหมุด", expand: "ขยาย", collapse: "ย่อ",
        selectModel: "เลือกโมเดล", noModelAvailable: "ไม่มีโมเดล", modelReleasedOn: "เผยแพร่เมื่อ",
        modelInputSupport: "รองรับอินพุต", modelSystemPrompt: "พรอมพ์ระบบ", modelFreeOnly: "โมเดลฟรีเท่านั้น",
        modelMultiFormatSupport: "รองรับหลายรูปแบบ", noModelMatch: "ไม่พบโมเดลที่ตรง",
        selectLanguage: "เลือกภาษา", myPrompts: "พรอมพ์ของฉัน", prefabPrompts: "พรอมพ์สำเร็จรูป",
        promptName: "ชื่อพรอมพ์", promptContent: "เนื้อหาพรอมพ์", promptMaxCount: `เพิ่มได้สูงสุด ${SHORTCUTS_MAX} พรอมพ์`,
        promptSaved: "บันทึกพรอมพ์สำเร็จ", promptDeleted: "ลบพรอมพ์สำเร็จ", savePromptChanges: "บันทึกการเปลี่ยนแปลงพรอมพ์",
        promptNamePlaceholder: "เช่น แปลเป็นภาษาไทย", promptContentPlaceholder: "กรอกพรอมพ์ของคุณ...",
        promptNameMaxWarning: `ชื่อพรอมพ์ต้องไม่เกิน ${NAME_MAX_LEN} ตัวอักษร`, confirmDeletePrompt: "คุณแน่ใจหรือไม่ที่จะลบพรอมพ์นี้?",
        modelSettings: "การตั้งค่าโมเดล", modelSettingsSaved: "บันทึกการตั้งค่าโมเดลแล้ว",
        promptHolder: "สร้างพรอมพ์ระบบสำหรับผู้ช่วย...", operation: "การดำเนินการ", selected: "เลือกแล้ว",
        enterToSubmit: "กด Enter เพื่อส่ง", verifyFirst: "กรุณายืนยัน API key ก่อน", pricing: "ราคา",
        contextLength: "ความยาวบริบท", usernamePlaceHolder: "กรอกชื่อ/ชื่อเล่นที่นี่..",
        statistics: "สถิติ", sponsorship: "การสนับสนุน", buyMeACoffee: "เลี้ยงกาแฟฉัน"
    }, {
        label: 'हिंदी (hi-IN)', value: 'hi-IN',
        newChat: "नई चैट", imageTag: "चित्र", audioTag: "ऑडियो", textTag: "पाठ", fileTag: "फ़ाइल",
        webSearch: "वेब खोज", promptTag: "प्रॉम्प्ट्स", modelTag: "मॉडल", currentModel: "वर्तमान मॉडल",
        select: "चुनें", releaseDate: "रिलीज़ तिथि", systemPrompt: "सिस्टम प्रॉम्प्ट", clear: "साफ़ करें",
        save: "सहेजें", apply: "लागू करें", verify: "सत्यापित करें", verifyLabel: "API key सत्यापित होने के बाद क्रेडिट जानकारी दिखाई जाएगी।",
        credit: "क्रेडिट", totalCredits: "कुल क्रेडिट", usedCredits: "प्रयुक्त क्रेडिट", refresh: "रिफ्रेश",
        saveChanges: "परिवर्तन सहेजें", delete: "हटाएँ", addNew: "जोड़ें", shortcuts: "शॉर्टकट्स", shortcutName: "शॉर्टकट नाम",
        shortcutPrompt: "शॉर्टकट प्रॉम्प्ट", shortcutMaxCount: `आप केवल 5 शॉर्टकट जोड़ सकते हैं`,
        shortcutSaved: "शॉर्टकट सफलतापूर्वक सहेजा गया", shortcutDeleted: "शॉर्टकट सफलतापूर्वक हटाया गया",
        saveUserInfo: "यूज़र जानकारी सहेजें", userName: "यूज़र नाम", languagePreference: "भाषा वरीयता",
        setAvatar: "अवतार सेट करें", updateAvatar: "अवतार अपडेट करें", setting: "सेटिंग", userInfo: "यूज़र जानकारी",
        apiKeyTab: "API Key", userInfoTab: "यूज़र जानकारी", shortcutsTab: "शॉर्टकट्स", aboutTab: "बारे में",
        getName: "आपका नाम/उपनाम", inputPlaceholder: "यहाँ दर्ज करें..", selectPlaceholder: "सिस्टम भाषा सेट करें",
        noShortcuts: "अभी तक कोई शॉर्टकट नहीं, 'जोड़ें' क्लिक करें",
        maxShortcutWarning: `आप केवल ${SHORTCUTS_MAX} शॉर्टकट जोड़ सकते हैं`,
        shortcutNamePlaceholder: "जैसे: अंग्रेज़ी में अनुवाद करें", shortcutPromptPlaceholder: "अपना प्रॉम्प्ट दर्ज करें...",
        nameMaxWarning: `नाम ${NAME_MAX_LEN} अक्षरों से अधिक नहीं हो सकता`, confirmDelete: "क्या आप यह शॉर्टकट हटाना चाहते हैं?",
        deleteText: "हटाएँ", cancelText: "रद्द करें", chatHistory: "चैट इतिहास", clearChatHistory: "चैट इतिहास साफ़ करें",
        clearHistoryConfirm: "क्या आप वाकई इतिहास हटाना चाहते हैं? इसे वापस नहीं किया जा सकता।", historyCleared: "चैट इतिहास हटाया गया",
        pinChat: "चैट पिन करें", unpinChat: "पिन हटाएँ", expand: "विस्तृत करें", collapse: "संकुचित करें",
        selectModel: "मॉडल चुनें", noModelAvailable: "कोई मॉडल उपलब्ध नहीं", modelReleasedOn: "जारी किया गया",
        modelInputSupport: "इनपुट समर्थन", modelSystemPrompt: "सिस्टम प्रॉम्प्ट", modelFreeOnly: "केवल निःशुल्क मॉडल",
        modelMultiFormatSupport: "मल्टी-फ़ॉर्मेट समर्थन", noModelMatch: "कोई मॉडल मेल नहीं खाया",
        selectLanguage: "भाषा चुनें", myPrompts: "मेरे प्रॉम्प्ट्स", prefabPrompts: "पूर्वनिर्धारित प्रॉम्प्ट्स",
        promptName: "प्रॉम्प्ट नाम", promptContent: "प्रॉम्प्ट सामग्री", promptMaxCount: `आप केवल ${SHORTCUTS_MAX} प्रॉम्प्ट जोड़ सकते हैं`,
        promptSaved: "प्रॉम्प्ट सहेजा गया", promptDeleted: "प्रॉम्प्ट हटाया गया", savePromptChanges: "परिवर्तन सहेजें",
        promptNamePlaceholder: "जैसे: अंग्रेज़ी में अनुवाद करें", promptContentPlaceholder: "अपना प्रॉम्प्ट दर्ज करें...",
        promptNameMaxWarning: `प्रॉम्प्ट नाम ${NAME_MAX_LEN} अक्षरों से अधिक नहीं हो सकता`, confirmDeletePrompt: "क्या आप यह प्रॉम्प्ट हटाना चाहते हैं?",
        modelSettings: "मॉडल सेटिंग्स", modelSettingsSaved: "मॉडल सेटिंग्स सहेजी गईं",
        promptHolder: "सहायक के लिए सिस्टम प्रॉम्प्ट बनाएँ...", operation: "क्रिया", selected: "चयनित",
        enterToSubmit: "Enter दबाएँ", verifyFirst: "कृपया पहले API key सत्यापित करें।", pricing: "मूल्य",
        contextLength: "संदर्भ लंबाई", usernamePlaceHolder: "यहाँ नाम/उपनाम दर्ज करें..",
        statistics: "सांख्यिकी", sponsorship: "प्रायोजन", buyMeACoffee: "मुझे कॉफ़ी पिलाएँ"
    },
    {
        label: 'বাংলা (bn-BD)', value: 'bn-BD',
        newChat: "নতুন চ্যাট", imageTag: "ছবি", audioTag: "অডিও", textTag: "টেক্সট", fileTag: "ফাইল",
        webSearch: "ওয়েব সার্চ", promptTag: "প্রম্পট", modelTag: "মডেল", currentModel: "বর্তমান মডেল",
        select: "নির্বাচন করুন", releaseDate: "প্রকাশের তারিখ", systemPrompt: "সিস্টেম প্রম্পট", clear: "মুছুন",
        save: "সংরক্ষণ", apply: "প্রয়োগ করুন", verify: "যাচাই করুন", verifyLabel: "API key যাচাইয়ের পর ক্রেডিট তথ্য প্রদর্শিত হবে।",
        credit: "ক্রেডিট", totalCredits: "মোট ক্রেডিট", usedCredits: "ব্যবহৃত ক্রেডিট", refresh: "রিফ্রেশ",
        saveChanges: "পরিবর্তন সংরক্ষণ করুন", delete: "মুছুন", addNew: "যোগ করুন", shortcuts: "শর্টকাট", shortcutName: "শর্টকাট নাম",
        shortcutPrompt: "শর্টকাট প্রম্পট", shortcutMaxCount: `আপনি সর্বোচ্চ 5টি শর্টকাট যোগ করতে পারবেন`,
        shortcutSaved: "শর্টকাট সফলভাবে সংরক্ষিত", shortcutDeleted: "শর্টকাট সফলভাবে মুছে ফেলা হয়েছে",
        saveUserInfo: "ব্যবহারকারীর তথ্য সংরক্ষণ করুন", userName: "ব্যবহারকারীর নাম", languagePreference: "ভাষা পছন্দ",
        setAvatar: "অবতার সেট করুন", updateAvatar: "অবতার আপডেট করুন", setting: "সেটিং", userInfo: "ব্যবহারকারীর তথ্য",
        apiKeyTab: "API Key", userInfoTab: "ব্যবহারকারীর তথ্য", shortcutsTab: "শর্টকাট", aboutTab: "সম্পর্কিত",
        getName: "আপনার নাম/ডাকনাম", inputPlaceholder: "এখানে লিখুন..", selectPlaceholder: "সিস্টেম ভাষা সেট করুন",
        noShortcuts: "এখনও কোনো শর্টকাট নেই, 'যোগ করুন' ক্লিক করুন",
        maxShortcutWarning: `আপনি সর্বোচ্চ ${SHORTCUTS_MAX} শর্টকাট যোগ করতে পারবেন`,
        shortcutNamePlaceholder: "যেমন: ইংরেজিতে অনুবাদ করুন", shortcutPromptPlaceholder: "আপনার প্রম্পট লিখুন...",
        nameMaxWarning: `নাম ${NAME_MAX_LEN} অক্ষরের বেশি হতে পারবে না`, confirmDelete: "আপনি কি নিশ্চিত এটি মুছবেন?",
        deleteText: "মুছুন", cancelText: "বাতিল", chatHistory: "চ্যাট ইতিহাস", clearChatHistory: "চ্যাট ইতিহাস মুছুন",
        clearHistoryConfirm: "আপনি কি নিশ্চিত ইতিহাস মুছবেন? এটি ফিরিয়ে আনা যাবে না।", historyCleared: "চ্যাট ইতিহাস মুছে ফেলা হয়েছে",
        pinChat: "চ্যাট পিন করুন", unpinChat: "পিন সরান", expand: "বিস্তার", collapse: "সংকুচিত করুন",
        selectModel: "মডেল নির্বাচন করুন", noModelAvailable: "কোনো মডেল নেই", modelReleasedOn: "প্রকাশিত",
        modelInputSupport: "ইনপুট সমর্থন", modelSystemPrompt: "সিস্টেম প্রম্পট", modelFreeOnly: "শুধু ফ্রি মডেল",
        modelMultiFormatSupport: "মাল্টি-ফরম্যাট সমর্থন", noModelMatch: "কোনো মডেল মেলেনি",
        selectLanguage: "ভাষা নির্বাচন করুন", myPrompts: "আমার প্রম্পট", prefabPrompts: "প্রস্তুত প্রম্পট",
        promptName: "প্রম্পট নাম", promptContent: "প্রম্পট বিষয়বস্তু", promptMaxCount: `আপনি সর্বোচ্চ ${SHORTCUTS_MAX} প্রম্পট যোগ করতে পারবেন`,
        promptSaved: "প্রম্পট সংরক্ষিত", promptDeleted: "প্রম্পট মুছে ফেলা হয়েছে", savePromptChanges: "পরিবর্তন সংরক্ষণ করুন",
        promptNamePlaceholder: "যেমন: ইংরেজিতে অনুবাদ করুন", promptContentPlaceholder: "আপনার প্রম্পট লিখুন...",
        promptNameMaxWarning: `প্রম্পট নাম ${NAME_MAX_LEN} অক্ষরের বেশি হতে পারবে না`, confirmDeletePrompt: "আপনি কি নিশ্চিত এটি মুছবেন?",
        modelSettings: "মডেল সেটিংস", modelSettingsSaved: "মডেল সেটিংস সংরক্ষিত",
        promptHolder: "সহকারীর জন্য সিস্টেম প্রম্পট তৈরি করুন...", operation: "অপারেশন", selected: "নির্বাচিত",
        enterToSubmit: "Enter চাপুন", verifyFirst: "দয়া করে প্রথমে API key যাচাই করুন।", pricing: "মূল্য",
        contextLength: "প্রসঙ্গ দৈর্ঘ্য", usernamePlaceHolder: "এখানে নাম/ডাকনাম লিখুন..",
        statistics: "পরিসংখ্যান", sponsorship: "স্পনসরশিপ", buyMeACoffee: "আমাকে কফি কিনুন"
    },
    {
        label: 'मराठी (mr-IN)', value: 'mr-IN',
        newChat: "नवीन गप्पा", imageTag: "चित्र", audioTag: "ऑडिओ", textTag: "मजकूर", fileTag: "फाइल",
        webSearch: "वेब शोध", promptTag: "प्रॉम्प्ट्स", modelTag: "मॉडेल्स", currentModel: "सध्याचे मॉडेल",
        select: "निवडा", releaseDate: "प्रकाशन तारीख", systemPrompt: "सिस्टम प्रॉम्प्ट", clear: "साफ करा",
        save: "जतन करा", apply: "लागू करा", verify: "तपासा", verifyLabel: "API key सत्यापित झाल्यावर क्रेडिट माहिती दाखवली जाईल.",
        credit: "क्रेडिट", totalCredits: "एकूण क्रेडिट", usedCredits: "वापरलेले क्रेडिट", refresh: "रिफ्रेश",
        saveChanges: "बदल जतन करा", delete: "हटवा", addNew: "जोडा", shortcuts: "शॉर्टकट्स", shortcutName: "शॉर्टकट नाव",
        shortcutPrompt: "शॉर्टकट प्रॉम्प्ट", shortcutMaxCount: `फक्त 5 शॉर्टकट जोडता येतील`,
        shortcutSaved: "शॉर्टकट यशस्वीरित्या जतन केला", shortcutDeleted: "शॉर्टकट यशस्वीरित्या हटवला",
        saveUserInfo: "वापरकर्ता माहिती जतन करा", userName: "वापरकर्ता नाव", languagePreference: "भाषा पसंती",
        setAvatar: "अवतार सेट करा", updateAvatar: "अवतार अपडेट करा", setting: "सेटिंग", userInfo: "वापरकर्ता माहिती",
        apiKeyTab: "API Key", userInfoTab: "माहिती", shortcutsTab: "शॉर्टकट्स", aboutTab: "विषयी",
        getName: "तुमचे नाव/टोपणनाव", inputPlaceholder: "इथे लिहा..", selectPlaceholder: "सिस्टम भाषा सेट करा",
        noShortcuts: "अजून शॉर्टकट नाहीत, 'जोडा' क्लिक करा",
        maxShortcutWarning: `फक्त ${SHORTCUTS_MAX} शॉर्टकट जोडता येतील`,
        shortcutNamePlaceholder: "उदा. इंग्रजीत भाषांतर करा", shortcutPromptPlaceholder: "तुमचा प्रॉम्प्ट लिहा...",
        nameMaxWarning: `नाव ${NAME_MAX_LEN} अक्षरांपेक्षा जास्त नसावे`, confirmDelete: "तुम्हाला खात्री आहे का हटवायचे?",
        deleteText: "हटवा", cancelText: "रद्द करा", chatHistory: "गप्पांचा इतिहास", clearChatHistory: "इतिहास साफ करा",
        clearHistoryConfirm: "खात्री आहे का इतिहास हटवायचा? ही क्रिया परत करता येणार नाही.", historyCleared: "इतिहास साफ केला",
        pinChat: "गप्पा पिन करा", unpinChat: "पिन काढा", expand: "वाढवा", collapse: "आकुंचन करा",
        selectModel: "मॉडेल निवडा", noModelAvailable: "मॉडेल उपलब्ध नाही", modelReleasedOn: "प्रकाशित",
        modelInputSupport: "इनपुट समर्थन", modelSystemPrompt: "सिस्टम प्रॉम्प्ट", modelFreeOnly: "फक्त मोफत मॉडेल्स",
        modelMultiFormatSupport: "मल्टी-फॉरमॅट समर्थन", noModelMatch: "कोणतेही मॉडेल जुळले नाही",
        selectLanguage: "भाषा निवडा", myPrompts: "माझे प्रॉम्प्ट्स", prefabPrompts: "पूर्वनिर्धारित प्रॉम्प्ट्स",
        promptName: "प्रॉम्प्ट नाव", promptContent: "प्रॉम्प्ट सामग्री", promptMaxCount: `फक्त ${SHORTCUTS_MAX} प्रॉम्प्ट्स जोडता येतील`,
        promptSaved: "प्रॉम्प्ट जतन केले", promptDeleted: "प्रॉम्प्ट हटवले", savePromptChanges: "बदल जतन करा",
        promptNamePlaceholder: "उदा. इंग्रजीत भाषांतर करा", promptContentPlaceholder: "तुमचा प्रॉम्प्ट लिहा...",
        promptNameMaxWarning: `प्रॉम्प्ट नाव ${NAME_MAX_LEN} अक्षरांपेक्षा जास्त नसावे`, confirmDeletePrompt: "तुम्हाला खात्री आहे का प्रॉम्प्ट हटवायचे?",
        modelSettings: "मॉडेल सेटिंग्ज", modelSettingsSaved: "मॉडेल सेटिंग्ज जतन केल्या",
        promptHolder: "सहाय्यकासाठी सिस्टम प्रॉम्प्ट तयार करा...", operation: "क्रिया", selected: "निवडले",
        enterToSubmit: "Enter दाबा", verifyFirst: "कृपया आधी API key तपासा.", pricing: "किंमत",
        contextLength: "संदर्भ लांबी", usernamePlaceHolder: "इथे नाव/टोपणनाव लिहा..",
        statistics: "सांख्यिकी", sponsorship: "प्रायोजकत्व", buyMeACoffee: "मला कॉफी खरेदी करा"
    }, {
        label: 'اردو (ur-PK)', value: 'ur-PK',
        newChat: "نئی چیٹ", imageTag: "تصویر", audioTag: "آڈیو", textTag: "متن", fileTag: "فائل",
        webSearch: "ویب تلاش", promptTag: "پرومپٹس", modelTag: "ماڈلز", currentModel: "موجودہ ماڈل",
        select: "منتخب کریں", releaseDate: "اجراء کی تاریخ", systemPrompt: "سسٹم پرومپٹ", clear: "صاف کریں",
        save: "محفوظ کریں", apply: "لاگو کریں", verify: "تصدیق کریں", verifyLabel: "API key کی تصدیق کے بعد کریڈٹ معلومات ظاہر ہوں گی۔",
        credit: "کریڈٹ", totalCredits: "کل کریڈٹ", usedCredits: "استعمال شدہ کریڈٹ", refresh: "ریفریش",
        saveChanges: "تبدیلیاں محفوظ کریں", delete: "حذف کریں", addNew: "نیا شامل کریں", shortcuts: "شارٹ کٹس", shortcutName: "شارٹ کٹ نام",
        shortcutPrompt: "شارٹ کٹ پرومپٹ", shortcutMaxCount: `آپ صرف 5 شارٹ کٹس شامل کرسکتے ہیں`,
        shortcutSaved: "شارٹ کٹ کامیابی سے محفوظ ہوا", shortcutDeleted: "شارٹ کٹ کامیابی سے حذف ہوا",
        saveUserInfo: "یوزر معلومات محفوظ کریں", userName: "یوزر نام", languagePreference: "زبان کی ترجیح",
        setAvatar: "اوتار سیٹ کریں", updateAvatar: "اوتار اپڈیٹ کریں", setting: "سیٹنگ", userInfo: "یوزر معلومات",
        apiKeyTab: "API Key", userInfoTab: "معلومات", shortcutsTab: "شارٹ کٹس", aboutTab: "متعلق",
        getName: "آپ کا نام/عرفیت", inputPlaceholder: "یہاں درج کریں..", selectPlaceholder: "سسٹم زبان منتخب کریں",
        noShortcuts: "ابھی تک کوئی شارٹ کٹ نہیں، 'نیا شامل کریں' پر کلک کریں",
        maxShortcutWarning: `آپ صرف ${SHORTCUTS_MAX} شارٹ کٹس شامل کرسکتے ہیں`,
        shortcutNamePlaceholder: "مثال: انگریزی میں ترجمہ کریں", shortcutPromptPlaceholder: "اپنا پرومپٹ درج کریں...",
        nameMaxWarning: `نام ${NAME_MAX_LEN} حروف سے زیادہ نہیں ہوسکتا`, confirmDelete: "کیا آپ واقعی اس شارٹ کٹ کو حذف کرنا چاہتے ہیں؟",
        deleteText: "حذف کریں", cancelText: "منسوخ کریں", chatHistory: "چیٹ ہسٹری", clearChatHistory: "چیٹ ہسٹری صاف کریں",
        clearHistoryConfirm: "کیا آپ واقعی ہسٹری حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہوگا۔", historyCleared: "چیٹ ہسٹری حذف ہوگئی",
        pinChat: "چیٹ پن کریں", unpinChat: "پن ہٹائیں", expand: "پھیلائیں", collapse: "سکیڑیں",
        selectModel: "ماڈل منتخب کریں", noModelAvailable: "کوئی ماڈل دستیاب نہیں", modelReleasedOn: "جاری کیا گیا",
        modelInputSupport: "ان پٹ سپورٹ", modelSystemPrompt: "سسٹم پرومپٹ", modelFreeOnly: "صرف مفت ماڈلز",
        modelMultiFormatSupport: "ملٹی فارمیٹ سپورٹ", noModelMatch: "کوئی ماڈل نہیں ملا",
        selectLanguage: "زبان منتخب کریں", myPrompts: "میرے پرومپٹس", prefabPrompts: "پہلے سے بنے پرومپٹس",
        promptName: "پرومپٹ نام", promptContent: "پرومپٹ مواد", promptMaxCount: `آپ صرف ${SHORTCUTS_MAX} پرومپٹس شامل کرسکتے ہیں`,
        promptSaved: "پرومپٹ محفوظ ہوا", promptDeleted: "پرومپٹ حذف ہوا", savePromptChanges: "تبدیلیاں محفوظ کریں",
        promptNamePlaceholder: "مثال: انگریزی میں ترجمہ کریں", promptContentPlaceholder: "اپنا پرومپٹ درج کریں...",
        promptNameMaxWarning: `پرومپٹ نام ${NAME_MAX_LEN} حروف سے زیادہ نہیں ہوسکتا`, confirmDeletePrompt: "کیا آپ واقعی اس پرومپٹ کو حذف کرنا چاہتے ہیں؟",
        modelSettings: "ماڈل سیٹنگز", modelSettingsSaved: "ماڈل سیٹنگز محفوظ ہوگئیں",
        promptHolder: "اسسٹنٹ کے لئے سسٹم پرومپٹ بنائیں...", operation: "عمل", selected: "منتخب شدہ",
        enterToSubmit: "Enter دبائیں", verifyFirst: "براہ کرم پہلے API key کی تصدیق کریں۔", pricing: "قیمت",
        contextLength: "سیاق و سباق کی لمبائی", usernamePlaceHolder: "یہاں اپنا نام/عرفیت درج کریں..",
        statistics: "اعدادوشمار", sponsorship: "سرپرستی", buyMeACoffee: "مجھے کافی خرید دیں"
    },
    {
        label: 'العربية (ar-SA)', value: 'ar-SA',
        newChat: "محادثة جديدة", imageTag: "صورة", audioTag: "صوت", textTag: "نص", fileTag: "ملف",
        webSearch: "بحث ويب", promptTag: "المطالبات", modelTag: "النماذج", currentModel: "النموذج الحالي",
        select: "اختر", releaseDate: "تاريخ الإصدار", systemPrompt: "موجه النظام", clear: "مسح",
        save: "حفظ", apply: "تطبيق", verify: "تحقق", verifyLabel: "ستظهر معلومات الرصيد بعد التحقق من مفتاح API.",
        credit: "رصيد", totalCredits: "إجمالي الرصيد", usedCredits: "الرصيد المستخدم", refresh: "تحديث",
        saveChanges: "حفظ التغييرات", delete: "حذف", addNew: "إضافة", shortcuts: "اختصارات", shortcutName: "اسم الاختصار",
        shortcutPrompt: "موجه الاختصار", shortcutMaxCount: `يمكنك إضافة ما يصل إلى 5 اختصارات فقط`,
        shortcutSaved: "تم حفظ الاختصار بنجاح", shortcutDeleted: "تم حذف الاختصار بنجاح",
        saveUserInfo: "حفظ معلومات المستخدم", userName: "اسم المستخدم", languagePreference: "تفضيل اللغة",
        setAvatar: "تعيين الصورة", updateAvatar: "تحديث الصورة", setting: "الإعدادات", userInfo: "معلومات المستخدم",
        apiKeyTab: "مفتاح API", userInfoTab: "معلومات", shortcutsTab: "اختصارات", aboutTab: "حول",
        getName: "اسمك/اللقب", inputPlaceholder: "أدخل هنا..", selectPlaceholder: "حدد لغة النظام",
        noShortcuts: "لا توجد اختصارات بعد، اضغط 'إضافة' للبدء",
        maxShortcutWarning: `يمكنك إضافة ما يصل إلى ${SHORTCUTS_MAX} اختصارات`,
        shortcutNamePlaceholder: "مثال: ترجمة إلى العربية", shortcutPromptPlaceholder: "أدخل موجهك...",
        nameMaxWarning: `لا يمكن أن يتجاوز الاسم ${NAME_MAX_LEN} حرفًا`, confirmDelete: "هل أنت متأكد من حذف هذا الاختصار؟",
        deleteText: "حذف", cancelText: "إلغاء", chatHistory: "سجل المحادثة", clearChatHistory: "مسح السجل",
        clearHistoryConfirm: "هل أنت متأكد من مسح السجل؟ لا يمكن التراجع عن هذا الإجراء.", historyCleared: "تم مسح السجل",
        pinChat: "تثبيت المحادثة", unpinChat: "إلغاء التثبيت", expand: "توسيع", collapse: "طي",
        selectModel: "اختر نموذجًا", noModelAvailable: "لا يوجد نموذج", modelReleasedOn: "تم الإصدار",
        modelInputSupport: "دعم الإدخال", modelSystemPrompt: "موجه النظام", modelFreeOnly: "النماذج المجانية فقط",
        modelMultiFormatSupport: "دعم متعدد التنسيقات", noModelMatch: "لا يوجد نموذج مطابق",
        selectLanguage: "اختر اللغة", myPrompts: "مطالباتي", prefabPrompts: "المطالبات الجاهزة",
        promptName: "اسم الموجه", promptContent: "محتوى الموجه", promptMaxCount: `يمكنك إضافة ما يصل إلى ${SHORTCUTS_MAX} مطالبات`,
        promptSaved: "تم حفظ الموجه", promptDeleted: "تم حذف الموجه", savePromptChanges: "حفظ التغييرات",
        promptNamePlaceholder: "مثال: ترجمة إلى العربية", promptContentPlaceholder: "أدخل الموجه...",
        promptNameMaxWarning: `لا يمكن أن يتجاوز اسم الموجه ${NAME_MAX_LEN} حرفًا`, confirmDeletePrompt: "هل أنت متأكد من حذف هذا الموجه؟",
        modelSettings: "إعدادات النموذج", modelSettingsSaved: "تم حفظ الإعدادات",
        promptHolder: "إنشاء موجه نظام للمساعد...", operation: "إجراء", selected: "محدد",
        enterToSubmit: "اضغط Enter للإرسال", verifyFirst: "يرجى التحقق من مفتاح API أولاً.", pricing: "التسعير",
        contextLength: "طول السياق", usernamePlaceHolder: "أدخل اسمك/لقبك هنا..",
        statistics: "إحصائيات", sponsorship: "رعاية", buyMeACoffee: "اشترِ لي قهوة"
    },
    {
        label: 'فارسی (fa-IR)', value: 'fa-IR',
        newChat: "چت جدید", imageTag: "تصویر", audioTag: "صوت", textTag: "متن", fileTag: "فایل",
        webSearch: "جستجوی وب", promptTag: "پرومپت‌ها", modelTag: "مدل‌ها", currentModel: "مدل فعلی",
        select: "انتخاب کنید", releaseDate: "تاریخ انتشار", systemPrompt: "پرومپت سیستم", clear: "پاک کردن",
        save: "ذخیره", apply: "اعمال", verify: "تأیید", verifyLabel: "اطلاعات اعتبار پس از تأیید کلید API نمایش داده می‌شود.",
        credit: "اعتبار", totalCredits: "کل اعتبار", usedCredits: "اعتبار مصرف شده", refresh: "به‌روزرسانی",
        saveChanges: "ذخیره تغییرات", delete: "حذف", addNew: "افزودن", shortcuts: "میانبرها", shortcutName: "نام میانبر",
        shortcutPrompt: "پرومپت میانبر", shortcutMaxCount: `فقط می‌توانید تا 5 میانبر اضافه کنید`,
        shortcutSaved: "میانبر با موفقیت ذخیره شد", shortcutDeleted: "میانبر با موفقیت حذف شد",
        saveUserInfo: "ذخیره اطلاعات کاربر", userName: "نام کاربری", languagePreference: "ترجیح زبان",
        setAvatar: "تنظیم آواتار", updateAvatar: "به‌روزرسانی آواتار", setting: "تنظیمات", userInfo: "اطلاعات کاربر",
        apiKeyTab: "کلید API", userInfoTab: "اطلاعات", shortcutsTab: "میانبرها", aboutTab: "درباره",
        getName: "نام/لقب شما", inputPlaceholder: "اینجا وارد کنید..", selectPlaceholder: "زبان سیستم را انتخاب کنید",
        noShortcuts: "هنوز میانبری وجود ندارد، روی 'افزودن' کلیک کنید",
        maxShortcutWarning: `فقط می‌توانید تا ${SHORTCUTS_MAX} میانبر اضافه کنید`,
        shortcutNamePlaceholder: "مثال: ترجمه به فارسی", shortcutPromptPlaceholder: "پرومپت خود را وارد کنید...",
        nameMaxWarning: `نام نمی‌تواند بیش از ${NAME_MAX_LEN} نویسه باشد`, confirmDelete: "آیا مطمئنید که این میانبر حذف شود؟",
        deleteText: "حذف", cancelText: "لغو", chatHistory: "تاریخچه چت", clearChatHistory: "پاک کردن تاریخچه",
        clearHistoryConfirm: "آیا مطمئنید که تاریخچه پاک شود؟ این عمل غیرقابل بازگشت است.", historyCleared: "تاریخچه چت پاک شد",
        pinChat: "پین کردن چت", unpinChat: "برداشتن پین", expand: "گسترش", collapse: "جمع کردن",
        selectModel: "انتخاب مدل", noModelAvailable: "مدلی موجود نیست", modelReleasedOn: "منتشر شده در",
        modelInputSupport: "پشتیبانی ورودی", modelSystemPrompt: "پرومپت سیستم", modelFreeOnly: "فقط مدل‌های رایگان",
        modelMultiFormatSupport: "پشتیبانی چند قالبی", noModelMatch: "هیچ مدلی مطابق نبود",
        selectLanguage: "انتخاب زبان", myPrompts: "پرومپت‌های من", prefabPrompts: "پرومپت‌های آماده",
        promptName: "نام پرومپت", promptContent: "محتوای پرومپت", promptMaxCount: `فقط می‌توانید تا ${SHORTCUTS_MAX} پرومپت اضافه کنید`,
        promptSaved: "پرومپت ذخیره شد", promptDeleted: "پرومپت حذف شد", savePromptChanges: "ذخیره تغییرات",
        promptNamePlaceholder: "مثال: ترجمه به فارسی", promptContentPlaceholder: "پرومپت خود را وارد کنید...",
        promptNameMaxWarning: `نام پرومپت نمی‌تواند بیش از ${NAME_MAX_LEN} نویسه باشد`, confirmDeletePrompt: "آیا مطمئنید که این پرومپت حذف شود؟",
        modelSettings: "تنظیمات مدل", modelSettingsSaved: "تنظیمات مدل ذخیره شد",
        promptHolder: "پرومپت سیستم برای دستیار بسازید...", operation: "عملیات", selected: "انتخاب شده",
        enterToSubmit: "برای ارسال Enter بزنید", verifyFirst: "لطفاً ابتدا کلید API را تأیید کنید.", pricing: "قیمت",
        contextLength: "طول متن", usernamePlaceHolder: "اینجا نام/لقب خود را وارد کنید..",
        statistics: "آمار", sponsorship: "حمایت مالی", buyMeACoffee: "برایم قهوه بخر"
    },
    {
        label: 'עברית (he-IL)', value: 'he-IL',
        newChat: "צ'אט חדש", imageTag: "תמונה", audioTag: "אודיו", textTag: "טקסט", fileTag: "קובץ",
        webSearch: "חיפוש באינטרנט", promptTag: "הנחיות", modelTag: "מודלים", currentModel: "מודל נוכחי",
        select: "בחר", releaseDate: "תאריך יציאה", systemPrompt: "הנחיית מערכת", clear: "נקה",
        save: "שמור", apply: "החל", verify: "אמת", verifyLabel: "מידע האשראי יוצג לאחר אימות מפתח ה-API.",
        credit: "קרדיט", totalCredits: "סה\"כ קרדיט", usedCredits: "קרדיט בשימוש", refresh: "רענן",
        saveChanges: "שמור שינויים", delete: "מחק", addNew: "הוסף", shortcuts: "קיצורים", shortcutName: "שם קיצור",
        shortcutPrompt: "הנחיית קיצור", shortcutMaxCount: `ניתן להוסיף עד 5 קיצורים בלבד`,
        shortcutSaved: "קיצור נשמר בהצלחה", shortcutDeleted: "קיצור נמחק בהצלחה",
        saveUserInfo: "שמור פרטי משתמש", userName: "שם משתמש", languagePreference: "העדפת שפה",
        setAvatar: "הגדר אוואטר", updateAvatar: "עדכן אוואטר", setting: "הגדרות", userInfo: "פרטי משתמש",
        apiKeyTab: "מפתח API", userInfoTab: "פרטי משתמש", shortcutsTab: "קיצורים", aboutTab: "אודות",
        getName: "השם/כינוי שלך", inputPlaceholder: "הזן כאן..", selectPlaceholder: "בחר שפת מערכת",
        noShortcuts: "אין קיצורים עדיין, לחץ 'הוסף' כדי להתחיל",
        maxShortcutWarning: `ניתן להוסיף עד ${SHORTCUTS_MAX} קיצורים`,
        shortcutNamePlaceholder: "לדוגמה: תרגם לעברית", shortcutPromptPlaceholder: "הזן הנחיה...",
        nameMaxWarning: `שם לא יכול לחרוג מ-${NAME_MAX_LEN} תווים`, confirmDelete: "האם אתה בטוח שברצונך למחוק קיצור זה?",
        deleteText: "מחק", cancelText: "בטל", chatHistory: "היסטוריית צ'אט", clearChatHistory: "נקה היסטוריה",
        clearHistoryConfirm: "האם אתה בטוח שברצונך לנקות את ההיסטוריה? פעולה זו אינה ניתנת לביטול.", historyCleared: "היסטוריית הצ'אט נוקתה",
        pinChat: "הצמד צ'אט", unpinChat: "הסר הצמדה", expand: "הרחב", collapse: "כווץ",
        selectModel: "בחר מודל", noModelAvailable: "אין מודלים זמינים", modelReleasedOn: "יצא ב-",
        modelInputSupport: "תמיכת קלט", modelSystemPrompt: "הנחיית מערכת", modelFreeOnly: "מודלים חינמיים בלבד",
        modelMultiFormatSupport: "תמיכה בריבוי פורמטים", noModelMatch: "לא נמצא מודל תואם",
        selectLanguage: "בחר שפה", myPrompts: "ההנחיות שלי", prefabPrompts: "הנחיות מוכנות",
        promptName: "שם הנחיה", promptContent: "תוכן הנחיה", promptMaxCount: `ניתן להוסיף עד ${SHORTCUTS_MAX} הנחיות`,
        promptSaved: "הנחיה נשמרה", promptDeleted: "הנחיה נמחקה", savePromptChanges: "שמור שינויים",
        promptNamePlaceholder: "לדוגמה: תרגם לעברית", promptContentPlaceholder: "הזן הנחיה...",
        promptNameMaxWarning: `שם הנחיה לא יכול לחרוג מ-${NAME_MAX_LEN} תווים`, confirmDeletePrompt: "האם אתה בטוח שברצונך למחוק הנחיה זו?",
        modelSettings: "הגדרות מודל", modelSettingsSaved: "הגדרות נשמרו",
        promptHolder: "צור הנחיית מערכת עבור העוזר...", operation: "פעולה", selected: "נבחר",
        enterToSubmit: "לחץ Enter לשליחה", verifyFirst: "אנא אמת קודם את מפתח ה-API.", pricing: "תמחור",
        contextLength: "אורך הקשר", usernamePlaceHolder: "הזן כאן שם/כינוי..",
        statistics: "סטטיסטיקות", sponsorship: "חסות", buyMeACoffee: "קנה לי קפה"
    },

    {
        label: 'Nederlands (nl-NL)',
        value: 'nl-NL',
        newChat: "nieuwChat",
        imageTag: "afbeelding",
        audioTag: "audio",
        textTag: "tekst",
        fileTag: "bestand",
        webSearch: "web zoeken",
        promptTag: "Prompts",
        modelTag: "Modellen",
        currentModel: "Huidig Model",
        select: "Selecteer",
        releaseDate: "Releasedatum",
        systemPrompt: "Systeem Prompt",
        clear: "wissen",
        save: "opslaan",
        apply: "toepassen",
        verify: "Verifiëren",
        verifyLabel: "De kredietinformatie wordt weergegeven na verificatie van de API-sleutel.",
        credit: "Krediet",
        totalCredits: "Totaal Kredieten",
        usedCredits: "Gebruikte Kredieten",
        refresh: "Vernieuwen",
        saveChanges: "Wijzigingen opslaan",
        delete: "Verwijderen",
        addNew: "Toevoegen",
        shortcuts: "Snelkoppelingen",
        shortcutName: "Snelkoppeling Naam",
        shortcutPrompt: "Snelkoppeling Prompt",
        shortcutMaxCount: `U kunt maximaal 5 snelkoppelingen toevoegen`,
        shortcutSaved: "Snelkoppeling succesvol opgeslagen",
        shortcutDeleted: "Snelkoppeling succesvol verwijderd",
        saveUserInfo: "Gebruikersinfo opslaan",
        userName: "Gebruikersnaam",
        languagePreference: "Taalvoorkeur",
        setAvatar: "Avatar instellen",
        updateAvatar: "Avatar bijwerken",
        setting: "Instelling",
        userInfo: "Gebruikersinfo",
        apiKeyTab: "API Sleutel",
        userInfoTab: "Gebruikersinfo",
        shortcutsTab: "Snelkoppelingen",
        aboutTab: "Over",
        getName: "Uw Naam/Bijnaam",
        inputPlaceholder: "Voer hier in..",
        selectPlaceholder: "Stel Systeemtaal in",
        noShortcuts: "Nog geen snelkoppelingen, klik 'Toevoegen' om te beginnen",
        maxShortcutWarning: `U kunt maximaal ${SHORTCUTS_MAX} snelkoppelingen toevoegen`,
        shortcutNamePlaceholder: "bijv. Vertalen naar Engels",
        shortcutPromptPlaceholder: "Voer uw prompt in...",
        nameMaxWarning: `Naam mag niet meer dan ${NAME_MAX_LEN} tekens bevatten`,
        confirmDelete: "Weet u zeker dat u deze snelkoppeling wilt verwijderen?",
        deleteText: "Verwijderen",
        cancelText: "Annuleren",
        chatHistory: "Chatgeschiedenis",
        clearChatHistory: "Chatgeschiedenis wissen",
        clearHistoryConfirm: "Weet u zeker dat u de chatgeschiedenis wilt wissen? Deze actie kan niet ongedaan worden gemaakt.",
        historyCleared: "Chatgeschiedenis gewist",
        pinChat: "Chat vastzetten",
        unpinChat: "Chat losmaken",
        expand: "Uitvouwen",
        collapse: "Samenvouwen",
        selectModel: "Model selecteren",
        noModelAvailable: "Geen model beschikbaar",
        modelReleasedOn: "Uitgebracht op",
        modelInputSupport: "Invoer Ondersteuning",
        modelSystemPrompt: "Systeem Prompt",
        modelFreeOnly: "Alleen Gratis Modellen",
        modelMultiFormatSupport: "Multi-formaat Invoer",
        noModelMatch: "Geen model komt overeen met filter",
        selectLanguage: "Taal selecteren",
        myPrompts: "Mijn Prompts",
        prefabPrompts: "Vooraf Prompts",
        promptName: "Prompt Naam",
        promptContent: "Prompt Inhoud",
        promptMaxCount: `U kunt maximaal ${SHORTCUTS_MAX} prompts toevoegen`,
        promptSaved: "Prompt succesvol opgeslagen",
        promptDeleted: "Prompt succesvol verwijderd",
        savePromptChanges: "Promptwijzigingen opslaan",
        promptNamePlaceholder: "bijv. Vertalen naar Engels",
        promptContentPlaceholder: "Voer uw prompt in...",
        promptNameMaxWarning: `Promptnaam mag niet meer dan ${NAME_MAX_LEN} tekens bevatten`,
        confirmDeletePrompt: "Weet u zeker dat u deze prompt wilt verwijderen?",
        modelSettings: "Model Instellingen",
        modelSettingsSaved: "Modelinstellingen succesvol opgeslagen",
        promptHolder: "Maak systeem prompt voor de assistent...",
        operation: "Operatie",
        selected: "Geselecteerd",
        enterToSubmit: "druk op Enter om te verzenden",
        verifyFirst: "Verifieer eerst de API-sleutel.",
        pricing: "Prijzen",
        contextLength: "Contextlengte",
        usernamePlaceHolder: "Voer hier uw naam/bijnaam in..",
        statistics: "Statistieken",
        sponsorship: "Sponsoring",
        buyMeACoffee: "Koop een koffie voor mij"
    },

    {
        label: 'Svenska (sv-SE)',
        value: 'sv-SE',
        newChat: "nyChat",
        imageTag: "bild",
        audioTag: "ljud",
        textTag: "text",
        fileTag: "fil",
        webSearch: "webbsökning",
        promptTag: "Prompter",
        modelTag: "Modeller",
        currentModel: "Aktuell Modell",
        select: "Välj",
        releaseDate: "Utgivningsdatum",
        systemPrompt: "Systemprompt",
        clear: "rensa",
        save: "spara",
        apply: "tillämpa",
        verify: "Verifiera",
        verifyLabel: "Kreditinformationen visas efter att API-nyckeln har verifierats.",
        credit: "Kredit",
        totalCredits: "Totala Krediter",
        usedCredits: "Använda Krediter",
        refresh: "Uppdatera",
        saveChanges: "Spara Ändringar",
        delete: "Radera",
        addNew: "Lägg till",
        shortcuts: "Genvägar",
        shortcutName: "Genvägsnamn",
        shortcutPrompt: "Genvägs-Prompt",
        shortcutMaxCount: `Du kan bara lägga till upp till 5 genvägar`,
        shortcutSaved: "Genväg sparad",
        shortcutDeleted: "Genväg raderad",
        saveUserInfo: "Spara Användarinfo",
        userName: "Användarnamn",
        languagePreference: "Språkpreferens",
        setAvatar: "Ställ in Avatar",
        updateAvatar: "Uppdatera Avatar",
        setting: "Inställning",
        userInfo: "Användarinfo",
        apiKeyTab: "API-nyckel",
        userInfoTab: "Användarinfo",
        shortcutsTab: "Genvägar",
        aboutTab: "Om",
        getName: "Ditt Namn/Smeknamn",
        inputPlaceholder: "Skriv här..",
        selectPlaceholder: "Ställ in Systemspråk",
        noShortcuts: "Inga genvägar ännu, klicka 'Lägg till' för att börja",
        maxShortcutWarning: `Du kan bara lägga till upp till ${SHORTCUTS_MAX} genvägar`,
        shortcutNamePlaceholder: "t.ex. Översätt till engelska",
        shortcutPromptPlaceholder: "Skriv din prompt...",
        nameMaxWarning: `Namn får inte överstiga ${NAME_MAX_LEN} tecken`,
        confirmDelete: "Är du säker på att du vill radera denna genväg?",
        deleteText: "Radera",
        cancelText: "Avbryt",
        chatHistory: "Chatthistorik",
        clearChatHistory: "Rensa Chatthistorik",
        clearHistoryConfirm: "Är du säker på att du vill rensa chatthistoriken? Detta kan inte ångras.",
        historyCleared: "Chatthistorik rensad",
        pinChat: "Fäst chatt",
        unpinChat: "Lossa chatt",
        expand: "Expandera",
        collapse: "Komprimera",
        selectModel: "Välj Modell",
        noModelAvailable: "Inga modeller tillgängliga",
        modelReleasedOn: "Släppt den",
        modelInputSupport: "Inmatningsstöd",
        modelSystemPrompt: "Systemprompt",
        modelFreeOnly: "Endast Gratis Modeller",
        modelMultiFormatSupport: "Stöd för flera format",
        noModelMatch: "Ingen modell matchar filtret",
        selectLanguage: "Välj språk",
        myPrompts: "Mina Prompter",
        prefabPrompts: "Färdiga Prompter",
        promptName: "Promptnamn",
        promptContent: "Promptinnehåll",
        promptMaxCount: `Du kan bara lägga till upp till ${SHORTCUTS_MAX} prompter`,
        promptSaved: "Prompt sparad",
        promptDeleted: "Prompt raderad",
        savePromptChanges: "Spara Promptändringar",
        promptNamePlaceholder: "t.ex. Översätt till engelska",
        promptContentPlaceholder: "Skriv din prompt...",
        promptNameMaxWarning: `Promptnamn får inte överstiga ${NAME_MAX_LEN} tecken`,
        confirmDeletePrompt: "Är du säker på att du vill radera denna prompt?",
        modelSettings: "Modellinställningar",
        modelSettingsSaved: "Modellinställningar sparade",
        promptHolder: "Skapa systemprompt för assistenten...",
        operation: "Åtgärd",
        selected: "Vald",
        enterToSubmit: "tryck Enter för att skicka",
        verifyFirst: "Verifiera API-nyckeln först.",
        pricing: "Prissättning",
        contextLength: "Kontextlängd",
        usernamePlaceHolder: "Skriv ditt namn/smeknamn här..",
        statistics: "Statistik",
        sponsorship: "Sponsring",
        buyMeACoffee: "Bjud mig på en kaffe"
    },
    {
        label: 'Norsk (no-NO)',
        value: 'no-NO',
        newChat: "nyChat",
        imageTag: "bilde",
        audioTag: "lyd",
        textTag: "tekst",
        fileTag: "fil",
        webSearch: "websøk",
        promptTag: "Prompter",
        modelTag: "Modeller",
        currentModel: "Gjeldende Modell",
        select: "Velg",
        releaseDate: "Utgivelsesdato",
        systemPrompt: "Systemprompt",
        clear: "tøm",
        save: "lagre",
        apply: "bruk",
        verify: "Verifiser",
        verifyLabel: "Kredittinformasjon vises etter at API-nøkkelen er verifisert.",
        credit: "Kreditt",
        totalCredits: "Totale Kreditter",
        usedCredits: "Brukte Kreditter",
        refresh: "Oppdater",
        saveChanges: "Lagre Endringer",
        delete: "Slett",
        addNew: "Legg til",
        shortcuts: "Snarveier",
        shortcutName: "Snarveinavn",
        shortcutPrompt: "Snarveiprompt",
        shortcutMaxCount: `Du kan bare legge til opptil 5 snarveier`,
        shortcutSaved: "Snarvei lagret",
        shortcutDeleted: "Snarvei slettet",
        saveUserInfo: "Lagre Brukerinfo",
        userName: "Brukernavn",
        languagePreference: "Språkpreferanse",
        setAvatar: "Sett Avatar",
        updateAvatar: "Oppdater Avatar",
        setting: "Innstilling",
        userInfo: "Brukerinfo",
        apiKeyTab: "API-nøkkel",
        userInfoTab: "Brukerinfo",
        shortcutsTab: "Snarveier",
        aboutTab: "Om",
        getName: "Ditt Navn/Kallenavn",
        inputPlaceholder: "Skriv inn her..",
        selectPlaceholder: "Velg Systemspråk",
        noShortcuts: "Ingen snarveier ennå, klikk 'Legg til' for å starte",
        maxShortcutWarning: `Du kan bare legge til opptil ${SHORTCUTS_MAX} snarveier`,
        shortcutNamePlaceholder: "f.eks. Oversett til engelsk",
        shortcutPromptPlaceholder: "Skriv inn prompt...",
        nameMaxWarning: `Navn kan ikke overstige ${NAME_MAX_LEN} tegn`,
        confirmDelete: "Er du sikker på at du vil slette denne snarveien?",
        deleteText: "Slett",
        cancelText: "Avbryt",
        chatHistory: "Chatthistorikk",
        clearChatHistory: "Tøm Chatthistorikk",
        clearHistoryConfirm: "Er du sikker på at du vil tømme chatthistorikken? Denne handlingen kan ikke angres.",
        historyCleared: "Chatthistorikk tømt",
        pinChat: "Fest chat",
        unpinChat: "Løsne chat",
        expand: "Utvid",
        collapse: "Skjul",
        selectModel: "Velg Modell",
        noModelAvailable: "Ingen modeller tilgjengelig",
        modelReleasedOn: "Utgitt",
        modelInputSupport: "Inngangsstøtte",
        modelSystemPrompt: "Systemprompt",
        modelFreeOnly: "Kun Gratis Modeller",
        modelMultiFormatSupport: "Støtte for flere formater",
        noModelMatch: "Ingen modell samsvarer med filter",
        selectLanguage: "Velg språk",
        myPrompts: "Mine Prompter",
        prefabPrompts: "Ferdige Prompter",
        promptName: "Promptnavn",
        promptContent: "Promptinnhold",
        promptMaxCount: `Du kan bare legge til opptil ${SHORTCUTS_MAX} prompter`,
        promptSaved: "Prompt lagret",
        promptDeleted: "Prompt slettet",
        savePromptChanges: "Lagre Promptendringer",
        promptNamePlaceholder: "f.eks. Oversett til engelsk",
        promptContentPlaceholder: "Skriv inn prompt...",
        promptNameMaxWarning: `Promptnavn kan ikke overstige ${NAME_MAX_LEN} tegn`,
        confirmDeletePrompt: "Er du sikker på at du vil slette denne prompten?",
        modelSettings: "Modellinnstillinger",
        modelSettingsSaved: "Modellinnstillinger lagret",
        promptHolder: "Lag systemprompt for assistenten...",
        operation: "Operasjon",
        selected: "Valgt",
        enterToSubmit: "trykk Enter for å sende",
        verifyFirst: "Verifiser API-nøkkelen først.",
        pricing: "Priser",
        contextLength: "Kontekstlengde",
        usernamePlaceHolder: "Skriv inn ditt navn/kallenavn her..",
        statistics: "Statistikk",
        sponsorship: "Sponsing",
        buyMeACoffee: "Kjøp en kaffe til meg"
    },

    {
        label: 'Dansk (da-DK)',
        value: 'da-DK',
        newChat: "nyChat",
        imageTag: "billede",
        audioTag: "lyd",
        textTag: "tekst",
        fileTag: "fil",
        webSearch: "websøgning",
        promptTag: "Prompter",
        modelTag: "Modeller",
        currentModel: "Aktuel Model",
        select: "Vælg",
        releaseDate: "Udgivelsesdato",
        systemPrompt: "Systemprompt",
        clear: "ryd",
        save: "gem",
        apply: "anvend",
        verify: "Verificer",
        verifyLabel: "Kreditoplysninger vises efter API-nøglen er verificeret.",
        credit: "Kredit",
        totalCredits: "Samlede Kreditter",
        usedCredits: "Brugte Kreditter",
        refresh: "Opdater",
        saveChanges: "Gem Ændringer",
        delete: "Slet",
        addNew: "Tilføj",
        shortcuts: "Genveje",
        shortcutName: "Genvejsnavn",
        shortcutPrompt: "Genvejsprompt",
        shortcutMaxCount: `Du kan kun tilføje op til 5 genveje`,
        shortcutSaved: "Genvej gemt",
        shortcutDeleted: "Genvej slettet",
        saveUserInfo: "Gem Brugerinfo",
        userName: "Brugernavn",
        languagePreference: "Sprogpræference",
        setAvatar: "Indstil Avatar",
        updateAvatar: "Opdater Avatar",
        setting: "Indstilling",
        userInfo: "Brugerinfo",
        apiKeyTab: "API-nøgle",
        userInfoTab: "Brugerinfo",
        shortcutsTab: "Genveje",
        aboutTab: "Om",
        getName: "Dit Navn/Kaldenavn",
        inputPlaceholder: "Skriv her..",
        selectPlaceholder: "Vælg System Sprog",
        noShortcuts: "Ingen genveje endnu, klik 'Tilføj' for at starte",
        maxShortcutWarning: `Du kan kun tilføje op til ${SHORTCUTS_MAX} genveje`,
        shortcutNamePlaceholder: "f.eks. Oversæt til engelsk",
        shortcutPromptPlaceholder: "Indtast din prompt...",
        nameMaxWarning: `Navn må ikke overstige ${NAME_MAX_LEN} tegn`,
        confirmDelete: "Er du sikker på at du vil slette denne genvej?",
        deleteText: "Slet",
        cancelText: "Annuller",
        chatHistory: "Chathistorik",
        clearChatHistory: "Ryd Chathistorik",
        clearHistoryConfirm: "Er du sikker på at du vil rydde chathistorikken? Denne handling kan ikke fortrydes.",
        historyCleared: "Chathistorik ryddet",
        pinChat: "Fastgør chat",
        unpinChat: "Frigør chat",
        expand: "Udvid",
        collapse: "Skjul",
        selectModel: "Vælg Model",
        noModelAvailable: "Ingen modeller tilgængelige",
        modelReleasedOn: "Udgivet",
        modelInputSupport: "Inputunderstøttelse",
        modelSystemPrompt: "Systemprompt",
        modelFreeOnly: "Kun Gratis Modeller",
        modelMultiFormatSupport: "Multi-format Understøttelse",
        noModelMatch: "Ingen modeller matcher filter",
        selectLanguage: "Vælg Sprog",
        myPrompts: "Mine Prompter",
        prefabPrompts: "Forudindstillede Prompter",
        promptName: "Promptnavn",
        promptContent: "Promptindhold",
        promptMaxCount: `Du kan kun tilføje op til ${SHORTCUTS_MAX} prompter`,
        promptSaved: "Prompt gemt",
        promptDeleted: "Prompt slettet",
        savePromptChanges: "Gem Promptændringer",
        promptNamePlaceholder: "f.eks. Oversæt til engelsk",
        promptContentPlaceholder: "Indtast din prompt...",
        promptNameMaxWarning: `Promptnavn må ikke overstige ${NAME_MAX_LEN} tegn`,
        confirmDeletePrompt: "Er du sikker på at du vil slette denne prompt?",
        modelSettings: "Modelindstillinger",
        modelSettingsSaved: "Modelindstillinger gemt",
        promptHolder: "Opret systemprompt til assistenten...",
        operation: "Handling",
        selected: "Valgt",
        enterToSubmit: "tryk Enter for at sende",
        verifyFirst: "Verificer API-nøglen først.",
        pricing: "Priser",
        contextLength: "Kontekstlængde",
        usernamePlaceHolder: "Indtast dit navn/kaldenavn her..",
        statistics: "Statistik",
        sponsorship: "Sponsoring",
        buyMeACoffee: "Køb en kaffe til mig"
    },

    {
        label: 'Suomi (fi-FI)',
        value: 'fi-FI',
        newChat: "uusiChat",
        imageTag: "kuva",
        audioTag: "ääni",
        textTag: "teksti",
        fileTag: "tiedosto",
        webSearch: "verkkohaku",
        promptTag: "Promptit",
        modelTag: "Mallit",
        currentModel: "Nykyinen Malli",
        select: "Valitse",
        releaseDate: "Julkaisupäivä",
        systemPrompt: "Järjestelmäprompt",
        clear: "tyhjennä",
        save: "tallenna",
        apply: "käytä",
        verify: "Vahvista",
        verifyLabel: "Luottotiedot näytetään API-avaimen vahvistamisen jälkeen.",
        credit: "Krediitti",
        totalCredits: "Kokonaiskrediitit",
        usedCredits: "Käytetyt Krediitit",
        refresh: "Päivitä",
        saveChanges: "Tallenna Muutokset",
        delete: "Poista",
        addNew: "Lisää",
        shortcuts: "Pikakuvakkeet",
        shortcutName: "Pikakuvakkeen Nimi",
        shortcutPrompt: "Pikakuvakeprompt",
        shortcutMaxCount: `Voit lisätä enintään 5 pikakuvaketta`,
        shortcutSaved: "Pikakuvake tallennettu",
        shortcutDeleted: "Pikakuvake poistettu",
        saveUserInfo: "Tallenna Käyttäjätiedot",
        userName: "Käyttäjänimi",
        languagePreference: "Kieliasetus",
        setAvatar: "Aseta Avatar",
        updateAvatar: "Päivitä Avatar",
        setting: "Asetus",
        userInfo: "Käyttäjätiedot",
        apiKeyTab: "API-avain",
        userInfoTab: "Käyttäjätiedot",
        shortcutsTab: "Pikakuvakkeet",
        aboutTab: "Tietoja",
        getName: "Nimesi/Lempinimesi",
        inputPlaceholder: "Syötä tähän..",
        selectPlaceholder: "Aseta Järjestelmän Kieli",
        noShortcuts: "Ei vielä pikakuvakkeita, klikkaa 'Lisää' aloittaaksesi",
        maxShortcutWarning: `Voit lisätä enintään ${SHORTCUTS_MAX} pikakuvaketta`,
        shortcutNamePlaceholder: "esim. Käännä englanniksi",
        shortcutPromptPlaceholder: "Kirjoita prompt...",
        nameMaxWarning: `Nimi ei voi ylittää ${NAME_MAX_LEN} merkkiä`,
        confirmDelete: "Haluatko varmasti poistaa tämän pikakuvakkeen?",
        deleteText: "Poista",
        cancelText: "Peruuta",
        chatHistory: "Chathistoria",
        clearChatHistory: "Tyhjennä Chathistoria",
        clearHistoryConfirm: "Haluatko varmasti tyhjentää chathistorian? Tätä ei voi perua.",
        historyCleared: "Chathistoria tyhjennetty",
        pinChat: "Kiinnitä chat",
        unpinChat: "Irrota chat",
        expand: "Laajenna",
        collapse: "Tiivistä",
        selectModel: "Valitse Malli",
        noModelAvailable: "Ei mallia saatavilla",
        modelReleasedOn: "Julkaistu",
        modelInputSupport: "Syötetuki",
        modelSystemPrompt: "Järjestelmäprompt",
        modelFreeOnly: "Vain Ilmaiset Mallit",
        modelMultiFormatSupport: "Monimuotoinen Syötetuki",
        noModelMatch: "Ei mallia täsmää suodattimeen",
        selectLanguage: "Valitse Kieli",
        myPrompts: "Omat Promptit",
        prefabPrompts: "Valmiit Promptit",
        promptName: "Promptin Nimi",
        promptContent: "Promptin Sisältö",
        promptMaxCount: `Voit lisätä enintään ${SHORTCUTS_MAX} promptia`,
        promptSaved: "Prompt tallennettu",
        promptDeleted: "Prompt poistettu",
        savePromptChanges: "Tallenna Prompt-muutokset",
        promptNamePlaceholder: "esim. Käännä englanniksi",
        promptContentPlaceholder: "Kirjoita prompt...",
        promptNameMaxWarning: `Promptin nimi ei voi ylittää ${NAME_MAX_LEN} merkkiä`,
        confirmDeletePrompt: "Haluatko varmasti poistaa tämän promptin?",
        modelSettings: "Malliasetukset",
        modelSettingsSaved: "Malliasetukset tallennettu",
        promptHolder: "Luo järjestelmäprompt avustajalle...",
        operation: "Toiminto",
        selected: "Valittu",
        enterToSubmit: "paina Enter lähettääksesi",
        verifyFirst: "Vahvista API-avain ensin.",
        pricing: "Hinnoittelu",
        contextLength: "Kontekstin Pituus",
        usernamePlaceHolder: "Syötä nimesi/lempinimesi tähän..",
        statistics: "Tilastot",
        sponsorship: "Sponsorointi",
        buyMeACoffee: "Tarjoa kahvi"
    },
    {
        label: 'Čeština (cs-CZ)',
        value: 'cs-CZ',
        newChat: "novýChat",
        imageTag: "obrázek",
        audioTag: "zvuk",
        textTag: "text",
        fileTag: "soubor",
        webSearch: "webové hledání",
        promptTag: "Prompty",
        modelTag: "Modely",
        currentModel: "Aktuální Model",
        select: "Vybrat",
        releaseDate: "Datum vydání",
        systemPrompt: "Systémový Prompt",
        clear: "vymazat",
        save: "uložit",
        apply: "použít",
        verify: "Ověřit",
        verifyLabel: "Informace o kreditu se zobrazí po ověření API klíče.",
        credit: "Kredit",
        totalCredits: "Celkové Kredity",
        usedCredits: "Využité Kredity",
        refresh: "Obnovit",
        saveChanges: "Uložit Změny",
        delete: "Smazat",
        addNew: "Přidat",
        shortcuts: "Zkratky",
        shortcutName: "Název Zkratky",
        shortcutPrompt: "Prompt Zkratky",
        shortcutMaxCount: `Můžete přidat maximálně 5 zkratek`,
        shortcutSaved: "Zkratka uložena",
        shortcutDeleted: "Zkratka smazána",
        saveUserInfo: "Uložit Uživatelské Info",
        userName: "Uživatelské jméno",
        languagePreference: "Jazyková preference",
        setAvatar: "Nastavit Avatar",
        updateAvatar: "Aktualizovat Avatar",
        setting: "Nastavení",
        userInfo: "Uživatelské info",
        apiKeyTab: "API Klíč",
        userInfoTab: "Uživatelské info",
        shortcutsTab: "Zkratky",
        aboutTab: "O aplikaci",
        getName: "Vaše Jméno/Přezdívka",
        inputPlaceholder: "Zadejte zde..",
        selectPlaceholder: "Nastavte systémový jazyk",
        noShortcuts: "Zatím žádné zkratky, klikněte na 'Přidat' pro začátek",
        maxShortcutWarning: `Můžete přidat maximálně ${SHORTCUTS_MAX} zkratek`,
        shortcutNamePlaceholder: "např. Přeložit do angličtiny",
        shortcutPromptPlaceholder: "Zadejte prompt...",
        nameMaxWarning: `Název nesmí přesáhnout ${NAME_MAX_LEN} znaků`,
        confirmDelete: "Opravdu chcete tuto zkratku smazat?",
        deleteText: "Smazat",
        cancelText: "Zrušit",
        chatHistory: "Historie chatu",
        clearChatHistory: "Vymazat Historii",
        clearHistoryConfirm: "Opravdu chcete vymazat historii chatu? Toto nelze vrátit zpět.",
        historyCleared: "Historie vymazána",
        pinChat: "Připnout chat",
        unpinChat: "Odepnout chat",
        expand: "Rozbalit",
        collapse: "Sbalit",
        selectModel: "Vybrat Model",
        noModelAvailable: "Žádný model k dispozici",
        modelReleasedOn: "Vydáno",
        modelInputSupport: "Podpora Vstupu",
        modelSystemPrompt: "Systémový Prompt",
        modelFreeOnly: "Pouze Zdarma Modely",
        modelMultiFormatSupport: "Podpora více formátů",
        noModelMatch: "Žádný model neodpovídá filtru",
        selectLanguage: "Vyberte Jazyk",
        myPrompts: "Moje Prompty",
        prefabPrompts: "Přednastavené Prompty",
        promptName: "Název Promptu",
        promptContent: "Obsah Promptu",
        promptMaxCount: `Můžete přidat maximálně ${SHORTCUTS_MAX} promptů`,
        promptSaved: "Prompt uložen",
        promptDeleted: "Prompt smazán",
        savePromptChanges: "Uložit změny Promptu",
        promptNamePlaceholder: "např. Přeložit do angličtiny",
        promptContentPlaceholder: "Zadejte prompt...",
        promptNameMaxWarning: `Název promptu nesmí přesáhnout ${NAME_MAX_LEN} znaků`,
        confirmDeletePrompt: "Opravdu chcete tento prompt smazat?",
        modelSettings: "Nastavení Modelu",
        modelSettingsSaved: "Nastavení uloženo",
        promptHolder: "Vytvořte systémový prompt pro asistenta...",
        operation: "Operace",
        selected: "Vybráno",
        enterToSubmit: "stiskněte Enter pro odeslání",
        verifyFirst: "Nejprve ověřte API klíč.",
        pricing: "Ceny",
        contextLength: "Délka Kontextu",
        usernamePlaceHolder: "Zadejte své jméno/přezdívku zde..",
        statistics: "Statistiky",
        sponsorship: "Sponzorství",
        buyMeACoffee: "Kup mi kávu"
    },

    {
        label: 'Magyar (hu-HU)',
        value: 'hu-HU',
        newChat: "újChat",
        imageTag: "kép",
        audioTag: "hang",
        textTag: "szöveg",
        fileTag: "fájl",
        webSearch: "webkeresés",
        promptTag: "Promtok",
        modelTag: "Modellek",
        currentModel: "Aktuális Modell",
        select: "Választ",
        releaseDate: "Kiadás dátuma",
        systemPrompt: "Rendszerprompt",
        clear: "töröl",
        save: "mentés",
        apply: "alkalmaz",
        verify: "Ellenőrzés",
        verifyLabel: "A kreditinformáció az API-kulcs ellenőrzése után jelenik meg.",
        credit: "Kredit",
        totalCredits: "Összes Kredit",
        usedCredits: "Felhasznált Kreditek",
        refresh: "Frissít",
        saveChanges: "Változások mentése",
        delete: "Töröl",
        addNew: "Hozzáad",
        shortcuts: "Gyorsgombok",
        shortcutName: "Gyorsgomb neve",
        shortcutPrompt: "Gyorsgomb Prompt",
        shortcutMaxCount: `Legfeljebb 5 gyorsgomb adható hozzá`,
        shortcutSaved: "Gyorsgomb mentve",
        shortcutDeleted: "Gyorsgomb törölve",
        saveUserInfo: "Felhasználói adatok mentése",
        userName: "Felhasználónév",
        languagePreference: "Nyelvi beállítás",
        setAvatar: "Avatar beállítása",
        updateAvatar: "Avatar frissítése",
        setting: "Beállítás",
        userInfo: "Felhasználói adatok",
        apiKeyTab: "API-kulcs",
        userInfoTab: "Felhasználói adatok",
        shortcutsTab: "Gyorsgombok",
        aboutTab: "Névjegy",
        getName: "Neved/Beceneved",
        inputPlaceholder: "Írd be ide..",
        selectPlaceholder: "Állítsd be a rendszer nyelvét",
        noShortcuts: "Nincsenek gyorsgombok, kattints a 'Hozzáad' gombra a kezdéshez",
        maxShortcutWarning: `Legfeljebb ${SHORTCUTS_MAX} gyorsgomb adható hozzá`,
        shortcutNamePlaceholder: "pl. Fordítás angolra",
        shortcutPromptPlaceholder: "Írd be a promptot...",
        nameMaxWarning: `A név nem haladhatja meg a ${NAME_MAX_LEN} karaktert`,
        confirmDelete: "Biztosan törölni szeretnéd ezt a gyorsgombot?",
        deleteText: "Töröl",
        cancelText: "Mégse",
        chatHistory: "Chatelőzmények",
        clearChatHistory: "Chatelőzmények törlése",
        clearHistoryConfirm: "Biztosan törlöd a chatelőzményeket? Ez nem vonható vissza.",
        historyCleared: "Chatelőzmények törölve",
        pinChat: "Chat rögzítése",
        unpinChat: "Chat feloldása",
        expand: "Kibontás",
        collapse: "Összezárás",
        selectModel: "Modell kiválasztása",
        noModelAvailable: "Nincs elérhető modell",
        modelReleasedOn: "Kiadva",
        modelInputSupport: "Bemenet támogatás",
        modelSystemPrompt: "Rendszerprompt",
        modelFreeOnly: "Csak Ingyenes Modellek",
        modelMultiFormatSupport: "Többformátumú támogatás",
        noModelMatch: "Nincs modell a szűrőnek megfelelően",
        selectLanguage: "Nyelv kiválasztása",
        myPrompts: "Saját Promptok",
        prefabPrompts: "Előkészített Promptok",
        promptName: "Prompt neve",
        promptContent: "Prompt tartalom",
        promptMaxCount: `Legfeljebb ${SHORTCUTS_MAX} prompt adható hozzá`,
        promptSaved: "Prompt mentve",
        promptDeleted: "Prompt törölve",
        savePromptChanges: "Prompt módosítások mentése",
        promptNamePlaceholder: "pl. Fordítás angolra",
        promptContentPlaceholder: "Írd be a promptot...",
        promptNameMaxWarning: `A prompt neve nem haladhatja meg a ${NAME_MAX_LEN} karaktert`,
        confirmDeletePrompt: "Biztosan törölni szeretnéd ezt a promptot?",
        modelSettings: "Modellbeállítások",
        modelSettingsSaved: "Modellbeállítások mentve",
        promptHolder: "Hozz létre rendszerpromptot az asszisztenshez...",
        operation: "Művelet",
        selected: "Kiválasztva",
        enterToSubmit: "nyomd meg az Entert a küldéshez",
        verifyFirst: "Először ellenőrizd az API-kulcsot.",
        pricing: "Árazás",
        contextLength: "Konteksthossz",
        usernamePlaceHolder: "Írd be a neved/beceneved ide..",
        statistics: "Statisztika",
        sponsorship: "Szponzorálás",
        buyMeACoffee: "Vegyél nekem egy kávét"
    },

    {
        label: 'Română (ro-RO)',
        value: 'ro-RO',
        newChat: "chatNou",
        imageTag: "imagine",
        audioTag: "audio",
        textTag: "text",
        fileTag: "fișier",
        webSearch: "căutare web",
        promptTag: "Prompturi",
        modelTag: "Modele",
        currentModel: "Model Curent",
        select: "Selectează",
        releaseDate: "Data lansării",
        systemPrompt: "Prompt Sistem",
        clear: "șterge",
        save: "salvează",
        apply: "aplică",
        verify: "Verifică",
        verifyLabel: "Informațiile despre credit vor fi afișate după verificarea cheii API.",
        credit: "Credit",
        totalCredits: "Credite Totale",
        usedCredits: "Credite Utilizate",
        refresh: "Reîmprospătează",
        saveChanges: "Salvează Modificările",
        delete: "Șterge",
        addNew: "Adaugă",
        shortcuts: "Scurtături",
        shortcutName: "Nume Scurtătură",
        shortcutPrompt: "Prompt Scurtătură",
        shortcutMaxCount: `Poți adăuga maximum 5 scurtături`,
        shortcutSaved: "Scurtătură salvată",
        shortcutDeleted: "Scurtătură ștearsă",
        saveUserInfo: "Salvează Info Utilizator",
        userName: "Nume Utilizator",
        languagePreference: "Preferință Limbă",
        setAvatar: "Setează Avatar",
        updateAvatar: "Actualizează Avatar",
        setting: "Setare",
        userInfo: "Info Utilizator",
        apiKeyTab: "Cheie API",
        userInfoTab: "Info Utilizator",
        shortcutsTab: "Scurtături",
        aboutTab: "Despre",
        getName: "Numele/ Pseudonimul tău",
        inputPlaceholder: "Introdu aici..",
        selectPlaceholder: "Setează Limba Sistemului",
        noShortcuts: "Nicio scurtătură încă, apasă 'Adaugă' pentru a începe",
        maxShortcutWarning: `Poți adăuga maximum ${SHORTCUTS_MAX} scurtături`,
        shortcutNamePlaceholder: "ex. Tradu în engleză",
        shortcutPromptPlaceholder: "Introdu promptul...",
        nameMaxWarning: `Numele nu poate depăși ${NAME_MAX_LEN} caractere`,
        confirmDelete: "Sigur dorești să ștergi această scurtătură?",
        deleteText: "Șterge",
        cancelText: "Anulează",
        chatHistory: "Istoric chat",
        clearChatHistory: "Șterge Istoric Chat",
        clearHistoryConfirm: "Sigur dorești să ștergi istoricul chatului? Această acțiune nu poate fi anulată.",
        historyCleared: "Istoric șters",
        pinChat: "Fixează chat",
        unpinChat: "Anulează fixarea",
        expand: "Extinde",
        collapse: "Restrânge",
        selectModel: "Selectează Model",
        noModelAvailable: "Niciun model disponibil",
        modelReleasedOn: "Lansat pe",
        modelInputSupport: "Suport Input",
        modelSystemPrompt: "Prompt Sistem",
        modelFreeOnly: "Doar Modele Gratuite",
        modelMultiFormatSupport: "Suport Multi-format",
        noModelMatch: "Niciun model nu corespunde filtrului",
        selectLanguage: "Selectează Limbă",
        myPrompts: "Prompturile Mele",
        prefabPrompts: "Prompturi Predefinite",
        promptName: "Nume Prompt",
        promptContent: "Conținut Prompt",
        promptMaxCount: `Poți adăuga maximum ${SHORTCUTS_MAX} prompturi`,
        promptSaved: "Prompt salvat",
        promptDeleted: "Prompt șters",
        savePromptChanges: "Salvează Modificările Promptului",
        promptNamePlaceholder: "ex. Tradu în engleză",
        promptContentPlaceholder: "Introdu promptul...",
        promptNameMaxWarning: `Numele promptului nu poate depăși ${NAME_MAX_LEN} caractere`,
        confirmDeletePrompt: "Sigur dorești să ștergi acest prompt?",
        modelSettings: "Setări Model",
        modelSettingsSaved: "Setările modelului salvate",
        promptHolder: "Creează prompt de sistem pentru asistent...",
        operation: "Operație",
        selected: "Selectat",
        enterToSubmit: "apasă Enter pentru a trimite",
        verifyFirst: "Verifică mai întâi cheia API.",
        pricing: "Prețuri",
        contextLength: "Lungimea Contextului",
        usernamePlaceHolder: "Introdu numele/pseudonimul aici..",
        statistics: "Statistici",
        sponsorship: "Sponsorizare",
        buyMeACoffee: "Cumpără-mi o cafea"
    },
    {
        label: 'Ελληνικά (el-GR)',
        value: 'el-GR',
        newChat: "νέοChat",
        imageTag: "εικόνα",
        audioTag: "ήχος",
        textTag: "κείμενο",
        fileTag: "αρχείο",
        webSearch: "αναζήτηση ιστού",
        promptTag: "Προτροπές",
        modelTag: "Μοντέλα",
        currentModel: "Τρέχον Μοντέλο",
        select: "Επιλογή",
        releaseDate: "Ημερομηνία κυκλοφορίας",
        systemPrompt: "Προτροπή Συστήματος",
        clear: "εκκαθάριση",
        save: "αποθήκευση",
        apply: "εφαρμογή",
        verify: "Επαλήθευση",
        verifyLabel: "Οι πληροφορίες πιστωτικών θα εμφανιστούν μετά την επαλήθευση του API key.",
        credit: "Πίστωση",
        totalCredits: "Συνολικές Πιστώσεις",
        usedCredits: "Χρησιμοποιημένες Πιστώσεις",
        refresh: "Ανανέωση",
        saveChanges: "Αποθήκευση Αλλαγών",
        delete: "Διαγραφή",
        addNew: "Προσθήκη",
        shortcuts: "Συντομεύσεις",
        shortcutName: "Όνομα Συντόμευσης",
        shortcutPrompt: "Προτροπή Συντόμευσης",
        shortcutMaxCount: `Μπορείτε να προσθέσετε έως 5 συντομεύσεις`,
        shortcutSaved: "Η συντόμευση αποθηκεύτηκε",
        shortcutDeleted: "Η συντόμευση διαγράφηκε",
        saveUserInfo: "Αποθήκευση Στοιχείων Χρήστη",
        userName: "Όνομα Χρήστη",
        languagePreference: "Προτίμηση Γλώσσας",
        setAvatar: "Ορισμός Avatar",
        updateAvatar: "Ενημέρωση Avatar",
        setting: "Ρυθμίσεις",
        userInfo: "Στοιχεία Χρήστη",
        apiKeyTab: "Κλειδί API",
        userInfoTab: "Στοιχεία Χρήστη",
        shortcutsTab: "Συντομεύσεις",
        aboutTab: "Σχετικά",
        getName: "Το Όνομά σας/Παρατσούκλι",
        inputPlaceholder: "Πληκτρολογήστε εδώ..",
        selectPlaceholder: "Ορίστε τη Γλώσσα Συστήματος",
        noShortcuts: "Καμία συντόμευση ακόμη, πατήστε 'Προσθήκη' για να ξεκινήσετε",
        maxShortcutWarning: `Μπορείτε να προσθέσετε έως ${SHORTCUTS_MAX} συντομεύσεις`,
        shortcutNamePlaceholder: "π.χ. Μετάφραση στα Αγγλικά",
        shortcutPromptPlaceholder: "Εισάγετε την προτροπή...",
        nameMaxWarning: `Το όνομα δεν μπορεί να υπερβαίνει τους ${NAME_MAX_LEN} χαρακτήρες`,
        confirmDelete: "Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν τη συντόμευση;",
        deleteText: "Διαγραφή",
        cancelText: "Ακύρωση",
        chatHistory: "Ιστορικό Συνομιλίας",
        clearChatHistory: "Εκκαθάριση Ιστορικού",
        clearHistoryConfirm: "Είστε σίγουροι ότι θέλετε να εκκαθαρίσετε το ιστορικό; Δεν μπορεί να αναιρεθεί.",
        historyCleared: "Το ιστορικό εκκαθαρίστηκε",
        pinChat: "Καρφίτσωμα",
        unpinChat: "Ξεκαρφίτσωμα",
        expand: "Ανάπτυξη",
        collapse: "Σύμπτυξη",
        selectModel: "Επιλογή Μοντέλου",
        noModelAvailable: "Δεν υπάρχει διαθέσιμο μοντέλο",
        modelReleasedOn: "Κυκλοφόρησε στις",
        modelInputSupport: "Υποστήριξη Εισόδου",
        modelSystemPrompt: "Προτροπή Συστήματος",
        modelFreeOnly: "Μόνο Δωρεάν Μοντέλα",
        modelMultiFormatSupport: "Υποστήριξη Πολλαπλών Μορφών",
        noModelMatch: "Κανένα μοντέλο δεν ταιριάζει",
        selectLanguage: "Επιλέξτε Γλώσσα",
        myPrompts: "Οι Προτροπές μου",
        prefabPrompts: "Έτοιμες Προτροπές",
        promptName: "Όνομα Προτροπής",
        promptContent: "Περιεχόμενο Προτροπής",
        promptMaxCount: `Μπορείτε να προσθέσετε έως ${SHORTCUTS_MAX} προτροπές`,
        promptSaved: "Η προτροπή αποθηκεύτηκε",
        promptDeleted: "Η προτροπή διαγράφηκε",
        savePromptChanges: "Αποθήκευση Αλλαγών Προτροπής",
        promptNamePlaceholder: "π.χ. Μετάφραση στα Αγγλικά",
        promptContentPlaceholder: "Εισάγετε την προτροπή...",
        promptNameMaxWarning: `Το όνομα δεν μπορεί να υπερβαίνει τους ${NAME_MAX_LEN} χαρακτήρες`,
        confirmDeletePrompt: "Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την προτροπή;",
        modelSettings: "Ρυθμίσεις Μοντέλου",
        modelSettingsSaved: "Οι ρυθμίσεις αποθηκεύτηκαν",
        promptHolder: "Δημιουργήστε προτροπή συστήματος για τον βοηθό...",
        operation: "Ενέργεια",
        selected: "Επιλεγμένο",
        enterToSubmit: "πατήστε Enter για υποβολή",
        verifyFirst: "Επαληθεύστε πρώτα το API key.",
        pricing: "Τιμές",
        contextLength: "Μήκος Συμφραζομένων",
        usernamePlaceHolder: "Πληκτρολογήστε το όνομα/παρατσούκλι εδώ..",
        statistics: "Στατιστικά",
        sponsorship: "Χορηγία",
        buyMeACoffee: "Κεράστε με έναν καφέ"
    },

    {
        label: 'Bahasa Indonesia (id-ID)',
        value: 'id-ID',
        newChat: "chatBaru",
        imageTag: "gambar",
        audioTag: "audio",
        textTag: "teks",
        fileTag: "file",
        webSearch: "pencarian web",
        promptTag: "Prompt",
        modelTag: "Model",
        currentModel: "Model Saat Ini",
        select: "Pilih",
        releaseDate: "Tanggal Rilis",
        systemPrompt: "Prompt Sistem",
        clear: "hapus",
        save: "simpan",
        apply: "terapkan",
        verify: "Verifikasi",
        verifyLabel: "Informasi kredit akan muncul setelah API key diverifikasi.",
        credit: "Kredit",
        totalCredits: "Total Kredit",
        usedCredits: "Kredit Terpakai",
        refresh: "Muat Ulang",
        saveChanges: "Simpan Perubahan",
        delete: "Hapus",
        addNew: "Tambah",
        shortcuts: "Pintasan",
        shortcutName: "Nama Pintasan",
        shortcutPrompt: "Prompt Pintasan",
        shortcutMaxCount: `Hanya bisa menambahkan hingga 5 pintasan`,
        shortcutSaved: "Pintasan berhasil disimpan",
        shortcutDeleted: "Pintasan berhasil dihapus",
        saveUserInfo: "Simpan Info Pengguna",
        userName: "Nama Pengguna",
        languagePreference: "Preferensi Bahasa",
        setAvatar: "Atur Avatar",
        updateAvatar: "Perbarui Avatar",
        setting: "Pengaturan",
        userInfo: "Info Pengguna",
        apiKeyTab: "API Key",
        userInfoTab: "Info Pengguna",
        shortcutsTab: "Pintasan",
        aboutTab: "Tentang",
        getName: "Nama/Panggilan Anda",
        inputPlaceholder: "Masukkan di sini..",
        selectPlaceholder: "Atur Bahasa Sistem",
        noShortcuts: "Belum ada pintasan, klik 'Tambah' untuk memulai",
        maxShortcutWarning: `Hanya bisa menambahkan hingga ${SHORTCUTS_MAX} pintasan`,
        shortcutNamePlaceholder: "contoh: Terjemahkan ke Inggris",
        shortcutPromptPlaceholder: "Masukkan prompt...",
        nameMaxWarning: `Nama tidak boleh lebih dari ${NAME_MAX_LEN} karakter`,
        confirmDelete: "Yakin ingin menghapus pintasan ini?",
        deleteText: "Hapus",
        cancelText: "Batal",
        chatHistory: "Riwayat Chat",
        clearChatHistory: "Hapus Riwayat Chat",
        clearHistoryConfirm: "Yakin ingin menghapus riwayat chat? Tindakan ini tidak bisa dibatalkan.",
        historyCleared: "Riwayat chat dihapus",
        pinChat: "Sematkan chat",
        unpinChat: "Lepaskan chat",
        expand: "Perluas",
        collapse: "Ciutkan",
        selectModel: "Pilih Model",
        noModelAvailable: "Tidak ada model tersedia",
        modelReleasedOn: "Dirilis pada",
        modelInputSupport: "Dukungan Input",
        modelSystemPrompt: "Prompt Sistem",
        modelFreeOnly: "Hanya Model Gratis",
        modelMultiFormatSupport: "Dukungan Multi-format",
        noModelMatch: "Tidak ada model yang cocok",
        selectLanguage: "Pilih Bahasa",
        myPrompts: "Prompt Saya",
        prefabPrompts: "Prompt Siap Pakai",
        promptName: "Nama Prompt",
        promptContent: "Konten Prompt",
        promptMaxCount: `Hanya bisa menambahkan hingga ${SHORTCUTS_MAX} prompt`,
        promptSaved: "Prompt berhasil disimpan",
        promptDeleted: "Prompt berhasil dihapus",
        savePromptChanges: "Simpan Perubahan Prompt",
        promptNamePlaceholder: "contoh: Terjemahkan ke Inggris",
        promptContentPlaceholder: "Masukkan prompt...",
        promptNameMaxWarning: `Nama prompt tidak boleh lebih dari ${NAME_MAX_LEN} karakter`,
        confirmDeletePrompt: "Yakin ingin menghapus prompt ini?",
        modelSettings: "Pengaturan Model",
        modelSettingsSaved: "Pengaturan model berhasil disimpan",
        promptHolder: "Buat prompt sistem untuk asisten...",
        operation: "Operasi",
        selected: "Dipilih",
        enterToSubmit: "tekan Enter untuk mengirim",
        verifyFirst: "Verifikasi API key terlebih dahulu.",
        pricing: "Harga",
        contextLength: "Panjang Konteks",
        usernamePlaceHolder: "Masukkan nama/panggilan Anda di sini..",
        statistics: "Statistik",
        sponsorship: "Sponsor",
        buyMeACoffee: "Belikan saya kopi"
    },

    {
        label: 'Malay (ms-MY)',
        value: 'ms-MY',
        newChat: "chatBaru",
        imageTag: "imej",
        audioTag: "audio",
        textTag: "teks",
        fileTag: "fail",
        webSearch: "carian web",
        promptTag: "Prompt",
        modelTag: "Model",
        currentModel: "Model Semasa",
        select: "Pilih",
        releaseDate: "Tarikh Keluaran",
        systemPrompt: "Prompt Sistem",
        clear: "padam",
        save: "simpan",
        apply: "guna",
        verify: "Sahkan",
        verifyLabel: "Maklumat kredit akan dipaparkan selepas API key disahkan.",
        credit: "Kredit",
        totalCredits: "Jumlah Kredit",
        usedCredits: "Kredit Digunakan",
        refresh: "Segar Semula",
        saveChanges: "Simpan Perubahan",
        delete: "Padam",
        addNew: "Tambah",
        shortcuts: "Pintasan",
        shortcutName: "Nama Pintasan",
        shortcutPrompt: "Prompt Pintasan",
        shortcutMaxCount: `Anda hanya boleh tambah sehingga 5 pintasan`,
        shortcutSaved: "Pintasan berjaya disimpan",
        shortcutDeleted: "Pintasan berjaya dipadam",
        saveUserInfo: "Simpan Maklumat Pengguna",
        userName: "Nama Pengguna",
        languagePreference: "Keutamaan Bahasa",
        setAvatar: "Tetapkan Avatar",
        updateAvatar: "Kemas kini Avatar",
        setting: "Tetapan",
        userInfo: "Maklumat Pengguna",
        apiKeyTab: "Kunci API",
        userInfoTab: "Maklumat Pengguna",
        shortcutsTab: "Pintasan",
        aboutTab: "Tentang",
        getName: "Nama/Gelaran Anda",
        inputPlaceholder: "Masukkan di sini..",
        selectPlaceholder: "Tetapkan Bahasa Sistem",
        noShortcuts: "Belum ada pintasan, klik 'Tambah' untuk mula",
        maxShortcutWarning: `Anda hanya boleh tambah sehingga ${SHORTCUTS_MAX} pintasan`,
        shortcutNamePlaceholder: "cth. Terjemah ke Bahasa Inggeris",
        shortcutPromptPlaceholder: "Masukkan prompt...",
        nameMaxWarning: `Nama tidak boleh melebihi ${NAME_MAX_LEN} aksara`,
        confirmDelete: "Adakah anda pasti mahu padam pintasan ini?",
        deleteText: "Padam",
        cancelText: "Batal",
        chatHistory: "Sejarah Chat",
        clearChatHistory: "Padam Sejarah Chat",
        clearHistoryConfirm: "Adakah anda pasti mahu padam sejarah chat? Tindakan ini tidak boleh dibatalkan.",
        historyCleared: "Sejarah chat dipadam",
        pinChat: "Sematkan chat",
        unpinChat: "Nyahsemat chat",
        expand: "Kembangkan",
        collapse: "Kuncupkan",
        selectModel: "Pilih Model",
        noModelAvailable: "Tiada model tersedia",
        modelReleasedOn: "Dikeluarkan pada",
        modelInputSupport: "Sokongan Input",
        modelSystemPrompt: "Prompt Sistem",
        modelFreeOnly: "Hanya Model Percuma",
        modelMultiFormatSupport: "Sokongan Multi-format",
        noModelMatch: "Tiada model sepadan",
        selectLanguage: "Pilih Bahasa",
        myPrompts: "Prompt Saya",
        prefabPrompts: "Prompt Sedia Ada",
        promptName: "Nama Prompt",
        promptContent: "Kandungan Prompt",
        promptMaxCount: `Anda hanya boleh tambah sehingga ${SHORTCUTS_MAX} prompt`,
        promptSaved: "Prompt berjaya disimpan",
        promptDeleted: "Prompt berjaya dipadam",
        savePromptChanges: "Simpan Perubahan Prompt",
        promptNamePlaceholder: "cth. Terjemah ke Bahasa Inggeris",
        promptContentPlaceholder: "Masukkan prompt...",
        promptNameMaxWarning: `Nama prompt tidak boleh melebihi ${NAME_MAX_LEN} aksara`,
        confirmDeletePrompt: "Adakah anda pasti mahu padam prompt ini?",
        modelSettings: "Tetapan Model",
        modelSettingsSaved: "Tetapan model berjaya disimpan",
        promptHolder: "Cipta prompt sistem untuk pembantu...",
        operation: "Operasi",
        selected: "Dipilih",
        enterToSubmit: "tekan Enter untuk hantar",
        verifyFirst: "Sahkan API key dahulu.",
        pricing: "Harga",
        contextLength: "Panjang Konteks",
        usernamePlaceHolder: "Masukkan nama/gelaran anda di sini..",
        statistics: "Statistik",
        sponsorship: "Tajaan",
        buyMeACoffee: "Belanja saya kopi"
    },

];

const SettingModel: React.FC<Props> = ({ open, onCancel, setApiKeyReady, setToken, userInfo, setUserInfo }) => {


    const [activeKey, setActiveKey] = useState<string>('api');
    const [store, setStore] = useState<Store | null>(null);

    // ===== API Key Tab state =====
    const [apiKeyInput, setApiKeyInput] = useState<string>('');
    const [verifying, setVerifying] = useState<boolean>(false);
    const [creditData, setCreditData] = useState<{ total?: number; used?: number } | null>(null);

    // ===== User Info Tab state =====
    const hasAvatar = useMemo(() => !!userInfo.avatar, [userInfo.avatar]);

    const [draftName, setDraftName] = useState<string>('');
    const isUserDirty = useMemo(
        () => draftName !== userInfo.name || userInfo.language?.label !== userInfo.language.label,
        [draftName, userInfo.language, userInfo.name, userInfo.language]
    );
    const [savingUser, setSavingUser] = useState<boolean>(false);

    // ===== Shortcuts Tab state =====
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [loadingShortcuts, setLoadingShortcuts] = useState<boolean>(false);
    const [savingShortcuts, setSavingShortcuts] = useState<boolean>(false);

    // -------- Helpers: Store I/O --------
    const ensureApiKeyInStore = async (s: Store) => {
        let exist = await s.get(API_KEY_FIELD);
        if (typeof exist === 'string') {
            setApiKeyInput(exist);
        } else {
            await s.set(API_KEY_FIELD, '');
            await s.save();
            setApiKeyInput('');
        }
    };

    const changeSystemLanguage = async (lang: any) => {
        await saveUserInfo({ language: languageOptions.find(item => item.value === lang) });
    }

    const ensureUserInfoInStore = async (s: Store) => {
        let v = (await s.get(USER_INFO_FIELD)) as any;

        if (v != null && v != undefined) {
            const info = { name: v.name, language: v.language, avatar: v.avatar } as UserInfo;
            setUserInfo(info);
            // 同步到草稿
            setDraftName(info.name || '');
        } else {
            const empty: UserInfo = { name: 'User', language: languageOptions[0], avatar: '' };
            await s.set(USER_INFO_FIELD, empty);
            await s.save();
            setUserInfo(empty);
            setDraftName('');
        }
    };

    const loadShortcutsFromStore = async (s: Store) => {
        setLoadingShortcuts(true);
        try {
            const raw = await s.get(SHORTCUTS_FIELD);
            if (raw === undefined || raw === null) {
                message.error(userInfo.language.noShortcuts);
                setShortcuts([]);
                return;
            }
            // 兼容：对象或数组
            let list: Shortcut[] = [];
            if (Array.isArray(raw)) {
                list = raw.filter(
                    (x) =>
                        x &&
                        typeof x === 'object' &&
                        typeof x.name === 'string' &&
                        typeof x.prompt === 'string'
                );
            } else if (typeof raw === 'object' && raw) {
                const obj = raw as any;
                if (typeof obj.name === 'string' && typeof obj.prompt === 'string') {
                    list = [{ name: obj.name, prompt: obj.prompt }];
                }
            }
            // 限制最多 5 条
            list = list.slice(0, SHORTCUTS_MAX);
            setShortcuts(list);
        } catch (e) {
            console.error('load shortcuts error', e);
            message.error(userInfo.language.noShortcuts);
            setShortcuts([]);
        } finally {
            setLoadingShortcuts(false);
        }
    };

    const saveApiKey = async (key: string) => {
        if (!store) return;
        setApiKeyReady();
        setToken(key);
        await store.set(API_KEY_FIELD, key);
        await store.save();
    };

    const saveUserInfo = async (info: Partial<UserInfo>) => {
        if (!store) return;
        const next = { ...userInfo, ...info };
        setUserInfo(next);
        await store.set(USER_INFO_FIELD, next);
        await store.save();
    };

    const saveShortcuts = async () => {
        if (!store) return;
        // 校验：数量、长度
        if (shortcuts.length > SHORTCUTS_MAX) {
            message.warning(userInfo.language.maxShortcutWarning.replace('${SHORTCUTS_MAX}', String(SHORTCUTS_MAX)));
            return;
        }
        for (const [_, sc] of shortcuts.entries()) {
            if ((sc.name || '').length > NAME_MAX_LEN) {
                message.warning(`Name length Exceeded`);
                return;
            }
            if ((sc.prompt || '').length > PROMPT_MAX_LEN) {
                message.warning(`Prompt length Exceeded`);
                return;
            }
        }
        setSavingShortcuts(true);
        try {
            await store.set(SHORTCUTS_FIELD, shortcuts);
            await store.save();
            message.success(userInfo.language.shortcutSaved);
            await emit('shortcuts_updated', { shortcuts });
        } catch (e) {
            console.error(e);
            message.error(userInfo.language.noShortcuts);
        } finally {
            setSavingShortcuts(false);
        }
    };

    // -------- Init on open --------
    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const s = await Store.load('store.json');
                setStore(s);
                await ensureApiKeyInStore(s);
                await ensureUserInfoInStore(s);
                // 若初始标签就是 shortcuts，也要加载
                if (activeKey === 'shortcuts') {
                    await loadShortcutsFromStore(s);
                }
            } catch (e) {
                console.error('load store error', e);
                message.error('初始化存储失败');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // 进入 Shortcuts 页时加载
    useEffect(() => {
        (async () => {
            if (activeKey === 'shortcuts' && store) {
                await loadShortcutsFromStore(store);
            }
        })();
    }, [activeKey, store]);

    // -------- Handlers: API Key Verify (支持静默模式，不提示成功) --------
    const handleVerify = async (silent: boolean = false) => {
        const key = apiKeyInput.trim();
        if (!key) {
            message.warning('Please input API Key');
            return;
        }
        setVerifying(true);
        try {
            const response = await fetch('https://openrouter.ai/api/v1/credits', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${key}`,
                },
            });

            let body: any = null;
            try {
                body = await response.json();
            } catch {
                body = null;
            }

            if (!response.ok) {
                const errMsg = body?.error?.message || `Request Failed: ${response.status}）`;
                setCreditData(null);
                message.error(errMsg);
            } else {
                const total = Number(body?.data?.total_credits ?? 0);
                const used = Number(body?.data?.total_usage ?? 0);
                setCreditData({ total, used });
                await saveApiKey(key);
                if (!silent) {
                    message.success('Verification Success');
                }
            }
        } catch (e) {
            console.error('Network Error, try again later', e);
            setCreditData(null);
            message.error('Network Error, try again later');
        } finally {
            setVerifying(false);
        }
    };

    // -------- Handlers: User Info --------
    const handleSaveUser = async () => {
        setSavingUser(true);
        try {
            await saveUserInfo({ name: draftName, language: userInfo.language });
            message.success('Save user info');
        } catch (e) {
            console.error(e);
            message.error('Failed to save user info ');
        } finally {
            setSavingUser(false);
        }
    };

    const uploadProps: UploadProps = {
        accept: 'image/*',
        showUploadList: false,
        beforeUpload: async (file) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const dataURL = String(reader.result || '');
                await saveUserInfo({ avatar: dataURL });
                message.success('Avatar Updated');
            };
            reader.onerror = () => message.error('Failed to load image');
            reader.readAsDataURL(file);
            return false; // 阻止 antd 真正发起上传
        },
    };

    // -------- UI Bits: Credit number formatting --------
    const remain = useMemo(() => {
        const t = creditData?.total ?? undefined;
        const u = creditData?.used ?? undefined;
        if (t === undefined || u === undefined) return undefined;
        const r = Math.max(0, t - u);
        return Math.round(r * 1000000) / 1000000; // 保留到 6 位小数以内
    }, [creditData]);



    // -------- Common styles --------
    const commonPageStyle: React.CSSProperties = {
        height: PAGE_HEIGHT,
        overflowY: 'auto',
        paddingRight: 16,
    };

    const apiTab = (
        <div style={commonPageStyle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space.Compact style={{ width: '100%' }}>
                    <Input.Password
                        placeholder={"API-KEY.."}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        disabled={verifying}
                        autoComplete="off"
                    />
                    <Button
                        type="primary"
                        onClick={() => handleVerify(false)}
                        loading={verifying}
                        disabled={verifying || apiKeyInput.trim() === ''}
                    >
                        {userInfo.language.verify}
                    </Button>
                </Space.Compact>

                {/* 旁白 + 刷新按钮（仅当 apiKey 不为空时显示） */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Typography.Text style={{ fontSize: 12, color: '#999' }}>
                        {userInfo.language.verifyLabel}
                    </Typography.Text>

                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ padding: '8px 4px' }}>
                    <span
                        style={{
                            fontSize: 32,
                            fontWeight: 700,
                            color: '#c79c4e',
                            lineHeight: 1.2,
                        }}
                    >
                        {remain !== undefined ? remain : '--'}
                    </span>
                    <span
                        style={{
                            fontSize: 32,
                            fontWeight: 400,
                            color: '#000',
                            lineHeight: 1.2,
                            marginLeft: 8,
                        }}
                    >
                        Credits
                    </span>
                    {apiKeyInput.trim() !== '' && (
                        <Button
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={() => handleVerify(true)}
                            loading={verifying}
                            disabled={verifying}
                            style={{ transform: "translate(0%,-20%)", marginLeft: 12 }}
                        >
                            {userInfo.language.refresh}
                        </Button>
                    )}
                    <div style={{ marginTop: 16 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                            {userInfo.language.totalCredits}: {creditData?.total ?? '--'}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                            {userInfo.language.usedCredits}: {creditData?.used ?? '--'}
                        </Typography.Text>
                    </div>
                </div>
            </Space>
        </div>
    );

    const userTab = (
        <div
            style={{
                ...commonPageStyle,
                // 全部水平居中
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <div style={{ width: '100%', maxWidth: 520 }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* 头像区域：按钮放到头像下方 */}
                    <div style={{ textAlign: 'center' }}>
                        <Avatar
                            size={80}
                            src={hasAvatar ? userInfo.avatar : undefined}
                            icon={hasAvatar ? undefined : <UserOutlined />}
                        />
                        <div style={{ marginTop: 12 }}>
                            <Upload {...uploadProps}>
                                <Button>{hasAvatar ? userInfo.language.updateAvatar : userInfo.language.setAvatar}</Button>
                            </Upload>
                        </div>
                    </div>

                    {/* 名称 */}
                    <div>
                        <Typography.Text strong>{userInfo.language.getName}</Typography.Text>
                        <Input
                            placeholder={userInfo.language.usernamePlaceHolder}
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            allowClear
                        />
                    </div>

                    {/* 语言偏好（≥20） */}
                    <div>
                        <Typography.Text strong>{userInfo.language.languagePreference}</Typography.Text>
                        <div style={{ marginTop: 8 }}>
                            <Select
                                placeholder={userInfo.language.languagePreference}
                                value={userInfo.language || undefined}
                                onChange={changeSystemLanguage}
                                style={{ width: '100%' }
                                }
                                options={languageOptions}
                                showSearch={false}
                                allowClear={false}
                                optionFilterProp="label"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="primary"
                            onClick={handleSaveUser}
                            loading={savingUser}
                            disabled={!isUserDirty || savingUser}
                        >
                            {userInfo.language.save}
                        </Button>
                    </div>
                </Space>
            </div>
        </div>
    );

    // ===== Shortcuts Tab UI =====
    const handleAddShortcut = () => {
        if (shortcuts.length >= SHORTCUTS_MAX) {
            message.warning(userInfo.language.maxShortcutWarning.replace('${SHORTCUTS_MAX}', String(SHORTCUTS_MAX)));
            return;
        }
        setShortcuts((prev) => [...prev, { name: '', prompt: '' }]);
    };

    const handleChangeShortcut = (idx: number, patch: Partial<Shortcut>) => {
        setShortcuts((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], ...patch };
            return next;
        });
    };

    const handleDeleteShortcut = (idx: number) => {
        setShortcuts((prev) => prev.filter((_, i) => i !== idx));
    };

    const shortcutsTab = (
        <div style={commonPageStyle}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <Typography.Title level={5} style={{ margin: 0 }}>
                            {userInfo.language.shortcuts}
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            {userInfo.language.shortcutMaxCount}（{shortcuts.length}/{SHORTCUTS_MAX}）
                        </Typography.Text>
                    </div>
                    <Space>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddShortcut}
                            disabled={shortcuts.length >= SHORTCUTS_MAX}
                        >
                            {userInfo.language.addNew}
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={saveShortcuts}
                            loading={savingShortcuts}
                            disabled={loadingShortcuts || savingShortcuts}
                        >
                            {userInfo.language.save}
                        </Button>
                    </Space>
                </div>

                <Divider style={{ margin: '0px 0', rowGap: "0px" }} />

                {loadingShortcuts ? (
                    <Card loading />
                ) : shortcuts.length === 0 ? (
                    <div style={{ padding: '24px 0' }}>
                        <Empty description={userInfo.language.noShortcuts} />
                    </div>
                ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {shortcuts.map((sc, idx) => (
                            <Card
                                key={idx}
                                size="small"
                                style={{ borderRadius: 10, padding: "12px 12px 18px 12px" }}
                                title={
                                    <Space align="center">
                                        <Tag color="gold">#{idx + 1}</Tag>
                                        <Typography.Text strong>{userInfo.language.shortcuts}</Typography.Text>
                                    </Space>
                                }
                                extra={
                                    <Popconfirm
                                        title={userInfo.language.confirmDelete}
                                        onConfirm={() => handleDeleteShortcut(idx)}
                                        okText={userInfo.language.deleteText}
                                        cancelText={userInfo.language.cancelText}
                                    >
                                        <Button type="text" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                }
                            >
                                <Space direction="vertical" style={{ width: '100%' }} size="small">
                                    <div>
                                        <Typography.Text>
                                            {userInfo.language.shortcutName}（≤{NAME_MAX_LEN}）
                                        </Typography.Text>
                                        <Input
                                            style={{ marginTop: 6 }}
                                            placeholder={userInfo.language.shortcutNamePlaceholder}
                                            value={sc.name}
                                            onChange={(e) => handleChangeShortcut(idx, { name: e.target.value.slice(0, NAME_MAX_LEN) })}
                                            maxLength={NAME_MAX_LEN}
                                            showCount
                                            allowClear
                                        />
                                    </div>
                                    <div>
                                        <Typography.Text>
                                            {userInfo.language.shortcutPrompt}（≤{PROMPT_MAX_LEN}）
                                        </Typography.Text>
                                        <TextArea
                                            style={{ marginTop: 6 }}
                                            placeholder={userInfo.language.shortcutPromptPlaceholder}
                                            value={sc.prompt}
                                            onChange={(e) =>
                                                handleChangeShortcut(idx, {
                                                    prompt: e.target.value.slice(0, PROMPT_MAX_LEN),
                                                })
                                            }
                                            maxLength={PROMPT_MAX_LEN}
                                            showCount
                                            autoSize={{ minRows: 3, maxRows: 8 }}
                                        />
                                    </div>
                                </Space>
                            </Card>
                        ))}
                    </Space>
                )}
            </Space>
        </div>
    );

    // const aboutTab = (
    //     <div style={commonPageStyle}>
    //         <Typography.Text>这是关于页面，占位文案。</Typography.Text>
    //     </div>
    // );

    const items: TabsProps['items'] = [
        { key: 'api', label: userInfo.language.apiKeyTab, children: apiTab },
        { key: 'user', label: userInfo.language.userInfoTab, children: userTab },
        { key: 'shortcuts', label: userInfo.language.shortcutsTab, children: shortcutsTab },
        // { key: 'about', label: userInfo.language.aboutTab, children: aboutTab },
    ];

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={720}
            title={userInfo.language.setting}
            destroyOnHidden={false}
            maskClosable={!verifying}
            mask={false}
            centered
        >
            <Tabs
                activeKey={activeKey}
                onChange={setActiveKey}
                items={items}
                tabPosition="left"
                animated
            />
        </Modal>
    );
};

export default SettingModel;
