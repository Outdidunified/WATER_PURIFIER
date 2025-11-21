import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart' as ph;
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart' as fbs;
import 'package:get/get.dart';
import 'package:barcode_scan2/barcode_scan2.dart' as bs;
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'plan_config_page.dart';

class OrderTypeConstants {
  static const String installation = 'Installation';
  static const String recharge = 'Recharge';

  static Color getOrderTypeColor(String? type) {
    if (type == null) return Colors.grey;
    final lowerType = type.toLowerCase();
    if (lowerType.contains('installation')) return Colors.green;
    if (lowerType.contains('recharge')) return Colors.blue;
    return Colors.grey;
  }

  static IconData getOrderTypeIcon(String? type) {
    if (type == null) return Icons.help;
    final lowerType = type.toLowerCase();
    if (lowerType.contains('installation')) return Icons.build;
    if (lowerType.contains('recharge')) return Icons.autorenew;
    return Icons.help;
  }
}

class DeviceSetupPage extends StatefulWidget {
  const DeviceSetupPage({super.key});

  @override
  State<DeviceSetupPage> createState() => _DeviceSetupPageState();
}

class _DeviceSetupPageState extends State<DeviceSetupPage> with TickerProviderStateMixin {
  Order? _currentOrder;
  List<Order> _setupRequiredOrders = [];
  bool _isOrderListMode = true;
  String _macId = '';
  bool _macIdStored = false;
  bool _isStoringMacId = false;
  bool _showMacIdInput = false;
  bool _isScanning = false;
  bool _isBleConnecting = false;
  String? _connectingDeviceId;
  String? _connectedDeviceId;
  String? _connectedDeviceName;
  List<ScanResult> _bleDevices = [];
  List<fbs.BluetoothDiscoveryResult> _classicDevices = [];
  BluetoothDevice? _connectedDevice;
  BluetoothCharacteristic? _bleWriteChar;
  bool _bleEnabled = false;
  String _connectionType = '';
  fbs.BluetoothConnection? _bluetoothConnection;
  StreamSubscription<List<ScanResult>>? _bleScanSubscription;
  StreamSubscription<fbs.BluetoothDiscoveryResult>? _classicDiscoverySubscription;
  StreamSubscription<List<int>>? _notifySubscription;
  StreamSubscription<void>? _orderSubscription;
  String _bleDataBuffer = '';
  String _classicDataBuffer = '';
  SharedPreferences? _prefs;
  bool _isDeviceVerified = false;
  Completer<bool>? _verificationCompleter;
  Completer<bool>? _ackCompleter;
  DateTime? _lastBluetoothEnableAttempt;
  bool _isWaitingForBluetoothEnable = false;

  final TextEditingController _macIdController = TextEditingController();
  final SubscriptionController subscriptionController = Get.find<SubscriptionController>();
  final SessionController sessionController = Get.find<SessionController>();

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadInitialData);
  }

  @override
  void dispose() {
    _bleScanSubscription?.cancel();
    _classicDiscoverySubscription?.cancel();
    _notifySubscription?.cancel();
    _orderSubscription?.cancel();
    _macIdController.dispose();
    _bluetoothConnection?.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    await _initPreferences();
    _setupOrderListener();

    // Start automatic scanning when entering device setup page
    _startAutomaticScanning();
  }

  Future<void> _initPreferences() async {
    try {
      _prefs = await SharedPreferences.getInstance();
    } catch (e) {
      debugPrint('Error initializing preferences: $e');
    }
  }

  void _setupOrderListener() {
    _updateSetupRequiredOrders();
    _orderSubscription?.cancel();
    _orderSubscription = subscriptionController.orders.listen((_) {
      if (!mounted) return;
      _updateSetupRequiredOrders();
    });
  }

  void _updateSetupRequiredOrders() {
    try {
      final allOrders = subscriptionController.orders;
      _setupRequiredOrders = allOrders
          .where((order) {
            if (order.orderType == null) return false;
            if (order.modelType == null) return false;

            final orderType = order.orderType!.toLowerCase();
            final modelType = order.modelType!.toLowerCase();

            if (orderType.contains('recharge') && modelType.contains('smart')) {
              if (order.isSetup == true) return false;
              return order.paymentStatus.toLowerCase() == 'completed' &&
                  order.orderStatus.toLowerCase() != 'completed';
            }

            return false;
          })
          .toList();

      if (_setupRequiredOrders.isEmpty) {
        setState(() {
          _currentOrder = null;
          _setupRequiredOrders = [];
          _isOrderListMode = true;
          _macId = '';
          _macIdStored = false;
          _macIdController.clear();
        });
        return;
      }

      setState(() {
        _setupRequiredOrders = _setupRequiredOrders;
        if (_currentOrder == null) {
          _isOrderListMode = true;
        }
      });
    } catch (e) {
      debugPrint('Error updating setup required orders: $e');
    }
  }

  void _selectOrderFromList(Order order) {
    try {
      final storedMacId = order.macId;
      setState(() {
        _currentOrder = order;
        _isOrderListMode = false;
        if (storedMacId != null && storedMacId.isNotEmpty) {
          _macId = storedMacId;
          _macIdStored = true;
          _macIdController.text = storedMacId;
        } else {
          _macIdStored = false;
          _macId = '';
          _macIdController.clear();
        }
      });

      // Start automatic scanning when entering setup mode
      _startAutomaticScanning();

      // If we have a stored MAC ID, automatically start scanning and attempt connection
      if (storedMacId != null && storedMacId.isNotEmpty) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            _autoConnectToStoredDevice(storedMacId);
          }
        });
      }
    } catch (e) {
      debugPrint('Error selecting order: $e');
    }
  }

  void _backToOrderList() {
    // Disconnect device when going back to order list
    _disconnectCurrentDevice();

    setState(() {
      _isOrderListMode = true;
      _currentOrder = null;
      _macId = '';
      _macIdStored = false;
      _macIdController.clear();
      _bleDevices.clear();
      _classicDevices.clear();
      _isScanning = false;
      _isBleConnecting = false;
    });
  }

  Future<void> _disconnectCurrentDevice() async {
    try {
      if (_connectionType == 'BLE' && _connectedDevice != null) {
        await _connectedDevice!.disconnect();
        debugPrint('BLE device disconnected');
      } else if (_connectionType == 'Classic' && _bluetoothConnection != null) {
        await _bluetoothConnection!.close();
        debugPrint('Classic BT device disconnected');
      }

      // Clear connection state
      setState(() {
        _connectedDeviceId = null;
        _connectedDeviceName = null;
        _connectedDevice = null;
        _bleWriteChar = null;
        _bluetoothConnection = null;
        _connectionType = '';
        _isDeviceVerified = false;
      });

      // Cancel subscriptions
      _notifySubscription?.cancel();
      _notifySubscription = null;
    } catch (e) {
      debugPrint('Error disconnecting device: $e');
    }
  }

  int _extractTotalWaterLimit() {
    final capacity = _currentOrder?.selectedPlan.capacity;
    if (capacity != null && capacity.isNotEmpty) {
      try {
        return int.parse(capacity);
      } catch (e) {
        debugPrint('Error parsing capacity: $e');
      }
    }
    return 150;
  }

  int _extractDurationDays() {
    final durationStr = _currentOrder?.selectedDuration.durationTimeLimit;
    if (durationStr != null && durationStr.isNotEmpty) {
      try {
        final match = RegExp(r'(\d+)').firstMatch(durationStr);
        if (match != null) {
          return int.parse(match.group(1) ?? '28');
        }
      } catch (e) {
        debugPrint('Error parsing duration: $e');
      }
    }
    return 28;
  }

  String _calculateEndDate() {
    final startDate = DateTime.now();
    final durationDays = _extractDurationDays();
    final endDate = startDate.add(Duration(days: durationDays));
    return endDate.toIso8601String().split('T')[0];
  }

  Future<void> _callStoreBleAckApi(String macId, bool isConfigSuccess,
      {bool isClassic = false}) async {
    try {
      final totalWaterLimit = _extractTotalWaterLimit();
      final endDate = _calculateEndDate();
      final startDateStr = DateTime.now().toIso8601String().split('T')[0];

      final Map<String, dynamic> payload = {
        "wp_device_id": _currentOrder?.wpDeviceId ?? '',
        "mac_id": macId,
        "status": isConfigSuccess ? 1 : 0,
        "timestamp": DateTime.now().toIso8601String(),
        "user_id": sessionController.userId.value,
        "plan_config": {
          "totalWaterLimit": totalWaterLimit,
          "startDate": startDateStr,
          "endDate": endDate,
          "renewal": 0,
          "connectivity": {
            "ble": isClassic ? 0 : 1,
            "wifi": 0,
            "4g": 0,
            "ethernet": 0
          }
        }
      };

      debugPrint('Calling storeBleAck API with payload: ${jsonEncode(payload)}');
      CustomSnackbar.showSuccess(message: 'Device setup completed successfully');
    } catch (e) {
      debugPrint('Error calling storeBleAck API: $e');
    }
  }

  Future<void> _scanMacId() async {
    try {
      setState(() => _isStoringMacId = true);
      final result = await bs.BarcodeScanner.scan();
      if (result.rawContent.isNotEmpty) {
        setState(() => _macId = result.rawContent);
        _macIdController.text = _macId;
      }
    } catch (e) {
      debugPrint('Error scanning MAC ID: $e');
      CustomSnackbar.showError(message: 'Error scanning MAC ID');
    } finally {
      setState(() => _isStoringMacId = false);
    }
  }

  Future<void> _setupBleConnection() async {
    if (_macId.isEmpty) {
      CustomSnackbar.showError(message: 'Please enter a MAC ID');
      return;
    }
    try {
      setState(() => _isStoringMacId = true);
      await _prefs?.setString('mac_id_${_currentOrder?.id}', _macId);
      setState(() {
        _macIdStored = true;
        _showMacIdInput = false;
      });
      CustomSnackbar.showSuccess(message: 'MAC ID saved successfully');
    } catch (e) {
      debugPrint('Error saving MAC ID: $e');
      CustomSnackbar.showError(message: 'Error saving MAC ID');
    } finally {
      setState(() => _isStoringMacId = false);
    }
  }

  Future<void> _requestPermissionsAndScan() async {
    if (Platform.isAndroid) {
      final status = await Permission.bluetooth.request();
      if (!status.isGranted) {
        CustomSnackbar.showError(message: 'Bluetooth permission required');
        return;
      }
    }
    _startScanning();
  }

  Future<void> _autoConnectToStoredDevice(String targetMacId) async {
    try {
      // Check if Bluetooth is enabled
      final adapterState = await FlutterBluePlus.adapterState.first;
      if (adapterState != BluetoothAdapterState.on) {
        // Don't show dialog if we just attempted to enable Bluetooth (within last 5 seconds)
        if (_lastBluetoothEnableAttempt != null &&
            DateTime.now().difference(_lastBluetoothEnableAttempt!).inSeconds < 5) {
          // Wait a bit and try again
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              _autoConnectToStoredDevice(targetMacId);
            }
          });
          return;
        }
        if (mounted) {
          _showEnableBluetoothDialog();
        }
        return;
      }

      // Request permissions
      if (Platform.isAndroid) {
        final status = await Permission.bluetooth.request();
        if (!status.isGranted) {
          CustomSnackbar.showError(message: 'Bluetooth permission required');
          return;
        }
      }

      // Start scanning
      setState(() => _isScanning = true);
      _bleDevices.clear();
      _classicDevices.clear();

      await FlutterBluePlus.startScan(timeout: const Duration(seconds: 15));
      _bleScanSubscription = FlutterBluePlus.onScanResults.listen((results) {
        setState(() {
          _bleDevices = results;
        });

        // Check if target device is found
        for (final result in results) {
          final deviceId = '${result.device.remoteId}';
          if (deviceId.toLowerCase() == targetMacId.toLowerCase()) {
            debugPrint('Found target BLE device: $deviceId');
            FlutterBluePlus.stopScan();
            _bleScanSubscription?.cancel();
            setState(() => _isScanning = false);
            _connectToBleDevice(result.device);
            return;
          }
        }
      });

      // Also check Classic Bluetooth devices
      fbs.FlutterBluetoothSerial.instance.startDiscovery().listen((result) {
        setState(() {
          if (!_classicDevices.any((d) => d.device.address == result.device.address)) {
            _classicDevices.add(result);
          }
        });

        // Check if target device is found
        final deviceId = result.device.address;
        if (deviceId.toLowerCase() == targetMacId.toLowerCase()) {
          debugPrint('Found target Classic BT device: $deviceId');
          fbs.FlutterBluetoothSerial.instance.cancelDiscovery();
          _classicDiscoverySubscription?.cancel();
          setState(() => _isScanning = false);
          _connectToClassicDevice(result);
          return;
        }
      });

      // Stop scanning after timeout
      await Future.delayed(const Duration(seconds: 15));
      await FlutterBluePlus.stopScan();
      fbs.FlutterBluetoothSerial.instance.cancelDiscovery();
      _bleScanSubscription?.cancel();
      _classicDiscoverySubscription?.cancel();
      setState(() => _isScanning = false);

      // If device not found, show message
      if (_connectedDeviceId == null) {
        CustomSnackbar.showError(message: 'Device with MAC ID $targetMacId not found');
      }
    } catch (e) {
      debugPrint('Error in auto-connect: $e');
      setState(() => _isScanning = false);
      CustomSnackbar.showError(message: 'Error connecting to device');
    }
  }

  void _showEnableBluetoothDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 250),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.bluetooth,
                  size: 48,
                  color: Colors.blue,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Enable Bluetooth',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Bluetooth is required to scan and connect to devices. Please enable Bluetooth to continue.',
                  style: TextStyle(fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () async {
                        _lastBluetoothEnableAttempt = DateTime.now();
                        _isWaitingForBluetoothEnable = true;
                        Navigator.of(context, rootNavigator: true).pop();
                        // Small delay to ensure dialog is fully closed
                        await Future.delayed(const Duration(milliseconds: 100));
                        // Try to show system Bluetooth enable dialog
                        try {
                          final result = await fbs.FlutterBluetoothSerial.instance.requestEnable();
                          if (result == true) {
                            // Bluetooth was enabled successfully
                            _isWaitingForBluetoothEnable = false;
                            Future.delayed(const Duration(seconds: 1), () {
                              if (mounted) {
                                _startAutomaticScanning();
                              }
                            });
                          } else {
                            // User denied or failed
                            _isWaitingForBluetoothEnable = false;
                            CustomSnackbar.showError(message: 'Bluetooth permission required to scan devices.');
                          }
                        } catch (e) {
                          debugPrint('Error requesting Bluetooth enable: $e');
                          // Fallback: try FlutterBluePlus
                          try {
                            await FlutterBluePlus.turnOn();
                            Future.delayed(const Duration(seconds: 1), () {
                              if (mounted) {
                                _startAutomaticScanning();
                              }
                            });
                          } catch (e2) {
                            debugPrint('Error turning on Bluetooth: $e2');
                            CustomSnackbar.showError(message: 'Please enable Bluetooth manually in your device settings.');
                            _checkBluetoothStateAfterSettings();
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        textStyle: const TextStyle(fontSize: 12),
                        minimumSize: const Size(80, 32),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.zero,
                        ),
                      ),
                      child: const Text('Enable'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _checkBluetoothStateAfterSettings() {
    // Check Bluetooth state every 2 seconds for up to 30 seconds
    int checkCount = 0;
    const maxChecks = 15;

    Timer.periodic(const Duration(seconds: 2), (timer) async {
      checkCount++;
      try {
        final adapterState = await FlutterBluePlus.adapterState.first;
        if (adapterState == BluetoothAdapterState.on) {
          timer.cancel();
          if (mounted) {
            _isWaitingForBluetoothEnable = false;
            // Force a rebuild to dismiss any lingering dialogs
            setState(() {});
            _startAutomaticScanning();
          }
          return;
        }
      } catch (e) {
        debugPrint('Error checking Bluetooth state: $e');
      }

      if (checkCount >= maxChecks) {
        timer.cancel();
        _isWaitingForBluetoothEnable = false;
      }
    });
  }

  Future<void> _startAutomaticScanning() async {
    if (_isScanning) return; // Already scanning

    // Check if Bluetooth is enabled
    final adapterState = await FlutterBluePlus.adapterState.first;
    if (adapterState != BluetoothAdapterState.on) {
      // Don't show dialog if we're currently waiting for Bluetooth to be enabled
      // or if we just attempted to enable Bluetooth (within last 10 seconds)
      if (_isWaitingForBluetoothEnable ||
          (_lastBluetoothEnableAttempt != null &&
           DateTime.now().difference(_lastBluetoothEnableAttempt!).inSeconds < 10)) {
        // Wait a bit and try again
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            _startAutomaticScanning();
          }
        });
        return;
      }
      if (mounted) {
        _isWaitingForBluetoothEnable = true;
        _showEnableBluetoothDialog();
      }
      return;
    }

    try {
      if (mounted) {
        setState(() => _isScanning = true);
      }
      _bleDevices.clear();
      _classicDevices.clear();

      await FlutterBluePlus.startScan(timeout: const Duration(seconds: 10));
      _bleScanSubscription = FlutterBluePlus.onScanResults.listen((results) {
        if (mounted) {
          setState(() {
            _bleDevices = results;
          });
        }
      });

      fbs.FlutterBluetoothSerial.instance.startDiscovery().listen((result) {
        if (mounted) {
          setState(() {
            if (!_classicDevices.any((d) => d.device.address == result.device.address)) {
              _classicDevices.add(result);
            }
          });
        }
      });

      await Future.delayed(const Duration(seconds: 10));
      await FlutterBluePlus.stopScan();
      _bleScanSubscription?.cancel();
      if (mounted) {
        setState(() => _isScanning = false);
      }
    } catch (e) {
      debugPrint('Error scanning devices: $e');
      CustomSnackbar.showError(message: 'Error scanning devices');
      if (mounted) {
        setState(() => _isScanning = false);
      }
    }
  }

  Future<void> _startScanning() async {
    try {
      setState(() => _isScanning = true);
      _bleDevices.clear();
      _classicDevices.clear();

      await FlutterBluePlus.startScan(timeout: const Duration(seconds: 10));
      _bleScanSubscription = FlutterBluePlus.onScanResults.listen((results) {
        setState(() {
          _bleDevices = results;
        });
      });

      fbs.FlutterBluetoothSerial.instance.startDiscovery().listen((result) {
        setState(() {
          if (!_classicDevices.any((d) => d.device.address == result.device.address)) {
            _classicDevices.add(result);
          }
        });
      });

      await Future.delayed(const Duration(seconds: 10));
      await FlutterBluePlus.stopScan();
      _bleScanSubscription?.cancel();
      setState(() => _isScanning = false);
    } catch (e) {
      debugPrint('Error scanning devices: $e');
      CustomSnackbar.showError(message: 'Error scanning devices');
      setState(() => _isScanning = false);
    }
  }

  Future<void> _connectToBleDevice(BluetoothDevice device) async {
    // Check if Bluetooth is enabled before attempting connection
    final adapterState = await FlutterBluePlus.adapterState.first;
    if (adapterState != BluetoothAdapterState.on) {
      // Don't show dialog if we just attempted to enable Bluetooth (within last 5 seconds)
      if (_lastBluetoothEnableAttempt != null &&
          DateTime.now().difference(_lastBluetoothEnableAttempt!).inSeconds < 5) {
        return; // Just return without showing dialog
      }
      if (mounted) {
        _showEnableBluetoothDialog();
      }
      return;
    }

    setState(() {
      _isBleConnecting = true;
      _connectingDeviceId = '${device.remoteId}';
      _isDeviceVerified = false;
    });
    try {
      await device.connect();
      _connectedDevice = device;

      await _findAndStoreBleWriteChar(device);
      await _setupBleNotificationListener(device);

      // Small delay to ensure notifications are set up
      await Future.delayed(const Duration(milliseconds: 1000));

      // Wait for device verification (ACK response)
      _verificationCompleter = Completer<bool>();
      _ackCompleter = Completer<bool>();
      _bleDataBuffer = ''; // Reset buffer

      // Send verification payload like classic Bluetooth
      // Use device remoteId for verification
      final String deviceMacId = device.remoteId.toString();
      final Map<String, dynamic> verificationPayload = {
        "wp_device_id": _currentOrder?.wpDeviceId ?? '',
        "mac_id": _normalizeMac(deviceMacId),
        "timestamp": DateTime.now().toIso8601String(),
      };

      debugPrint('Sending verification payload: wp_device_id=${verificationPayload["wp_device_id"]}, mac_id=${verificationPayload["mac_id"]}, timestamp=${verificationPayload["timestamp"]}');
      if (_bleWriteChar != null) {
        final data = utf8.encode(jsonEncode(verificationPayload));
        debugPrint('Writing ${data.length} bytes to BLE characteristic');
        await _bleWriteChar!.write(data);
        debugPrint('BLE write completed');
      } else {
        debugPrint('⚠️ No BLE write characteristic available');
        await device.disconnect();
        return;
      }

      // Small delay after write to allow device to respond
      await Future.delayed(const Duration(milliseconds: 500));

      // Try to read response from the characteristic if it supports read
      if (_bleWriteChar!.properties.read) {
        try {
          final response = await _bleWriteChar!.read();
          final chunk = utf8.decode(response);
          debugPrint('BLE Read response: $chunk');
          _handleBleNotification(response); // Treat as notification data
        } catch (e) {
          debugPrint('Error reading BLE char: $e');
        }
      }

      bool verified = await _verificationCompleter!.future.timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          debugPrint('⚠️ Device verification timeout');
          CustomSnackbar.showError(message: 'Device verification timeout');
          Future.microtask(() => device.disconnect());
          return false;
        },
      );

      if (!verified) {
        await device.disconnect();
        return;
      }

      // Set connected status only after verification
      final deviceId = '${device.remoteId}';
      setState(() {
        _connectionType = 'BLE';
        _connectedDeviceId = deviceId;
        _connectedDeviceName = device.name.isNotEmpty ? device.name : 'BLE Device';
        _isDeviceVerified = true;
      });

      // Wait for ACK response (max 10 seconds)
      bool ackReceived = await _ackCompleter!.future.timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          debugPrint('⚠️ ACK response timeout');
          CustomSnackbar.showError(message: 'Device ACK response timeout');
          Future.microtask(() => device.disconnect());
          return false;
        },
      );

      if (!ackReceived) {
        await device.disconnect();
        return;
      }

      if (mounted && _currentOrder != null) {
        Get.to(() => PlanConfigPage(
          order: _currentOrder!,
          macId: _normalizeMac(_connectedDeviceId!),
          deviceName: _connectedDeviceName ?? 'BLE Device',
          isClassic: false,
          bleWriteChar: _bleWriteChar,
          classicConnection: null,
        ));
      }
    } catch (e) {
      debugPrint('Error connecting to BLE device: $e');
      CustomSnackbar.showError(message: 'Error connecting to BLE device');
      try {
        await device.disconnect();
      } catch (_) {}
    } finally {
      setState(() {
        _isBleConnecting = false;
        _connectingDeviceId = null;
      });
    }
  }

  Future<void> _sendVerificationPayload({
    required bool isClassic,
    fbs.BluetoothConnection? classicConnection,
    String? deviceAddress,
  }) async {
    try {
      final verificationPayload = {
        "wp_device_id": _currentOrder?.wpDeviceId ?? '',
        "mac_id": deviceAddress != null ? _normalizeMac(deviceAddress) : _macId,
        "timestamp": DateTime.now().toIso8601String(),
      };

      final payloadJson = jsonEncode(verificationPayload);
      debugPrint('Sending verification payload: $payloadJson');

      if (isClassic) {
        if (classicConnection != null) {
          classicConnection.output.add(utf8.encode('$payloadJson\n'));
          await classicConnection.output.allSent;
          debugPrint('✓ Verification payload sent via Classic BT');
        }
      }
    } catch (e) {
      debugPrint('Error sending verification payload: $e');
    }
  }

  Future<void> _findAndStoreBleWriteChar(BluetoothDevice device) async {
    try {
      final services = await device.discoverServices();

      // First try any write characteristic
      for (var service in services) {
        for (var characteristic in service.characteristics) {
          if (characteristic.properties.write) {
            _bleWriteChar = characteristic;
            debugPrint('✓ Found BLE write characteristic: ${characteristic.uuid}');
            return;
          }
        }
      }
      debugPrint('⚠️ No write characteristic found');
    } catch (e) {
      debugPrint('Error finding BLE write characteristic: $e');
    }
  }

  Future<void> _setupBleNotificationListener(BluetoothDevice device) async {
    try {
      final services = await device.discoverServices();

      // First try any notify characteristic
      for (var service in services) {
        for (var characteristic in service.characteristics) {
          if (characteristic.properties.notify) {
            await characteristic.setNotifyValue(true);
            _notifySubscription?.cancel();
            _notifySubscription = characteristic.onValueReceived.listen((data) {
              _handleBleNotification(data);
            });
            debugPrint('✓ Subscribed to BLE notifications on characteristic: ${characteristic.uuid}');
            return;
          }
        }
      }
      debugPrint('⚠️ No notify characteristic found');
    } catch (e) {
      debugPrint('Error setting up BLE notification listener: $e');
    }
  }

  void _handleBleNotification(List<int> data) {
    try {
      final chunk = utf8.decode(data);
      debugPrint('✓ BLE Data Received: $chunk');
      _bleDataBuffer += chunk;

      while (_bleDataBuffer.contains('\n')) {
        final index = _bleDataBuffer.indexOf('\n');
        final line = _bleDataBuffer.substring(0, index).trim();
        _bleDataBuffer = _bleDataBuffer.substring(index + 1);

        // Try to parse as JSON for ACK response
        try {
          final jsonData = jsonDecode(line);
          // Check if this is device info message
          if (jsonData.containsKey('mac_id') &&
              jsonData.containsKey('wp_device_id')) {
            if (_validateDeviceInfo(jsonData)) {
              setState(() => _isDeviceVerified = true);
              if (!_verificationCompleter!.isCompleted) {
                _verificationCompleter!.complete(true);
              }
            } else {
              if (!_verificationCompleter!.isCompleted) {
                _verificationCompleter!.complete(false);
              }
            }
          }

          // Check if this is ACK message
          if (jsonData.containsKey('status')) {
            if (_handleAckResponse(jsonData)) {
              if (!_ackCompleter!.isCompleted) {
                _ackCompleter!.complete(true);
              }
            } else {
              if (!_ackCompleter!.isCompleted) {
                _ackCompleter!.complete(false);
              }
            }
          }
        } catch (e) {
          debugPrint('Error parsing JSON: $e');
        }
      }

      // If buffer doesn't contain \n but has data, try to parse as complete JSON
      if (_bleDataBuffer.isNotEmpty && !_bleDataBuffer.contains('\n')) {
        try {
          final jsonData = jsonDecode(_bleDataBuffer.trim());
          // Check if this is device info message
          if (jsonData.containsKey('mac_id') &&
              jsonData.containsKey('wp_device_id')) {
            if (_validateDeviceInfo(jsonData)) {
              setState(() => _isDeviceVerified = true);
              if (!_verificationCompleter!.isCompleted) {
                _verificationCompleter!.complete(true);
              }
            } else {
              if (!_verificationCompleter!.isCompleted) {
                _verificationCompleter!.complete(false);
              }
            }
          }

          // Check if this is ACK message
          if (jsonData.containsKey('status')) {
            if (_handleAckResponse(jsonData)) {
              if (!_ackCompleter!.isCompleted) {
                _ackCompleter!.complete(true);
              }
            } else {
              if (!_ackCompleter!.isCompleted) {
                _ackCompleter!.complete(false);
              }
            }
            _bleDataBuffer = ''; // Clear buffer
          }
        } catch (e) {
          // Not a complete JSON yet, keep in buffer
        }
      }
    } catch (e) {
      debugPrint('Error handling BLE notification: $e');
    }
  }

  Future<void> _connectToClassicDevice(fbs.BluetoothDiscoveryResult result) async {
    // Check if Bluetooth is enabled before attempting connection
    final adapterState = await FlutterBluePlus.adapterState.first;
    if (adapterState != BluetoothAdapterState.on) {
      // Don't show dialog if we just attempted to enable Bluetooth (within last 5 seconds)
      if (_lastBluetoothEnableAttempt != null &&
          DateTime.now().difference(_lastBluetoothEnableAttempt!).inSeconds < 5) {
        return; // Just return without showing dialog
      }
      if (mounted) {
        _showEnableBluetoothDialog();
      }
      return;
    }

    setState(() {
      _isBleConnecting = true;
      _connectingDeviceId = result.device.address;
      _isDeviceVerified = false;
    });

    try {
      final connection = await fbs.BluetoothConnection.toAddress(result.device.address);
      _bluetoothConnection = connection;

      setState(() {
        _connectionType = 'Classic';
        _connectedDeviceId = result.device.address;
        _connectedDeviceName = result.device.name ?? 'Classic Device';
      });

      connection.input?.listen(_handleClassicData).onDone(() {
        debugPrint('Classic device disconnected');
      });

      // Send verification payload to device
      await _sendVerificationPayload(isClassic: true, classicConnection: connection, deviceAddress: result.device.address);

      _verificationCompleter = Completer<bool>();
      _ackCompleter = Completer<bool>();

      bool verified = await _verificationCompleter!.future.timeout(
        const Duration(seconds: 15),
        onTimeout: () {
          debugPrint('⚠️ Device verification timeout');
          CustomSnackbar.showError(message: 'Device verification timeout');
          return false;
        },
      );

      if (!verified) {
        await _bluetoothConnection?.close();
        setState(() {
          _connectedDeviceId = null;
          _connectedDeviceName = null;
          _bluetoothConnection = null;
          _connectionType = '';
        });
        return;
      }

      setState(() => _isDeviceVerified = true);

      bool ackReceived = await _ackCompleter!.future.timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          debugPrint('⚠️ ACK response timeout');
          CustomSnackbar.showError(message: 'Device ACK response timeout');
          return false;
        },
      );

      if (!ackReceived) {
        await _bluetoothConnection?.close();
        setState(() {
          _connectedDeviceId = null;
          _connectedDeviceName = null;
          _bluetoothConnection = null;
          _connectionType = '';
          _isDeviceVerified = false;
        });
        return;
      }

      if (mounted && _currentOrder != null) {
        Get.to(() => PlanConfigPage(
          order: _currentOrder!,
          macId: _normalizeMac(_connectedDeviceId!),
          deviceName: _connectedDeviceName ?? 'Classic Device',
          isClassic: true,
          bleWriteChar: null,
          classicConnection: _bluetoothConnection,
        ));
      }
    } catch (e) {
      debugPrint('Error connecting to Classic device: $e');
      CustomSnackbar.showError(message: 'Error connecting to device');
    } finally {
      setState(() {
        _isBleConnecting = false;
        _connectingDeviceId = null;
      });
    }
  }

  void _handleClassicData(Uint8List data) {
    try {
      final chunk = utf8.decode(data);
      debugPrint('✓ Classic BT Data Received: $chunk');
      _classicDataBuffer += chunk;
      while (_classicDataBuffer.contains('\n')) {
        final index = _classicDataBuffer.indexOf('\n');
        final line = _classicDataBuffer.substring(0, index).trim();
        _classicDataBuffer = _classicDataBuffer.substring(index + 1);

        // Try to parse as JSON for ACK response
        try {
          final jsonData = jsonDecode(line);
          if (jsonData.containsKey('status')) {
            debugPrint('✓ ACK response received: $jsonData');
            final isValid = _handleAckResponse(jsonData);

            if (!_verificationCompleter!.isCompleted) {
              _verificationCompleter!.complete(isValid);
            }

            if (!_ackCompleter!.isCompleted) {
              _ackCompleter!.complete(isValid);
            }
          } else if (jsonData.containsKey('mac_id') && jsonData.containsKey('wp_device_id') && !jsonData.containsKey('status')) {
            // This is device info response (verification)
            if (_validateDeviceInfo(jsonData)) {
              setState(() => _isDeviceVerified = true);
              if (!_verificationCompleter!.isCompleted) {
                _verificationCompleter!.complete(true);
              }
            } else {
              if (!_verificationCompleter!.isCompleted) {
                _verificationCompleter!.complete(false);
              }
            }
          }
        } catch (e) {
          debugPrint('Error parsing JSON: $e');
        }
      }
    } catch (e) {
      debugPrint('Error handling Classic BT data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isOrderListMode) {
      return _buildOrderListView();
    } else {
      return _buildSetupView();
    }
  }

  Widget _buildOrderListView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Device Setup', style: TextStyle(
          fontWeight: FontWeight.w500,
          color: Colors.blue,
          fontSize: 16,
        ),
        ),
        leading: const Icon(Icons.devices, color: Colors.blue),
        backgroundColor: Colors.white,
        elevation: 0,
        shadowColor: Colors.grey.withOpacity(0.1),
        surfaceTintColor: Colors.transparent,
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(
            color: Colors.grey.withOpacity(0.1),
            height: 1.0,
          ),
        ),
      ),
      body: _setupRequiredOrders.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    sessionController.isSubscribed.value
                        ? (subscriptionController.orders.isNotEmpty
                            ? Icons.devices
                            : Icons.check_circle)
                        : Icons.subscriptions,
                    size: 64,
                    color: sessionController.isSubscribed.value
                        ? (subscriptionController.orders.isNotEmpty
                            ? Colors.grey[400]
                            : Colors.green[300])
                        : Colors.orange[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    sessionController.isSubscribed.value
                        ? (subscriptionController.orders.isNotEmpty
                            ? 'No devices found to setup'
                            : 'All devices are set up')
                        : 'No active subscription',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                    textAlign: TextAlign.center,
                  ),
                  if (sessionController.isSubscribed.value && subscriptionController.orders.isNotEmpty) ...[
                    const SizedBox(height: 8),

                  ] else if (!sessionController.isSubscribed.value) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Purchase a plan to set up your devices',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  color: Colors.blue.shade50,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.info, color: Colors.blue, size: 20),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'These are the devices you need to renew yourself.Complete each setup so your service stays active.',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.black87),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _setupRequiredOrders.length,
                    itemBuilder: (context, index) {
                      final order = _setupRequiredOrders[index];
                      final orderType = order.orderType ?? 'Unknown';
                      final color = OrderTypeConstants.getOrderTypeColor(orderType);
                      final icon = OrderTypeConstants.getOrderTypeIcon(orderType);

                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 6),
                        elevation: 1,
                        color: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: InkWell(
                          onTap: () => _selectOrderFromList(order),
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            child: Row(
                              children: [
                                Container(
                                  width: 3,
                                  height: 60,
                                  decoration: BoxDecoration(
                                    color: color,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Customer name
                                      Text(
                                        order.deliveryAddress.name,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      // Order type + ID
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: color.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              orderType,
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                                color: color,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              'ID: ${order.customOrderId}',
                                              style: TextStyle(
                                                color: Colors.grey.shade600,
                                                fontSize: 11,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 3),
                                      // Device line
                                      Text(
                                        'Device: ${order.wpDeviceId}',
                                        style: TextStyle(
                                          color: Colors.grey.shade700,
                                          fontSize: 11,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Icon(
                                  Icons.arrow_forward_ios,
                                  size: 16,
                                  color: Colors.grey.shade400,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildSetupView() {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.primaryColor,
        title: const Text('Device Setup', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _backToOrderList,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Step 1: Connect via Bluetooth',
              style: theme.textTheme.titleMedium?.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            _macIdStored ? Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade100,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(
                          Icons.bluetooth_connected,
                          color: Colors.blue.shade700,
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Auto-connecting to device',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'MAC ID: $_macId',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.blue.shade700,
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (_isScanning) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Searching for device...',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.blue.shade700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ) : Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade100,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(
                          Icons.bluetooth,
                          color: Colors.blue.shade700,
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Search for devices',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Scan for nearby Bluetooth devices',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.grey.shade600,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isScanning || _isBleConnecting
                          ? null
                          : _requestPermissionsAndScan,
                      icon: _isScanning
                          ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white),
                        ),
                      )
                          : const Icon(Icons.bluetooth_searching, size: 18),
                      label: _isScanning
                          ? const Text('Scanning...', style: TextStyle(
                          fontSize: 12))
                          : const Text('Search for Devices', style: TextStyle(
                          fontSize: 12)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue.shade600,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: Colors.grey.shade400,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (_bleDevices.isNotEmpty || _classicDevices.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                'Available Devices (${_bleDevices.length + _classicDevices.length})',
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 8),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _bleDevices.length + _classicDevices.length,
                itemBuilder: (context, index) {
                  if (index < _bleDevices.length) {
                    final device = _bleDevices[index];
                    final deviceId = '${device.device.remoteId}';
                    final isConnecting = _connectingDeviceId == deviceId;
                    final isConnected = _connectedDeviceId == deviceId;

                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 5),
                      elevation: isConnected ? 2 : 0,
                      color: isConnected ? Colors.green.shade50 : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                        side: BorderSide(
                          color: isConnected
                              ? Colors.green.shade300
                              : Colors.grey.shade200,
                          width: isConnected ? 1.5 : 1,
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: isConnected ? Colors.green.shade100 : Colors.blue.shade100,
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: Icon(
                                isConnected ? Icons.bluetooth_connected : Icons.bluetooth,
                                color: isConnected ? Colors.green.shade600 : Colors.blue.shade600,
                                size: 16,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          device.device.name.isNotEmpty ? device.device.name : 'BLE Device',
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            fontWeight: FontWeight.w500,
                                            fontSize: 12,
                                            color: isConnected ? Colors.green.shade700 : Colors.black87,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          deviceId,
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            color: Colors.grey.shade600,
                                            fontSize: 10,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (isConnected) ...[
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.green.shade200,
                                            borderRadius: BorderRadius.circular(3),
                                          ),
                                          child: Text(
                                            'Connected',
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.green.shade700,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        SizedBox(
                                          height: 28,
                                          child: ElevatedButton(
                                            onPressed: _currentOrder != null
                                                ? () {
                                                    Get.to(() => PlanConfigPage(
                                                          order: _currentOrder!,
                                                          macId: _normalizeMac(_connectedDeviceId!),
                                                          deviceName: _connectedDeviceName ?? (_connectionType == 'BLE' ? 'BLE Device' : 'Classic Device'),
                                                          isClassic: _connectionType == 'Classic',
                                                          bleWriteChar: _bleWriteChar,
                                                          classicConnection: _bluetoothConnection,
                                                        ));
                                                  }
                                                : null,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.green.shade600,
                                              padding: const EdgeInsets.symmetric(horizontal: 12),
                                              minimumSize: const Size(0, 28),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                                            ),
                                            child: const Text('Configure', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.white)),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (isConnecting)
                              const SizedBox(
                                height: 16,
                                width: 16,
                                child: CircularProgressIndicator(strokeWidth: 1.5),
                              )
                            else if (!isConnected)
                              ElevatedButton(
                                onPressed: _connectingDeviceId == null ? () => _connectToBleDevice(device.device) : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue.shade600,
                                  disabledBackgroundColor: Colors.grey.shade300,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                  minimumSize: const Size(50, 28),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                                ),
                                child: const Text('Connect', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.white)),
                              ),
                          ],
                        ),
                      ),
                    );
                  } else {
                    final device = _classicDevices[index - _bleDevices.length];
                    final deviceId = device.device.address;
                    final isConnecting = _connectingDeviceId == deviceId;
                    final isConnected = _connectedDeviceId == deviceId;

                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 5),
                      elevation: isConnected ? 2 : 0,
                      color: isConnected ? Colors.green.shade50 : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                        side: BorderSide(
                          color: isConnected ? Colors.green.shade300 : Colors.grey.shade200,
                          width: isConnected ? 1.5 : 1,
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: isConnected ? Colors.green.shade100 : Colors.blue.shade100,
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: Icon(
                                isConnected ? Icons.bluetooth_connected : Icons.bluetooth_connected,
                                color: isConnected ? Colors.green.shade600 : Colors.blue.shade600,
                                size: 16,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          device.device.name ?? 'Classic BT Device',
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            fontWeight: FontWeight.w500,
                                            fontSize: 12,
                                            color: isConnected ? Colors.green.shade700 : Colors.black87,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          deviceId,
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            color: Colors.grey.shade600,
                                            fontSize: 10,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (isConnected) ...[
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.green.shade200,
                                            borderRadius: BorderRadius.circular(3),
                                          ),
                                          child: Text(
                                            'Connected',
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.green.shade700,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        SizedBox(
                                          height: 28,
                                          child: ElevatedButton(
                                            onPressed: _currentOrder != null
                                                ? () {
                                                    Get.to(() => PlanConfigPage(
                                                          order: _currentOrder!,
                                                          macId: _normalizeMac(_connectedDeviceId!),
                                                          deviceName: _connectedDeviceName ?? (_connectionType == 'BLE' ? 'BLE Device' : 'Classic Device'),
                                                          isClassic: _connectionType == 'Classic',
                                                          bleWriteChar: _bleWriteChar,
                                                          classicConnection: _bluetoothConnection,
                                                        ));
                                                  }
                                                : null,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.green.shade600,
                                              padding: const EdgeInsets.symmetric(horizontal: 12),
                                              minimumSize: const Size(0, 28),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                                            ),
                                            child: const Text('Configure', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.white)),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (isConnecting)
                              const SizedBox(
                                height: 16,
                                width: 16,
                                child: CircularProgressIndicator(strokeWidth: 1.5),
                              )
                            else if (!isConnected)
                              ElevatedButton(
                                onPressed: _connectingDeviceId == null ? () => _connectToClassicDevice(device) : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue.shade600,
                                  disabledBackgroundColor: Colors.grey.shade300,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                  minimumSize: const Size(50, 28),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                                ),
                                child: const Text('Connect', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.white)),
                              ),
                          ],
                        ),
                      ),
                    );
                  }
                },
              ),
            ] else
              if (!_isScanning) ...[
                const SizedBox(height: 12),
                Center(
                  child: Column(
                    children: [
                      Icon(
                        Icons.bluetooth_disabled,
                        size: 40,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No devices found',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Try scanning again or ensure devices are in range',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade500,
                          fontSize: 11,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.grey[600], fontSize: 14),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: valueColor,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  String _normalizeMac(String mac) {
    return mac.replaceAll('-', ':').toUpperCase();
  }

  bool _validateDeviceInfo(Map<String, dynamic> deviceInfo) {
    final wpDeviceId = deviceInfo['wp_device_id'] as String?;
    final deviceMac = deviceInfo['mac_id'] as String?;
    final timestamp = deviceInfo['timestamp'] as String?;

    debugPrint(
        'Received DeviceInfo: wp_device_id=$wpDeviceId, mac_id=$deviceMac, timestamp=$timestamp');

    if (deviceMac == null || deviceMac.isEmpty) {
      CustomSnackbar.showError(message: 'Device info missing MAC ID');
      return false;
    }

    final normalizedDeviceMac = _normalizeMac(deviceMac);
    final normalizedEnteredMac = _normalizeMac(_macId);

    debugPrint(
        'MAC Validation: Device=$normalizedDeviceMac vs Entered=$normalizedEnteredMac');

    if (normalizedDeviceMac != normalizedEnteredMac) {
      CustomSnackbar.showError(
        message: 'MAC ID mismatch.\nDevice: $normalizedDeviceMac\nEntered: $normalizedEnteredMac',
      );
      return false;
    }

    CustomSnackbar.showSuccess(message: 'Device validated: $wpDeviceId');
    return true;
  }

  bool _handleAckResponse(Map<String, dynamic> ack) {
    final status = ack['status'] as int?;
    final errorCode = ack['error'] as int?;

    switch (status) {
      case 1:
        // Success - no snackbar needed
        return true;
      case 2:
        CustomSnackbar.showError(
          message: 'MAC mismatch error (Code: $errorCode)',
        );
        return false;
      case 0:
        CustomSnackbar.showError(
          message: 'Invalid data error (Code: $errorCode)',
        );
        return false;
      default:
        CustomSnackbar.showError(message: 'Unknown device response');
        return false;
    }
  }
}
