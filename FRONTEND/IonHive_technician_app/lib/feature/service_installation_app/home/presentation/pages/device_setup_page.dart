import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart' as fbs;
import 'package:permission_handler/permission_handler.dart';
import 'package:get/get.dart';
import 'package:barcode_scan2/barcode_scan2.dart' as bs;
import 'package:intl/intl.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'plan_config_page.dart';

class TaskTypeConstants {
  static const int installation = 1;
  static const int maintenance = 2;
  static const int Recharged = 3;

  static String getTaskTypeName(int? type) {
    switch (type) {
      case 1:
        return 'Installation';
      case 2:
        return 'Maintenance';
      case 3:
        return 'Recharged';
      default:
        return 'Unknown';
    }
  }

  static Color getTaskTypeColor(int? type) {
    switch (type) {
      case 1:
        return Colors.green;
      case 2:
        return Colors.blue;
      case 3:
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  static IconData getTaskTypeIcon(int? type) {
    switch (type) {
      case 1:
        return Icons.build;
      case 2:
        return Icons.settings;
      case 3:
        return Icons.autorenew;
      default:
        return Icons.help;
    }
  }
}

class DeviceSetupPage extends StatefulWidget {
  const DeviceSetupPage({super.key});

  @override
  State<DeviceSetupPage> createState() => _DeviceSetupPageState();
}

class _DeviceSetupPageState extends State<DeviceSetupPage> with TickerProviderStateMixin, WidgetsBindingObserver {
  Task? _currentTask;
  List<Task> _installationTasks = [];
  bool _isTaskListMode = true; // Track if we're showing task list or setup screen
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
  StreamSubscription<
      fbs.BluetoothDiscoveryResult>? _classicDiscoverySubscription;
  StreamSubscription<List<int>>? _notifySubscription;
  StreamSubscription<List<Task>>? _taskSubscription;
  String _bleDataBuffer = '';
  String _classicDataBuffer = '';
  SharedPreferences? _prefs;
  bool _isDeviceVerified = false;
  Completer<bool>? _verificationCompleter;
  Completer<bool>? _ackCompleter;
  DateTime? _lastBluetoothEnableAttempt;

  final TextEditingController _macIdController = TextEditingController();
  final TechnicianController controller = Get.find<TechnicianController>();
  final SessionController sessionController = Get.find<SessionController>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(_loadInitialData);
  }

  @override
  void deactivate() {
    _bleScanSubscription?.cancel();
    _classicDiscoverySubscription?.cancel();
    super.deactivate();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _bleScanSubscription?.cancel();
    _classicDiscoverySubscription?.cancel();
    _notifySubscription?.cancel();
    _taskSubscription?.cancel();
    _macIdController.dispose();
    _bluetoothConnection?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkConnectionStatus();
    }
  }

  Future<void> _loadInitialData() async {
    await _initPreferences();
    _setupTaskListener();

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

  void _setupTaskListener() {
    _updateCurrentTask();
    _taskSubscription?.cancel();
    _taskSubscription = controller.allTasks.listen((_) {
      if (!mounted) return;
      _updateCurrentTask();
    });
  }

  void _updateCurrentTask() {
    try {
      final tasks = controller.allTasks;
      _installationTasks = tasks
          .where((task) {
        if (task.setupComplete == true) {
          return false;
        }
        if (task.taskType == TaskTypeConstants.installation) {
          if (task.taskStatus == 'In Progress') {
            final paymentStatus = task.paymentSnapshot?.paymentStatus ?? task.orderPaymentStatus;
            return paymentStatus == 'Completed';
          }
          return false;
        }
        if (task.taskType == 3) {
          if (task.taskStatus == 'In Progress' || task.taskStatus == 'RechargedOpened') {
            final rechargeDetails = task.rechargeDetails;
            if (rechargeDetails != null && rechargeDetails['paymentStatus'] == 'Completed') {
              return true;
            }
          }
        }
        return false;
      })
          .toList();

      if (_installationTasks.isEmpty) {
        setState(() {
          _currentTask = null;
          _installationTasks = [];
          _isTaskListMode = true;
          _macId = '';
          _macIdStored = false;
          _macIdController.clear();
        });
        return;
      }

      setState(() {
        _installationTasks = _installationTasks;
        // If no task is selected yet, stay in list mode
        if (_currentTask == null) {
          _isTaskListMode = true;
        }
      });
    } catch (e) {
      debugPrint('Error updating current task: $e');
    }
  }

  void _selectTaskFromList(Task task) {
    try {
      final String? storedMacId = _prefs?.getString('mac_id_${task.taskId}');
      String? normalizedRechargeMac;

      if (task.taskType == TaskTypeConstants.Recharged) {
        final String? macFromTask = task.macId?.isNotEmpty == true
            ? task.macId
            : task.rechargeDetails != null && task.rechargeDetails!['mac_id'] != null
            ? task.rechargeDetails!['mac_id'].toString()
            : null;
        if (macFromTask != null && macFromTask.isNotEmpty) {
          normalizedRechargeMac = _normalizeMac(macFromTask);
        }
      }

      setState(() {
        _currentTask = task;
        _isTaskListMode = false;
        _showMacIdInput = false;

        if (normalizedRechargeMac != null) {
          _macId = normalizedRechargeMac!;
          _macIdStored = true;
          _macIdController.text = normalizedRechargeMac!;
        } else if (storedMacId != null && storedMacId.isNotEmpty) {
          _macId = storedMacId;
          _macIdStored = true;
          _macIdController.text = storedMacId;
        } else {
          _macIdStored = false;
          _macId = '';
          _macIdController.clear();
          // Show MAC ID input for manual entry if not stored
          _showMacIdInput = true;
        }
      });

      // Start automatic scanning when entering setup mode
      _startAutomaticScanning();

      if (normalizedRechargeMac != null) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            _autoConnectToRechargeDevice(normalizedRechargeMac!);
          }
        });
      }
    } catch (e) {
      debugPrint('Error selecting task: $e');
    }
  }

  void _backToTaskList() {
    // Disconnect device when going back to task list
    _disconnectCurrentDevice();

    setState(() {
      _isTaskListMode = true;
      _currentTask = null;
      _macId = '';
      _macIdStored = false;
      _macIdController.clear();
      _bleDevices.clear();
      _classicDevices.clear();
      _isScanning = false;
      _isBleConnecting = false;
    });
  }

  void _checkConnectionStatus() {
    if (_connectionType == 'BLE' && _connectedDeviceId != null) {
      final connectedDevices = FlutterBluePlus.connectedDevices;
      final isStillConnected = connectedDevices.any((d) => d.remoteId.str == _connectedDeviceId);
      if (!isStillConnected && mounted) {
        setState(() {
          _connectedDeviceId = null;
          _connectedDeviceName = null;
          _bleWriteChar = null;
          _connectionType = '';
        });
      }
    } else if (_connectionType == 'Classic' && _bluetoothConnection != null) {
      // For classic Bluetooth, check if connection is still active
      if (_bluetoothConnection!.isConnected != true && mounted) {
        setState(() {
          _connectedDeviceId = null;
          _connectedDeviceName = null;
          _bluetoothConnection = null;
          _connectionType = '';
        });
      }
    }
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
    final capacity = _currentTask?.product?.selectedPlan?['capacity'];
    if (capacity != null && capacity
        .toString()
        .isNotEmpty) {
      try {
        return int.parse(capacity.toString());
      } catch (e) {
        debugPrint('Error parsing capacity: $e');
      }
    }
    return 150;
  }

  int _extractDurationDays() {
    final durationStr = _currentTask?.product
        ?.selectedDuration?['duration_time_limit'];
    if (durationStr != null && durationStr
        .toString()
        .isNotEmpty) {
      try {
        final match = RegExp(r'(\d+)').firstMatch(durationStr.toString());
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
        "task_id": _currentTask?.taskId,
        "wp_device_id": _currentTask?.wpDeviceId ?? '',
        "mac_id": macId,
        "status": isConfigSuccess ? 1 : 0,
        "timestamp": DateTime.now().toIso8601String(),
        "technician_id": sessionController.technicianId.value,
        "plan_config": {
          "totalWaterLimit": totalWaterLimit,
          "startDate": startDateStr,
          "endDate": endDate,
          "renewal": _currentTask?.taskType == 3 ? 1 : 0,
          "connectivity": {
            "ble": isClassic ? 0 : 1,
            "wifi": 0,
            "4g": 0,
            "ethernet": 0
          }
        }
      };

      debugPrint(
          'Calling storeBleAck API with payload: ${jsonEncode(payload)}');

      final response = await controller.storeBleAck(payload);

      if (response != null && response['error'] == false) {
        debugPrint('✓ storeBleAck API call successful');
        CustomSnackbar.showSuccess(message: 'Device sent successfully');
      } else {
        debugPrint('✗ storeBleAck API call failed: ${response?['message']}');
      }
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
      await _prefs?.setString('mac_id_${_currentTask?.taskId}', _macId);
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
      final status = await Permission.bluetooth.status;
      
      if (status.isDenied) {
        final result = await Permission.bluetooth.request();
        if (!result.isGranted) {
          _showPermissionDeniedDialog();
          return;
        }
      } else if (status.isPermanentlyDenied) {
        _showPermissionDeniedDialog();
        return;
      }
    }
    _startScanning();
  }

  void _showPermissionDeniedDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Bluetooth Permission Required'),
          content: const Text(
            'Bluetooth permission is required to scan for devices. You can grant permission in app settings or try scanning manually if you have already enabled Bluetooth on your device.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                openAppSettings();
              },
              child: const Text('Open Settings'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _startScanning();
              },
              child: const Text('Try Anyway'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _autoConnectToRechargeDevice(String targetMacId) async {
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
              _autoConnectToRechargeDevice(targetMacId);
            }
          });
          return;
        }
        if (mounted) {
          _showEnableBluetoothDialog();
        }
        return;
      }

      if (Platform.isAndroid) {
        final permissionStatus = await Permission.bluetooth.request();
        if (!permissionStatus.isGranted) {
          CustomSnackbar.showError(message: 'Bluetooth permission required');
          return;
        }
      }

      _bleScanSubscription?.cancel();
      _classicDiscoverySubscription?.cancel();

      bool connectionStarted = false;
      setState(() {
        _isScanning = true;
        _bleDevices.clear();
        _classicDevices.clear();
      });

      await FlutterBluePlus.startScan(timeout: const Duration(seconds: 15));
      _bleScanSubscription = FlutterBluePlus.onScanResults.listen((results) {
        if (!mounted || connectionStarted) {
          return;
        }
        setState(() {
          _bleDevices = results;
        });

        for (final result in results) {
          final deviceId = _normalizeMac(result.device.remoteId.toString());
          if (deviceId == targetMacId) {
            connectionStarted = true;
            FlutterBluePlus.stopScan();
            _bleScanSubscription?.cancel();
            setState(() => _isScanning = false);
            _connectToBleDevice(result.device);
            return;
          }
        }
      });

      _classicDiscoverySubscription = fbs.FlutterBluetoothSerial.instance
          .startDiscovery()
          .listen((result) {
        if (!mounted || connectionStarted) {
          return;
        }
        setState(() {
          if (!_classicDevices
              .any((device) => device.device.address == result.device.address)) {
            _classicDevices.add(result);
          }
        });

        final deviceId = _normalizeMac(result.device.address);
        if (deviceId == targetMacId) {
          connectionStarted = true;
          fbs.FlutterBluetoothSerial.instance.cancelDiscovery();
          _classicDiscoverySubscription?.cancel();
          setState(() => _isScanning = false);
          _connectToClassicDevice(result.device);
        }
      });

      await Future.delayed(const Duration(seconds: 15));
      await FlutterBluePlus.stopScan();
      fbs.FlutterBluetoothSerial.instance.cancelDiscovery();
      _bleScanSubscription?.cancel();
      _classicDiscoverySubscription?.cancel();
      setState(() => _isScanning = false);

      if (!connectionStarted && _connectedDeviceId == null) {
        CustomSnackbar.showError(
          message:
          'Device with MAC ID $targetMacId not found. Ensure the device is powered on and in range, then try scanning again.',
        );
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
                        Navigator.of(context, rootNavigator: true).pop();
                        // Small delay to ensure dialog is fully closed
                        await Future.delayed(const Duration(milliseconds: 100));
                        // Try to turn on Bluetooth
                        try {
                          await FlutterBluePlus.turnOn();
                          // After turning on, start scanning
                          Future.delayed(const Duration(seconds: 1), () {
                            if (mounted) {
                              _startAutomaticScanning();
                            }
                          });
                        } catch (e) {
                          debugPrint('Error turning on Bluetooth: $e');
                          // If programmatic enable fails, open settings as fallback
                          try {
                            await openAppSettings();
                            _checkBluetoothStateAfterSettings();
                          } catch (settingsError) {
                            CustomSnackbar.showError(message: 'Failed to enable Bluetooth. Please enable it manually in settings.');
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
            _startAutomaticScanning();
          }
          return;
        }
      } catch (e) {
        debugPrint('Error checking Bluetooth state: $e');
      }

      if (checkCount >= maxChecks) {
        timer.cancel();
      }
    });
  }

  Future<void> _startAutomaticScanning() async {
    if (_isScanning) return; // Already scanning

    // Check if Bluetooth is enabled
    final adapterState = await FlutterBluePlus.adapterState.first;
    if (adapterState != BluetoothAdapterState.on) {
      // Don't show dialog if we just attempted to enable Bluetooth (within last 5 seconds)
      if (_lastBluetoothEnableAttempt != null &&
          DateTime.now().difference(_lastBluetoothEnableAttempt!).inSeconds < 5) {
        // Wait a bit and try again
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            _startAutomaticScanning();
          }
        });
        return;
      }
      if (mounted) {
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

      _classicDiscoverySubscription = fbs.FlutterBluetoothSerial.instance.startDiscovery().listen((result) {
        debugPrint('Classic BT device found: ${result.device.name} - ${result.device.address}');
        if (mounted) {
          setState(() {
            if (!_classicDevices.any((d) =>
            d.device.address == result.device.address)) {
              _classicDevices.add(result);
              debugPrint('Added Classic device to list. Total devices: ${_classicDevices.length}');
            }
          });
        }
      });

      await Future.delayed(const Duration(seconds: 10));
      await FlutterBluePlus.stopScan();
      _bleScanSubscription?.cancel();
      _classicDiscoverySubscription?.cancel();
      debugPrint('Scan completed - BLE devices: ${_bleDevices.length}, Classic devices: ${_classicDevices.length}');
      if (mounted) {
        setState(() => _isScanning = false);
      }
    } catch (e) {
      debugPrint('Error scanning devices: $e');
      if (mounted) {
        CustomSnackbar.showError(message: 'Error scanning devices');
        setState(() => _isScanning = false);
      }
    }
  }

  Future<void> _startScanning() async {
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

      _classicDiscoverySubscription = fbs.FlutterBluetoothSerial.instance.startDiscovery().listen((result) {
        debugPrint('Classic BT device found: ${result.device.name} - ${result.device.address}');
        if (mounted) {
          setState(() {
            if (!_classicDevices.any((d) =>
            d.device.address == result.device.address)) {
              _classicDevices.add(result);
              debugPrint('Added Classic device to list. Total devices: ${_classicDevices.length}');
            }
          });
        }
      });

      await Future.delayed(const Duration(seconds: 10));
      await FlutterBluePlus.stopScan();
      _bleScanSubscription?.cancel();
      _classicDiscoverySubscription?.cancel();
      debugPrint('Scan completed - BLE devices: ${_bleDevices.length}, Classic devices: ${_classicDevices.length}');
      if (mounted) {
        setState(() => _isScanning = false);
      }
    } catch (e) {
      debugPrint('Error scanning devices: $e');
      if (mounted) {
        CustomSnackbar.showError(message: 'Error scanning devices');
        setState(() => _isScanning = false);
      }
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

      // Find and store write characteristic
      await _findAndStoreBleWriteChar(device);

      // Setup notification listener for device info and ACK
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
        "wp_device_id": _currentTask?.wpDeviceId ?? '',
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
        _connectedDeviceName =
        device.name.isNotEmpty ? device.name : 'BLE Device';
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

      // Navigate to plan config only after receiving ACK with status=1
      if (mounted) {
        Get.to(() =>
            PlanConfigPage(
              task: _currentTask!,
              macId: _normalizeMac(device.remoteId.toString()),
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
          if (jsonData.containsKey('status')) {
            final isValid = _handleAckResponse(jsonData);
            debugPrint('✓ ACK response received: $jsonData');

            if (!_verificationCompleter!.isCompleted) {
              _verificationCompleter!.complete(isValid);
            }

            if (!_ackCompleter!.isCompleted) {
              _ackCompleter!.complete(isValid);
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
          if (jsonData.containsKey('status')) {
            final isValid = _handleAckResponse(jsonData);
            debugPrint('✓ ACK response received (no newline): $jsonData');

            if (!_verificationCompleter!.isCompleted) {
              _verificationCompleter!.complete(isValid);
            }

            if (!_ackCompleter!.isCompleted) {
              _ackCompleter!.complete(isValid);
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

  Future<void> _sendPlanConfigBle(BluetoothCharacteristic writeChar,
      String macId) async {
    if (writeChar == null) {
      CustomSnackbar.showError(message: 'Write characteristic not available');
      return;
    }

    try {
      final totalWaterLimit = _extractTotalWaterLimit();
      final endDate = _calculateEndDate();
      final startDateStr = DateTime.now().toIso8601String().split('T')[0];

      final Map<String, dynamic> planConfig = {
        "wp_device_id": _currentTask?.wpDeviceId ?? '',
        "mac_id": macId,
        "totalWaterLimit": totalWaterLimit,
        "startDate": startDateStr,
        "endDate": endDate,
        "renewal": 1,
        "connectivity": {"ble": 1, "wifi": 0, "4g": 0, "ethernet": 0},
        "timestamp": DateTime.now().toIso8601String()
      };

      final String payload = jsonEncode(planConfig);
      debugPrint('Sending plan config: $payload');
      await writeChar.write(utf8.encode(payload), withoutResponse: false);
      debugPrint('Plan config sent successfully');
      CustomSnackbar.showSuccess(message: 'Plan configured successfully');

      await _callStoreBleAckApi(macId, true, isClassic: false);

      await Future.delayed(const Duration(seconds: 2));
      CustomSnackbar.showSuccess(message: 'Device setup complete');
    } catch (e) {
      debugPrint('Error sending config: $e');
      CustomSnackbar.showError(message: 'Error sending config: $e');
    }
  }

  Future<void> _connectToClassicDevice(fbs.BluetoothDevice device) async {
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
      _connectingDeviceId = device.address;
      _isDeviceVerified = false;
    });
    try {
      debugPrint('Connecting to Classic BT device: ${device.address}');
      _bluetoothConnection =
      await fbs.BluetoothConnection.toAddress(device.address);
      debugPrint('Connected successfully');

      _verificationCompleter = Completer<bool>();
      _ackCompleter = Completer<bool>();

      bool verificationAcknowledged = false;
      bool ackAcknowledged = false;

      _classicDataBuffer = '';
      _notifySubscription?.cancel();
      _notifySubscription = _bluetoothConnection!.input!.listen((data) async {
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
            if (jsonData.containsKey('status') && !ackAcknowledged) {
              ackAcknowledged = true;
              debugPrint('✓ ACK response received: $jsonData');
              final isValid = _handleAckResponse(jsonData);

              if (!_verificationCompleter!.isCompleted) {
                _verificationCompleter!.complete(isValid);
              }

              if (!_ackCompleter!.isCompleted) {
                _ackCompleter!.complete(isValid);
              }
            }
          } catch (e) {
            debugPrint('Error parsing JSON: $e');
          }
        }
      });

      final Map<String, dynamic> verificationPayload = {
        "wp_device_id": _currentTask?.wpDeviceId ?? '',
        "mac_id": _normalizeMac(device.address),
        "timestamp": DateTime.now().toIso8601String(),
      };

      debugPrint(
          'Sending verification payload: ${jsonEncode(verificationPayload)}');
      _bluetoothConnection?.output.add(
          utf8.encode(jsonEncode(verificationPayload) + '\n'));
      await _bluetoothConnection?.output.allSent;

      // Wait for verification
      bool verified = await _verificationCompleter!.future.timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          debugPrint('⚠️ Verification timeout');
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

      // Set connected status only after verification
      setState(() {
        _connectionType = 'Classic';
        _connectedDeviceId = device.address;
        _connectedDeviceName = device.name?.isNotEmpty == true ? device.name : 'Classic BT Device';
        _isDeviceVerified = true;
      });

      // Wait for ACK response before navigating
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


      // Navigate to plan config only after receiving ACK with status=1
      if (mounted) {
        Get.to(() =>
            PlanConfigPage(
              task: _currentTask!,
              macId: _normalizeMac(device.address),
              deviceName: (device.name ?? '').isNotEmpty ? device.name ??
                  'Classic BT Device' : 'Classic BT Device',
              isClassic: true,
              bleWriteChar: null,
              classicConnection: _bluetoothConnection,
            ));
      }
    } catch (e) {
      debugPrint('Error connecting to Classic device: $e');
      CustomSnackbar.showError(message: 'Error connecting: $e');
    } finally {
      setState(() {
        _isBleConnecting = false;
        _connectingDeviceId = null;
      });
    }
  }

  Future<void> _sendPlanConfigClassic(String deviceAddress,
      String normalizedMac) async {
    try {
      final totalWaterLimit = _extractTotalWaterLimit();
      final endDate = _calculateEndDate();
      final startDateStr = DateTime.now().toIso8601String().split('T')[0];

      final Map<String, dynamic> planConfig = {
        "wp_device_id": _currentTask?.wpDeviceId ?? '',
        "mac_id": normalizedMac,
        "totalWaterLimit": totalWaterLimit,
        "startDate": startDateStr,
        "endDate": endDate,
        "renewal": 0,
        "connectivity": {"ble": 0, "wifi": 0, "4g": 0, "ethernet": 0},
        "timestamp": DateTime.now().toIso8601String()
      };

      debugPrint('Sending plan config: ${jsonEncode(planConfig)}');
      _bluetoothConnection?.output.add(
          utf8.encode(jsonEncode(planConfig) + '\n'));
      await _bluetoothConnection?.output.allSent;
      debugPrint('Plan config sent successfully');
      CustomSnackbar.showSuccess(message: 'Plan configured successfully');

      await _callStoreBleAckApi(normalizedMac, true, isClassic: true);

      await Future.delayed(const Duration(seconds: 2));
      CustomSnackbar.showSuccess(message: 'Device setup complete');
    } catch (e) {
      debugPrint('Error sending config: $e');
      CustomSnackbar.showError(message: 'Error sending config: $e');
    }
  }

  String _normalizeMac(String mac) {
    return mac.replaceAll('-', ':').toUpperCase();
  }

  String _getDeviceDisplayName(Task task) {
    // For recharge tasks (type 3), show wp_device_id from rechargeDetails
    if (task.taskType == 3) {
      final rechargeDetails = task.rechargeDetails;
      if (rechargeDetails != null && rechargeDetails['wp_device_id'] != null) {
        return rechargeDetails['wp_device_id'].toString();
      }
    }

    // For installation tasks (type 1), show wp_device_id from task
    return task.wpDeviceId ?? 'N/A';
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

  Future<void> _handleSendPlanConfig(Map<String, dynamic> planConfig) async {
    try {
      if (_connectionType == 'BLE') {
        await _sendPlanConfigViaBle(planConfig);
      } else {
        await _sendPlanConfigViaClassic(planConfig);
      }
    } catch (e) {
      debugPrint('Error sending plan config: $e');
      rethrow;
    }
  }

  Future<void> _sendPlanConfigViaBle(Map<String, dynamic> planConfig) async {
    try {
      if (_connectedDevice == null) {
        throw Exception('No BLE device connected');
      }

      // Get write characteristic
      final services = await _connectedDevice!.discoverServices();
      BluetoothCharacteristic? writeChar;

      for (var service in services) {
        for (var characteristic in service.characteristics) {
          if (characteristic.properties.write) {
            writeChar = characteristic;
            break;
          }
        }
        if (writeChar != null) break;
      }

      if (writeChar == null) {
        throw Exception('Write characteristic not found');
      }

      final String payload = jsonEncode(planConfig);
      debugPrint('Sending BLE plan config: $payload');
      await writeChar.write(utf8.encode(payload), withoutResponse: false);
      debugPrint('✓ Plan config sent successfully via BLE');
    } catch (e) {
      debugPrint('Error sending config via BLE: $e');
      CustomSnackbar.showError(message: 'Error sending config to device');
      rethrow;
    }
  }

  Future<void> _sendPlanConfigViaClassic(
      Map<String, dynamic> planConfig) async {
    try {
      if (_bluetoothConnection == null) {
        throw Exception('No Classic BT device connected');
      }

      final String payload = jsonEncode(planConfig);
      debugPrint('Sending Classic BT plan config: $payload');
      _bluetoothConnection?.output.add(utf8.encode(payload + '\n'));
      await _bluetoothConnection?.output.allSent;
      debugPrint('✓ Plan config sent successfully via Classic BT');
    } catch (e) {
      debugPrint('Error sending config via Classic BT: $e');
      CustomSnackbar.showError(message: 'Error sending config to device');
      rethrow;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isTaskListMode) {
      if (_installationTasks.isEmpty) {
        return Scaffold(
          appBar: AppBar(
            backgroundColor: theme.primaryColor,
            elevation: 0,
            title: const Text(
              'Installation Tasks',
              style: TextStyle(
                fontSize: 18, // You can reduce to 16 if you want smaller text
                fontWeight: FontWeight.w500,
              ),
            ),
          ),

          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.inbox_outlined,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'No installation tasks available',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
        );
      }

      return Scaffold(
        appBar: AppBar(
          backgroundColor: theme.primaryColor,
          title: const Text('Installation Tasks'),
          elevation: 0,
        ),
        body: ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          itemCount: _installationTasks.length,
          itemBuilder: (context, index) {
            final task = _installationTasks[index];
            final taskTypeColor = TaskTypeConstants.getTaskTypeColor(
                task.taskType);

            return Card(
              margin: const EdgeInsets.symmetric(vertical: 6),
              elevation: 1,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              child: InkWell(
                onTap: () => _selectTaskFromList(task),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    children: [
                      Container(
                        width: 3,
                        height: 60,
                        decoration: BoxDecoration(
                          color: taskTypeColor,
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
                              task.address?.name ?? 'Unknown Customer',
                              style: theme.textTheme.bodyLarge?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),

                            // Task type + ID
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: taskTypeColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    TaskTypeConstants.getTaskTypeName(task.taskType),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: taskTypeColor,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'ID: ${task.taskId}',
                                    style: theme.textTheme.bodySmall?.copyWith(
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

                            // Device line + Setup Complete
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Device: ${_getDeviceDisplayName(task)}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: Colors.grey.shade700,
                                      fontSize: 11,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (task.setupComplete == true) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.green.shade50,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: Colors.green.shade200),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.check_circle,
                                          size: 12,
                                          color: Colors.green.shade600,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Setup Complete',
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            color: Colors.green.shade700,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
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
      );
    }

    if (_currentTask == null) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: theme.primaryColor,
          title: const Text('Device Setup'),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _backToTaskList,
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.info_outline,
                size: 64,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 16),
              Text(
                'No task selected for device setup',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.primaryColor,
        title: const Text('Device Setup'),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _backToTaskList,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            const SizedBox(height: 1),
            if (!_macIdStored) ...[
              Text(
                'Step 1: Add Device MAC ID',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: 14, // 🔹 reduced font size (try 15 or 14 if you want smaller)
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),


              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
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
                    Text(
                      'Choose input method:',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 36,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                setState(() => _showMacIdInput = !_showMacIdInput);
                              },
                              label: const Text('Enter Manually', style: TextStyle(fontSize: 10)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue.shade600,
                                foregroundColor: Colors.white,
                                disabledBackgroundColor: Colors.blue.shade200,
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: SizedBox(
                            height: 36,
                            child: ElevatedButton.icon(
                              onPressed: _isStoringMacId ? null : _scanMacId,
                              label: const Text('Scan QR Code', style: TextStyle(fontSize: 10)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue.shade600,
                                foregroundColor: Colors.white,
                                disabledBackgroundColor: Colors.blue.shade200,
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (_showMacIdInput) ...[
                      const SizedBox(height: 16),
                      TextField(
                        controller: _macIdController,
                        style: const TextStyle(fontSize: 13),
                        decoration: InputDecoration(
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                          labelText: 'MAC ID (e.g., 49:E7:29:19:C8:B6)',
                          hintText: 'Enter device MAC address',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(
                                color: Colors.blue.shade600, width: 2),
                          ),
                        ),
                        onChanged: (val) {
                          setState(() => _macId = val);
                        },
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 36,
                              child: TextButton(
                                onPressed: () {
                                  setState(() {
                                    _showMacIdInput = false;
                                    _macIdController.clear();
                                    _macId = '';
                                  });
                                },
                                style: TextButton.styleFrom(
                                  backgroundColor: Colors.grey.shade200,
                                  foregroundColor: Colors.grey.shade700,
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: const Text('Cancel', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: SizedBox(
                              height: 36,
                              child: ElevatedButton(
                                onPressed: _isStoringMacId
                                    ? null
                                    : () {
                                  setState(() => _macId = _macIdController.text);
                                  _setupBleConnection();
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green,
                                  foregroundColor: Colors.white,
                                  disabledBackgroundColor: Colors.green.shade200,
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: _isStoringMacId
                                    ? const SizedBox(
                                  height: 16,
                                  width: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                                    : const Text('Save MAC ID', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (_macIdController.text.isNotEmpty &&
                        !_showMacIdInput) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle,
                                color: Colors.green.shade600, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'MAC ID: ${_macIdController.text}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.green.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
            if (_macIdStored) ...[
              Text(
                'Step 2: Connect via Bluetooth',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: 14, // 🔹 reduced font size
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),

              const SizedBox(height: 12),
              Container(
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
                    if (_connectedDeviceId != null) ...[
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.green.shade100,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Icon(
                                Icons.bluetooth_connected,
                                color: Colors.green.shade600,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Connected to device',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: Colors.green.shade700,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _connectedDeviceName ??
                                        (_connectionType == 'Classic'
                                            ? 'Classic Device'
                                            : 'BLE Device'),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: Colors.black87,
                                      fontSize: 11,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _normalizeMac(_connectedDeviceId!),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: Colors.grey.shade600,
                                      fontSize: 10,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              height: 28,
                              child: ElevatedButton(
                                onPressed: (_currentTask != null && _isDeviceVerified)
                                    ? () {
                                  Get.to(() => PlanConfigPage(
                                    task: _currentTask!,
                                    macId: _normalizeMac(_connectedDeviceId!),
                                    deviceName: _connectedDeviceName ??
                                        (_connectionType == 'Classic'
                                            ? 'Classic Device'
                                            : 'BLE Device'),
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
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(5),
                                  ),
                                ),
                                child: const Text(
                                  'Configure',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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
                    if (_bleDevices.isNotEmpty ||
                        _classicDevices.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        'Available Devices (${_bleDevices.length +
                            _classicDevices.length})',
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
                            final isConnecting = _connectingDeviceId ==
                                deviceId;
                            final isConnected = _connectedDeviceId == deviceId;

                            return Card(
                              margin: const EdgeInsets.symmetric(vertical: 5),
                              elevation: isConnected ? 2 : 0,
                              color: isConnected ? Colors.green.shade50 : Colors
                                  .white,
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
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 8),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: isConnected ? Colors.green
                                            .shade100 : Colors.blue.shade100,
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      child: Icon(
                                        isConnected
                                            ? Icons.bluetooth_connected
                                            : Icons.bluetooth,
                                        color: isConnected ? Colors.green
                                            .shade600 : Colors.blue.shade600,
                                        size: 16,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment
                                            .start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  device.device.name.isNotEmpty
                                                      ? device.device.name
                                                      : 'BLE Device',
                                                  style: theme.textTheme
                                                      .bodySmall?.copyWith(
                                                    fontWeight: FontWeight.w500,
                                                    fontSize: 12,
                                                    color: isConnected ? Colors
                                                        .green.shade700 : Colors
                                                        .black87,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow
                                                      .ellipsis,
                                                ),
                                              ),
                                              if (isConnected)
                                                Container(
                                                  padding: const EdgeInsets
                                                      .symmetric(horizontal: 6,
                                                      vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: Colors.green
                                                        .shade200,
                                                    borderRadius: BorderRadius
                                                        .circular(3),
                                                  ),
                                                  child: Text(
                                                    'Connected',
                                                    style: TextStyle(
                                                      fontSize: 9,
                                                      fontWeight: FontWeight
                                                          .w600,
                                                      color: Colors.green
                                                          .shade700,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            deviceId,
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              color: Colors.grey.shade600,
                                              fontSize: 10,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    if (isConnected)
                                      Icon(
                                        Icons.check_circle,
                                        color: Colors.green.shade600,
                                        size: 18,
                                      )
                                    else
                                      if (isConnecting)
                                        const SizedBox(
                                          height: 16,
                                          width: 16,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 1.5),
                                        )
                                      else
                                        ElevatedButton(
                                          onPressed: (_connectingDeviceId == null && _macId.isNotEmpty)
                                              ? () =>
                                              _connectToBleDevice(device.device)
                                              : null,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.blue
                                                .shade600,
                                            disabledBackgroundColor: Colors.grey
                                                .shade300,
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 12, vertical: 5),
                                            minimumSize: const Size(50, 28),
                                            shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius
                                                    .circular(5)),
                                          ),
                                          child: const Text(
                                            'Connect',
                                            style: TextStyle(fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                                color: Colors.white),
                                          ),
                                        ),
                                  ],
                                ),
                              ),
                            );
                          } else {
                            final device = _classicDevices[index -
                                _bleDevices.length];
                            final deviceId = device.device.address;
                            final isConnecting = _connectingDeviceId ==
                                deviceId;
                            final isConnected = _connectedDeviceId == deviceId;

                            return Card(
                              margin: const EdgeInsets.symmetric(vertical: 5),
                              elevation: isConnected ? 2 : 0,
                              color: isConnected ? Colors.green.shade50 : Colors
                                  .white,
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
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 8),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: isConnected ? Colors.green
                                            .shade100 : Colors.orange.shade100,
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      child: Icon(
                                        isConnected
                                            ? Icons.bluetooth_connected
                                            : Icons.bluetooth_connected,
                                        color: isConnected ? Colors.green
                                            .shade600 : Colors.orange.shade600,
                                        size: 16,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment
                                            .start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  device.device.name ??
                                                      'Classic BT Device',
                                                  style: theme.textTheme
                                                      .bodySmall?.copyWith(
                                                    fontWeight: FontWeight.w500,
                                                    fontSize: 12,
                                                    color: isConnected ? Colors
                                                        .green.shade700 : Colors
                                                        .black87,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow
                                                      .ellipsis,
                                                ),
                                              ),
                                              if (isConnected)
                                                Container(
                                                  padding: const EdgeInsets
                                                      .symmetric(horizontal: 6,
                                                      vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: Colors.green
                                                        .shade200,
                                                    borderRadius: BorderRadius
                                                        .circular(3),
                                                  ),
                                                  child: Text(
                                                    'Connected',
                                                    style: TextStyle(
                                                      fontSize: 9,
                                                      fontWeight: FontWeight
                                                          .w600,
                                                      color: Colors.green
                                                          .shade700,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            deviceId,
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              color: Colors.grey.shade600,
                                              fontSize: 10,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    if (isConnected)
                                      Icon(
                                        Icons.check_circle,
                                        color: Colors.green.shade600,
                                        size: 18,
                                      )
                                    else
                                      if (isConnecting)
                                        const SizedBox(
                                          height: 16,
                                          width: 16,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 1.5),
                                        )
                                      else
                                        ElevatedButton(
                                          onPressed: _connectingDeviceId == null
                                              ? () =>
                                              _connectToClassicDevice(
                                                  device.device)
                                              : null,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.blue
                                                .shade600,
                                            disabledBackgroundColor: Colors.grey
                                                .shade300,
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 12, vertical: 5),
                                            minimumSize: const Size(50, 28),
                                            shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius
                                                    .circular(5)),
                                          ),
                                          child: const Text(
                                            'Connect',
                                            style: TextStyle(fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                                color: Colors.white),
                                          ),
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
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String? value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: Colors.black87,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              value ?? 'N/A',
              style: const TextStyle(
                fontSize: 12,
                color: Colors.black54,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

