import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart' as fbs;
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page.dart';
import 'device_setup_page.dart';

class PlanConfigPage extends StatefulWidget {
  final Task task;
  final String macId;
  final String deviceName;
  final bool isClassic;
  final BluetoothCharacteristic? bleWriteChar;
  final fbs.BluetoothConnection? classicConnection;

  const PlanConfigPage({
    required this.task,
    required this.macId,
    required this.deviceName,
    required this.isClassic,
    this.bleWriteChar,
    this.classicConnection,
    super.key,
  });

  @override
  State<PlanConfigPage> createState() => _PlanConfigPageState();
}

class _PlanConfigPageState extends State<PlanConfigPage> with SingleTickerProviderStateMixin {
  late TextEditingController _waterLimitController;
  late TextEditingController _startDateController;
  late TextEditingController _endDateController;
  late TextEditingController _bluetoothMessageController;
  late TabController _tabController;
  bool _isSending = false;
  bool _isSendingMessage = false;
  final TechnicianController controller = Get.find<TechnicianController>();
  final SessionController sessionController = Get.find<SessionController>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initializeControllers();
  }

  void _initializeControllers() {
    final totalWaterLimit = _extractTotalWaterLimit();
    final startDate = _formatDateToISO(DateTime.now());
    final endDate = _formatDateToISO(_calculateEndDateTime());

    _waterLimitController = TextEditingController(text: totalWaterLimit.toString());
    _startDateController = TextEditingController(text: startDate);
    _endDateController = TextEditingController(text: endDate);
    _bluetoothMessageController = TextEditingController();
  }

  @override
  void dispose() {
    _waterLimitController.dispose();
    _startDateController.dispose();
    _endDateController.dispose();
    _bluetoothMessageController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  int _extractTotalWaterLimit() {
    final plan = _getSelectedPlan();
    final capacity = plan?['capacity'];
    if (capacity != null && capacity.toString().isNotEmpty) {
      try {
        return int.parse(capacity.toString());
      } catch (e) {
        debugPrint('Error parsing capacity: $e');
      }
    }
    return 150;
  }

  int _extractDurationDays() {
    final duration = _getSelectedDuration();
    final durationStr = duration?['duration_time_limit'];
    if (durationStr != null && durationStr.toString().isNotEmpty) {
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

  DateTime _calculateEndDateTime() {
    final startDate = DateTime.now();
    final durationDays = _extractDurationDays();
    return startDate.add(Duration(days: durationDays));
  }

  String _formatDateToISO(DateTime date) {
    return date.toIso8601String();
  }

  Map<String, dynamic>? _getSelectedPlan() {
    if (widget.task.taskType == 3) {
      final rechargeDetails = widget.task.rechargeDetails;
      if (rechargeDetails != null && rechargeDetails['selectedPlan'] is Map) {
        return Map<String, dynamic>.from(rechargeDetails['selectedPlan'] as Map);
      }
    }
    final plan = widget.task.product?.selectedPlan;
    if (plan != null) {
      return Map<String, dynamic>.from(plan);
    }
    return null;
  }

  Map<String, dynamic>? _getSelectedDuration() {
    if (widget.task.taskType == 3) {
      final rechargeDetails = widget.task.rechargeDetails;
      if (rechargeDetails != null && rechargeDetails['selectedDuration'] is Map) {
        return Map<String, dynamic>.from(rechargeDetails['selectedDuration'] as Map);
      }
    }
    final duration = widget.task.product?.selectedDuration;
    if (duration != null) {
      return Map<String, dynamic>.from(duration);
    }
    return null;
  }

  String _getModelName() {
    final modelName = widget.task.product?.modelName ?? widget.task.modelName;
    if (modelName == null || modelName.isEmpty) {
      return 'N/A';
    }
    return modelName;
  }

  String _getPlanLabel() {
    final plan = _getSelectedPlan();
    final label = plan?['label'];
    if (label == null) {
      return 'N/A';
    }
    final labelStr = label.toString();
    return labelStr.isEmpty ? 'N/A' : labelStr;
  }

  String _getPlanDurationLabel() {
    final duration = _getSelectedDuration();
    final durationLabel = duration?['duration_time_limit'];
    if (durationLabel == null) {
      return 'N/A';
    }
    final labelStr = durationLabel.toString();
    return labelStr.isEmpty ? 'N/A' : labelStr;
  }

  String _getPlanCapacity() {
    final plan = _getSelectedPlan();
    final capacity = plan?['capacity'];
    if (capacity == null) {
      return 'N/A';
    }
    final capacityStr = capacity.toString();
    return capacityStr.isEmpty ? 'N/A' : capacityStr;
  }

  String _getDeviceId() {
    final deviceId = widget.task.wpDeviceId ?? widget.macId;
    if (deviceId.isEmpty) {
      return 'N/A';
    }
    return deviceId;
  }

  Future<void> _sendPlanConfig() async {
    if (!_validateInputs()) return;

    setState(() => _isSending = true);

    try {
      final totalWaterLimit = int.parse(_waterLimitController.text);
      final startDate = _startDateController.text;
      final endDate = _endDateController.text;

      final Map<String, dynamic> planConfig = {
        "wp_device_id": widget.task.wpDeviceId ?? '',
        "mac_id": widget.macId,
        "totalWaterLimit": totalWaterLimit,
        "startDate": startDate,
        "endDate": endDate,
        "renewal": 0,
        "connectivity": {
          "ble": widget.isClassic ? 0 : 1,
          "wifi": 0,
          "4g": 0,
          "ethernet": 0
        },
        "timestamp": _formatDateToISO(DateTime.now())
      };

      final planConfigJson = jsonEncode(planConfig);
      debugPrint('Sending plan config: $planConfigJson');

      if (widget.isClassic) {
        final connection = widget.classicConnection;
        if (connection == null) {
          CustomSnackbar.showError(message: 'Classic connection not available');
          return;
        }
        connection.output.add(utf8.encode('$planConfigJson\n'));
        await connection.output.allSent;
      } else {
        final writeChar = widget.bleWriteChar;
        if (writeChar == null) {
          CustomSnackbar.showError(message: 'BLE characteristic not available');
          return;
        }
        await writeChar.write(utf8.encode(planConfigJson), withoutResponse: false);
      }



      final ackSuccess = await _callStoreBleAckApi(
        macId: widget.macId,
        isConfigSuccess: true,
        planConfig: planConfig,
      );

      if (ackSuccess) {
        final Task updatedTask = Task(
          id: widget.task.id,
          taskId: widget.task.taskId,
          taskStatus: widget.task.taskStatus,
          assignedTechnicianId: widget.task.assignedTechnicianId,
          pendingReason: widget.task.pendingReason,
          createdDate: widget.task.createdDate,
          modifiedBy: widget.task.modifiedBy,
          modifiedDate: widget.task.modifiedDate,
          assignedDate: widget.task.assignedDate,
          taskType: widget.task.taskType,
          taskDescription: widget.task.taskDescription,
          imageBeforeService: widget.task.imageBeforeService,
          imageAfterService: widget.task.imageAfterService,
          taskCreatedByUserId: widget.task.taskCreatedByUserId,
          taskCreatedByUserEmail: widget.task.taskCreatedByUserEmail,
          otp: widget.task.otp,
          assignedBy: widget.task.assignedBy,
          otd: widget.task.otd,
          wpDeviceId: widget.task.wpDeviceId,
          modelId: widget.task.modelId,
          model_id: widget.task.model_id,
          modelName: widget.task.modelName,
          address: widget.task.address,
          product: widget.task.product,
          paymentSnapshot: widget.task.paymentSnapshot,
          orderPaymentStatus: widget.task.orderPaymentStatus,
          paymentCollected: widget.task.paymentCollected,
          paymentMethod: widget.task.paymentMethod,
          waitingStatus: widget.task.waitingStatus,
          leaveAction: widget.task.leaveAction,
          setupComplete: true,
          macId: widget.macId,
          requestType: widget.task.requestType,
          currentPlan: widget.task.currentPlan,
          currentPlanEndDate: widget.task.currentPlanEndDate,
          rechargeDetails: widget.task.rechargeDetails,
        );

        final List<Task> updatedAllTasks = controller.allTasks.map((task) {
          if (task.taskId == widget.task.taskId) {
            return updatedTask;
          }
          return task;
        }).toList();

        controller.allTasks.assignAll(updatedAllTasks);

        final List<Task> updatedFilteredTasks = controller.filteredTasks.map((task) {
          if (task.taskId == widget.task.taskId) {
            return updatedTask;
          }
          return task;
        }).toList();

        controller.filteredTasks.assignAll(updatedFilteredTasks);

        unawaited(controller.loadTasks());

        debugPrint('[PlanConfig] ✓ API acknowledgement received with status 1');
        CustomSnackbar.showSuccess(message: 'Plan configuration sent successfully');
        debugPrint('[PlanConfig] → Initiating device disconnection...');
        await _disconnectDevice();
        debugPrint('[PlanConfig] ✓ Device disconnection completed');
        await Future.delayed(const Duration(seconds: 2));

        if (mounted) {
          final landingController = Get.find<TechnicianLandingPageController>();
          landingController.changePage(0);
          Get.offAll(() => const TechnicianLandingPage());
        }
      }
    } catch (e) {
      debugPrint('Error sending plan config: $e');
      CustomSnackbar.showError(message: 'Error sending plan config: $e');
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  Future<bool> _callStoreBleAckApi({
    required String macId,
    required bool isConfigSuccess,
    required Map<String, dynamic> planConfig,
  }) async {
    try {
      final payload = {
        "task_id": widget.task.taskId,
        "wp_device_id": widget.task.wpDeviceId ?? '',
        "mac_id": macId,
        "status": isConfigSuccess ? 1 : 0,
        "timestamp": _formatDateToISO(DateTime.now()),
        "technician_id": sessionController.technicianId.value,
        "plan_config": planConfig,
      };

      debugPrint('Calling storeBleAck API with payload: ${jsonEncode(payload)}');

      final Map<String, dynamic> response = await controller.storeBleAck(payload);

      if (response['error'] == false) {
        debugPrint('✓ storeBleAck API call successful');
        return true;
      } else {
        final message = response['message']?.toString() ?? 'Failed to send plan config';
        debugPrint('✗ storeBleAck API call failed: $message');
        CustomSnackbar.showError(message: message);
        return false;
      }
    } catch (e) {
      debugPrint('Error calling storeBleAck API: $e');
      CustomSnackbar.showError(message: 'Error calling storeBleAck API: $e');
      return false;
    }
  }

  Future<void> _disconnectDevice() async {
    try {
      if (widget.isClassic) {
        final connection = widget.classicConnection;
        if (connection != null && connection.isConnected) {
          debugPrint('[Disconnect] Closing Classic Bluetooth connection for ${widget.macId}');
          await connection.close();
          debugPrint('[Disconnect] ✓ Classic Bluetooth disconnected successfully');
          CustomSnackbar.showSuccess(message: 'Classic Bluetooth disconnected successfully');
        } else {
          debugPrint('[Disconnect] Classic connection was already closed or null');
        }
      } else {
        debugPrint('[Disconnect] Disconnecting BLE device: ${widget.macId}');
        try {
          final writeChar = widget.bleWriteChar;
          if (writeChar != null) {
            final device = writeChar.device;
            await device.disconnect();
            debugPrint('[Disconnect] ✓ BLE device disconnected successfully');
            CustomSnackbar.showSuccess(message: 'Bluetooth disconnected successfully');
          } else {
            debugPrint('[Disconnect] BLE characteristic not available for disconnect');
          }
        } catch (e) {
          debugPrint('[Disconnect] Error during BLE disconnect: $e');
        }
      }
    } catch (e) {
      debugPrint('[Disconnect] ✗ Error disconnecting device: $e');
    }
  }

  bool _validateInputs() {
    if (_waterLimitController.text.isEmpty) {
      CustomSnackbar.showError(message: 'Water limit cannot be empty');
      return false;
    }
    if (_startDateController.text.isEmpty) {
      CustomSnackbar.showError(message: 'Start date cannot be empty');
      return false;
    }
    if (_endDateController.text.isEmpty) {
      CustomSnackbar.showError(message: 'End date cannot be empty');
      return false;
    }
    try {
      int.parse(_waterLimitController.text);
    } catch (e) {
      CustomSnackbar.showError(message: 'Water limit must be a number');
      return false;
    }
    return true;
  }

  Future<void> _selectDate(TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      controller.text = picked.toIso8601String().split('T')[0];
      setState(() {});
    }
  }

  Future<void> _sendBluetoothMessage() async {
    if (_bluetoothMessageController.text.trim().isEmpty) {
      CustomSnackbar.showError(message: 'Please enter a message to send');
      return;
    }

    setState(() => _isSendingMessage = true);

    try {
      final message = _bluetoothMessageController.text.trim();

      if (widget.isClassic && widget.classicConnection != null) {
        widget.classicConnection!.output.add(utf8.encode(message + '\n'));
        CustomSnackbar.showSuccess(message: 'Message sent via Classic BT');
      } else if (!widget.isClassic && widget.bleWriteChar != null) {
        await widget.bleWriteChar!.write(utf8.encode(message), withoutResponse: false);
        CustomSnackbar.showSuccess(message: 'Message sent via BLE');
      } else {
        CustomSnackbar.showError(message: 'No active Bluetooth connection');
        return;
      }

      _bluetoothMessageController.clear();
    } catch (e) {
      debugPrint('Error sending Bluetooth message: $e');
      CustomSnackbar.showError(message: 'Error sending message: $e');
    } finally {
      if (mounted) {
        setState(() => _isSendingMessage = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        foregroundColor: Colors.black,
        title: const Text('Plan Configuration'),
        elevation: 1,
        shadowColor: Colors.black.withOpacity(0.1),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: theme.primaryColor,
              unselectedLabelColor: Colors.grey.shade600,
              indicatorColor: theme.primaryColor,
              dividerColor: Colors.transparent,
              tabs: const [
                Tab(text: 'Plan Config'),
                Tab(text: 'Bluetooth Commands'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPlanConfigTab(),
          _buildBluetoothCommandsTab(),
        ],
      ),
    );
  }

  Widget _buildPlanConfigTab() {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
         
          const SizedBox(height: 10),
          Text(
            'Plan Configuration',
            style: theme.textTheme.titleMedium?.copyWith(
              fontSize: 14, // 🔹 reduced font size
              fontWeight: FontWeight.w400,
              color: Colors.black87,
            ),
          ),

          const SizedBox(height: 18),
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
                Text(
                  'Total Water Limit (Liters)',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _waterLimitController,
                  enabled: false,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    hintText: 'e.g., 150',
                    prefixIcon: const Icon(Icons.water_drop, size: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    disabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.blue.shade600, width: 2),
                    ),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                  ),
                ),
              ],
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
                Text(
                  'Start Date',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _startDateController,
                  enabled: false,
                  readOnly: true,
                  onTap: null,
                  decoration: InputDecoration(
                    hintText: 'YYYY-MM-DD',
                    prefixIcon: const Icon(Icons.calendar_today, size: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    disabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.blue.shade600, width: 2),
                    ),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                  ),
                ),
              ],
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
                Text(
                  'End Date',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _endDateController,
                  enabled: false,
                  readOnly: true,
                  onTap: null,
                  decoration: InputDecoration(
                    hintText: 'YYYY-MM-DD',
                    prefixIcon: const Icon(Icons.calendar_today, size: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    disabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.blue.shade600, width: 2),
                    ),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.amber.shade100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Summary',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.amber.shade800,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 8),
                _buildSummaryRow('Model', _getModelName()),
                _buildSummaryRow('Plan', _getPlanLabel()),
                _buildSummaryRow('Duration', _getPlanDurationLabel()),
                _buildSummaryRow('Device ID', _getDeviceId()),
                _buildSummaryRow('Water Limit', '${_waterLimitController.text} L'),
                _buildSummaryRow('Start Date', _startDateController.text),
                _buildSummaryRow('End Date', _endDateController.text),
                _buildSummaryRow('Connection Type', widget.isClassic ? 'Classic BT' : 'BLE'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isSending ? null : _sendPlanConfig,
              icon: _isSending
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.send, size: 18),
              label: _isSending
                  ? const Text('Sending Plan...', style: TextStyle(fontSize: 13))
                  : const Text('Send Plan Configuration', style: TextStyle(fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade600,
                foregroundColor: Colors.white,
                disabledBackgroundColor: Colors.grey.shade400,
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBluetoothCommandsTab() {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
         
          const SizedBox(height: 10),
          Text(
            'Send Commands',
            style: theme.textTheme.titleMedium?.copyWith(
              fontSize: 14, // 🔹 reduced font size
              fontWeight: FontWeight.w400,
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
                Text(
                  'Command Message',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _bluetoothMessageController,
                  enabled: !_isSendingMessage,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Enter command (e.g., hello, status, ping)',
                    prefixIcon: const Icon(Icons.message, size: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    disabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: Colors.blue.shade600, width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: !_isSendingMessage ? () => _bluetoothMessageController.text = 'hello' : null,
                  icon: const Icon(Icons.waving_hand, size: 16),
                  label: const Text('Hello', style: TextStyle(fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: !_isSendingMessage ? () => _bluetoothMessageController.text = 'status' : null,
                  icon: const Icon(Icons.info, size: 16),
                  label: const Text('Status', style: TextStyle(fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: !_isSendingMessage ? () => _bluetoothMessageController.text = 'ping' : null,
                  icon: const Icon(Icons.network_ping, size: 16),
                  label: const Text('Ping', style: TextStyle(fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isSendingMessage ? null : _sendBluetoothMessage,
              icon: _isSendingMessage
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.send, size: 18),
              label: _isSendingMessage
                  ? const Text('Sending...', style: TextStyle(fontSize: 13))
                  : const Text('Send Command', style: TextStyle(fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade600,
                foregroundColor: Colors.white,
                disabledBackgroundColor: Colors.grey.shade400,
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.black87,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.black54,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
