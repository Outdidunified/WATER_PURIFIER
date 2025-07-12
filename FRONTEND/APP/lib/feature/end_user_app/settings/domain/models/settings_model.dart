// Updated UserData model
class UserData {
  final int? userId;
  final String? name;
  final String email;
  final int? phone;
  final String? city;
  final bool status;
  final bool isSubscribed;
  final DateTime createdDate;
  final DateTime? modified_date;

  UserData({
    required this.userId,
    required this.name,
    required this.email,
    required this.phone,
    required this.city,
    required this.status,
    required this.isSubscribed,
    required this.createdDate,
    this.modified_date,
  });

  factory UserData.fromJson(Map<String, dynamic> json) {
    return UserData(
      userId: json['user_id'] as int?,
      name: json['name'] as String?,
      email: json['email'] as String,
      phone: json['phone'] as int?,
      city: json['city'] as String?,
      status: json['status'] as bool,
      isSubscribed: json['is_subscribed'] as bool,
      createdDate: DateTime.parse(json['createdDate'] as String),
      modified_date: json['modifiedDate'] != null
          ? DateTime.parse(json['modifiedDate'] as String)
          : null, // Map API's modifiedDate to modified_date
    );
  }

  UserData copyWith({
    int? userId,
    String? name,
    String? email,
    int? phone,
    String? city,
    bool? status,
    bool? isSubscribed,
    DateTime? createdDate,
    DateTime? modified_date,
  }) {
    return UserData(
      userId: userId ?? this.userId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      city: city ?? this.city,
      status: status ?? this.status,
      isSubscribed: isSubscribed ?? this.isSubscribed,
      createdDate: createdDate ?? this.createdDate,
      modified_date: modified_date ?? this.modified_date,
    );
  }
}

// Updated UserDetailsModel
class UserDetailsModel {
  final bool error;
  final String message;
  final UserData data;

  UserDetailsModel({
    required this.error,
    required this.message,
    required this.data,
  });

  factory UserDetailsModel.fromJson(Map<String, dynamic> json) {
    return UserDetailsModel(
      error: json['error'] as bool,
      message: json['message'] as String,
      data: UserData.fromJson(json['data'] as Map<String, dynamic>),
    );
  }

  UserDetailsModel copyWith({UserData? data}) {
    return UserDetailsModel(
      error: error,
      message: message,
      data: data ?? this.data,
    );
  }
}

class ServiceRequest {
  final int userId;
  final String userEmail;
  final String taskDescription;
  final String? deviceId; // Added to include deviceId, optional

  ServiceRequest({
    required this.userId,
    required this.userEmail,
    required this.taskDescription,
    this.deviceId, // Optional parameter
  });

  Map<String, dynamic> toJson() {
    return {
      "task_created_by_user_id": userId,
      "task_created_by_user_email": userEmail,
      "task_description": taskDescription,
      if (deviceId != null)
        "device_id": deviceId, // Include deviceId if present
    };
  }
}
