// File: lib/feature/end_user_app/settings/domain/models/payment_history_model.dart

import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart' show PlanConfig;

class PaymentHistory {
  final String? id;
  final int userId;
  final String? orderId;
  final String? razorpayOrderId;
  final double? baseRent;
  final double? discount;
  final double? discountedBaseRent;
  final double? finalMonthlyPrice;
  final double? discountAmount;
  final double? priceWithGST;
  final double? gstAmount;
  final double? securityDeposit;
  final double? totalPrice;
  final double? totalLitre;
  final String? paymentStatus;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? razorpayPaymentId;
  final DateTime? subscribedAt;
  final DateTime? subscriptionExpiryDate;
  final List<Order> orders; // Added orders field

  PaymentHistory({
    this.id,
    required this.userId,
    this.orderId,
    this.razorpayOrderId,
    this.baseRent,
    this.discount,
    this.discountedBaseRent,
    this.finalMonthlyPrice,
    this.discountAmount,
    this.priceWithGST,
    this.gstAmount,
    this.securityDeposit,
    this.totalPrice,
    this.totalLitre,
    this.paymentStatus,
    required this.createdAt,
    required this.updatedAt,
    this.razorpayPaymentId,
    this.subscribedAt,
    this.subscriptionExpiryDate,
    required this.orders,
  });

  factory PaymentHistory.fromJson(Map<String, dynamic> json) {
    final createdAtStr = json['createdAt'] as String?;
    final updatedAtStr = json['updatedAt'] as String?;
    final createdAt = createdAtStr != null ? DateTime.parse(createdAtStr) : DateTime.now();
    final updatedAt = updatedAtStr != null ? DateTime.parse(updatedAtStr) : createdAt;

    return PaymentHistory(
      id: json['_id'] as String?,
      userId: _toInt(json['user_id']) ?? 0,
      orderId: json['orderId'] as String?,
      razorpayOrderId: json['razorpayOrderId'] as String?,
      baseRent: _toDouble(json['baseRent']),
      discount: _toDouble(json['discount']),
      discountedBaseRent: _toDouble(json['discountedBaseRent']),
      finalMonthlyPrice: _toDouble(json['finalMonthlyPrice']),
      discountAmount: _toDouble(json['discountAmount']),
      priceWithGST: _toDouble(json['priceWithGST']),
      gstAmount: _toDouble(json['gstAmount']) ?? 0.0,
      securityDeposit: _toDouble(json['securityDeposit']) ?? 0.0,
      totalPrice: _toDouble(json['totalPrice']) ?? 0.0,
      totalLitre: _toDouble(json['totalLitre']),
      paymentStatus: json['paymentStatus'] as String?,
      createdAt: createdAt,
      updatedAt: updatedAt,
      razorpayPaymentId: json['razorpayPaymentId'] as String?,
      subscribedAt: json['subscribedAt'] != null
          ? DateTime.parse(json['subscribedAt'] as String)
          : null,
      subscriptionExpiryDate: json['subscriptionExpiryDate'] != null
          ? DateTime.parse(json['subscriptionExpiryDate'] as String)
          : null,
      orders: (json['orders'] as List<dynamic>?)
              ?.map((order) => Order.fromJson(order as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class Order {
  final String? id;
  final String? customOrderId;
  final int userId;
  final String? productModelId;
  final String? modelName;
  final String? wpDeviceId;
  final String? modelType;
  final String? orderType;
  final SelectedPlan selectedPlan;
  final SelectedDuration selectedDuration;
  final double? price;
  final DeliveryAddress deliveryAddress;
  final String? paymentStatus;
  final String? orderStatus;
  final String? razorpayOrderId;
  final double? totalLitre;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? razorpayPaymentId;
  final DateTime? subscriptionExpiryDate;
  final String? installationStatus;
  final DateTime? modifiedDate;
  final String? modifiedBy;
  final String? paymentType;
  final double? grandTotal;
  final int? codFee;
  final PlanConfig? planConfig;

  Order({
    this.id,
    this.customOrderId,
    required this.userId,
    this.productModelId,
    this.modelName,
    this.wpDeviceId,
    this.modelType,
    this.orderType,
    required this.selectedPlan,
    required this.selectedDuration,
    this.price,
    required this.deliveryAddress,
    this.paymentStatus,
    this.orderStatus,
    this.razorpayOrderId,
    this.totalLitre,
    required this.createdAt,
    required this.updatedAt,
    this.razorpayPaymentId,
    this.subscriptionExpiryDate,
    this.installationStatus,
    this.modifiedDate,
    this.modifiedBy,
    this.paymentType,
    this.grandTotal,
    this.codFee,
    this.planConfig,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] as String?,
      customOrderId: json['customOrderId'] as String?,
      userId: _toInt(json['user_id']) ?? 0,
      productModelId: json['productModelId']?.toString(),
      modelName: json['modelName'] as String?,
      wpDeviceId: json['wp_device_id'] as String?,
      modelType: json['modeltype'] as String?,
      orderType: json['orderType'] as String?,
      selectedPlan: json['selectedPlan'] != null
          ? SelectedPlan.fromJson(json['selectedPlan'] as Map<String, dynamic>)
          : SelectedPlan(plansId: 0),
      selectedDuration: json['selectedDuration'] != null
          ? SelectedDuration.fromJson(
              json['selectedDuration'] as Map<String, dynamic>)
          : SelectedDuration(durationId: 0),
      price: _toDouble(json['price'] ?? json['grandTotal']) ?? 0.0,
      deliveryAddress: json['deliveryAddress'] != null
          ? DeliveryAddress.fromJson(
              json['deliveryAddress'] as Map<String, dynamic>)
          : DeliveryAddress(),
      paymentStatus: json['paymentStatus'] as String?,
      orderStatus: json['orderStatus'] as String?,
      razorpayOrderId: json['razorpayOrderId'] as String?,
      totalLitre: _toDouble(json['totalLitre']),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      razorpayPaymentId: json['razorpayPaymentId'] as String?,
      subscriptionExpiryDate: json['subscriptionExpiryDate'] != null &&
              json['subscriptionExpiryDate'] != "2025-07-21T06:12:40.228Z"
          ? DateTime.parse(json['subscriptionExpiryDate'] as String)
          : null,
      installationStatus: json['installation_status'] as String?,
      modifiedDate: json['modifiedDate'] != null &&
              json['modifiedDate'] != "2025-07-21T06:12:40.228Z"
          ? DateTime.parse(json['modifiedDate'] as String)
          : null,
      modifiedBy: json['modified_by'] as String?,
      paymentType: json['paymentType'] as String?,
      grandTotal: _toDouble(json['grandTotal']),
      codFee: _toInt(json['codFee']),
      planConfig: json['plan_config'] != null
          ? PlanConfig.fromJson(json['plan_config'] as Map<String, dynamic>)
          : null,
    );
  }
}

class SelectedPlan {
  final int plansId;
  final String? label;
  final String? capacity;
  final double? price;

  SelectedPlan({
    required this.plansId,
    this.label,
    this.capacity,
    this.price,
  });

  factory SelectedPlan.fromJson(Map<String, dynamic> json) {
    return SelectedPlan(
      plansId: _toInt(json['plans_id']) ?? 0,
      label: json['label'] as String?,
      capacity: json['capacity'] as String?,
      price: _toDouble(json['price']),
    );
  }
}

class SelectedDuration {
  final int durationId;
  final String? durationTimeLimit;
  final double? price;
  final double? gst;
  final double? discount;
  final double? securityDeposit;

  SelectedDuration({
    required this.durationId,
    this.durationTimeLimit,
    this.price,
    this.gst,
    this.discount,
    this.securityDeposit,
  });

  factory SelectedDuration.fromJson(Map<String, dynamic> json) {
    return SelectedDuration(
      durationId: _toInt(json['duration_id']) ?? 0,
      durationTimeLimit: json['duration_time_limit'] as String?,
      price: _toDouble(json['price']),
      gst: _toDouble(json['gst']) ?? 0.0,
      discount: _toDouble(json['discount']) ?? 0.0,
      securityDeposit: _toDouble(json['security_deposit']) ?? 0.0,
    );
  }
}

// Helper function to convert various types to double
double? _toDouble(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) {
    try {
      return double.parse(value);
    } catch (e) {
      return null;
    }
  }
  if (value is num) return value.toDouble();
  return null;
}

// Helper function to convert various types to int
int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) {
    try {
      return int.parse(value);
    } catch (e) {
      return null;
    }
  }
  if (value is num) return value.toInt();
  return null;
}

class DeliveryAddress {
  final String? name;
  final String? phone;
  final String? addressLine1;
  final String? street;
  final String? landmark;
  final String? city;
  final String? state;
  final String? pincode;

  DeliveryAddress({
    this.name,
    this.phone,
    this.addressLine1,
    this.street,
    this.landmark,
    this.city,
    this.state,
    this.pincode,
  });

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    return DeliveryAddress(
      name: json['name'] as String?,
      phone: json['phone'] as String?,
      addressLine1: json['addressLine1'] as String?,
      street: json['street'] as String?,
      landmark: json['landmark'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      pincode: json['pincode'] as String?,
    );
  }
}
