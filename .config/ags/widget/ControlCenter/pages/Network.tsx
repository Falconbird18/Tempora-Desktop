import AstalNetwork from "gi://AstalNetwork?version=0.1";
import Page from "../Page";
import { App, Gtk, Gdk, Widget } from "astal/gtk3";
import { bind, execAsync, timeout, Variable } from "astal";
import icons from "../../../lib/icons";

export default () => {
  const network = AstalNetwork.get_default();
  const nmClient = network.get_client();
  const { wifi } = AstalNetwork.get_default();

  const hoveredAp = Variable<AstalNetwork.AccessPoint | null>(null);
  const password = Variable("");

  if (wifi == null) {
    return null;
  }

  return (
    <Page
      label={"Network"}
      refresh={() => wifi.scan()}
      scanning={bind(wifi, "scanning")}
    >
      <box
        vertical
        spacing={8}
        className={"control-center__page_scrollable-content"}
      >
        <eventbox
          onClickRelease={(_, event) => {
            console.log("Wi-Fi toggle eventbox clicked.");
            if (event.button !== 1) return;
            if (network.wifi.enabled) {
              network.wifi.enabled = false;
            } else {
              network.wifi.enabled = true;
              network.wifi.scan();
            }
          }}
        >
          <box
            className="control-center__page_item-header"
            setup={(self) => {
              self.toggleClassName("active", wifi.enabled);
              self.hook(wifi, "notify::enabled", () => {
                self.toggleClassName("active", wifi.enabled);
              });
            }}
          >
            <icon icon={bind(wifi, "iconName")} />
            <label label={"Wi-Fi"} hexpand halign={Gtk.Align.START} />
            <switch
              hexpand={false}
              halign={Gtk.Align.END}
              valign={Gtk.Align.CENTER}
              active={bind(wifi, "enabled")}
              onActivate={({ active }) => (network.wifi.enabled = active)}
            />
          </box>
        </eventbox>
        <box vertical spacing={4}>
          {bind(wifi, "accessPoints").as((points) =>
            points.map((ap) => (
              <button
                className="control-center__page_item"
                onEnter={() => {
                  hoveredAp.value = ap;
                  password.value = "";
                }}
                onLeave={() => {
                  timeout(100, () => {
                    if (hoveredAp.value === ap) {
                      hoveredAp.value = null;
                    }
                  });
                }}
              >
                <box>
                  <icon icon={ap.iconName} iconSize={20} />
                  <label label={ap.ssid || ""} />
                  {bind(wifi, "activeAccessPoint").as((activeAp) =>
                    activeAp === ap ? (
                      <button
                        className="primary-button"
                        onClick={async () => {
                          console.log(
                            `Forget button clicked for SSID: ${ap.ssid}`,
                          );
                          try {
                            console.log("Attempting to get connections...");
                            const connections =
                              await nmClient.get_connections_async();

                            const matchingConnection = connections.find(
                              (conn: any) => {
                                try {
                                  const wirelessSetting =
                                    conn.get_setting_wireless();
                                  return (
                                    wirelessSetting &&
                                    wirelessSetting.get_ssid() === ap.ssid
                                  );
                                } catch (e) {
                                  return false;
                                }
                              },
                            );

                            if (matchingConnection) {
                              console.log(
                                `Found matching connection for SSID: ${ap.ssid}. Attempting to delete.`,
                              );
                              await matchingConnection.delete_async();
                              console.log(
                                `Successfully forgot network: ${ap.ssid}`,
                              );
                            } else {
                              console.warn(
                                `Could not find saved connection for SSID: ${ap.ssid} to forget.`,
                              );
                            }
                          } catch (error: any) {
                            console.error(
                              `Failed to forget network ${ap.ssid}:`,
                              error,
                            );
                          } finally {
                            hoveredAp.value = null;
                          }
                        }}
                      >
                        <label label="Forget" />
                      </button>
                    ) : (
                      bind(hoveredAp, "value").as((currentHoveredAp) =>
                        currentHoveredAp === ap ? (
                          <box hexpand halign={Gtk.Align.END} spacing={4}>
                            {ap.security !== "" && ap.security !== "none" && (
                              <entry
                                text={bind(password, "value")}
                                placeholderText="Password"
                                inputType={Gtk.InputPurpose.PASSWORD}
                                widthRequest={120}
                                onChange={(self) =>
                                  (password.value = self.text)
                                }
                              />
                            )}
                            <button
                              className="control-center__page_item-connect-button"
                              onClick={async () => {
                                console.log(
                                  `Connect button clicked for SSID: ${ap.ssid}`,
                                );
                                try {
                                  const Ap = AstalNetwork.AccessPoint;
                                  const Nm = AstalNetwork.NetworkManager;

                                  // Try to find the Wi-Fi device
                                  const devices =
                                    await nmClient.get_devices_async();
                                  const wifiDevice = devices.find(
                                    (dev: any) =>
                                      dev.get_device_type() ===
                                      Nm.DeviceType.WIFI,
                                  );

                                  if (!wifiDevice) {
                                    console.error("No Wi-Fi device found.");
                                    return;
                                  }

                                  // Prepare connection settings
                                  const s_connection =
                                    new Nm.SettingConnection();
                                  s_connection.uuid = Nm.utils_generate_uuid();
                                  s_connection.id = ap.ssid;
                                  s_connection.type = "802-11-wireless";

                                  const s_wireless = new Nm.SettingWireless();
                                  s_wireless.ssid = ap.ssid;
                                  s_wireless.mode = "infrastructure";

                                  const s_ip4 = new Nm.SettingIP4Config();
                                  s_ip4.method = Nm.SettingIP4ConfigMethod.AUTO;

                                  const s_ip6 = new Nm.SettingIP6Config();
                                  s_ip6.method = Nm.SettingIP6ConfigMethod.AUTO;

                                  const settings = [
                                    s_connection,
                                    s_wireless,
                                    s_ip4,
                                    s_ip6,
                                  ];

                                  // Add security settings if required
                                  if (ap.security && ap.security !== "none") {
                                    const s_wireless_security =
                                      new Nm.SettingWirelessSecurity();
                                    s_wireless_security.key_mgmt = "wpa-psk";
                                    s_wireless_security.psk = password.get();
                                    settings.push(s_wireless_security);
                                  }

                                  // Convert settings array to GVariant dictionary expected by add_and_activate_connection_async
                                  const connection_config =
                                    Nm.utils_build_connection(settings);

                                  console.log(
                                    `Attempting to add and activate connection to SSID: ${ap.ssid}`,
                                  );
                                  await nmClient.add_and_activate_connection_async(
                                    connection_config,
                                    wifiDevice,
                                    ap,
                                  );
                                  console.log(
                                    `Successfully attempted to connect to network: ${ap.ssid}`,
                                  );
                                } catch (error: any) {
                                  console.error(
                                    `Failed to connect to network ${ap.ssid}:`,
                                    error,
                                  );
                                } finally {
                                  password.value = "";
                                  hoveredAp.value = null;
                                }
                              }}
                            >
                              <label label="Connect" />
                            </button>
                          </box>
                        ) : (
                          <icon
                            visible={bind(wifi, "activeAccessPoint").as(
                              (aap) => aap === ap,
                            )}
                            icon={icons.ui.tick}
                            hexpand
                            halign={Gtk.Align.END}
                          />
                        ),
                      )
                    ),
                  )}
                </box>
              </button>
            )),
          )}
        </box>
      </box>
    </Page>
  );
};
