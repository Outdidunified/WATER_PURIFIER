// feature/end_user_app/settings/domain/models/technician_details_model.dart
class TechnicianDetailsModel {
  final int userId;
  final String name;
  final String email;
  final int phone;
  final String city;
  final bool status;
  final bool issubscribed;
  final DateTime createdDate;
  final TechnicianInfo technicianInfo;

  TechnicianDetailsModel({
    required this.userId,
    required this.name,
    required this.email,
    required this.phone,
    required this.city,
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
      phone: json['phone'] ?? 0,
      city: json['city'] ?? '',
      status: json['status'] ?? false,
      issubscribed: json['issubscribed'] ?? false,
      createdDate: DateTime.parse(
          json['createdDate'] ?? DateTime.now().toIso8601String()),
      technicianInfo: TechnicianInfo.fromJson(json['technician_info'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'name': name,
      'email': email,
      'phone': phone,
      'city': city,
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
    String? city,
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
      city: city ?? this.city,
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
