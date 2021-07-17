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
    report = parseDefaults(report);                                                           // defaults
    report.temperature = parseInt(report.temperature);                                        // '63',
    report.fan_status = parseInt(report.fan_status);                                          // '0',
    report.memory_free = parseInt(report.memory_free);                                        // '119200',
    report.memory_total = parseInt(report.memory_total);                                      // '256252',
    report.cpu_usage = parseFloat(report.cpu_usage.split("(")[1].trim().replace("%)", ""));   // '    5 Secs ( 29.9353%)   60 Secs ( 30.4123%)  300 Secs ( 30.4612%)'
    return report;
  },
  'unifi.ap': (report) => {
    report = parseDefaults(report);                                                           // defaults
    report.radio_rx_packets = parseInt(report.radio_rx_packets);                              // '2492713'
    report.radio_tx_packets = parseInt(report.radio_tx_packets);                              // '69734'
    return report;
  },
  'idrac': (report) => {    
    report = parseDefaults(report);                                                           // defaults
    report.system_board_inlet_temp = parseInt(report.system_board_inlet_temp) / 10;           // '270',
    report.system_board_exhaust_temp = parseInt(report.system_board_exhaust_temp) / 10;       // '420',
    report.system_board_power_consumption = parseInt(report.system_board_power_consumption);  // '98',
    report.cpu1_temp = parseInt(report.cpu1_temp) / 10;                                       // '480',
    report.cpu2_temp = parseInt(report.cpu2_temp) / 10;                                       // '510'
    return report;
  }
}