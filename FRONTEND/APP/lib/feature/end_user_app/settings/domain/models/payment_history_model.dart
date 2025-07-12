// File: lib/feature/end_user_app/settings/domain/models/payment_history_model.dart

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
    return PaymentHistory(
      id: json['_id'] as String?,
      userId: json['user_id'] as int? ?? 0, // Default to 0 if null
      orderId: json['orderId'] as String?,
      razorpayOrderId: json['razorpayOrderId'] as String?,
      baseRent: (json['baseRent'] as num?)?.toDouble(),
      discount: (json['discount'] as num?)?.toDouble(),
      discountedBaseRent: (json['discountedBaseRent'] as num?)?.toDouble(),
      finalMonthlyPrice: (json['finalMonthlyPrice'] as num?)?.toDouble(),
      discountAmount: (json['discountAmount'] as num?)?.toDouble(),
      priceWithGST: (json['priceWithGST'] as num?)?.toDouble(),
      gstAmount: (json['gstAmount'] as num?)?.toDouble() ?? 0.0,
      securityDeposit: (json['securityDeposit'] as num?)?.toDouble() ?? 0.0,
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0.0,
      totalLitre: (json['totalLitre'] as num?)?.toDouble(),
      paymentStatus: json['paymentStatus'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
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

  Order({
    this.id,
    this.customOrderId,
    required this.userId,
    this.productModelId,
    this.modelName,
    this.wpDeviceId,
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
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] as String?,
      customOrderId: json['customOrderId'] as String?,
      userId: json['user_id'] as int? ?? 0, // Default to 0 if null
      productModelId: json['productModelId'] as String?,
      modelName: json['modelName'] as String?,
      wpDeviceId: json['wp_device_id'] as String?,
      selectedPlan:
          SelectedPlan.fromJson(json['selectedPlan'] as Map<String, dynamic>),
      selectedDuration: SelectedDuration.fromJson(
          json['selectedDuration'] as Map<String, dynamic>),
      price: (json['price'] ?? json['grandTotal'] as num?)?.toDouble() ?? 0.0,
      deliveryAddress: DeliveryAddress.fromJson(
          json['deliveryAddress'] as Map<String, dynamic>),
      paymentStatus: json['paymentStatus'] as String?,
      orderStatus: json['orderStatus'] as String?,
      razorpayOrderId: json['razorpayOrderId'] as String?,
      totalLitre: (json['totalLitre'] as num?)?.toDouble(),
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
      plansId: json['plans_id'] as int? ?? 0, // Default to 0 if null
      label: json['label'] as String?,
      capacity: json['capacity'] as String?,
      price: (json['price'] as num?)?.toDouble(),
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
      durationId: json['duration_id'] as int? ?? 0, // Default to 0 if null
      durationTimeLimit: json['duration_time_limit'] as String?,
      price: (json['price'] as num?)?.toDouble(),
      gst: (json['gst'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      securityDeposit: (json['security_deposit'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class DeliveryAddress {
  final String? name;
  final String? phone;
  final String? addressLine1;
  final String? city;
  final String? state;
  final String? pincode;

  DeliveryAddress({
    this.name,
    this.phone,
    this.addressLine1,
    this.city,
    this.state,
    this.pincode,
  });

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    return DeliveryAddress(
      name: json['name'] as String?,
      phone: json['phone'] as String?,
      addressLine1: json['addressLine1'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      pincode: json['pincode'] as String?,
    );
  }
}
