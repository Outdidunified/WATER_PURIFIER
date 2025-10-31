import 'package:equatable/equatable.dart';

class ProductModel extends Equatable {
  final String id;
  final int modelId;
  final String modelName;
  final String mainImg;
  final String subImg1;
  final String subImg2;
  final String subImg3;
  final String subImg4;
  final String productDetails;
  final String productSpecifications;
  final String wpDeviceQuantity;
  final List<Plan> plans;
  final List<DurationOption> duration;
  final String createdBy;
  final String modifiedBy;
  final DateTime createdDate;
  final DateTime modifiedDate;
  final bool status;

  const ProductModel({
    required this.id,
    required this.modelId,
    required this.modelName,
    required this.mainImg,
    required this.subImg1,
    required this.subImg2,
    required this.subImg3,
    required this.subImg4,
    required this.productDetails,
    required this.productSpecifications,
    required this.wpDeviceQuantity,
    required this.plans,
    required this.duration,
    required this.createdBy,
    required this.modifiedBy,
    required this.createdDate,
    required this.modifiedDate,
    required this.status,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['_id'] ?? '',
      modelId: json['model_id'] ?? 0,
      modelName: json['model_name'] ?? '',
      mainImg: json['main_img'] ?? '',
      subImg1: json['sub_img_1'] ?? '',
      subImg2: json['sub_img_2'] ?? '',
      subImg3: json['sub_img_3'] ?? '',
      subImg4: json['sub_img_4'] ?? '',
      productDetails: json['product_details'] ?? '',
      productSpecifications: json['product_specifications'] ?? '',
      wpDeviceQuantity: json['wp_device_quantity']?.toString() ?? '0',
      plans: (json['plans'] as List<dynamic>?)
              ?.map((plan) => Plan.fromJson(plan))
              .toList() ??
          [],
      duration: (json['duration'] as List<dynamic>?)
              ?.map((dur) => DurationOption.fromJson(dur))
              .toList() ??
          [],
      createdBy: json['createdby'] ?? '',
      modifiedBy: json['modifiedby'] ?? '',
      createdDate:
          DateTime.tryParse(json['createddate'] ?? '') ?? DateTime.now(),
      modifiedDate:
          DateTime.tryParse(json['modifieddate'] ?? '') ?? DateTime.now(),
      status: json['status'] ?? false,
    );
  }

  @override
  List<Object?> get props => [
        id,
        modelId,
        modelName,
        mainImg,
        subImg1,
        subImg2,
        subImg3,
        subImg4,
        productDetails,
        productSpecifications,
        wpDeviceQuantity,
        plans,
        duration,
        createdBy,
        modifiedBy,
        createdDate,
        modifiedDate,
        status,
      ];
}

class Plan extends Equatable {
  final int plansId;
  final String label;
  final String capacity;
  final int? price;

  const Plan({
    required this.plansId,
    required this.label,
    required this.capacity,
    this.price,
  });

  factory Plan.fromJson(Map<String, dynamic> json) {
    return Plan(
      plansId: json['plans_id'] ?? 0,
      label: json['label'] ?? '',
      capacity: json['capacity'] ?? '',
      price: json['price'] as int?,
    );
  }

  @override
  List<Object?> get props => [plansId, label, capacity, price];
}

class DurationOption extends Equatable {
  final int durationId;
  final String durationTimeLimit;
  final double gst;
  final double discount;
  final double securityDeposit;
  final int? price;
  final List<Plan> plans;

  const DurationOption({
    required this.durationId,
    required this.durationTimeLimit,
    required this.gst,
    required this.discount,
    required this.securityDeposit,
    this.price,
    this.plans = const [],
  });

  factory DurationOption.fromJson(Map<String, dynamic> json) {
    return DurationOption(
      durationId: json['duration_id'] ?? 0,
      durationTimeLimit: json['duration_time_limit'] ?? '',
      gst: (json['gst'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      securityDeposit: (json['security_deposit'] as num?)?.toDouble() ?? 0.0,
      price: json['price'] as int?,
      plans: (json['plans'] as List<dynamic>?)
              ?.map((plan) => Plan.fromJson(plan))
              .toList() ??
          [],
    );
  }

  @override
  List<Object?> get props => [
        durationId,
        durationTimeLimit,
        gst,
        discount,
        securityDeposit,
        price,
        plans,
      ];
}
