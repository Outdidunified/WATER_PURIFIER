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
  final SelectedPlan selectedPlan;
  final SelectedDuration selectedDuration;
  final double price;
  final DeliveryAddress deliveryAddress;
  final String paymentStatus;
  final String orderStatus;
  final String razorpayOrderId;
  final int totalLitre;
  final String createdAt;
  final String updatedAt;
  final String razorpayPaymentId;
  final String subscriptionExpiryDate;

  const Subscription({
    required this.id,
    required this.customOrderId,
    required this.userId,
    required this.productModelId,
    required this.modelName,
    required this.wpDeviceId,
    required this.selectedPlan,
    required this.selectedDuration,
    required this.price,
    required this.deliveryAddress,
    required this.paymentStatus,
    required this.orderStatus,
    required this.razorpayOrderId,
    required this.totalLitre,
    required this.createdAt,
    required this.updatedAt,
    required this.razorpayPaymentId,
    required this.subscriptionExpiryDate,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['_id'] as String? ?? '',
      customOrderId: json['customOrderId'] as String? ?? '',
      userId: json['user_id'] as int? ?? 0,
      productModelId: json['productModelId'] as String? ?? '',
      modelName: json['modelName'] as String? ?? '',
      wpDeviceId: json['wp_device_id'] as String? ?? '',
      selectedPlan:
          SelectedPlan.fromJson(json['selectedPlan'] as Map<String, dynamic>),
      selectedDuration: SelectedDuration.fromJson(
          json['selectedDuration'] as Map<String, dynamic>),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      deliveryAddress: DeliveryAddress.fromJson(
          json['deliveryAddress'] as Map<String, dynamic>),
      paymentStatus: json['paymentStatus'] as String? ?? 'unknown',
      orderStatus: json['orderStatus'] as String? ?? 'unknown',
      razorpayOrderId: json['razorpayOrderId'] as String? ?? '',
      totalLitre: json['totalLitre'] as int? ?? 0,
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      razorpayPaymentId: json['razorpayPaymentId'] as String? ?? '',
      subscriptionExpiryDate: json['subscriptionExpiryDate'] as String? ?? '',
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
      'selectedPlan': selectedPlan.toJson(),
      'selectedDuration': selectedDuration.toJson(),
      'price': price,
      'deliveryAddress': deliveryAddress.toJson(),
      'paymentStatus': paymentStatus,
      'orderStatus': orderStatus,
      'razorpayOrderId': razorpayOrderId,
      'totalLitre': totalLitre,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'razorpayPaymentId': razorpayPaymentId,
      'subscriptionExpiryDate': subscriptionExpiryDate,
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
        selectedPlan,
        selectedDuration,
        price,
        deliveryAddress,
        paymentStatus,
        orderStatus,
        razorpayOrderId,
        totalLitre,
        createdAt,
        updatedAt,
        razorpayPaymentId,
        subscriptionExpiryDate,
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
      plansId: json['plans_id'] as int? ?? 0,
      label: json['label'] as String? ?? '',
      capacity: json['capacity'] as String? ?? '',
      price: json['price'] as int? ?? 0,
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
  final int gst;
  final int discount;
  final int securityDeposit;

  const SelectedDuration({
    required this.durationId,
    required this.durationTimeLimit,
    required this.gst,
    required this.discount,
    required this.securityDeposit,
  });

  factory SelectedDuration.fromJson(Map<String, dynamic> json) {
    return SelectedDuration(
      durationId: json['duration_id'] as int? ?? 0,
      durationTimeLimit: json['duration_time_limit'] as String? ?? '',
      gst: json['gst'] as int? ?? 0,
      discount: json['discount'] as int? ?? 0,
      securityDeposit: json['security_deposit'] as int? ?? 0,
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
  final String addressLine1;
  final String city;
  final String state;
  final String pincode;

  const DeliveryAddress({
    required this.name,
    required this.phone,
    required this.addressLine1,
    required this.city,
    required this.state,
    required this.pincode,
  });

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    return DeliveryAddress(
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      addressLine1: json['addressLine1'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'addressLine1': addressLine1,
      'city': city,
      'state': state,
      'pincode': pincode,
    };
  }

  @override
  List<Object?> get props => [
        name,
        phone,
        addressLine1,
        city,
        state,
        pincode,
      ];
}
