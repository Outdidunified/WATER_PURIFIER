import 'package:equatable/equatable.dart';

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
      message: json['message'] as String? ?? 'Unknown error',
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
  final String mainImage;
  final List<String> subImages;
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
    required this.mainImage,
    required this.subImages,
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
      id: json['_id'] as String? ?? '',
      customOrderId: json['customOrderId'] as String? ?? '',
      userId: json['user_id'] as int? ?? 0,
      productModelId: json['productModelId'] as String? ?? '',
      modelName: json['modelName'] as String? ?? '',
      wpDeviceId: json['wp_device_id'] as String? ?? '',
      mainImage: json['main_image'] as String? ?? '',
      subImages: (json['sub_images'] as List<dynamic>?)?.map((e) => e as String).toList() ?? [],
      selectedPlan: json['selectedPlan'] != null
          ? SelectedPlan.fromJson(json['selectedPlan'] as Map<String, dynamic>)
          : const SelectedPlan(plansId: 0, label: '', capacity: '', price: 0),
      selectedDuration: json['selectedDuration'] != null
          ? SelectedDuration.fromJson(json['selectedDuration'] as Map<String, dynamic>)
          : const SelectedDuration(durationId: 0, durationTimeLimit: '', gst: 0, discount: 0, securityDeposit: 0),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0.0,
      deliveryAddress: json['deliveryAddress'] != null
          ? DeliveryAddress.fromJson(json['deliveryAddress'] as Map<String, dynamic>)
          : const DeliveryAddress(name: '', phone: '', street: '', landmark: '', city: '', district: '', state: '', pincode: '', email: ''),
      paymentStatus: json['paymentStatus'] as String? ?? 'unknown',
      paymentType: json['paymentType'] as String? ?? 'COD',
      orderStatus: json['orderStatus'] as String? ?? 'unknown',
      razorpayOrderId: json['razorpayOrderId'] as String? ?? '',
      totalLitre: json['totalLitre'] as int? ?? 0,
      codFee: json['codFee'] as int? ?? 0,
      installationStatus: json['installation_status'] as String? ?? 'Pending',
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      razorpayPaymentId: json['razorpayPaymentId'] as String? ?? '',
      subscriptionExpiryDate: json['subscriptionExpiryDate'] as String? ?? '',
      tasks: (json['tasks'] as List<dynamic>?)?.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList() ?? [],
      deliveryAcceptanceStatus: json.containsKey('deliveryAcceptanceStatus') && json['deliveryAcceptanceStatus'] is String ? json['deliveryAcceptanceStatus'] as String : null,
      deliveryAcceptanceTimestamp: json.containsKey('deliveryAcceptanceTimestamp') && json['deliveryAcceptanceTimestamp'] is String ? json['deliveryAcceptanceTimestamp'] as String : null,
      deliveryCompletionTimestamp: json.containsKey('deliveryCompletionTimestamp') && json['deliveryCompletionTimestamp'] is String ? json['deliveryCompletionTimestamp'] as String : null,
      deliveryCurrentStatus: json.containsKey('deliveryCurrentStatus') && json['deliveryCurrentStatus'] is String ? json['deliveryCurrentStatus'] as String : null,
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
      'main_image': mainImage,
      'sub_images': subImages,
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
        mainImage,
        subImages,
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
      plansId: json['plans_id'] is int ? json['plans_id'] as int : 0,
      label: json['label'] is String ? json['label'] as String : '',
      capacity: json['capacity'] is String ? json['capacity'] as String : '',
      price: json['price'] is int ? json['price'] as int : 0,
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
      durationId: json['duration_id'] is int ? json['duration_id'] as int : 0,
      durationTimeLimit: json['duration_time_limit'] is String ? json['duration_time_limit'] as String : '',
      gst: json['gst'] is num ? (json['gst'] as num).toDouble() : 0.0,
      discount: json['discount'] is num ? (json['discount'] as num).toDouble() : 0.0,
      securityDeposit: json['security_deposit'] is num ? (json['security_deposit'] as num).toDouble() : 0.0,
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
      name: json['name'] is String ? json['name'] as String : '',
      phone: json['phone'] is String ? json['phone'] as String : '',
      street: json['street'] is String ? json['street'] as String : '',
      landmark: json['landmark'] is String ? json['landmark'] as String : '',
      city: json['city'] is String ? json['city'] as String : '',
      district: json['district'] is String ? json['district'] as String : '',
      state: json['state'] is String ? json['state'] as String : '',
      pincode: json['pincode'] is String ? json['pincode'] as String : '',
      email: json['email'] is String ? json['email'] as String : '',
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

// Alias for backward compatibility
typedef Order = Subscription;

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
      status: json['status'] is String ? json['status'] as String : '',
      timestamp: json['timestamp'] is String ? json['timestamp'] as String : '',
      notes: json['notes'] is String ? json['notes'] as String : '',
      updatedBy: json['updatedBy'] is String ? json['updatedBy'] as String : '',
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
      taskType: json['task_type'] is int ? json['task_type'] as int : 0,
      taskStatus: json['task_status'] is String ? json['task_status'] as String : '',
      technician: json['technician'] is Map ? Technician.fromJson(json['technician'] as Map<String, dynamic>) : const Technician(name: '', phone: ''),
      estimatedEnd: json['estimated_end'] is String ? json['estimated_end'] as String : null,
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
      name: json['name'] is String ? json['name'] as String : '',
      phone: json['phone'] != null ? json['phone'].toString() : '',
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
      message: json['message'] as String? ?? 'Unknown error',
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
