use serde_json::{json, Value};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const DEFAULT_TRANSLATION_PROMPT: &str = r#"你是一个专业的聊天语境翻译引擎，不是普通机器翻译。

你的任务：
1. 根据用户输入内容，判断源语言。
2. 将内容翻译成目标语言。
3. 优先保留真实聊天语气，而不是逐字直译。
4. 识别俚语、缩写、网络用语、游戏圈用语、二次元/小圈子/Second Life 场景用语。
5. 遇到脏话、挑衅、阴阳怪气、玩笑、暧昧表达时，要解释真实语气。
6. 不要把所有内容翻译得过于正式。
7. 不要擅自美化原文，不要把攻击性内容洗白。
8. 不要输出无关废话。
9. 用户更关心“这句话到底是什么意思”和“该怎么自然理解”。

输入信息：
* 源语言：{{source_language}}
* 目标语言：{{target_language}}
* 用户文本：{{text}}
* 使用场景：{{scene}}

输出格式必须为：

【自然翻译】
用目标语言自然翻译原文。

【语气解释】
解释这句话的语气、情绪、潜台词。没有特别语气就写“普通表达”。

【难懂词/梗解释】
列出俚语、缩写、圈内词、网络用语。没有就写“无”。

【直译参考】
给一个接近原文结构的直译，方便用户对照理解。"#;

const DEFAULT_REPLY_PROMPT: &str = r#"你是一个自然聊天回复助手，目标是把用户想表达的中文意思改写成自然、地道、不像机器翻译的外语回复。

你的任务：
1. 根据对方原文理解聊天上下文。
2. 根据用户想表达的意思，生成目标语言回复。
3. 回复要自然、口语化，像真实网友聊天。
4. 不要过度正式，不要像商务邮件。
5. 保留用户原本的态度：友好、随便、吐槽、拒绝、解释、开玩笑。
6. 用户不会说很复杂的英文，所以优先生成简单自然的句子。
7. 不要加入用户没有表达过的新信息。
8. 如果对方在开玩笑，回复也可以轻松一点。
9. 如果内容可能引战，降低攻击性，但保留态度。

输入信息：
* 对方原文：{{context_text}}
* 用户想表达：{{user_intent}}
* 目标语言：{{target_language}}
* 回复风格：{{reply_style}}
* 是否需要简短：{{short_mode}}

输出格式必须为：

【推荐回复】
最自然、最推荐直接发送的一句。

【更随便一点】
更口语、更像网友聊天的版本。

【更礼貌一点】
语气更稳一点的版本。

【意思解释】
用中文解释这些回复大概是什么意思。"#;

#[tauri::command]
pub fn get_config(app: AppHandle) -> Result<Value, String> {
  read_config_value(&app)
}

#[tauri::command]
pub fn save_config(app: AppHandle, config: Value) -> Result<Value, String> {
  save_config_value(&app, config)
}

#[tauri::command]
pub fn complete_setup(app: AppHandle, config: Value) -> Result<Value, String> {
  let mut next = config;
  next["firstRun"] = Value::Bool(false);
  next["setupCompleted"] = Value::Bool(true);
  save_config_value(&app, next)
}

#[tauri::command]
pub fn config_file_path(app: AppHandle) -> Result<String, String> {
  config_path(&app).map(|path| path.display().to_string())
}

pub fn ensure_config(app: &AppHandle) -> Result<Value, String> {
  let path = config_path(app)?;

  if !path.exists() {
    return save_config_value(app, default_config());
  }

  read_config_value(app)
}

pub fn read_config_value(app: &AppHandle) -> Result<Value, String> {
  let path = config_path(app)?;
  let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
  let loaded: Value = serde_json::from_str(raw.trim_start_matches('\u{feff}'))
    .map_err(|error| error.to_string())?;
  let mut merged = default_config();
  merge_json(&mut merged, loaded);
  Ok(merged)
}

pub fn save_config_value(app: &AppHandle, config: Value) -> Result<Value, String> {
  let path = config_path(app)?;
  let mut merged = default_config();
  merge_json(&mut merged, config);
  let serialized = serde_json::to_string_pretty(&merged).map_err(|error| error.to_string())?;
  fs::write(path, serialized).map_err(|error| error.to_string())?;
  Ok(merged)
}

pub fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_config_dir().map_err(|error| error.to_string())?;
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  Ok(dir.join("config.json"))
}

pub fn listen_port(config: &Value) -> u16 {
  config
    .get("listenPort")
    .and_then(Value::as_u64)
    .filter(|port| (1024..=65535).contains(port))
    .unwrap_or(60828) as u16
}

pub fn should_show_settings(config: &Value) -> bool {
  let first_run = config.get("firstRun").and_then(Value::as_bool).unwrap_or(true);
  let setup_completed = config
    .get("setupCompleted")
    .and_then(Value::as_bool)
    .unwrap_or(false);
  let tray_only = config
    .get("trayOnlyOnLaunch")
    .and_then(Value::as_bool)
    .unwrap_or(true);

  first_run || !setup_completed || !tray_only
}

pub fn toggle_clipboard_listen(app: &AppHandle) -> Result<bool, String> {
  let mut config = read_config_value(app)?;
  let next = !config
    .get("clipboardListen")
    .and_then(Value::as_bool)
    .unwrap_or(false);
  config["clipboardListen"] = Value::Bool(next);
  save_config_value(app, config)?;
  Ok(next)
}

fn default_config() -> Value {
  json!({
    "firstRun": true,
    "setupCompleted": false,
    "theme": "dark",
    "startup": false,
    "trayOnlyOnLaunch": true,
    "animations": true,
    "windowTransparency": false,
    "clipboardListen": false,
    "autoPopupAfterCopy": false,
    "listenPort": 60828,
    "minTextLength": 2,
    "proxy": {
      "enabled": false,
      "protocol": "http",
      "host": "",
      "port": "",
      "username": "",
      "password": "",
      "bypass": "localhost,127.0.0.1"
    },
    "translationSettings": {
      "sourceLanguage": "auto",
      "targetLanguage": "zh-CN",
      "languageDetectEngine": "local",
      "aiForShortText": false,
      "removeLineBreaks": true,
      "trimSpaces": true,
      "keepEmoji": true,
      "keepSourceCase": false,
      "rememberWindowSize": true,
      "alwaysOnTop": false,
      "autoHideOnBlur": false,
      "focusResultAfterTranslate": true,
      "autoCopyAiReply": false,
      "aiReplyCopyFormat": "replyOnly"
    },
    "hotkeys": {
      "inputTranslate": "Ctrl+Alt+T",
      "ocr": "Ctrl+Alt+O",
      "screenshotTranslate": "Ctrl+Alt+S"
    },
    "services": {
      "translate": [
        { "id": "google", "type": "built-in", "name": "谷歌翻译", "enabled": true, "iconText": "G" },
        { "id": "bing", "type": "built-in", "name": "必应翻译", "enabled": true, "iconText": "B" },
        { "id": "lingva", "type": "built-in", "name": "Lingva 翻译", "enabled": false, "iconText": "L" }
      ],
      "ai": [
        {
          "id": "openai",
          "provider": "OpenAI",
          "name": "OpenAI",
          "enabled": false,
          "baseUrl": "https://api.openai.com/v1",
          "apiKey": "",
          "model": "gpt-4o-mini",
          "temperature": 0.4,
          "maxTokens": 1600,
          "useProxy": false,
          "customHeaders": ""
        }
      ],
      "ocr": [
        { "id": "system-ocr", "type": "system", "name": "系统 OCR", "enabled": true, "iconText": "S" },
        { "id": "tesseract", "type": "plugin", "name": "Tesseract.js", "enabled": false, "iconText": "T" }
      ]
    },
    "aiSettings": {
      "defaultServiceId": "openai",
      "replyTargetLanguage": "en",
      "replyStyle": "natural",
      "shortMode": true,
      "enableAiReply": true,
      "autoCopyAiReply": false,
      "translationPrompt": DEFAULT_TRANSLATION_PROMPT,
      "replyPrompt": DEFAULT_REPLY_PROMPT
    },
    "ocrSettings": {
      "defaultEngine": "system-ocr",
      "language": "auto",
      "autoDetectLanguage": true,
      "copyAfterOcr": false,
      "translateAfterOcr": false,
      "fallbackOnFailure": true
    }
  })
}

fn merge_json(base: &mut Value, override_value: Value) {
  match (base, override_value) {
    (Value::Object(base_map), Value::Object(override_map)) => {
      for (key, value) in override_map {
        merge_json(base_map.entry(key).or_insert(Value::Null), value);
      }
    }
    (slot, value) => {
      *slot = value;
    }
  }
}
