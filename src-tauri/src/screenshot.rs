use arboard::Clipboard;
use base64::{engine::general_purpose, Engine as _};
use image::{imageops::FilterType, DynamicImage, ImageBuffer, ImageFormat, Rgba};
use serde::Serialize;
use std::{
  fs,
  io::Cursor,
  process::Command,
  thread,
  time::{Duration, Instant},
};
use tauri::{Manager, WebviewWindow};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CapturedScreenshot {
  image_data_url: String,
  width: usize,
  height: usize,
  ocr_text: String,
}

#[tauri::command]
pub async fn capture_screen_clip(window: WebviewWindow) -> Result<CapturedScreenshot, String> {
  let should_restore = window.is_visible().unwrap_or(false);
  if should_restore {
    let _ = window.hide();
  }

  let mut result = tauri::async_runtime::spawn_blocking(capture_with_windows_screen_clip)
    .await
    .map_err(|error| error.to_string())?;

  if let Ok(ref mut screenshot) = result {
    if let Ok(debug_path) = save_debug_capture(&window, screenshot) {
      screenshot.ocr_text = run_windows_ocr(&debug_path).unwrap_or_default();
    }
  }

  if should_restore {
    let _ = window.show();
    let _ = window.set_focus();
  }

  result
}

fn capture_with_windows_screen_clip() -> Result<CapturedScreenshot, String> {
  let before = clipboard_image_fingerprint();
  launch_windows_screen_clip()?;

  let deadline = Instant::now() + Duration::from_secs(60);
  while Instant::now() < deadline {
    if let Some(image) = read_clipboard_image_if_changed(before.as_deref())? {
      return encode_clipboard_image(image);
    }
    thread::sleep(Duration::from_millis(350));
  }

  Err("没有检测到新的截图。请重新点击截图按钮，并在截图工具中框选区域。".to_string())
}

#[cfg(target_os = "windows")]
fn launch_windows_screen_clip() -> Result<(), String> {
  Command::new("cmd")
    .args(["/C", "start", "", "ms-screenclip:"])
    .spawn()
    .map_err(|error| format!("无法启动 Windows 截图工具：{error}"))?;
  Ok(())
}

#[cfg(not(target_os = "windows"))]
fn launch_windows_screen_clip() -> Result<(), String> {
  Err("当前截图入口使用 Windows 截图工具，请在 Windows 上运行。".to_string())
}

fn clipboard_image_fingerprint() -> Option<String> {
  let mut clipboard = Clipboard::new().ok()?;
  let image = clipboard.get_image().ok()?;
  Some(image_fingerprint(image.width, image.height, image.bytes.as_ref()))
}

fn read_clipboard_image_if_changed(
  before: Option<&str>,
) -> Result<Option<arboard::ImageData<'static>>, String> {
  let mut clipboard = Clipboard::new().map_err(|error| format!("无法读取剪贴板：{error}"))?;
  let Ok(image) = clipboard.get_image() else {
    return Ok(None);
  };

  let current = image_fingerprint(image.width, image.height, image.bytes.as_ref());
  if before == Some(current.as_str()) {
    return Ok(None);
  }

  Ok(Some(image))
}

fn image_fingerprint(width: usize, height: usize, bytes: &[u8]) -> String {
  let head = bytes
    .iter()
    .take(64)
    .fold(0u64, |acc, byte| acc.wrapping_mul(131).wrapping_add(*byte as u64));
  let tail = bytes
    .iter()
    .rev()
    .take(64)
    .fold(0u64, |acc, byte| acc.wrapping_mul(131).wrapping_add(*byte as u64));
  format!("{width}x{height}:{head:x}:{tail:x}:{}", bytes.len())
}

fn encode_clipboard_image(image: arboard::ImageData<'static>) -> Result<CapturedScreenshot, String> {
  let width = image.width;
  let height = image.height;
  let buffer =
    ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width as u32, height as u32, image.bytes.into_owned())
      .ok_or_else(|| "截图像素格式无法转换为 PNG。".to_string())?;
  let source = DynamicImage::ImageRgba8(buffer);
  let scale = ocr_scale_factor(width, height);
  let encoded_image = if scale > 1 {
    source.resize_exact((width * scale) as u32, (height * scale) as u32, FilterType::CatmullRom)
  } else {
    source
  };
  let mut png = Cursor::new(Vec::new());
  encoded_image
    .write_to(&mut png, ImageFormat::Png)
    .map_err(|error| format!("截图 PNG 编码失败：{error}"))?;

  Ok(CapturedScreenshot {
    image_data_url: format!(
      "data:image/png;base64,{}",
      general_purpose::STANDARD.encode(png.into_inner())
    ),
    width,
    height,
    ocr_text: String::new(),
  })
}

fn ocr_scale_factor(width: usize, height: usize) -> usize {
  if width < 700 || height < 220 {
    3
  } else if width < 1200 || height < 420 {
    2
  } else {
    1
  }
}

fn save_debug_capture(window: &WebviewWindow, screenshot: &CapturedScreenshot) -> Result<std::path::PathBuf, String> {
  let (_, encoded) = screenshot
    .image_data_url
    .split_once(',')
    .ok_or_else(|| "截图 data URL 缺少 base64 内容。".to_string())?;
  let bytes = general_purpose::STANDARD
    .decode(encoded)
    .map_err(|error| format!("截图调试文件解码失败：{error}"))?;
  let dir = window
    .app_handle()
    .path()
    .app_config_dir()
    .map_err(|error| error.to_string())?;
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  let path = dir.join("last-ai-vision.png");
  fs::write(&path, bytes).map_err(|error| error.to_string())?;
  Ok(path)
}

#[cfg(target_os = "windows")]
fn run_windows_ocr(image_path: &std::path::Path) -> Result<String, String> {
  let output_path = image_path.with_file_name("last-ai-vision-ocr.txt");
  let image_path = image_path.to_string_lossy().replace('\'', "''");
  let output_path_arg = output_path.to_string_lossy().replace('\'', "''");
  let script = format!(
    r#"
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
function Await($op, $resultType) {{
  $asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {{
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  }} | Select-Object -First 1
  $task = $asTask.MakeGenericMethod($resultType).Invoke($null, @($op))
  $task.Wait()
  $task.Result
}}
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync('{image_path}')) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $engine) {{
  Set-Content -Path '{output_path_arg}' -Value '' -Encoding UTF8
  exit 0
}}
$result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
Set-Content -Path '{output_path_arg}' -Value $result.Text -Encoding UTF8
"#
  );
  let status = Command::new("powershell.exe")
    .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &script])
    .status()
    .map_err(|error| format!("Windows OCR 启动失败：{error}"))?;
  if !status.success() {
    return Err(format!("Windows OCR 执行失败：{status}"));
  }
  fs::read_to_string(output_path)
    .map(|text| text.trim_start_matches('\u{feff}').trim().to_string())
    .map_err(|error| format!("读取 OCR 结果失败：{error}"))
}

#[cfg(not(target_os = "windows"))]
fn run_windows_ocr(_image_path: &std::path::Path) -> Result<String, String> {
  Ok(String::new())
}
