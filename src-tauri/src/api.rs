use futures_util::StreamExt;
use reqwest::Client;
use serde_json::Value;
use tauri::{command, Emitter, Window};

/// 命令通用返回结构
/// Generic command result envelope.
#[derive(Debug, serde::Serialize)]
pub struct CommandResult {
    /// 是否成功 / success flag
    pub success: bool,
    /// 数据（可选）/ optional payload
    pub data: Option<serde_json::Value>,
    /// 错误信息（可选）/ optional error message
    pub error: Option<String>,
}

/// 获取 OpenRouter 模型列表（HTTP）
/// Fetch OpenRouter model list via HTTP.
///
/// 返回 JSON 字符串封装的结果。
/// Returns a JSON string of `CommandResult`.
#[command]
pub async fn get_open_router_models() -> String {
    let url = "https://openrouter.ai/api/v1/models";
    let client = Client::new();

    match client.get(url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                let data = response.json::<serde_json::Value>().await;
                match data {
                    Ok(json_data) => {
                        let result = CommandResult {
                            success: true,
                            data: Some(json_data),
                            error: None,
                        };
                        serde_json::to_string(&result).unwrap_or_else(|e| {
                            format!(
                                "{{\"success\": false, \"error\": \"Failed to serialize JSON: {}\"}}",
                                e
                            )
                        })
                    }
                    Err(e) => {
                        let result = CommandResult {
                            success: false,
                            data: None,
                            error: Some(format!("Failed to parse JSON: {}", e)),
                        };
                        serde_json::to_string(&result).unwrap()
                    }
                }
            } else {
                let status = response.status();
                let result = CommandResult {
                    success: false,
                    data: None,
                    error: Some(format!("Request failed with status: {}", status)),
                };
                serde_json::to_string(&result).unwrap()
            }
        }
        Err(e) => {
            let result = CommandResult {
                success: false,
                data: None,
                error: Some(format!("Request error: {}", e)),
            };
            serde_json::to_string(&result).unwrap()
        }
    }
}

/// 代理转发流式响应到前端（SSE/流）
/// Proxy OpenRouter streaming response to frontend (SSE/stream).
///
/// - 实时将 `delta.content` 片段通过 `stream-response` 事件推送给窗口。
/// - 当首次对话完成后，异步生成标题并通过 `update_chat_title` 通知前端。
/// - Push `delta.content` chunks via `stream-response`.
/// - On first conversation, asynchronously request a title and emit `update_chat_title`.
#[command]
pub async fn proxy_stream(
    window: Window,
    mut body: Value,
    model: String,
    token: String,
) -> Result<(), String> {
    let url = "https://openrouter.ai/api/v1/chat/completions".to_string();
    let client = Client::builder().build().map_err(|e| e.to_string())?;

    // 首次对话：消息数为 2（user+system or user+assistant？按你的逻辑保持不变）
    // First interaction heuristic: messages length == 2.
    let is_first_interaction = body
        .get("messages")
        .and_then(|msgs| msgs.as_array())
        .map(|msgs| msgs.len() == 2)
        .unwrap_or(false);

    body.as_object_mut()
        .ok_or_else(|| "Body is not a JSON object".to_string())?
        .insert("model".to_string(), Value::String(model.clone()));

    let response = client
        .post(&url)
        .bearer_auth(token.clone())
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = response.bytes_stream();
    let mut assistant_response = String::new();

    while let Some(item) = stream.next().await {
        match item {
            Ok(chunk) => {
                let text_chunk = String::from_utf8_lossy(&chunk);
                for line in text_chunk.split("\n\n") {
                    if !line.starts_with("data: ") {
                        continue;
                    }
                    let json_str = line.trim_start_matches("data: ");
                    if json_str == "[DONE]" {
                        window.emit("stream-response", json_str.to_string()).map_err(|e| e.to_string())?;

                        if is_first_interaction {
                            let title_body = create_title_body(&body, &assistant_response)?;
                            spawn_fetch_chat_title(window.clone(), title_body, model.clone(), token.clone());
                        }
                        return Ok(());
                    }
                    if let Ok(json_value) = serde_json::from_str::<Value>(json_str) {
                        if let Some(content) = json_value
                            .get("choices")
                            .and_then(|choices| choices.get(0))
                            .and_then(|choice| choice.get("delta"))
                            .and_then(|delta| delta.get("content"))
                            .and_then(|content| content.as_str())
                        {
                            assistant_response.push_str(content);
                            window.emit("stream-response", content.to_string()).map_err(|e| e.to_string())?;
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("{}", e.to_string());
                return Err(e.to_string());
            }
        }
    }

    // 兜底 DONE 事件 / emit final DONE as fallback
    window.emit("stream-response", "[DONE]".to_string()).map_err(|e| e.to_string())?;

    if is_first_interaction {
        let title_body = create_title_body(&body, &assistant_response)?;
        spawn_fetch_chat_title(window.clone(), title_body, model.clone(), token.clone());
    }

    Ok(())
}

/// 生成用于标题生成的请求体（在原有 messages 末尾追加）
/// Build request body for title generation (append to messages).
///
/// 将 assistant 最终回复与一个“生成标题”的用户指令加入 messages。
/// Appends the assistant final reply and a title-generation user prompt.
pub fn create_title_body(original_body: &Value, assistant_response: &str) -> Result<Value, String> {
    let mut title_body = original_body.clone();

    if let Some(obj) = title_body.as_object_mut() {
        obj.remove("stream");

        if let Some(messages) = obj.get_mut("messages").and_then(|m| m.as_array_mut()) {
            let assistant_message = serde_json::json!({
                "role": "assistant",
                "content": assistant_response
            });
            messages.push(assistant_message);

            let title_request = serde_json::json!({
                "role": "user",
                "content": "Please generate a short, descriptive title (maximum 7 words) for this conversation based on the user's question using user's language. Only return the title, no additional text."
            });
            messages.push(title_request);
        }
    }

    Ok(title_body)
}

/// 后台异步任务：获取会话标题
/// Spawn a background task to fetch the chat title.
pub fn spawn_fetch_chat_title(window: Window, body: Value, model: String, token: String) {
    tauri::async_runtime::spawn(async move {
        match fetch_chat_title(window, body, model, token).await {
            Ok(_) => {
                println!("Chat title generated successfully");
            }
            Err(e) => {
                eprintln!("Failed to generate chat title: {}", e);
            }
        }
    });
}

/// 请求 OpenRouter 生成标题并通知前端
/// Request OpenRouter to generate a title and emit to frontend.
///
/// 成功时通过 `update_chat_title` 向窗口发送完整 JSON。
/// On success, emits `update_chat_title` with full JSON payload.
#[command]
pub async fn fetch_chat_title(
    window: Window,
    mut body: Value,
    model: String,
    token: String,
) -> Result<Value, String> {
    let url = "https://openrouter.ai/api/v1/chat/completions".to_string();
    let client = Client::new();

    body.as_object_mut()
        .ok_or_else(|| "Body is not a JSON object".to_string())?
        .insert("model".to_string(), Value::String(model));

    let response = client
        .post(&url)
        .bearer_auth(token.to_string())
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let json_response: Value = response.json().await.map_err(|e| e.to_string())?;
        window.emit("update_chat_title", json_response.clone()).unwrap();
        Ok(json_response)
    } else {
        let status = response.status();
        let text = response.text().await.map_err(|e| e.to_string())?;
        Err(format!("Request failed with status: {}, body: {}", status, text))
    }
}
