import { Palette, Power, Radio } from "lucide-react";
import { Field, Section, SelectInput, Switch, TextInput } from "../../ui/Form";
import { useConfigStore } from "../../../stores/configStore";
import type { ProxyProtocol, ThemeName } from "../../../types/config";

export function GeneralSettings() {
  const { config, updateConfig } = useConfigStore();

  return (
    <>
      <PageHeader title="常规设置" description="启动、外观、监听和网络代理会直接保存到 config.json。" />
      <Section title="启动" description="首次启动会显示本设置窗口；完成设置后，后续启动默认仅驻留托盘。">
        <Field label="开机启动">
          <Switch checked={config.startup} onChange={(checked) => void updateConfig((draft) => void (draft.startup = checked))} />
        </Field>
        <Field label="启动后仅显示托盘图标" description="第二次及以后启动时不自动弹出设置窗口。">
          <Switch
            checked={config.trayOnlyOnLaunch}
            onChange={(checked) => void updateConfig((draft) => void (draft.trayOnlyOnLaunch = checked))}
          />
        </Field>
      </Section>

      <Section title="外观" description="深色主题为默认主题；透明效果暂时保存配置并预留系统效果接入。">
        <Field label="主题">
          <SelectInput
            value={config.theme}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.theme = event.target.value as ThemeName;
              })
            }
          >
            <option value="light">白色主题</option>
            <option value="dark">黑色主题</option>
            <option value="blue">蓝色主题</option>
          </SelectInput>
        </Field>
        <Field label="界面动效">
          <Switch
            checked={config.animations}
            onChange={(checked) => void updateConfig((draft) => void (draft.animations = checked))}
          />
        </Field>
        <Field label="窗口透明效果" description="TODO: 接入 Windows 窗口材质效果。">
          <Switch
            checked={config.windowTransparency}
            onChange={(checked) => void updateConfig((draft) => void (draft.windowTransparency = checked))}
          />
        </Field>
      </Section>

      <Section title="监听" description="本地 HTTP 服务会优先使用配置端口；端口被占用时自动尝试后续端口。">
        <Field label="剪贴板监听">
          <Switch
            checked={config.clipboardListen}
            onChange={(checked) => void updateConfig((draft) => void (draft.clipboardListen = checked))}
          />
        </Field>
        <Field label="复制文本后自动弹出翻译窗口">
          <Switch
            checked={config.autoPopupAfterCopy}
            onChange={(checked) => void updateConfig((draft) => void (draft.autoPopupAfterCopy = checked))}
          />
        </Field>
        <Field label="监听端口">
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
        </Field>
        <Field label="配置端口" description="写入 config.json 的 listenPort。">
          <TextInput value={config.listenPort} readOnly />
        </Field>
        <Field label="当前实际监听端口" description="成功监听后写回 runtimePort。">
          <TextInput value={config.runtimePort ?? "尚未启动本地服务"} readOnly />
        </Field>
        <Field label="忽略过短文本">
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
        </Field>
      </Section>

      <Section title="网络代理" description="代理配置会被 AI 服务和后续 OCR 插件复用。">
        <Field label="启用网络代理">
          <Switch
            checked={config.proxy.enabled}
            onChange={(checked) => void updateConfig((draft) => void (draft.proxy.enabled = checked))}
          />
        </Field>
        <Field label="代理协议">
          <SelectInput
            value={config.proxy.protocol}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.proxy.protocol = event.target.value as ProxyProtocol;
              })
            }
          >
            <option value="http">http</option>
            <option value="https">https</option>
            <option value="socks5">socks5</option>
          </SelectInput>
        </Field>
        <Field label="代理地址">
          <TextInput
            value={config.proxy.host}
            placeholder="127.0.0.1"
            onChange={(event) => void updateConfig((draft) => void (draft.proxy.host = event.target.value))}
          />
        </Field>
        <Field label="代理端口">
          <TextInput
            value={config.proxy.port}
            placeholder="7890"
            onChange={(event) => void updateConfig((draft) => void (draft.proxy.port = event.target.value))}
          />
        </Field>
        <Field label="用户名">
          <TextInput
            value={config.proxy.username}
            onChange={(event) => void updateConfig((draft) => void (draft.proxy.username = event.target.value))}
          />
        </Field>
        <Field label="密码">
          <TextInput
            type="password"
            value={config.proxy.password}
            onChange={(event) => void updateConfig((draft) => void (draft.proxy.password = event.target.value))}
          />
        </Field>
        <Field label="不使用代理的地址或 IP" alignTop>
          <TextInput
            value={config.proxy.bypass}
            onChange={(event) => void updateConfig((draft) => void (draft.proxy.bypass = event.target.value))}
          />
        </Field>
      </Section>
    </>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
        {title === "常规设置" ? <Power size={20} /> : title === "翻译设置" ? <Palette size={20} /> : <Radio size={20} />}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-text">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}
