import 'package:equatable/equatable.dart';

// Order class - same as Subscription for backward compatibility
class Order extends Subscription {
  const Order({
    required super.id,
    required super.customOrderId,
    required super.userId,
    required super.productModelId,
    required super.modelName,
    required super.wpDeviceId,
    super.macId,
    required super.mainImage,
    required super.subImages,
    super.modelType,
    super.orderType,
    required super.selectedPlan,
    required super.selectedDuration,
    required super.price,
    required super.grandTotal,
    required super.deliveryAddress,
    required super.paymentStatus,
    required super.paymentType,
    required super.orderStatus,
    required super.razorpayOrderId,
    required super.totalLitre,
    required super.codFee,
    required super.installationStatus,
    required super.createdAt,
    required super.updatedAt,
    required super.razorpayPaymentId,
    required super.subscriptionExpiryDate,
    super.planConfig,
    super.isSetup,
    required super.tasks,
    super.deliveryAcceptanceStatus,
    super.deliveryAcceptanceTimestamp,
    super.deliveryCompletionTimestamp,
    super.deliveryCurrentStatus,
    required super.deliveryHistory,
    super.deliveryCompletionStatus,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: _parseString(json['_id']),
      customOrderId: _parseString(json['customOrderId']),
      userId: json['user_id'] as int? ?? 0,
      productModelId: _parseString(json['productModelId']),
      modelName: _parseString(json['modelName']),
      wpDeviceId: _parseString(json['wp_device_id']),
      macId: _parseOptionalString(json['mac_id']),
      mainImage: _parseString(json['main_image']),
      subImages: (json['sub_images'] as List<dynamic>?)?.map((e) => _parseString(e)).toList() ?? [],
      modelType: json['modeltype'] != null ? _parseString(json['modeltype']) : null,
      orderType: json['orderType'] != null ? _parseString(json['orderType']) : null,
      selectedPlan: json['selectedPlan'] != null
          ? SelectedPlan.fromJson(json['selectedPlan'] as Map<String, dynamic>)
          : const SelectedPlan(plansId: 0, label: '', capacity: '', price: 0),
      selectedDuration: json['selectedDuration'] != null
          ? SelectedDuration.fromJson(json['selectedDuration'] as Map<String, dynamic>)
          : const SelectedDuration(durationId: 0, durationTimeLimit: '', gst: 0, discount: 0, securityDeposit: 0),
      price: _parseDouble(json['price']),
      grandTotal: _parseDouble(json['grandTotal']),
      deliveryAddress: json['deliveryAddress'] != null
          ? DeliveryAddress.fromJson(json['deliveryAddress'] as Map<String, dynamic>)
          : const DeliveryAddress(name: '', phone: '', street: '', landmark: '', city: '', district: '', state: '', pincode: '', email: ''),
      paymentStatus: _parseString(json['paymentStatus'], 'unknown'),
      paymentType: _parseString(json['paymentType'], 'COD'),
      orderStatus: _parseString(json['orderStatus'], 'unknown'),
      razorpayOrderId: _parseString(json['razorpayOrderId']),
      totalLitre: _parseInt(json['totalLitre']),
      codFee: _parseInt(json['codFee']),
      installationStatus: _parseString(json['installation_status'], 'Pending'),
      createdAt: _parseString(json['createdAt']),
      updatedAt: _parseString(json['updatedAt']),
      razorpayPaymentId: _parseString(json['razorpayPaymentId']),
      subscriptionExpiryDate: _parseString(json['subscriptionExpiryDate']),
      planConfig: json['plan_config'] != null ? PlanConfig.fromJson(json['plan_config'] as Map<String, dynamic>) : null,
      isSetup: _parseOptionalBool(json['isSetup']),
      tasks: (json['tasks'] as List<dynamic>?)?.map((task) => Task.fromJson(task as Map<String, dynamic>)).toList() ?? [],
      deliveryAcceptanceStatus: json['delivery_acceptance_status'] != null ? _parseString(json['delivery_acceptance_status']) : null,
      deliveryAcceptanceTimestamp: json['delivery_acceptance_timestamp'] != null ? _parseString(json['delivery_acceptance_timestamp']) : null,
      deliveryCompletionTimestamp: json['delivery_completion_timestamp'] != null ? _parseString(json['delivery_completion_timestamp']) : null,
      deliveryCurrentStatus: json['delivery_current_status'] != null ? _parseString(json['delivery_current_status']) : null,
      deliveryHistory: (json['deliveryHistory'] as List<dynamic>?)?.map((history) => DeliveryHistory.fromJson(history as Map<String, dynamic>)).toList() ?? [],
      deliveryCompletionStatus: json['delivery_completion_status'] as bool?,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'customOrderId': customOrderId,
      'user_id': userId,
      'productModelId': productModelId,
      'modelName': modelName,
      'wp_device_id': wpDeviceId,
      'mac_id': macId,
      'main_image': mainImage,
      'sub_images': subImages,
      'modeltype': modelType,
      'orderType': orderType,
      'selectedPlan': selectedPlan.toJson(),
      'selectedDuration': selectedDuration.toJson(),
      'price': price,
      'grandTotal': grandTotal,
      'deliveryAddress': deliveryAddress.toJson(),
      'paymentStatus': paymentStatus,
      'paymentType': paymentType,
      'orderStatus': orderStatus,
      'razorpayOrderId': razorpayOrderId,
      'totalLitre': totalLitre,
      'codFee': codFee,
      'installation_status': installationStatus,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'razorpayPaymentId': razorpayPaymentId,
      'subscriptionExpiryDate': subscriptionExpiryDate,
      'plan_config': planConfig?.toJson(),
      'isSetup': isSetup,
      'tasks': tasks.map((task) => task.toJson()).toList(),
      'delivery_acceptance_status': deliveryAcceptanceStatus,
      'delivery_acceptance_timestamp': deliveryAcceptanceTimestamp,
      'delivery_completion_timestamp': deliveryCompletionTimestamp,
      'delivery_current_status': deliveryCurrentStatus,
      'delivery_history': deliveryHistory.map((history) => history.toJson()).toList(),
      'delivery_completion_status': deliveryCompletionStatus,
    };
  }

  @override
  List<Object?> get props => [
    id,
    customOrderId,
    userId,
    productModelId,
    modelName,
    wpDeviceId,
    macId,
    mainImage,
    subImages,
    modelType,
    orderType,
    selectedPlan,
    selectedDuration,
    price,
    grandTotal,
    deliveryAddress,
    paymentStatus,
    paymentType,
    orderStatus,
    razorpayOrderId,
    totalLitre,
    codFee,
    installationStatus,
    createdAt,
    updatedAt,
    razorpayPaymentId,
    subscriptionExpiryDate,
    planConfig,
    tasks,
    deliveryAcceptanceStatus,
    deliveryAcceptanceTimestamp,
    deliveryCompletionTimestamp,
    deliveryCurrentStatus,
    deliveryHistory,
    deliveryCompletionStatus,
  ];
}

// Helper functions for parsing JSON values that may be strings or numbers
double _parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

int _parseInt(dynamic value) {
  if (value == null) return 0;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

String _parseString(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  if (value is String) return value;
  final result = value.toString();
  if (result.isEmpty) return fallback;
  return result;
}

String? _parseOptionalString(dynamic value) {
  if (value == null) return null;
  final result = _parseString(value);
  if (result.isEmpty) return null;
  return result;
}

bool? _parseOptionalBool(dynamic value) {
  if (value == null) return null;
  if (value is bool) return value;
  if (value is num) return value != 0;
  if (value is String) {
    final normalized = value.trim().toLowerCase();
    if (normalized == 'true' || normalized == '1' || normalized == 'yes') return true;
    if (normalized == 'false' || normalized == '0' || normalized == 'no') return false;
  }
  return null;
}

/// Represents the response from an active subscription API call.
class ActiveSubscriptionResponse extends Equatable {
  final bool error;
  final String message;
  final SubscriptionData? data;

  const ActiveSubscriptionResponse({
    required this.error,
    required this.message,
    this.data,
  });

  factory ActiveSubscriptionResponse.fromJson(Map<String, dynamic> json) {
    return ActiveSubscriptionResponse(
      error: json['error'] as bool? ?? true,
      message: _parseString(json['message'], 'Unknown error'),
      data: json['data'] != null
          ? SubscriptionData.fromJson(json['data'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'error': error,
      'message': message,
      'data': data?.toJson(),
    };
  }

  @override
  List<Object?> get props => [error, message, data];
}

/// Contains the subscription data within the response.
class SubscriptionData extends Equatable {
  final Subscription subscription;

  const SubscriptionData({required this.subscription});

  factory SubscriptionData.fromJson(Map<String, dynamic> json) {
    return SubscriptionData(
      subscription:
          Subscription.fromJson(json['subscription'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subscription': subscription.toJson(),
    };
  }

  @override
  List<Object?> get props => [subscription];
}

/// Represents a single subscription with detailed information.
class Subscription extends Equatable {
  final String id;
  final String customOrderId;
  final int userId;
  final String productModelId;
  final String modelName;
  final String wpDeviceId;
  final String? macId;
  final String mainImage;
  final List<String> subImages;
  final String? modelType;
  final String? orderType;
  final SelectedPlan selectedPlan;
  final SelectedDuration selectedDuration;
  final double price;
  final double grandTotal;
  final DeliveryAddress deliveryAddress;
  final String paymentStatus;
  final String paymentType;
  final String orderStatus;
  final String razorpayOrderId;
  final int totalLitre;
  final int codFee;
  final String installationStatus;
  final String createdAt;
  final String updatedAt;
  final String razorpayPaymentId;
  final String subscriptionExpiryDate;
  final PlanConfig? planConfig;
  final bool? isSetup;
  final List<Task> tasks;
  final String? deliveryAcceptanceStatus;
  final String? deliveryAcceptanceTimestamp;
  final String? deliveryCompletionTimestamp;
  final String? deliveryCurrentStatus;
  final List<DeliveryHistory> deliveryHistory;
  final bool? deliveryCompletionStatus;

  const Subscription({
    required this.id,
    required this.customOrderId,
    required this.userId,
    required this.productModelId,
    required this.modelName,
    required this.wpDeviceId,
    this.macId,
    required this.mainImage,
    required this.subImages,
    this.modelType,
    this.orderType,
    required this.selectedPlan,
    required this.selectedDuration,
    required this.price,
    required this.grandTotal,
    required this.deliveryAddress,
    required this.paymentStatus,
    required this.paymentType,
    required this.orderStatus,
    required this.razorpayOrderId,
    required this.totalLitre,
    required this.codFee,
    required this.installationStatus,
    required this.createdAt,
    required this.updatedAt,
    required this.razorpayPaymentId,
    required this.subscriptionExpiryDate,
    this.planConfig,
    this.isSetup,
    required this.tasks,
    this.deliveryAcceptanceStatus,
    this.deliveryAcceptanceTimestamp,
    this.deliveryCompletionTimestamp,
    this.deliveryCurrentStatus,
    required this.deliveryHistory,
    this.deliveryCompletionStatus,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: _parseString(json['_id']),
      customOrderId: _parseString(json['customOrderId']),
      userId: json['user_id'] as int? ?? 0,
      productModelId: _parseString(json['productModelId']),
      modelName: _parseString(json['modelName']),
      wpDeviceId: _parseString(json['wp_device_id']),
      macId: _parseOptionalString(json['mac_id']),
      mainImage: _parseString(json['main_image']),
      subImages: (json['sub_images'] as List<dynamic>?)?.map((e) => _parseString(e)).toList() ?? [],
      modelType: json['modeltype'] != null ? _parseString(json['modeltype']) : null,
      orderType: json['orderType'] != null ? _parseString(json['orderType']) : null,
      selectedPlan: json['selectedPlan'] != null
          ? SelectedPlan.fromJson(json['selectedPlan'] as Map<String, dynamic>)
          : const SelectedPlan(plansId: 0, label: '', capacity: '', price: 0),
      selectedDuration: json['selectedDuration'] != null
          ? SelectedDuration.fromJson(json['selectedDuration'] as Map<String, dynamic>)
          : const SelectedDuration(durationId: 0, durationTimeLimit: '', gst: 0, discount: 0, securityDeposit: 0),
      price: _parseDouble(json['price']),
      grandTotal: _parseDouble(json['grandTotal']),
      deliveryAddress: json['deliveryAddress'] != null
          ? DeliveryAddress.fromJson(json['deliveryAddress'] as Map<String, dynamic>)
          : const DeliveryAddress(name: '', phone: '', street: '', landmark: '', city: '', district: '', state: '', pincode: '', email: ''),
      paymentStatus: _parseString(json['paymentStatus'], 'unknown'),
      paymentType: _parseString(json['paymentType'], 'COD'),
      orderStatus: _parseString(json['orderStatus'], 'unknown'),
      razorpayOrderId: _parseString(json['razorpayOrderId']),
      totalLitre: _parseInt(json['totalLitre']),
      codFee: _parseInt(json['codFee']),
      installationStatus: _parseString(json['installation_status'], 'Pending'),
      createdAt: _parseString(json['createdAt']),
      updatedAt: _parseString(json['updatedAt']),
      razorpayPaymentId: _parseString(json['razorpayPaymentId']),
      subscriptionExpiryDate: _parseString(json['subscriptionExpiryDate']),
      planConfig: json['plan_config'] != null
          ? PlanConfig.fromJson(json['plan_config'] as Map<String, dynamic>)
          : null,
      isSetup: _parseOptionalBool(json['isSetup']),
      tasks: (json['tasks'] as List<dynamic>?)?.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList() ?? [],
      deliveryAcceptanceStatus: _parseOptionalString(json['deliveryAcceptanceStatus']),
      deliveryAcceptanceTimestamp: _parseOptionalString(json['deliveryAcceptanceTimestamp']),
      deliveryCompletionTimestamp: _parseOptionalString(json['deliveryCompletionTimestamp']),
      deliveryCurrentStatus: _parseOptionalString(json['deliveryCurrentStatus']),
      deliveryHistory: (json['deliveryHistory'] as List<dynamic>?)?.map((e) => DeliveryHistory.fromJson(e as Map<String, dynamic>)).toList() ?? [],
      deliveryCompletionStatus: json.containsKey('deliveryCompletionStatus') && json['deliveryCompletionStatus'] is bool ? json['deliveryCompletionStatus'] as bool : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'customOrderId': customOrderId,
      'user_id': userId,
      'productModelId': productModelId,
      'modelName': modelName,
      'wp_device_id': wpDeviceId,
      'mac_id': macId,
      'main_image': mainImage,
      'sub_images': subImages,
      'modeltype': modelType,
      'orderType': orderType,
      'selectedPlan': selectedPlan.toJson(),
      'selectedDuration': selectedDuration.toJson(),
      'price': price,
      'grandTotal': grandTotal,
      'deliveryAddress': deliveryAddress.toJson(),
      'paymentStatus': paymentStatus,
      'paymentType': paymentType,
      'orderStatus': orderStatus,
      'razorpayOrderId': razorpayOrderId,
      'totalLitre': totalLitre,
      'codFee': codFee,
      'installation_status': installationStatus,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'razorpayPaymentId': razorpayPaymentId,
      'subscriptionExpiryDate': subscriptionExpiryDate,
      'plan_config': planConfig?.toJson(),
      'isSetup': isSetup,
      'tasks': tasks.map((t) => t.toJson()).toList(),
      'deliveryAcceptanceStatus': deliveryAcceptanceStatus,
      'deliveryAcceptanceTimestamp': deliveryAcceptanceTimestamp,
      'deliveryCompletionTimestamp': deliveryCompletionTimestamp,
      'deliveryCurrentStatus': deliveryCurrentStatus,
      'deliveryHistory': deliveryHistory.map((h) => h.toJson()).toList(),
      'deliveryCompletionStatus': deliveryCompletionStatus,
    };
  }

  @override
  List<Object?> get props => [
        id,
        customOrderId,
        userId,
        productModelId,
        modelName,
        wpDeviceId,
        macId,
        mainImage,
        subImages,
        modelType,
        orderType,
        selectedPlan,
        selectedDuration,
        price,
        grandTotal,
        deliveryAddress,
        paymentStatus,
        paymentType,
        orderStatus,
        razorpayOrderId,
        totalLitre,
        codFee,
        installationStatus,
        createdAt,
        updatedAt,
        razorpayPaymentId,
        subscriptionExpiryDate,
        planConfig,
        isSetup,
        tasks,
        deliveryAcceptanceStatus,
        deliveryAcceptanceTimestamp,
        deliveryCompletionTimestamp,
        deliveryCurrentStatus,
        deliveryHistory,
        deliveryCompletionStatus,
      ];
}

/// Represents the selected plan details within a subscription.
class SelectedPlan extends Equatable {
  final int plansId;
  final String label;
  final String capacity;
  final int price;

  const SelectedPlan({
    required this.plansId,
    required this.label,
    required this.capacity,
    required this.price,
  });

  factory SelectedPlan.fromJson(Map<String, dynamic> json) {
    return SelectedPlan(
      plansId: _parseInt(json['plans_id']),
      label: _parseString(json['label']),
      capacity: _parseString(json['capacity']),
      price: _parseInt(json['price']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'plans_id': plansId,
      'label': label,
      'capacity': capacity,
      'price': price,
    };
  }

  @override
  List<Object?> get props => [plansId, label, capacity, price];
}

/// Represents the selected duration details within a subscription.
class SelectedDuration extends Equatable {
  final int durationId;
  final String durationTimeLimit;
  final double gst;
  final double discount;
  final double securityDeposit;

  const SelectedDuration({
    required this.durationId,
    required this.durationTimeLimit,
    required this.gst,
    required this.discount,
    required this.securityDeposit,
  });

  factory SelectedDuration.fromJson(Map<String, dynamic> json) {
    return SelectedDuration(
      durationId: _parseInt(json['duration_id']),
      durationTimeLimit: _parseString(json['duration_time_limit']),
      gst: _parseDouble(json['gst']),
      discount: _parseDouble(json['discount']),
      securityDeposit: _parseDouble(json['security_deposit']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'duration_id': durationId,
      'duration_time_limit': durationTimeLimit,
      'gst': gst,
      'discount': discount,
      'security_deposit': securityDeposit,
    };
  }

  @override
  List<Object?> get props => [
        durationId,
        durationTimeLimit,
        gst,
        discount,
        securityDeposit,
      ];
}

class PlanConnectivity extends Equatable {
  final int ble;
  final int wifi;
  final int fourG;
  final int ethernet;

  const PlanConnectivity({
    required this.ble,
    required this.wifi,
    required this.fourG,
    required this.ethernet,
  });

  factory PlanConnectivity.fromJson(Map<String, dynamic> json) {
    return PlanConnectivity(
      ble: _parseInt(json['ble']),
      wifi: _parseInt(json['wifi']),
      fourG: _parseInt(json['4g']),
      ethernet: _parseInt(json['ethernet']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'ble': ble,
      'wifi': wifi,
      '4g': fourG,
      'ethernet': ethernet,
    };
  }

  @override
  List<Object?> get props => [ble, wifi, fourG, ethernet];
}

class PlanConfig extends Equatable {
  final String wpDeviceId;
  final String macId;
  final int totalWaterLimit;
  final String startDate;
  final String endDate;
  final int renewal;
  final PlanConnectivity connectivity;
  final String timestamp;

  const PlanConfig({
    required this.wpDeviceId,
    required this.macId,
    required this.totalWaterLimit,
    required this.startDate,
    required this.endDate,
    required this.renewal,
    required this.connectivity,
    required this.timestamp,
  });

  factory PlanConfig.fromJson(Map<String, dynamic> json) {
    return PlanConfig(
      wpDeviceId: _parseString(json['wp_device_id']),
      macId: _parseString(json['mac_id']),
      totalWaterLimit: _parseInt(json['totalWaterLimit']),
      startDate: _parseString(json['startDate']),
      endDate: _parseString(json['endDate']),
      renewal: _parseInt(json['renewal']),
      connectivity: json['connectivity'] is Map<String, dynamic>
          ? PlanConnectivity.fromJson(json['connectivity'] as Map<String, dynamic>)
          : const PlanConnectivity(ble: 0, wifi: 0, fourG: 0, ethernet: 0),
      timestamp: _parseString(json['timestamp']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'wp_device_id': wpDeviceId,
      'mac_id': macId,
      'totalWaterLimit': totalWaterLimit,
      'startDate': startDate,
      'endDate': endDate,
      'renewal': renewal,
      'connectivity': connectivity.toJson(),
      'timestamp': timestamp,
    };
  }

  @override
  List<Object?> get props => [
        wpDeviceId,
        macId,
        totalWaterLimit,
        startDate,
        endDate,
        renewal,
        connectivity,
        timestamp,
      ];
}

/// Represents the delivery address within a subscription.
class DeliveryAddress extends Equatable {
  final String name;
  final String phone;
  final String street;
  final String landmark;
  final String city;
  final String district;
  final String state;
  final String pincode;
  final String email;

  const DeliveryAddress({
    required this.name,
    required this.phone,
    required this.street,
    required this.landmark,
    required this.city,
    required this.district,
    required this.state,
    required this.pincode,
    required this.email,
  });

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    return DeliveryAddress(
      name: _parseString(json['name']),
      phone: _parseString(json['phone']),
      street: _parseString(json['street']),
      landmark: _parseString(json['landmark']),
      city: _parseString(json['city']),
      district: _parseString(json['district']),
      state: _parseString(json['state']),
      pincode: _parseString(json['pincode']),
      email: _parseString(json['email']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'street': street,
      'landmark': landmark,
      'city': city,
      'district': district,
      'state': state,
      'pincode': pincode,
      'email': email,
    };
  }

  @override
  List<Object?> get props => [
        name,
        phone,
        street,
        landmark,
        city,
        district,
        state,
        pincode,
        email,
      ];
}

/// Represents a device that needs setup
class Device extends Equatable {
  final String wpDeviceId;
  final String modelName;
  final String modelType;
  final String orderType;
  final String orderId;
  final DeliveryAddress deliveryAddress;
  final SelectedPlan selectedPlan;
  final String installationStatus;
  final PlanConfig? planConfig;

  const Device({
    required this.wpDeviceId,
    required this.modelName,
    required this.modelType,
    required this.orderType,
    required this.orderId,
    required this.deliveryAddress,
    required this.selectedPlan,
    required this.installationStatus,
    this.planConfig,
  });

  factory Device.fromOrder(Order order) {
    return Device(
      wpDeviceId: order.wpDeviceId,
      modelName: order.modelName,
      modelType: order.modelType ?? 'smart',
      orderType: order.orderType ?? 'Recharge',
      orderId: order.id,
      deliveryAddress: order.deliveryAddress,
      selectedPlan: order.selectedPlan,
      installationStatus: order.installationStatus,
      planConfig: order.planConfig,
    );
  }

  @override
  List<Object?> get props => [
        wpDeviceId,
        modelName,
        modelType,
        orderType,
        orderId,
        deliveryAddress,
        selectedPlan,
        installationStatus,
        planConfig,
      ];
}

/// Represents a delivery status history entry.
class DeliveryHistory extends Equatable {
  final String status;
  final String timestamp;
  final String notes;
  final String updatedBy;

  const DeliveryHistory({
    required this.status,
    required this.timestamp,
    required this.notes,
    required this.updatedBy,
  });

  factory DeliveryHistory.fromJson(Map<String, dynamic> json) {
    return DeliveryHistory(
      status: _parseString(json['status']),
      timestamp: _parseString(json['timestamp']),
      notes: _parseString(json['notes']),
      updatedBy: _parseString(json['updatedBy']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'timestamp': timestamp,
      'notes': notes,
      'updatedBy': updatedBy,
    };
  }

  @override
  List<Object?> get props => [status, timestamp, notes, updatedBy];
}

/// Represents a task within a subscription (installation or service).
class Task extends Equatable {
  final int taskType;
  final String taskStatus;
  final Technician technician;
  final String? estimatedEnd;

  const Task({
    required this.taskType,
    required this.taskStatus,
    required this.technician,
    this.estimatedEnd,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      taskType: _parseInt(json['task_type']),
      taskStatus: _parseString(json['task_status']),
      technician: json['technician'] is Map ? Technician.fromJson(json['technician'] as Map<String, dynamic>) : const Technician(name: '', phone: ''),
      estimatedEnd: _parseOptionalString(json['estimated_end']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'task_type': taskType,
      'task_status': taskStatus,
      'technician': technician.toJson(),
      'estimated_end': estimatedEnd,
    };
  }

  @override
  List<Object?> get props => [taskType, taskStatus, technician, estimatedEnd];
}

/// Represents a technician assigned to a task.
class Technician extends Equatable {
  final String name;
  final String phone;

  const Technician({
    required this.name,
    required this.phone,
  });

  factory Technician.fromJson(Map<String, dynamic> json) {
    return Technician(
      name: _parseString(json['name']),
      phone: _parseString(json['phone']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
    };
  }

  @override
  List<Object?> get props => [name, phone];
}

// Response for fetching orders (multiple subscriptions)
class OrdersResponse extends Equatable {
  final bool error;
  final String message;
  final List<Order> data;

  const OrdersResponse({
    required this.error,
    required this.message,
    required this.data,
  });

  factory OrdersResponse.fromJson(Map<String, dynamic> json) {
    List<Order> data = [];
    if (json['data'] != null) {
      final dataJson = json['data'];
      if (dataJson is List<dynamic>) {
        data = dataJson.map((item) => Order.fromJson(item as Map<String, dynamic>)).toList();
      } else if (dataJson is Map<String, dynamic>) {
        // Handle case where data is a Map with subscription: null or a single subscription
        final subscription = dataJson['subscription'];
        if (subscription != null && subscription is Map<String, dynamic>) {
          data = [Order.fromJson(subscription)];
        }
        // If subscription is null, data remains empty
      }
    }
    return OrdersResponse(
      error: json['error'] as bool? ?? true,
      message: _parseString(json['message'], 'Unknown error'),
      data: data,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'error': error,
      'message': message,
      'data': data.map((item) => item.toJson()).toList(),
    };
  }

  @override
  List<Object?> get props => [error, message, data];
}
