// feature/end_user_app/settings/domain/models/technician_details_model.dart
class TechnicianDetailsModel {
  final int userId;
  final String name;
  final String email;
  final int phone;
  final String addressline1;
  final String addressline2;
  final String city;
  final String district;
  final String state;
  final String country;
  final String pincode;
  final int? password;
  final bool status;
  final bool issubscribed;
  final DateTime createdDate;
  final TechnicianInfo technicianInfo;

  TechnicianDetailsModel({
    required this.userId,
    required this.name,
    required this.email,
    required this.phone,
    required this.addressline1,
    required this.addressline2,
    required this.city,
    required this.district,
    required this.state,
    required this.country,
    required this.pincode,
    this.password,
    required this.status,
    required this.issubscribed,
    required this.createdDate,
    required this.technicianInfo,
  });

  factory TechnicianDetailsModel.fromJson(Map<String, dynamic> json) {
    return TechnicianDetailsModel(
      userId: json['user_id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: int.tryParse(json['phone']?.toString() ?? '') ?? 0,
      addressline1: json['addressline1'] ?? '',
      addressline2: json['addressline2'] ?? '',
      city: json['city'] ?? '',
      district: json['district'] ?? '',
      state: json['state'] ?? '',
      country: json['country'] ?? '',
      pincode: json['pincode'] ?? '',
      password: int.tryParse(json['password']?.toString() ?? ''),
      status: json['status'] ?? false,
      issubscribed: json['issubscribed'] ?? false,
      createdDate: DateTime.tryParse(json['createdDate'] ?? '') ?? DateTime.now(),
      technicianInfo: TechnicianInfo.fromJson(json['technician_info'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'name': name,
      'email': email,
      'phone': phone,
      'addressline1': addressline1,
      'addressline2': addressline2,
      'city': city,
      'district': district,
      'state': state,
      'country': country,
      'pincode': pincode,
      'password': password,
      'status': status,
      'issubscribed': issubscribed,
      'createdDate': createdDate.toIso8601String(),
      'technician_info': technicianInfo.toJson(),
    };
  }

  TechnicianDetailsModel copyWith({
    int? userId,
    String? name,
    String? email,
    int? phone,
    String? addressline1,
    String? addressline2,
    String? city,
    String? district,
    String? state,
    String? country,
    String? pincode,
    int? password,
    bool? status,
    bool? issubscribed,
    DateTime? createdDate,
    TechnicianInfo? technicianInfo,
  }) {
    return TechnicianDetailsModel(
      userId: userId ?? this.userId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      addressline1: addressline1 ?? this.addressline1,
      addressline2: addressline2 ?? this.addressline2,
      city: city ?? this.city,
      district: district ?? this.district,
      state: state ?? this.state,
      country: country ?? this.country,
      pincode: pincode ?? this.pincode,
      password: password ?? this.password,
      status: status ?? this.status,
      issubscribed: issubscribed ?? this.issubscribed,
      createdDate: createdDate ?? this.createdDate,
      technicianInfo: technicianInfo ?? this.technicianInfo,
    );
  }
}

class TechnicianInfo {
  final int totalCompletedServices;
  final int totalIncompleteServices;

  TechnicianInfo({
    required this.totalCompletedServices,
    required this.totalIncompleteServices,
  });

  factory TechnicianInfo.fromJson(Map<String, dynamic> json) {
    return TechnicianInfo(
      totalCompletedServices: json['total_completed_services'] ?? 0,
      totalIncompleteServices: json['total_incomplete_services'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total_completed_services': totalCompletedServices,
      'total_incomplete_services': totalIncompleteServices,
    };
  }
}
