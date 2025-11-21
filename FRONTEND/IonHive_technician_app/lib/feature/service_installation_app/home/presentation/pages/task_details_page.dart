import 'dart:convert';
import 'dart:io';
import 'package:ionhive_technician_app/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart' as fbs;
import 'package:permission_handler/permission_handler.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import 'package:barcode_scan2/barcode_scan2.dart' as bs;
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/core/core.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/pages/device_setup_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/pages/recharge_plan_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page_controller.dart';

class _PlanDisplayItem {
  final ProductWithPlans product;
  final ProductDuration duration;
  final ProductPlan plan;
  final double finalPrice;
  final bool hasDiscount;
  final double originalPrice;

  _PlanDisplayItem({
    required this.product,
    required this.duration,
    required this.plan,
    required this.finalPrice,
    required this.hasDiscount,
    required this.originalPrice,
  });
}

class TaskDetailPage extends StatefulWidget {
  final Task task;

  const TaskDetailPage({super.key, required this.task});

  @override
  State<TaskDetailPage> createState() => _TaskDetailPageState();
}

class _TaskDetailPageState extends State<TaskDetailPage> {
  late String _selectedStatus;
  String _pendingReason = '';
  String _otp = '';
  File? _beforeImage;
  File? _afterImage;
  bool _isLoading = false;
  bool _accepted = false;
  bool _declined = false;
  String _declineReason = '';
  bool _codCollected = false;
  bool _isPaymentCollecting = false;
  String _selectedPaymentMethod = 'Cash';
  String? _qrCode;
  bool _isGeneratingQR = false;
  
  // Renewal payment collection
  bool _renewalPaymentCollected = false;
  bool _isRenewalPaymentCollecting = false;
  String _selectedRenewalPaymentMethod = 'Cash';
  String? _renewalQrCode;
  bool _isGeneratingRenewalQR = false;
  
  late Task _currentTask;
  
  bool _isTechnicianOnLeave = false;
  bool _checkingLeave = true;
  bool _waitingActionSelected = false;
  String _macId = '';
  bool _macIdStored = false;
  bool _isStoringMacId = false;
  bool _showMacIdInput = false;
  bool _isScanning = false;
  bool _isBleConnecting = false;
  List<ScanResult> _bleDevices = [];
  List<fbs.BluetoothDiscoveryResult> _classicDevices = [];
  BluetoothDevice? _connectedDevice;
  bool _bleEnabled = false;
  String _connectionType = '';
  fbs.BluetoothConnection? _bluetoothConnection;

  // Recharge functionality
  List<ProductWithPlans> _productsWithPlans = [];
  bool _isLoadingProducts = false;
  Map<String, Map<String, dynamic>> _activeSubscriptionsByModel = {};
  ProductWithPlans? _selectedProduct;
  ProductDuration? _selectedDuration;
  ProductPlan? _selectedPlan;
  bool _isCreatingRechargeOrder = false;

  final TextEditingController _pendingReasonController =
      TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _macIdController = TextEditingController();
  final TechnicianController controller = Get.find<TechnicianController>();
  final SessionController sessionController = Get.find<SessionController>();

  @override
  void initState() {
    super.initState();
    _currentTask = widget.task;
    _selectedStatus = _currentTask.taskStatus ?? 'Pending';
    if (_currentTask.taskStatus == 'In Progress') {
      _accepted = true;
      _selectedStatus = 'In Progress';
    } else if (_currentTask.taskStatus == 'Rejected') {
      _declined = true;
      _declineReason = _currentTask.pendingReason ?? '';
    } else if (_currentTask.taskStatus == 'Pending' && _currentTask.pendingReason != null) {
      _declined = true;
      _declineReason = _currentTask.pendingReason!;
    }
    _codCollected = _currentTask.orderPaymentStatus?.toLowerCase() == 'completed' || _currentTask.paymentCollected == true;
    
    if (_codCollected && _currentTask.paymentMethod != null) {
      _selectedPaymentMethod = _currentTask.paymentMethod!;
    }
    
    // Initialize renewal payment tracking
    _renewalPaymentCollected = _currentTask.paymentCollected == true || _currentTask.orderPaymentStatus?.toLowerCase() == 'completed';
    if (_renewalPaymentCollected && _currentTask.paymentMethod != null) {
      _selectedRenewalPaymentMethod = _currentTask.paymentMethod!;
    }
    
    _checkTechnicianLeaveStatus();

    // Load products with plans for renewal tasks
    if (_currentTask.taskType == 3) {
      _loadProductsWithPlans();
    }
  }

  @override
  void dispose() {
    _pendingReasonController.dispose();
    _otpController.dispose();
    _macIdController.dispose();
    super.dispose();
  }

  Future<void> _checkTechnicianLeaveStatus() async {
    try {
      final leaveRequests = await controller.getTechnicianLeaveRequests(
        technicianId: sessionController.technicianId.value,
        email: sessionController.emailId.value,
      );

      final now = DateTime.now();
      
      for (var leaveReq in leaveRequests) {
        final fromDate = DateTime.parse(leaveReq['from_date'] as String);
        final toDate = DateTime.parse(leaveReq['to_date'] as String);
        final status = leaveReq['status'] as String?;

        if (status?.toLowerCase() == 'approved' &&
            now.isAfter(fromDate) &&
            now.isBefore(toDate.add(const Duration(days: 1)))) {
          setState(() {
            _isTechnicianOnLeave = true;
            _checkingLeave = false;
          });
          return;
        }
      }

      setState(() {
        _isTechnicianOnLeave = false;
        _checkingLeave = false;
      });
    } catch (e) {
      debugPrint('Error checking leave status: $e');
      setState(() {
        _isTechnicianOnLeave = false;
        _checkingLeave = false;
      });
    }
  }

  Future<void> _loadProductsWithPlans() async {
    setState(() => _isLoadingProducts = true);
    try {
      final products = await controller.getProductsWithPlans();

      // Fetch active subscriptions for the user
      final userId = widget.task.taskCreatedByUserId;
      final email = widget.task.address?.email;
      if (userId != null && email != null) {
        try {
          final activeSubscriptionsResponse = await controller.getActiveSubscriptionDetails(
            userId: userId,
            email: email,
            roleId: 3,
          );

          if (activeSubscriptionsResponse['error'] == false) {
            final data = activeSubscriptionsResponse['data'] as List<dynamic>;
            final expiredModelIds = <String>{};
            final subscriptionsById = <String, Map<String, dynamic>>{};

            final now = DateTime.now();
            for (final subscription in data) {
              if (subscription is! Map) continue;
              final subscriptionMap = Map<String, dynamic>.from(subscription as Map);

              // Check if subscription has expired
              final planConfig = subscriptionMap['plan_config'] as Map<String, dynamic>?;
              if (planConfig != null) {
                final endDateStr = planConfig['endDate'] as String?;
                if (endDateStr != null) {
                  try {
                    final endDate = DateTime.parse(endDateStr);
                    if (endDate.isBefore(now)) {
                      // Check if installation task is completed
                      final tasks = subscriptionMap['tasks'] as List<dynamic>?;
                      bool installationCompleted = false;
                      if (tasks != null) {
                        for (final task in tasks) {
                          if (task is Map) {
                            final taskMap = Map<String, dynamic>.from(task as Map);
                            final taskType = taskMap['task_type'];
                            final taskStatus = taskMap['task_status'] as String?;
                            if (taskType == 1 && taskStatus == 'Completed') {
                              installationCompleted = true;
                              break;
                            }
                          }
                        }
                      }

                      if (installationCompleted) {
                        // Only include Base model types for recharge
                        final modelType = subscriptionMap['modeltype'] as String?;
                        if (modelType == 'Base') {
                          final candidates = [
                            subscriptionMap['productModelId'],
                            subscriptionMap['modelId'],
                            subscriptionMap['model_id'],
                            subscriptionMap['productId'],
                            subscriptionMap['product_id'],
                          ];
                          for (final candidate in candidates) {
                            if (candidate == null) continue;
                            final key = candidate.toString();
                            if (key.isEmpty) continue;
                            expiredModelIds.add(key);
                            subscriptionsById[key] = subscriptionMap;
                          }
                        }
                      }
                    }
                  } catch (e) {
                    debugPrint('Error parsing endDate: $e');
                  }
                }
              }
            }

            debugPrint('Expired model IDs: $expiredModelIds');

            // First try to filter by expired model IDs
            final filteredByExpired = products.where((product) {
              final productId = product.id?.toString();
              final productModelId = product.modelId?.toString();
              final matches = expiredModelIds.contains(productId) || expiredModelIds.contains(productModelId);
              debugPrint('Product ${product.modelName} (ID: $productId, ModelID: $productModelId) matches expired: $matches');
              return matches;
            }).toList();

            // If no products match expired models, show all Base model products for recharge
            final baseProducts = products.where((product) => product.modelType?.toLowerCase() == 'base').toList();
            final filteredProducts = filteredByExpired.isNotEmpty
                ? filteredByExpired
                : (baseProducts.isNotEmpty ? baseProducts : products);

            debugPrint('Filtered products count: ${filteredProducts.length} (expired matches: ${filteredByExpired.length})');

            setState(() {
              _productsWithPlans = filteredProducts;
              _activeSubscriptionsByModel = subscriptionsById;
              _isLoadingProducts = false;
            });
          } else {
            debugPrint('Active subscriptions API returned error: ${activeSubscriptionsResponse['message']}');
            // Show Base products if API fails
            final baseProducts = products.where((product) => product.modelType?.toLowerCase() == 'base').toList();
            final filteredProducts = baseProducts.isNotEmpty ? baseProducts : products;
            setState(() {
              _productsWithPlans = filteredProducts;
              _activeSubscriptionsByModel = {};
              _isLoadingProducts = false;
            });
          }
        } catch (e) {
          debugPrint('Error fetching active subscriptions: $e');
          // Show Base products if API fails
          final baseProducts = products.where((product) => product.modelType?.toLowerCase() == 'base').toList();
          final filteredProducts = baseProducts.isNotEmpty ? baseProducts : products;
          setState(() {
            _productsWithPlans = filteredProducts;
            _isLoadingProducts = false;
          });
        }
      } else {
        debugPrint('User ID or email not available: userId=$userId, email=$email');
        // Show no products if user info not available
        setState(() {
          _productsWithPlans = [];
          _isLoadingProducts = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading products: $e');
      setState(() => _isLoadingProducts = false);
      CustomSnackbar.showError(message: 'Failed to load products: $e');
    }
  }

  Future<void> _showRechargePlanSelection() async {
    if (_isLoadingProducts) {
      return;
    }
    if (_productsWithPlans.isEmpty) {
      CustomSnackbar.showError(message: 'No recharge plans available');
      return;
    }

    final result = await Get.to(
      () => RechargeProductSelectionPage(
        products: _productsWithPlans,
        task: widget.task,
        activeSubscriptions: _activeSubscriptionsByModel,
      ),
      transition: Transition.rightToLeft,
      duration: const Duration(milliseconds: 300),
    );

    if (result != null && result is Map) {
      setState(() {
        _selectedProduct = result['product'] as ProductWithPlans?;
        _selectedDuration = result['duration'] as ProductDuration?;
        _selectedPlan = result['plan'] as ProductPlan?;
      });

      if (_selectedProduct != null && _selectedDuration != null && _selectedPlan != null) {
        _startRechargeOrder();
      }
    }
  }

  Future<void> _startRechargeOrder() async {
    if (_selectedProduct == null || _selectedDuration == null || _selectedPlan == null) {
      CustomSnackbar.showError(message: 'Please select a product, duration, and plan');
      return;
    }

    if (_currentTask.taskId == null || _currentTask.wpDeviceId == null) {
      CustomSnackbar.showError(message: 'Task ID or Device ID is missing');
      return;
    }

    setState(() => _isCreatingRechargeOrder = true);

    try {
      final planPrice = _selectedPlan!.price ?? 0;
      final gstPercent = _selectedDuration!.gst ?? 0;
      final discountPercent = _selectedDuration!.discount ?? 0;

      final subtotal = planPrice.toDouble();
      final discountAmount = (subtotal * discountPercent) / 100;
      final discountedPrice = subtotal - discountAmount;
      final gstAmount = (discountedPrice * gstPercent) / 100;
      final grandTotal = discountedPrice + gstAmount;

      final deliveryAddress = {
        'name': _currentTask.address?.name ?? '',
        'phone': _currentTask.address?.phone ?? '',
        'street': _currentTask.address?.street ?? '',
        'landmark': _currentTask.address?.landmark ?? '',
        'city': _currentTask.address?.city ?? '',
        'district': _currentTask.address?.district ?? '',
        'state': _currentTask.address?.state ?? '',
        'pincode': _currentTask.address?.pincode ?? '',
        'email': _currentTask.address?.email ?? '',
        'country': _currentTask.address?.country ?? 'India',
      };

      final response = await controller.createRechargeOrder(
        technicianId: sessionController.technicianId.value,
        email: sessionController.emailId.value,
        taskId: _currentTask.taskId!,
        wpDeviceId: _currentTask.wpDeviceId!,
        productModelId: _selectedProduct!.modelId?.toString() ?? '',
        selectedPlan: _selectedPlan!,
        selectedDuration: _selectedDuration!,
        deliveryAddress: deliveryAddress,
        discountedPrice: discountedPrice,
        discountAmount: discountAmount,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        priceWithGST: grandTotal,
        price: discountedPrice,
        subtotal: subtotal,
        codFee: 0,
      );

      if (response['error'] == false) {
        CustomSnackbar.showSuccess(message: 'Recharge order created successfully');
        setState(() {
          _selectedProduct = null;
          _selectedDuration = null;
          _selectedPlan = null;
        });
      } else {
        CustomSnackbar.showError(message: response['message']?.toString() ?? 'Failed to create recharge order');
      }
    } catch (e) {
      debugPrint('Error creating recharge order: $e');
      CustomSnackbar.showError(message: 'Failed to create recharge order: $e');
    } finally {
      setState(() => _isCreatingRechargeOrder = false);
    }
  }

  Future<void> _handleLeaveAction(String action) async {
    if (widget.task.taskId == null) {
      CustomSnackbar.showError(message: 'Task ID is missing');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await controller.updateInProgressTaskLeaveAction(
        technicianId: sessionController.technicianId.value,
        email: sessionController.emailId.value,
        taskId: widget.task.taskId!,
        action: action,
      );

      final updatedTask = controller.allTasks.firstWhere(
        (task) => task.taskId == widget.task.taskId,
        orElse: () => widget.task,
      );

      setState(() {
        _currentTask = updatedTask;
      });

      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      debugPrint('Error in _handleLeaveAction: $e');
      if (mounted) {
        CustomSnackbar.showError(message: 'Failed to update task: ${e.toString()}');
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickImage(String type) async {
    final pickedFile =
        await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        if (type == 'before') {
          _beforeImage = File(pickedFile.path);
        } else {
          _afterImage = File(pickedFile.path);
        }
      });
    }
  }

  Future<void> _acceptTask() async {
    if (widget.task.taskId == null) {
      CustomSnackbar.showError(message: 'Task ID is missing');
      return;
    }

    final DateTime assignedDateUtc = widget.task.assignedDate!;
    final DateTime assignedDate = assignedDateUtc.toLocal();
    final DateTime twoDaysLater = assignedDate.add(const Duration(days: 2));

    DateTime? estimatedEnd;

    await showDialog(
      context: context,
      builder: (context) {
        DateTime? end;
        return StatefulBuilder(
          builder: (context, setState) {
            return Dialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Container(
                width: MediaQuery.of(context).size.width * 0.85,
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Accept Task',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black),
                    ),
                    const SizedBox(height: 16),

                    GestureDetector(
                      onTap: () async {
                        final DateTime today = DateTime.now();
                        final DateTime startDate =
                        assignedDate.isAfter(today) ? assignedDate : today;

                        DateTime? pickedDate = await showDialog<DateTime>(
                          context: context,
                          builder: (context) {
                            DateTime tempDate = startDate;
                            return Dialog(
                              backgroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16)),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                width: MediaQuery.of(context).size.width * 0.8,
                                height: 360,
                                child: Column(
                                  children: [
                                    const Text(
                                      'Select End Date',
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16),
                                    ),
                                    const SizedBox(height: 12),
                                    Expanded(
                                      child: CalendarDatePicker(
                                        initialDate: startDate,
                                        firstDate: startDate,
                                        lastDate: twoDaysLater,
                                        onDateChanged: (date) {
                                          tempDate = date;
                                        },
                                      ),
                                    ),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(context),
                                          child: const Text('Cancel',
                                              style: TextStyle(fontSize: 13)),
                                        ),
                                        const SizedBox(width: 8),
                                        ElevatedButton(
                                          onPressed: () =>
                                              Navigator.pop(context, tempDate),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.blue,
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 14, vertical: 6),
                                            shape: RoundedRectangleBorder(
                                                borderRadius:
                                                BorderRadius.circular(6)),
                                          ),
                                          child: const Text(
                                            'OK',
                                            style: TextStyle(
                                                fontSize: 13, color: Colors.white),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );

                        if (pickedDate == null) return;

                        TimeOfDay? pickedTime = await showDialog<TimeOfDay>(
                          context: context,
                          builder: (context) {
                            TimeOfDay time = TimeOfDay(
                                hour: assignedDate.hour,
                                minute: assignedDate.minute);
                            return StatefulBuilder(
                              builder: (context, setTimeState) {
                                return Dialog(
                                  backgroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16)),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Text(
                                          'Select End Time',
                                          style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16),
                                        ),
                                        const SizedBox(height: 16),

                                        Row(
                                          mainAxisAlignment:
                                          MainAxisAlignment.spaceEvenly,
                                          children: [
                                            Column(
                                              children: [
                                                const Text('Hour',
                                                    style: TextStyle(fontSize: 12)),
                                                DropdownButton<int>(
                                                  value: time.hourOfPeriod == 0
                                                      ? 12
                                                      : time.hourOfPeriod,
                                                  menuMaxHeight: 220,
                                                  isDense: true,
                                                  dropdownColor: Colors.white,
                                                  style: const TextStyle(
                                                      fontSize: 13,
                                                      color: Colors.black),
                                                  underline: const SizedBox(),
                                                  borderRadius:
                                                  BorderRadius.circular(6),
                                                  items: List.generate(12, (i) {
                                                    return DropdownMenuItem(
                                                      value: i + 1,
                                                      child: Container(
                                                        height: 22,
                                                        alignment:
                                                        Alignment.center,
                                                        child: Text((i + 1)
                                                            .toString()
                                                            .padLeft(2, '0')),
                                                      ),
                                                    );
                                                  }),
                                                  onChanged: (value) {
                                                    if (value != null) {
                                                      setTimeState(() {
                                                        final newHour =
                                                        time.period ==
                                                            DayPeriod.am
                                                            ? (value == 12
                                                            ? 0
                                                            : value)
                                                            : (value == 12
                                                            ? 12
                                                            : value + 12);
                                                        time = TimeOfDay(
                                                            hour: newHour,
                                                            minute:
                                                            time.minute);
                                                      });
                                                    }
                                                  },
                                                ),
                                              ],
                                            ),

                                            Column(
                                              children: [
                                                const Text('Min',
                                                    style: TextStyle(fontSize: 12)),
                                                DropdownButton<int>(
                                                  value: time.minute,
                                                  menuMaxHeight: 220,
                                                  isDense: true,
                                                  dropdownColor: Colors.white,
                                                  style: const TextStyle(
                                                      fontSize: 13,
                                                      color: Colors.black),
                                                  underline: const SizedBox(),
                                                  borderRadius:
                                                  BorderRadius.circular(6),
                                                  items: List.generate(60, (i) {
                                                    return DropdownMenuItem(
                                                      value: i,
                                                      child: Container(
                                                        height: 22,
                                                        alignment:
                                                        Alignment.center,
                                                        child: Text(i
                                                            .toString()
                                                            .padLeft(2, '0')),
                                                      ),
                                                    );
                                                  }),
                                                  onChanged: (value) {
                                                    if (value != null) {
                                                      setTimeState(() {
                                                        time = TimeOfDay(
                                                            hour: time.hour,
                                                            minute: value);
                                                      });
                                                    }
                                                  },
                                                ),
                                              ],
                                            ),

                                            Column(
                                              children: [
                                                const Text('AM/PM',
                                                    style: TextStyle(fontSize: 12)),
                                                DropdownButton<DayPeriod>(
                                                  value: time.period,
                                                  menuMaxHeight: 220,
                                                  isDense: true,
                                                  dropdownColor: Colors.white,
                                                  style: const TextStyle(
                                                      fontSize: 13,
                                                      color: Colors.black),
                                                  underline: const SizedBox(),
                                                  borderRadius:
                                                  BorderRadius.circular(6),
                                                  items: const [
                                                    DropdownMenuItem(
                                                        value: DayPeriod.am,
                                                        child: Text('AM')),
                                                    DropdownMenuItem(
                                                        value: DayPeriod.pm,
                                                        child: Text('PM')),
                                                  ],
                                                  onChanged: (value) {
                                                    if (value != null) {
                                                      setTimeState(() {
                                                        final currentHour =
                                                        time.hourOfPeriod ==
                                                            0
                                                            ? 12
                                                            : time.hourOfPeriod;
                                                        final newHour =
                                                        value == DayPeriod.am
                                                            ? (currentHour == 12
                                                            ? 0
                                                            : currentHour)
                                                            : (currentHour ==
                                                            12
                                                            ? 12
                                                            : currentHour +
                                                            12);
                                                        time = TimeOfDay(
                                                            hour: newHour,
                                                            minute: time.minute);
                                                      });
                                                    }
                                                  },
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),

                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            TextButton(
                                              onPressed: () =>
                                                  Navigator.pop(context),
                                              child: const Text('Cancel',
                                                  style: TextStyle(fontSize: 13)),
                                            ),
                                            const SizedBox(width: 8),
                                            ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.blue,
                                                padding:
                                                const EdgeInsets.symmetric(
                                                    horizontal: 14,
                                                    vertical: 6),
                                                shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                    BorderRadius.circular(6)),
                                              ),
                                              onPressed: () =>
                                                  Navigator.pop(context, time),
                                              child: const Text('OK',
                                                  style: TextStyle(
                                                      fontSize: 13,
                                                      color: Colors.white)),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                        );

                        if (pickedTime != null) {
                          setState(() {
                            end = DateTime(
                              pickedDate.year,
                              pickedDate.month,
                              pickedDate.day,
                              pickedTime.hour,
                              pickedTime.minute,
                            );
                          });
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                end == null
                                    ? 'Select End Date & Time'
                                    : DateFormat('MMM dd, yyyy - hh:mm a')
                                    .format(end!),
                                style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.black87),
                              ),
                            ),
                            const Icon(Icons.calendar_today, color: Colors.blue),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child:
                          const Text('Cancel', style: TextStyle(fontSize: 13)),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 6),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6)),
                          ),
                          onPressed: () {
                            if (end == null) {
                              CustomSnackbar.showError(
                                  message: 'Please select end date & time');
                              return;
                            }

                            final DateTime minAllowed = assignedDate;
                            final DateTime maxAllowed = twoDaysLater;
                            if (end!.isBefore(minAllowed) ||
                                end!.isAfter(maxAllowed)) {
                              CustomSnackbar.showError(
                                message:
                                'Estimated end must be between ${DateFormat('MMM dd, yyyy hh:mm a').format(minAllowed)} and ${DateFormat('MMM dd, yyyy hh:mm a').format(maxAllowed)}',
                              );
                              return;
                            }

                            estimatedEnd = end;
                            Navigator.pop(context);
                          },
                          child: const Text('Accept',
                              style:
                              TextStyle(fontSize: 13, color: Colors.white)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    if (estimatedEnd == null) return;

    setState(() => _isLoading = true);
    try {
      await controller.acceptDeclineTask(
        taskId: widget.task.taskId!,
        action: 'accept',
        estimatedEnd: estimatedEnd!.toUtc(),
      );

      final updatedTask = controller.allTasks.firstWhere(
            (task) => task.taskId == widget.task.taskId,
        orElse: () => widget.task,
      );

      setState(() {
        _currentTask = updatedTask;
        _accepted = true;
        _selectedStatus = updatedTask.taskStatus ?? 'In Progress';

        // Update payment status based on task type
        if (_currentTask.taskType == 3) {
          // Renewal task
          _renewalPaymentCollected = updatedTask.orderPaymentStatus?.toLowerCase() == 'completed' ||
                                    updatedTask.paymentCollected == true;
          if (_renewalPaymentCollected && updatedTask.paymentMethod != null) {
            _selectedRenewalPaymentMethod = updatedTask.paymentMethod!;
          }
        } else {
          // Installation task
          _codCollected = updatedTask.orderPaymentStatus?.toLowerCase() == 'completed' ||
                         updatedTask.paymentCollected == true;
          if (_codCollected && updatedTask.paymentMethod != null) {
            _selectedPaymentMethod = updatedTask.paymentMethod!;
          }
        }
      });

      // Navigate to device setup only if payment is already collected
      bool paymentAlreadyCollected = (_currentTask.taskType == 3) ? _renewalPaymentCollected : _codCollected;
      if (mounted && paymentAlreadyCollected) {
        _navigateToDeviceSetup();
      }
    } catch (e) {
      CustomSnackbar.showError(message: e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }



  void _navigateToDeviceSetup() {
    Get.to(() => DeviceSetupPage())?.then((_) {
      // When returning from device setup, refresh the task data
      _refreshTaskData();
    });
  }

  Future<void> _refreshTaskData() async {
    try {
      // Refresh the task data from the controller
      final updatedTask = controller.allTasks.firstWhere(
            (task) => task.taskId == _currentTask.taskId,
        orElse: () => _currentTask,
      );

      setState(() {
        _currentTask = updatedTask;
        _selectedStatus = updatedTask.taskStatus ?? _selectedStatus;
      });
    } catch (e) {
      debugPrint('Error refreshing task data: $e');
    }
  }

  Future<void> _declineTask() async {
    if (widget.task.taskId == null) {
      CustomSnackbar.showError(message: 'Task ID is missing');
      return;
    }

    final reason = await showDialog<String>(
      context: context,
      builder: (context) {
        String declineReason = '';
        bool showError = false;
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              backgroundColor: Colors.white,
              child: Container(
                width: MediaQuery.of(context).size.width * 0.85,
                constraints: const BoxConstraints(maxHeight: 300),
                padding: const EdgeInsets.all(20),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Decline Task',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: showError ? Colors.red : Colors.transparent,
                          ),
                        ),
                        child: TextField(
                          onChanged: (value) {
                            setDialogState(() {
                              declineReason = value;
                              if (showError && declineReason.trim().isNotEmpty) {
                                showError = false;
                              }
                            });
                          },
                          decoration: InputDecoration(
                            labelText: 'Reason for declining',
                            hintText: 'Enter reason...',
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.all(16),
                            errorText: showError ? 'Reason is required' : null,
                          ),
                          maxLines: 3,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: () => Navigator.of(context).pop(null),
                            child: const Text('Cancel'),
                          ),
                          const SizedBox(width: 10),
                          TextButton(
                            onPressed: () {
                              final trimmedReason = declineReason.trim();
                              if (trimmedReason.isEmpty) {
                                setDialogState(() => showError = true);
                                return;
                              }
                              Navigator.of(context).pop(trimmedReason);
                            },
                            child: const Text('Decline'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );

    if (reason == null || reason.isEmpty) {
      return;
    }

    setState(() => _isLoading = true);
    try {
      await controller.acceptDeclineTask(
        taskId: widget.task.taskId!,
        action: 'decline',
        declineReason: reason,
      );
      
      final updatedTask = controller.allTasks.firstWhere(
        (task) => task.taskId == widget.task.taskId,
        orElse: () => widget.task,
      );
      
      setState(() {
        _currentTask = updatedTask;
        _declined = true;
        _declineReason = reason;
        _selectedStatus = updatedTask.taskStatus ?? 'Pending';
      });
    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to decline task: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _setupBleConnection() async {
    if (_macId.trim().isEmpty) {
      CustomSnackbar.showError(message: 'Please enter or scan MAC ID');
      return;
    }

    setState(() => _isStoringMacId = true);
    try {
      final response = await controller.setupBleConnection(
        wpDeviceId: _currentTask.wpDeviceId ?? '',
        macId: _macId,
        taskId: (_currentTask.taskId ?? '').toString(),
        technicianId: sessionController.technicianId.value,
      );

      if (response['error'] == false) {
        setState(() {
          _macIdStored = true;
        });
        CustomSnackbar.showSuccess(message: 'MAC ID stored successfully');
      } else {
        CustomSnackbar.showError(message: response['message'] ?? 'Failed to store MAC ID');
      }
    } catch (e) {
      CustomSnackbar.showError(message: 'Error storing MAC ID: $e');
    } finally {
      setState(() => _isStoringMacId = false);
    }
  }

  Future<void> _scanMacId() async {
    try {
      final result = await bs.BarcodeScanner.scan();

      if (result.rawContent.isNotEmpty) {
        setState(() {
          _macId = result.rawContent;
          _macIdController.text = result.rawContent;
        });
      }
    } catch (e) {
      CustomSnackbar.showError(message: 'Error scanning MAC ID: $e');
    }
  }

  Future<void> _requestPermissionsAndScan() async {
    try {
      await Permission.location.request();
      await Permission.bluetoothScan.request();
      await Permission.bluetoothConnect.request();
      
      await _enableBluetoothAndScan();
    } catch (e) {
      CustomSnackbar.showError(message: 'Error: $e');
    }
  }

  Future<void> _enableBluetoothAndScan() async {
    try {
      bool isBluetoothOn = await FlutterBluePlus.isOn;
      
      if (!isBluetoothOn) {
        await FlutterBluePlus.turnOn();
        await Future.delayed(const Duration(seconds: 1));
      }
      
      await fbs.FlutterBluetoothSerial.instance.requestEnable();
      
      setState(() => _isScanning = true);
      _bleDevices.clear();
      _classicDevices.clear();
      
      CustomSnackbar.showSuccess(message: 'Scanning for BLE & Classic devices...');
      
      await FlutterBluePlus.startScan(
        timeout: const Duration(seconds: 12),
        androidScanMode: AndroidScanMode.lowLatency,
      );
      
      FlutterBluePlus.scanResults.listen((results) {
        setState(() {
          _bleDevices = results
              .where((result) => 
                  result.device.name.isNotEmpty ||
                  result.device.remoteId.toString().contains(_macId.replaceAll(':', '').toLowerCase()))
              .toList();
        });
      });
      
      fbs.FlutterBluetoothSerial.instance.startDiscovery().listen(
        (fbs.BluetoothDiscoveryResult result) {
          setState(() {
            _classicDevices.add(result);
          });
        },
      );
      
      await Future.delayed(const Duration(seconds: 12));
      await FlutterBluePlus.stopScan();
      
      if (_bleDevices.isEmpty && _classicDevices.isEmpty) {
        CustomSnackbar.showError(message: 'No devices found. Turn on your Bluetooth device and keep it nearby');
      } else {
        if (_bleDevices.isNotEmpty) {
          CustomSnackbar.showSuccess(message: 'Found ${_bleDevices.length} BLE device(s)');
        }
        if (_classicDevices.isNotEmpty) {
          CustomSnackbar.showSuccess(message: 'Found ${_classicDevices.length} Classic Bluetooth device(s)');
        }
      }
    } catch (e) {
      CustomSnackbar.showError(message: 'Error scanning: $e');
    } finally {
      setState(() => _isScanning = false);
    }
  }

  Future<void> _connectToBleDevice(BluetoothDevice device) async {
    setState(() => _isBleConnecting = true);
    try {
      await device.connect(autoConnect: false);
      CustomSnackbar.showSuccess(message: 'Connected to BLE device');
      
      await Future.delayed(const Duration(seconds: 1));
      
      List<BluetoothService> services = await device.discoverServices();
      
      final Map<String, dynamic> planConfig = {
        "wp_device_id": _currentTask.wpDeviceId ?? '',
        "mac_id": _macId,
        "totalWaterLimit": 150,
        "startDate": DateTime.now().toIso8601String().split('T')[0],
        "endDate": DateTime.now().add(const Duration(days: 180)).toIso8601String().split('T')[0],
        "renewal": 0,
        "connectivity": {"ble": 1, "wifi": 0, "4g": 0, "ethernet": 0},
        "timestamp": DateTime.now().toIso8601String()
      };
      
      final String payload = jsonEncode(planConfig);
      
      for (BluetoothService service in services) {
        for (BluetoothCharacteristic characteristic in service.characteristics) {
          if (characteristic.properties.write) {
            await characteristic.write(utf8.encode(payload), withoutResponse: false);
            CustomSnackbar.showSuccess(message: 'Configuration sent to device');
            break;
          }
        }
      }
      
      await Future.delayed(const Duration(seconds: 2));
      
      setState(() {
        _macIdStored = true;
        _showMacIdInput = false;
        _bleDevices.clear();
        _classicDevices.clear();
        _connectedDevice = device;
      });
      
      CustomSnackbar.showSuccess(message: 'Device configured successfully');
      
      await device.disconnect();
    } catch (e) {
      CustomSnackbar.showError(message: 'Error: $e');
    } finally {
      setState(() => _isBleConnecting = false);
    }
  }

  Future<void> _connectToClassicDevice(fbs.BluetoothDevice device) async {
    setState(() => _isBleConnecting = true);
    try {
      _bluetoothConnection = await fbs.BluetoothConnection.toAddress(device.address);
      CustomSnackbar.showSuccess(message: 'Connected to Classic Bluetooth device');
      
      await Future.delayed(const Duration(seconds: 1));
      
      final Map<String, dynamic> planConfig = {
        "wp_device_id": _currentTask.wpDeviceId ?? '',
        "mac_id": _macId,
        "totalWaterLimit": 150,
        "startDate": DateTime.now().toIso8601String().split('T')[0],
        "endDate": DateTime.now().add(const Duration(days: 180)).toIso8601String().split('T')[0],
        "renewal": 0,
        "connectivity": {"ble": 0, "wifi": 0, "4g": 0, "ethernet": 0},
        "timestamp": DateTime.now().toIso8601String()
      };
      
      final String payload = jsonEncode(planConfig);
      _bluetoothConnection?.output.add(utf8.encode(payload));
      await _bluetoothConnection?.output.allSent;
      
      CustomSnackbar.showSuccess(message: 'Configuration sent to device');
      
      await Future.delayed(const Duration(seconds: 2));
      
      setState(() {
        _macIdStored = true;
        _showMacIdInput = false;
        _bleDevices.clear();
        _classicDevices.clear();
      });
      
      CustomSnackbar.showSuccess(message: 'Device configured successfully');
      
      await _bluetoothConnection?.close();
    } catch (e) {
      CustomSnackbar.showError(message: 'Error: $e');
    } finally {
      setState(() => _isBleConnecting = false);
    }
  }

  Future<void> _updateTask() async {
    String statusToSend = _accepted ? 'Completed' : _selectedStatus;
    
    if (statusToSend == 'Pending' && _pendingReason.trim().isEmpty) {
      CustomSnackbar.showError(message: 'Pending reason is required');
      return;
    }
    if (statusToSend == 'Completed' && _otp.trim().isEmpty) {
      CustomSnackbar.showError(message: 'OTP is required to mark as completed');
      return;
    }

    if (statusToSend == 'Completed') {
      if (widget.task.taskType == 2) {
        if (_beforeImage == null) {
          CustomSnackbar.showError(message: 'Before Service Image is required to complete the task');
          return;
        }
        if (_afterImage == null) {
          CustomSnackbar.showError(message: 'After Service Image is required to complete the task');
          return;
        }
      } else {
        if (_afterImage == null) {
          CustomSnackbar.showError(message: 'After Installation Image is required to complete the task');
          return;
        }
      }

      final paymentInfo = widget.task.paymentSnapshot;
      if (paymentInfo != null &&
          paymentInfo.paymentType != null &&
          paymentInfo.paymentType!.toUpperCase() == 'COD' &&
          paymentInfo.paymentStatus != null &&
          paymentInfo.paymentStatus!.toLowerCase() == 'pending' &&
          !_codCollected) {
        CustomSnackbar.showError(message: 'Please collect COD payment before completing the task');
        return;
      }
    }

    if (widget.task.taskId == null) {
      CustomSnackbar.showError(message: 'Task ID is missing');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await controller.updateTask(
        taskId: widget.task.taskId!,
        taskStatus: statusToSend,
        pendingReason: statusToSend == 'Pending' ? _pendingReason : null,
        otp: statusToSend == 'Completed' ? _otp : null,
        beforeImage:
            widget.task.taskType == 2 ? _beforeImage : null,
        afterImage: _afterImage,
        collectPayment: false,
        paymentMethod: null,
      );

      if (mounted) {
        final landingController = Get.find<TechnicianLandingPageController>();
        landingController.changePage(0);
        Get.offAll(() => const TechnicianLandingPage());
      }
    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to update task: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildInfoItem(String title, String? value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey)),
          const SizedBox(height: 4),
          Text(value ?? 'N/A',
              style:
                  const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildCompactInfoItem(String title, String? value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey)),
          const SizedBox(height: 2),
          Text(value ?? 'N/A',
              style:
                  const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  String _formatAddress(Address address) {
    List<String> addressParts = [];
    if (address.name != null && address.name!.isNotEmpty) {
      addressParts.add(address.name!);
    }
    if (address.street != null && address.street!.isNotEmpty) {
      addressParts.add(address.street!);
    }
    if (address.landmark != null && address.landmark!.isNotEmpty) {
      addressParts.add('Near ${address.landmark!}');
    }
    if (address.city != null && address.city!.isNotEmpty) {
      addressParts.add(address.city!);
    }
    if (address.district != null && address.district!.isNotEmpty) {
      addressParts.add(address.district!);
    }
    if (address.state != null && address.state!.isNotEmpty) {
      addressParts.add(address.state!);
    }
    if (address.pincode != null && address.pincode!.isNotEmpty) {
      addressParts.add(address.pincode!);
    }
    if (address.phone != null && address.phone!.isNotEmpty) {
      addressParts.add('Phone: ${address.phone!}');
    }
    return addressParts.isNotEmpty ? addressParts.join(', ') : 'N/A';
  }

  String _formatAddressWithoutPhone(Address address) {
    List<String> addressParts = [];
    if (address.name != null && address.name!.isNotEmpty) {
      addressParts.add(address.name!);
    }
    if (address.street != null && address.street!.isNotEmpty) {
      addressParts.add(address.street!);
    }
    if (address.landmark != null && address.landmark!.isNotEmpty) {
      addressParts.add('Near ${address.landmark!}');
    }
    if (address.city != null && address.city!.isNotEmpty) {
      addressParts.add(address.city!);
    }
    if (address.district != null && address.district!.isNotEmpty) {
      addressParts.add(address.district!);
    }
    if (address.state != null && address.state!.isNotEmpty) {
      addressParts.add(address.state!);
    }
    if (address.pincode != null && address.pincode!.isNotEmpty) {
      addressParts.add(address.pincode!);
    }
    return addressParts.isNotEmpty ? addressParts.join(', ') : 'N/A';
  }

  String _formatPlanEndDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final dateTime = DateTime.parse(dateStr);
      return DateFormat('MMM dd, yyyy – hh:mm a').format(dateTime.toLocal());
    } catch (e) {
      return dateStr;
    }
  }

  Widget _buildDropdown() {
    List<String> statusOptions;
    String displayValue;
    
    if (_accepted) {
      statusOptions = ['Completed'];
      displayValue = 'Completed';
    } else {
      statusOptions = ['Pending', 'In Progress', 'Completed'];
      displayValue = _selectedStatus;
    }
    
    return DropdownButtonFormField<String>(
      value: displayValue,
      dropdownColor: Colors.white,
      decoration: InputDecoration(
        filled: true,
        fillColor: Colors.grey.shade100,
        labelText: 'Select Status',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
      items: statusOptions
          .map((status) => DropdownMenuItem(value: status, child: Text(status)))
          .toList(),
      onChanged: (val) => setState(() {
        if (val != null) _selectedStatus = val;
      }),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    required Function(String) onChanged,
    List<TextInputFormatter>? inputFormatters,
    int? maxLength,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      maxLength: maxLength,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.grey.shade100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
      onChanged: onChanged,
    );
  }

  Widget _buildImageUploadRow({
    required String label,
    required File? file,
    required VoidCallback onPressed,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 8),
        Row(
          children: [
            OutlinedButton.icon(
              onPressed: onPressed,
              icon: const Icon(Icons.image),
              label: const Text('Pick Image'),
            ),
            const SizedBox(width: 16),
            if (file != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child:
                    Image.file(file, width: 90, height: 90, fit: BoxFit.cover),
              ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildSubmitButton(dynamic theme) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        icon: const Icon(Icons.check_circle_outline),
        label: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2))
            : const Text('Update Task'),
        style: FilledButton.styleFrom(
          backgroundColor: theme.primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        onPressed: _isLoading ? null : _updateTask,
      ),
    );
  }

  Widget _buildLeaveActionButtons(dynamic theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.amber.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.amber.shade300),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: Colors.amber.shade800, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'you’re on leave. Forward this task or Wait to Complete.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.amber.shade900,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                icon: const Icon(Icons.assignment_return),
                label: const Text('Forward'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onPressed: _isLoading ? null : () => _handleLeaveAction('forward'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton.icon(
                icon: const Icon(Icons.schedule),
                label: const Text('Waiting'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onPressed: _isLoading ? null : () => _handleLeaveAction('waiting'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCodCollectionCard(ThemeData theme, Task task) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _codCollected ? Colors.green.shade50 : Colors.orange.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _codCollected ? Colors.green.shade200 : Colors.orange.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _codCollected ? Icons.check_circle_outline : Icons.payments_outlined, 
                color: _codCollected ? Colors.green.shade800 : Colors.orange.shade800,
              ),
              const SizedBox(width: 8),
              Text(
                _codCollected ? 'COD Payment Collected' : 'Collect COD Payment',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: _codCollected ? Colors.green.shade900 : Colors.orange.shade900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _codCollected 
                ? 'Payment has been collected successfully.'
                : 'Select collection mode and mark payment as received before completing the task.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: _codCollected ? Colors.green.shade700 : null,
              fontWeight: _codCollected ? FontWeight.w500 : null,
            ),
          ),
          const SizedBox(height: 16),
          ToggleButtons(
            isSelected: [
              _selectedPaymentMethod == 'Cash',
              _selectedPaymentMethod == 'QR',
            ],
            onPressed: _codCollected ? null : (index) async {
              final newMethod = index == 0 ? 'Cash' : 'QR';
              if (newMethod == _selectedPaymentMethod) return;
              setState(() {
                _selectedPaymentMethod = newMethod;
              });
              if (newMethod == 'QR' && _qrCode == null) {
                await _generateQR(widget.task);
              }
            },
            borderRadius: BorderRadius.circular(10),
            selectedColor: Colors.white,
            fillColor: _codCollected ? Colors.grey : Colors.orange,
            color: _codCollected ? Colors.grey.shade600 : Colors.orange.shade800,
            disabledColor: Colors.grey.shade400,
            constraints: const BoxConstraints(minHeight: 40, minWidth: 90),
            children: const [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text('Cash'),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text('QR'),
              ),
            ],
          ),

          const SizedBox(height: 16),
          if (_selectedPaymentMethod == 'QR') ...[
            if (_isGeneratingQR) ...[
              const Center(child: CircularProgressIndicator()),
            ] else if (_qrCode != null) ...[
              Center(
                child: Image.memory(
                  base64Decode(_qrCode!),
                  width: 200,
                  height: 200,
                ),
              ),
              const SizedBox(height: 8),
              const Center(
                child: Text(
                  'Scan this QR code to pay',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ] else if (_codCollected) ...[
              const Center(
                child: Text(
                  'Payment already collected via QR.',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
            ] else ...[
              const Center(child: Text('Failed to generate QR code')),
            ],
            const SizedBox(height: 16),
          ],
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: _codCollected ? Colors.green : Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: _isPaymentCollecting || _codCollected
                  ? null
                  : () => _markCodCollected(task, theme),
              child: _isPaymentCollecting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(_codCollected ? 'Payment Collected' : 'Mark Payment Collected'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRenewalPaymentCollectionCard(ThemeData theme, Task task) {
    // Check if recharge order exists with COD payment
    final hasRechargeOrder = task.rechargeDetails != null;
    final isCodPayment = hasRechargeOrder && task.rechargeDetails!['paymentType'] == 'COD';
    final grandTotal = hasRechargeOrder ? task.rechargeDetails!['grandTotal'] ?? 0.0 : 0.0;
    final paymentStatus = hasRechargeOrder ? task.rechargeDetails!['paymentStatus'] ?? 'Pending' : 'Pending';

    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _renewalPaymentCollected ? Icons.check_circle_outline : Icons.payments_outlined,
                color: _renewalPaymentCollected ? Colors.green.shade800 : Colors.blue.shade800,
              ),
              const SizedBox(width: 8),
              Text(
                _renewalPaymentCollected ? 'Renewal Payment Collected' : 'Collect Renewal Payment',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: 15, // 👈 reduced font size
                  fontWeight: FontWeight.w400,
                  color: _renewalPaymentCollected ? Colors.green.shade900 : Colors.blue.shade900,
                ),
              ),

            ],
          ),
          if (hasRechargeOrder && isCodPayment) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Amount to Collect',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.green.shade800,
                        ),
                      ),
                      Text(
                        '₹${grandTotal.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.green.shade800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Payment Method: Cash on Delivery (COD)',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.green.shade700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Status: $paymentStatus',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.green.shade700,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          Text(
            _renewalPaymentCollected
                ? 'Payment has been collected successfully.'
                : 'Select collection mode and mark payment as received before completing the task.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: _renewalPaymentCollected ? Colors.green.shade700 : null,
              fontWeight: _renewalPaymentCollected ? FontWeight.w500 : null,
            ),
          ),
          const SizedBox(height: 16),
          ToggleButtons(
            isSelected: [
              _selectedRenewalPaymentMethod == 'Cash',
              _selectedRenewalPaymentMethod == 'QR',
            ],
            onPressed: _renewalPaymentCollected ? null : (index) async {
              final newMethod = index == 0 ? 'Cash' : 'QR';
              if (newMethod == _selectedRenewalPaymentMethod) return;
              setState(() {
                _selectedRenewalPaymentMethod = newMethod;
              });
              if (newMethod == 'QR' && _renewalQrCode == null) {
                await _generateRenewalQR(widget.task);
              }
            },
            borderRadius: BorderRadius.circular(10),
            selectedColor: Colors.white,
            fillColor: _renewalPaymentCollected ? Colors.grey : Colors.blue,
            color: _renewalPaymentCollected ? Colors.grey.shade600 : Colors.blue.shade800,
            disabledColor: Colors.grey.shade400,
            constraints: const BoxConstraints(minHeight: 40, minWidth: 90),
            children: const [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text('Cash'),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text('QR'),
              ),
            ],
          ),

          const SizedBox(height: 16),
          if (_selectedRenewalPaymentMethod == 'QR') ...[
            if (_isGeneratingRenewalQR) ...[
              const Center(child: CircularProgressIndicator()),
            ] else if (_renewalQrCode != null) ...[
              Center(
                child: Image.memory(
                  base64Decode(_renewalQrCode!),
                  width: 200,
                  height: 200,
                ),
              ),
              const SizedBox(height: 8),
              const Center(
                child: Text(
                  'Scan this QR code to pay',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ] else if (_renewalPaymentCollected) ...[
              const Center(
                child: Text(
                  'Payment already collected via QR.',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
            ] else ...[
              const Center(child: Text('Failed to generate QR code')),
            ],
            const SizedBox(height: 16),
          ],
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: _renewalPaymentCollected ? Colors.green : Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: _isRenewalPaymentCollecting || _renewalPaymentCollected
                  ? null
                  : () => _markRenewalPaymentCollected(task, theme),
              child: _isRenewalPaymentCollecting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(_renewalPaymentCollected ? 'Payment Collected' : 'Mark Payment Collected'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRechargePlanSelectionCard(ThemeData theme) {
    // Check if recharge order exists and payment type is COD
    final hasRechargeOrder = widget.task.rechargeDetails != null;
    final isCodPayment = hasRechargeOrder && widget.task.rechargeDetails!['paymentType'] == 'COD';

    // Don't show recharge plan selection if order is already created with COD
    if (hasRechargeOrder && isCodPayment) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      width: double.infinity,
      child: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: theme.colorScheme.primary.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.monetization_on_outlined,
                        color: theme.colorScheme.primary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Recharge Plan',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.primary,
                              overflow: TextOverflow.ellipsis,
                            ),
                            maxLines: 1,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Select a plan to recharge your device',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                              overflow: TextOverflow.ellipsis,
                            ),
                            maxLines: 1,
                          ),
                        ],
                      ),
                    ),
                    if (!_isLoadingProducts && _productsWithPlans.isNotEmpty) ...[
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _isCreatingRechargeOrder ? null : _showRechargePlanSelection,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isCreatingRechargeOrder
                              ? theme.colorScheme.primary.withOpacity(0.5)
                              : theme.colorScheme.primary,
                          foregroundColor: theme.colorScheme.onPrimary,
                          minimumSize: const Size(0, 26),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                          textStyle: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                        ),
                        child: _isCreatingRechargeOrder
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Choose Plan'),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 10),
              if (_isLoadingProducts) ...[
                _buildRechargePlanLoadingPlaceholder(),
              ] else if (_productsWithPlans.isEmpty) ...[
                const Center(
                  child: Text(
                    'No products available',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRechargePlanLoadingPlaceholder() {
    return Column(
      children: List.generate(3, (index) {
        return Padding(
          padding: EdgeInsets.only(bottom: index == 2 ? 0 : 12),
          child: Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Container(
              height: 52,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade200),
              ),
            ),
          ),
        );
      }),
    );
  }


  Widget _buildPlanDetailRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              color: Colors.black87,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSummaryPending(ThemeData theme, PaymentInfo paymentInfo, Task task) {
    List<Widget> paymentWidgets = [];
    if (paymentInfo.paymentType != null) paymentWidgets.add(_buildCompactInfoItem('Type', paymentInfo.paymentType!));
    if (paymentInfo.paymentStatus != null) paymentWidgets.add(_buildCompactInfoItem('Status', paymentInfo.paymentStatus!));
    if (paymentInfo.totalPrice != null) paymentWidgets.add(_buildCompactInfoItem('Total', '₹${paymentInfo.totalPrice!.toStringAsFixed(2)}'));
    if (paymentInfo.subtotal != null) paymentWidgets.add(_buildCompactInfoItem('Subtotal', '₹${paymentInfo.subtotal!.toStringAsFixed(2)}'));
    if (paymentInfo.securityDeposit != null) paymentWidgets.add(_buildCompactInfoItem('Deposit', '₹${paymentInfo.securityDeposit!.toStringAsFixed(2)}'));
    if (paymentInfo.gstAmount != null) paymentWidgets.add(_buildCompactInfoItem('GST', '₹${paymentInfo.gstAmount!.toStringAsFixed(2)}'));
    if (paymentInfo.paymentMethod != null) paymentWidgets.add(_buildCompactInfoItem('Method', paymentInfo.paymentMethod!));
    if (paymentInfo.paymentCollectedAt != null) paymentWidgets.add(_buildCompactInfoItem('Collected', DateFormat('MMM dd, yyyy').format(paymentInfo.paymentCollectedAt!.toLocal())));

    List<Widget> paymentRows = [];
    for (int i = 0; i < paymentWidgets.length; i += 2) {
      paymentRows.add(Row(
        children: [
          Expanded(child: paymentWidgets[i]),
          if (i + 1 < paymentWidgets.length) Expanded(child: paymentWidgets[i + 1]) else const SizedBox.shrink(),
        ],
      ));
      if (i + 2 < paymentWidgets.length) paymentRows.add(const SizedBox(height: 6));
    }

    return Container(
      margin: const EdgeInsets.only(top: 16, bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment Details',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade800,
            ),
          ),
          const SizedBox(height: 8),
          ...paymentRows,
        ],
      ),
    );
  }

  Widget _buildTaskDetailsCard(ThemeData theme, Task task) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade300, width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.taskDescription ?? "No description available",
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: Colors.grey.shade200),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionTitle('📅 Assigned Date', compact: true),
                const SizedBox(height: 12),
                _buildSimpleDetail(
                  label: '',
                  value: task.assignedDate != null
                      ? DateFormat('MMM dd, yyyy – hh:mm a').format(task.assignedDate!.toLocal())
                      : 'Not assigned',
                ),
              ],
            ),
          ),
          Divider(height: 1, color: Colors.grey.shade200),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionTitle('🔧 Device Information'),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: _buildSimpleDetail(
                        label: 'Model',
                        value: task.product?.modelName ?? task.modelName ?? 'N/A',
                        compact: true,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildSimpleDetail(
                        label: 'Device ID',
                        value: task.wpDeviceId ?? 'N/A',
                        compact: true,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _buildSimpleDetail(
                  label: 'Task Type',
                  value: task.taskType == 1 ? 'Installation' : (task.taskType == 2 ? 'Service' : (task.taskType == 3 ? 'Renewal' : 'Unknown')),
                ),
                if (task.taskType == 3) ...[
                  const SizedBox(height: 14),
                  if (task.currentPlan != null)
                    _buildSimpleDetail(
                      label: 'Current Plan Capacity',
                      value: '${task.currentPlan} L',
                      compact: true,
                    ),
                  if (task.currentPlanEndDate != null) ...[
                    const SizedBox(height: 10),
                    _buildSimpleDetail(
                      label: 'Plan End Date',
                      value: _formatPlanEndDate(task.currentPlanEndDate),
                      compact: true,
                    ),
                  ],
                  if (task.macId != null) ...[
                    const SizedBox(height: 10),
                    _buildSimpleDetail(
                      label: 'Device MAC ID',
                      value: task.macId ?? 'N/A',
                      compact: true,
                    ),
                  ],
                ],
              ],
            ),
          ),
          Divider(height: 1, color: Colors.grey.shade200),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionTitle('👤 Customer & Location'),
                const SizedBox(height: 14),
                _buildSimpleDetail(
                  label: 'Customer Email',
                  value: task.taskCreatedByUserEmail ?? 'N/A',
                ),
                if (task.address != null) ...[
                  const SizedBox(height: 14),
                  _buildSectionTitle('📍 Delivery Address', compact: true),
                  const SizedBox(height: 8),
                  _buildSimpleDetail(
                    label: '',
                    value: _formatAddressWithoutPhone(task.address!),
                  ),
                  if (task.address!.phone != null && task.address!.phone!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    _buildSimpleDetail(
                      label: 'Phone Number',
                      value: task.address!.phone!,
                      compact: true,
                    ),
                  ],
                ],
              ],
            ),
          ),
          if (task.paymentSnapshot != null && task.taskType != 3) ...[
            Divider(height: 1, color: Colors.grey.shade200),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('💳 Payment Summary'),
                  const SizedBox(height: 14),
                  _buildPaymentDetailRow(theme, task.paymentSnapshot!),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, {bool compact = false}) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 6 : 8,
      ),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        title,
        style: TextStyle(
          fontSize: compact ? 11 : 13,
          fontWeight: FontWeight.w600,
          color: Colors.black87,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  Widget _buildSimpleDetail({
    required String label,
    required String value,
    bool compact = false,
  }) {
    if (compact) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w400,
              color: Colors.black87,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: Colors.black87,
          ),
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildPaymentDetailRow(ThemeData theme, PaymentInfo paymentInfo) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (paymentInfo.paymentStatus != null) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Status',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: paymentInfo.paymentStatus!.toLowerCase() == 'completed'
                      ? Colors.green.shade50
                      : Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: paymentInfo.paymentStatus!.toLowerCase() == 'completed'
                        ? Colors.green.shade200
                        : Colors.orange.shade200,
                  ),
                ),
                child: Text(
                  paymentInfo.paymentStatus!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: paymentInfo.paymentStatus!.toLowerCase() == 'completed'
                        ? Colors.green.shade700
                        : Colors.orange.shade700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Subtotal',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            Text(
              paymentInfo.subtotal != null ? '₹${paymentInfo.subtotal!.toStringAsFixed(2)}' : 'N/A',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (paymentInfo.gstAmount != null) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'GST',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
              Text(
                '₹${paymentInfo.gstAmount!.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 8),
        ],
        if (paymentInfo.securityDeposit != null) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Security Deposit',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
              Text(
                '₹${paymentInfo.securityDeposit!.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 8),
        ],
        Container(
          height: 1,
          color: Colors.grey.shade200,
          margin: const EdgeInsets.symmetric(vertical: 8),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Total Amount',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade800,
              ),
            ),
            Text(
              paymentInfo.totalPrice != null ? '₹${paymentInfo.totalPrice!.toStringAsFixed(2)}' : 'N/A',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Colors.green.shade700,
              ),
            ),
          ],
        ),
        if (paymentInfo.paymentType != null) ...[
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Payment Type',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Text(
                  paymentInfo.paymentType!,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.blue.shade700),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Future<void> _generateQR(Task task) async {
    setState(() => _isGeneratingQR = true);
    try {
      final qr = await controller.generateQR(task.taskId!, _selectedStatus);
      
      String base64String = qr ?? '';
      if (base64String.contains(',')) {
        base64String = base64String.split(',').last;
      }
      
      setState(() {
        _qrCode = base64String;
      });
    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to generate QR: $e');
      setState(() {
        _selectedPaymentMethod = 'Cash';
      });
    } finally {
      setState(() => _isGeneratingQR = false);
    }
  }

  Future<void> _markCodCollected(Task task, ThemeData theme) async {
    if (_selectedPaymentMethod.isEmpty) {
      CustomSnackbar.showError(message: 'Please select a payment method');
      return;
    }

    setState(() => _isPaymentCollecting = true);
    try {
      await controller.updateTask(
        taskId: task.taskId!,
        taskStatus: _selectedStatus,
        pendingReason: _selectedStatus == 'Pending' ? task.pendingReason : null,
        otp: null,
        collectPayment: true,
        paymentMethod: _selectedPaymentMethod,
      );

      final updatedTask = controller.allTasks.firstWhere(
        (t) => t.taskId == task.taskId,
        orElse: () => task,
      );

      setState(() {
        _codCollected = true;
        _currentTask = updatedTask;

        _codCollected = updatedTask.orderPaymentStatus?.toLowerCase() == 'completed' ||
                       updatedTask.paymentCollected == true;
        if (_codCollected && updatedTask.paymentMethod != null) {
          _selectedPaymentMethod = updatedTask.paymentMethod!;
        }
      });

      // Navigate to device setup after payment collection
      if (mounted) {
        _navigateToDeviceSetup();
      }

    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to mark payment collected: $e');
    } finally {
      setState(() => _isPaymentCollecting = false);
    }
  }

  Future<void> _generateRenewalQR(Task task) async {
    setState(() => _isGeneratingRenewalQR = true);
    try {
      final qr = await controller.generateQR(task.taskId!, _selectedStatus);
      
      String base64String = qr ?? '';
      if (base64String.contains(',')) {
        base64String = base64String.split(',').last;
      }
      
      setState(() {
        _renewalQrCode = base64String;
      });
    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to generate QR: $e');
      setState(() {
        _selectedRenewalPaymentMethod = 'Cash';
      });
    } finally {
      setState(() => _isGeneratingRenewalQR = false);
    }
  }

  Future<void> _markRenewalPaymentCollected(Task task, ThemeData theme) async {
    if (_selectedRenewalPaymentMethod.isEmpty) {
      CustomSnackbar.showError(message: 'Please select a payment method');
      return;
    }

    setState(() => _isRenewalPaymentCollecting = true);
    try {
      await controller.updateTask(
        taskId: task.taskId!,
        taskStatus: _selectedStatus,
        pendingReason: _selectedStatus == 'Pending' ? task.pendingReason : null,
        otp: null,
        collectPayment: true,
        paymentMethod: _selectedRenewalPaymentMethod,
      );

      final updatedTask = controller.allTasks.firstWhere(
        (t) => t.taskId == task.taskId,
        orElse: () => task,
      );

      setState(() {
        _renewalPaymentCollected = true;
        _currentTask = updatedTask;

        _renewalPaymentCollected = updatedTask.orderPaymentStatus?.toLowerCase() == 'completed' ||
                                   updatedTask.paymentCollected == true;
        if (_renewalPaymentCollected && updatedTask.paymentMethod != null) {
          _selectedRenewalPaymentMethod = updatedTask.paymentMethod!;
        }
      });

      CustomSnackbar.showSuccess(message: 'Renewal payment collected successfully');

      // Navigate to device setup after renewal payment collection
      if (mounted) {
        _navigateToDeviceSetup();
      }
    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to mark payment collected: $e');
    } finally {
      setState(() => _isRenewalPaymentCollecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final task = _currentTask;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
  backgroundColor: theme.primaryColor,
  leading: IconButton(
    icon: const Icon(Icons.arrow_back),
    onPressed: () {
      final landingController = Get.find<TechnicianLandingPageController>();
      landingController.changePage(0);
      Get.offAll(() => const TechnicianLandingPage());
    },
  ),
  title: const Text(
    'Task Details',
    style: TextStyle(
      fontSize: 18, // You can adjust this value (e.g., 16 or 14)
      fontWeight: FontWeight.w500,
    ),
  ),
),

      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTaskDetailsCard(theme, task),
                const SizedBox(height: 20),
                if (!_accepted && !_declined) ...[
                  Text('Accept or Decline Task',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          icon: const Icon(Icons.check),
                          label: const Text('Accept'),
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _isLoading ? null : _acceptTask,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: FilledButton.icon(
                          icon: const Icon(Icons.close),
                          label: const Text('Decline'),
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _isLoading ? null : _declineTask,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),
                ] else if (_accepted) ...[
                  if (!_checkingLeave && _isTechnicianOnLeave && !_waitingActionSelected && _currentTask.waitingStatus != true)
                    _buildLeaveActionButtons(theme),
                  if (!_checkingLeave && _isTechnicianOnLeave && !_waitingActionSelected && _currentTask.waitingStatus != true)
                    const SizedBox(height: 24),
                  if (!_isTechnicianOnLeave || _waitingActionSelected || _currentTask.waitingStatus == true) ...[
                    if (task.paymentSnapshot != null &&
                        task.paymentSnapshot!.paymentType != null &&
                        task.paymentSnapshot!.paymentType!.toUpperCase() == 'COD')
                      _buildCodCollectionCard(theme, task),
                    if (task.taskType == 3) ...[
                      _buildRechargePlanSelectionCard(theme),
                      if (task.rechargeDetails != null) ...[
                        const SizedBox(height: 12),
                        _buildRenewalPaymentCollectionCard(theme, task),
                      ],
                    ],
                    const SizedBox(height: 24),
                    if (false) ...[
                      Text('Device Setup',
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      setState(() => _showMacIdInput = !_showMacIdInput);
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.blue,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 6),
                                      elevation: 0,
                                    ),
                                    child: const Text('Enter Manually', style: TextStyle(fontSize: 12)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: _isStoringMacId ? null : _scanMacId,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.blue,
                                      foregroundColor: Colors.white,
                                      disabledBackgroundColor: Colors.grey.shade400,
                                      padding: const EdgeInsets.symmetric(vertical: 6),
                                      elevation: 0,
                                    ),
                                    child: const Text('Scan MAC ID', style: TextStyle(fontSize: 12)),
                                  ),
                                ),
                              ],
                            ),
                            if (_showMacIdInput) ...[
                              const SizedBox(height: 12),
                              _buildTextField(
                                controller: _macIdController,
                                label: 'MAC ID (e.g., A1:B2:C3:D4:E5:F6)',
                                onChanged: (val) => _macId = val,
                              ),
                              const SizedBox(height: 10),
                              Center(
                                child: SizedBox(
                                  width: 100,
                                  child: ElevatedButton(
                                    onPressed: _isStoringMacId ? null : _setupBleConnection,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.green.shade600,
                                      foregroundColor: Colors.white,
                                      disabledBackgroundColor: Colors.grey.shade300,
                                      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 12),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                      elevation: 0,
                                    ),
                                    child: _isStoringMacId
                                        ? const SizedBox(
                                            height: 14,
                                            width: 14,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                            ),
                                          )
                                        : const Text('Save', style: TextStyle(fontSize: 11)),
                                  ),
                                ),
                              ),
                            ],
                            if (_macIdController.text.isNotEmpty && !_showMacIdInput) ...[
                              const SizedBox(height: 10),
                              Center(
                                child: SizedBox(
                                  width: 100,
                                  child: ElevatedButton(
                                    onPressed: _isStoringMacId ? null : _setupBleConnection,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.green.shade600,
                                      foregroundColor: Colors.white,
                                      disabledBackgroundColor: Colors.grey.shade300,
                                      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 12),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                      elevation: 0,
                                    ),
                                    child: _isStoringMacId
                                        ? const SizedBox(
                                            height: 14,
                                            width: 14,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                            ),
                                          )
                                        : const Text('Save', style: TextStyle(fontSize: 11)),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    if (false) ...[
                      Text('Bluetooth Connection',
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Column(
                          children: [
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _isScanning || _isBleConnecting ? null : _requestPermissionsAndScan,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue,
                                  foregroundColor: Colors.white,
                                  disabledBackgroundColor: Colors.grey.shade400,
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  elevation: 0,
                                ),
                                child: _isScanning
                                    ? const SizedBox(
                                        height: 18,
                                        width: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      )
                                    : const Text('Connect to Bluetooth', style: TextStyle(fontSize: 13)),
                              ),
                            ),
                            if (_bleDevices.isNotEmpty || _classicDevices.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Column(
                                children: [
                                  for (var scanResult in _bleDevices)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton(
                                          onPressed: _isBleConnecting ? null : () => _connectToBleDevice(scanResult.device),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.blue.shade50,
                                            foregroundColor: Colors.black87,
                                            disabledBackgroundColor: Colors.grey.shade300,
                                            side: BorderSide(color: Colors.blue.shade300),
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            elevation: 0,
                                          ),
                                          child: _isBleConnecting
                                              ? const SizedBox(
                                                  height: 18,
                                                  width: 18,
                                                  child: CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                                                  ),
                                                )
                                              : Column(
                                                  children: [
                                                    Text(scanResult.device.name.isNotEmpty ? scanResult.device.name : 'BLE Device', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                                    const SizedBox(height: 4),
                                                    Row(
                                                      mainAxisAlignment: MainAxisAlignment.center,
                                                      children: [
                                                        Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                          decoration: BoxDecoration(
                                                            color: Colors.blue.shade100,
                                                            borderRadius: BorderRadius.circular(3),
                                                          ),
                                                          child: const Text('BLE', style: TextStyle(fontSize: 8, color: Colors.blue)),
                                                        ),
                                                        const SizedBox(width: 8),
                                                        Text('${scanResult.device.remoteId}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                                      ],
                                                    ),
                                                  ],
                                                ),
                                        ),
                                      ),
                                    ),
                                  for (var classicDevice in _classicDevices)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton(
                                          onPressed: _isBleConnecting ? null : () => _connectToClassicDevice(classicDevice.device),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.green.shade50,
                                            foregroundColor: Colors.black87,
                                            disabledBackgroundColor: Colors.grey.shade300,
                                            side: BorderSide(color: Colors.green.shade300),
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            elevation: 0,
                                          ),
                                          child: _isBleConnecting
                                              ? const SizedBox(
                                                  height: 18,
                                                  width: 18,
                                                  child: CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                                                  ),
                                                )
                                              : Column(
                                                  children: [
                                                    Text(classicDevice.device.name ?? 'Classic BT Device', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                                    const SizedBox(height: 4),
                                                    Row(
                                                      mainAxisAlignment: MainAxisAlignment.center,
                                                      children: [
                                                        Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                          decoration: BoxDecoration(
                                                            color: Colors.green.shade100,
                                                            borderRadius: BorderRadius.circular(3),
                                                          ),
                                                          child: const Text('Classic', style: TextStyle(fontSize: 8, color: Colors.green)),
                                                        ),
                                                        const SizedBox(width: 8),
                                                        Text('${classicDevice.device.address}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                                      ],
                                                    ),
                                                  ],
                                                ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    Text('Update Task Status',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    _buildDropdown(),
                    if (_selectedStatus == 'Pending') ...[
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _pendingReasonController,
                        label: 'Pending Reason',
                        onChanged: (val) => _pendingReason = val,
                      ),
                    ],
                    if (_selectedStatus == 'Completed') ...[
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _otpController,
                        label: 'Enter OTP',
                        keyboardType: TextInputType.number,
                        onChanged: (val) => _otp = val,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(6),
                        ],
                        maxLength: 6,
                      ),
                    ],
                    const SizedBox(height: 24),
                    if (widget.task.taskType == 2) ...[
                      _buildImageUploadRow(
                        label: 'Before Service Image',
                        file: _beforeImage,
                        onPressed: () => _pickImage('before'),
                      ),
                      _buildImageUploadRow(
                        label: 'After Service Image',
                        file: _afterImage,
                        onPressed: () => _pickImage('after'),
                      ),
                    ] else if (widget.task.taskType == 3) ...[
                      _buildImageUploadRow(
                        label: 'After Renewal Image',
                        file: _afterImage,
                        onPressed: () => _pickImage('after'),
                      ),
                    ] else ...[
                      _buildImageUploadRow(
                        label: 'After Installation Image',
                        file: _afterImage,
                        onPressed: () => _pickImage('after'),
                      ),
                    ],
                    const SizedBox(height: 36),
                    _buildSubmitButton(theme),
                  ],
                ] else if (_declined) ...[
                  Text('Task Declined',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'This task has been declined.',
                          style: TextStyle(color: Colors.red.shade800),
                        ),
                        if (_declineReason.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Reason: $_declineReason',
                            style: TextStyle(color: Colors.red.shade800),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
