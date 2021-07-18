/**
 * These are the device parsers
 * They get selected by the library the user sets on a device
 * and they parse the data so they are properly formatted
 * @author George Tsotsos
 */
 function parseDefaults(report) {
  report.uptime = +report.uptime / 100;
  return report;
}

module.exports = {
  undefined: (report) => parseDefaults(report), // If the library is missing just parse the defaults
  "unifi.switch": (report) => {
    report = parseDefaults(report);
    report.temperature = +report.temperature
    report.fan_status = +report.fan_status
    report.ram = {
      free: (+report.memory_free / 1000 / 1000).toFixed(2),
      total: (+report.memory_total / 1000 / 1000).toFixed(2),
      used: ((+report.memory_total - +report.memory_free) / 1000 / 1000).toFixed(2),
    };
    report.cpu = +report.cpu_usage.spli("(")[1].trim().replace("%)", "");
    return report;
  },
  "unifi.ap": (report) => {
    report = parseDefaults(report);
    report.radio = {
      TxPackets: +report.radio_tx_packets,
      RxPackets: +report.radio_rx_packets
    };
    report.cpu = +report.cpu

    return report;
  },
  idrac: (report) => {
    report = parseDefaults(report);
    report.system_board_inlet_temp = +report.system_board_inlet_temp / 10;
    report.system_board_exhaust_temp = +report.system_board_exhaust_temp / 10;
    report.system_board_power_consumption = +report.system_board_power_consumption
    report.cpus = [{ temp: +report.cpu1_temp / 10 }, { temp: +report.cpu2_temp / 10 }];
    return report;
  },
};
