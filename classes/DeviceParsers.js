/**
 * These are the device parsers
 * They get selected by the library the user sets on a device
 * and they parse the data so they are properly formatted
 * @author George Tsotsos
 */
function parseDefaults(report){
  report.uptime = parseInt(parseInt(report.uptime) / 100);
  return report;
}

module.exports = {
  'undefined': (report) => parseDefaults(report), // If the library is missing just parse the defaults
  'unifi.switch': (report) => {     
    report = parseDefaults(report);
    report.temperature = parseInt(report.temperature);
    report.fan_status = parseInt(report.fan_status);
    report.ram = {
      free: (parseInt(report.memory_free) / 1000 / 1000).toFixed(2),
      total:  (parseInt(report.memory_total) / 1000 / 1000).toFixed(2),
      used: ((parseInt(report.memory_total) - parseInt(report.memory_free))/ 1000 / 1000).toFixed(2),
    }
    report.cpu = parseInt(report.cpu_usage.split("(")[1].trim().replace("%)", ""));
    return report;
  },
  'unifi.ap': (report) => {
    report = parseDefaults(report);
    report.radio = {
      TxPackets: parseInt(report.radio_tx_packets),
      RxPackets: parseInt(report.radio_rx_packets),
    }
    return report;
  },
  'idrac': (report) => {    
    report = parseDefaults(report);
    report.system_board_inlet_temp = parseInt(report.system_board_inlet_temp) / 10;
    report.system_board_exhaust_temp = parseInt(report.system_board_exhaust_temp) / 10;
    report.system_board_power_consumption = parseInt(report.system_board_power_consumption);
    report.cpus = [
      {temp: parseInt(report.cpu1_temp) / 10},
      {temp: parseInt(report.cpu2_temp) / 10}
    ]
    return report;
  }
}