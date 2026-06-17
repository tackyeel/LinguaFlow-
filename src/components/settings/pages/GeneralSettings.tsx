import { Palette, Radio, Rocket, Server } from "lucide-react";
import { PageHeader, SectionCard, Select, SettingRow, Switch, TextInput } from "../../ui/Material";
import { useConfigStore } from "../../../stores/configStore";
import { UI_LANGUAGE_OPTIONS, useUiLanguageStore, type UiLanguage } from "../../../stores/uiLanguageStore";
import type { ProxyProtocol, ThemeName } from "../../../types/config";

export function GeneralSettings() {
  const { config, updateConfig } = useConfigStore();
  const { language, setLanguage } = useUiLanguageStore();

  return (
    <>
      <PageHeader title="常规设置" description="启动、外观、监听和网络代理会自动保存到本地配置。" />

      <div className="space-y-6">
        <SectionCard title="启动" icon={<Rocket size={18} />}>
          <SettingRow title="开机启动" description="登录 Windows 后自动启动 LinguaFlow。">
            <Switch checked={config.startup} onChange={(checked) => void updateConfig((draft) => void (draft.startup = checked))} />
          </SettingRow>
          <SettingRow title="启动后仅显示托盘图标" description="第二次及以后启动时不自动弹出设置窗口。">
            <Switch
              checked={config.trayOnlyOnLaunch}
              onChange={(checked) => void updateConfig((draft) => void (draft.trayOnlyOnLaunch = checked))}
            />
          </SettingRow>
        </SectionCard>

        <SectionCard title="外观" icon={<Palette size={18} />}>
          <SettingRow title="系统语言" description="界面语言设置保存在本机。">
            <Select value={language} onChange={(event) => setLanguage(event.target.value as UiLanguage)}>
              {UI_LANGUAGE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </SettingRow>
          <SettingRow title="主题" description="浅色、深色和蓝色主题会立即应用到设置页和历史记录。">
            <Select
              value={config.theme}
              onChange={(event) =>
                void updateConfig((draft) => {
                  draft.theme = event.target.value as ThemeName;
                })
              }
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="blue">蓝色</option>
            </Select>
          </SettingRow>
          <SettingRow title="界面动效" description="启用平滑过渡和轻量动效。">
            <Switch
              checked={config.animations}
              onChange={(checked) => void updateConfig((draft) => void (draft.animations = checked))}
            />
          </SettingRow>
          <SettingRow title="窗口透明效果" description="预留 Windows 窗口材质接入。">
            <Switch
              checked={config.windowTransparency}
              onChange={(checked) => void updateConfig((draft) => void (draft.windowTransparency = checked))}
            />
          </SettingRow>
        </SectionCard>

        <SectionCard title="监听" icon={<Radio size={18} />}>
          <SettingRow title="剪贴板监听" description="复制文本后进入后续自动翻译流程。">
            <Switch
              checked={config.clipboardListen}
              onChange={(checked) => void updateConfig((draft) => void (draft.clipboardListen = checked))}
            />
          </SettingRow>
          <SettingRow title="复制后自动弹出" description="复制文本后立即打开翻译窗口。">
            <Switch
              checked={config.autoPopupAfterCopy}
              onChange={(checked) => void updateConfig((draft) => void (draft.autoPopupAfterCopy = checked))}
            />
          </SettingRow>
          <SettingRow title="监听端口" description="写入 config.json 的 listenPort。">
            <TextInput
              type="number"
              min={1024}
              max={65535}
              value={config.listenPort}
              onChange={(event) =>
                void updateConfig((draft) => {
                  draft.listenPort = Number(event.target.value);
                })
              }
            />
          </SettingRow>
          <SettingRow title="当前实际监听端口" description="端口被占用时会自动切换并写回 runtimePort。">
            <TextInput value={config.runtimePort ?? "尚未启动本地服务"} readOnly />
          </SettingRow>
          <SettingRow title="忽略过短文本" description="跳过短于该长度的字符串。">
            <TextInput
              type="number"
              min={0}
              value={config.minTextLength}
              onChange={(event) =>
                void updateConfig((draft) => {
                  draft.minTextLength = Number(event.target.value);
                })
              }
            />
          </SettingRow>
        </SectionCard>

        <SectionCard title="网络代理" icon={<Server size={18} />}>
          <SettingRow title="启用代理" description="AI Provider 可以选择复用这里的代理配置。">
            <Switch checked={config.proxy.enabled} onChange={(checked) => void updateConfig((draft) => void (draft.proxy.enabled = checked))} />
          </SettingRow>
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-medium text-text-secondary">协议</span>
              <Select
                value={config.proxy.protocol}
                disabled={!config.proxy.enabled}
                onChange={(event) =>
                  void updateConfig((draft) => {
                    draft.proxy.protocol = event.target.value as ProxyProtocol;
                  })
                }
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks5">SOCKS5</option>
              </Select>
            </label>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <label className="space-y-2">
                <span className="text-xs font-medium text-text-secondary">Host</span>
                <TextInput
                  value={config.proxy.host}
                  disabled={!config.proxy.enabled}
                  placeholder="127.0.0.1"
                  onChange={(event) => void updateConfig((draft) => void (draft.proxy.host = event.target.value))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-text-secondary">Port</span>
                <TextInput
                  value={config.proxy.port}
                  disabled={!config.proxy.enabled}
                  placeholder="7890"
                  onChange={(event) => void updateConfig((draft) => void (draft.proxy.port = event.target.value))}
                />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-xs font-medium text-text-secondary">用户名</span>
              <TextInput
                value={config.proxy.username}
                disabled={!config.proxy.enabled}
                onChange={(event) => void updateConfig((draft) => void (draft.proxy.username = event.target.value))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-text-secondary">密码</span>
              <TextInput
                type="password"
                value={config.proxy.password}
                disabled={!config.proxy.enabled}
                onChange={(event) => void updateConfig((draft) => void (draft.proxy.password = event.target.value))}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-medium text-text-secondary">不使用代理的地址或 IP</span>
              <TextInput
                value={config.proxy.bypass}
                disabled={!config.proxy.enabled}
                onChange={(event) => void updateConfig((draft) => void (draft.proxy.bypass = event.target.value))}
              />
            </label>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
