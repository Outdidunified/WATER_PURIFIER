class UserData {
  final int? userId;
  final String? name;
  final String email;
  final int? phone;
  final int? password;

  // Address fields
  final String? addressline1;
  final String? addressline2;
  final String? city;
  final String? district;
  final String? state;
  final String? country;
  final String? pincode;

  final bool status;
  final bool isSubscribed;
  final DateTime createdDate;
  final DateTime? modified_date;

  UserData({
    required this.userId,
    required this.name,
    required this.email,
    required this.phone,
    this.password,
    this.addressline1,
    this.addressline2,
    this.city,
    this.district,
    this.state,
    this.country,
    this.pincode,
    required this.status,
    required this.isSubscribed,
    required this.createdDate,
    this.modified_date,
  });

  factory UserData.fromJson(Map<String, dynamic> json) {
    // Debug: Log raw JSON password value
    print('🔍 MODEL fromJson - Raw password value: ${json['password']} (type: ${json['password'].runtimeType})');
    
    // Handle password - can be int or String from backend
    int? passwordValue;
    if (json['password'] != null) {
      if (json['password'] is int) {
        passwordValue = json['password'] as int;
        print('🔍 MODEL fromJson - Parsed as int: $passwordValue');
      } else if (json['password'] is String) {
        passwordValue = int.tryParse(json['password'] as String);
        print('🔍 MODEL fromJson - Parsed from String: $passwordValue');
      }
    } else {
      print('🔍 MODEL fromJson - Password is null');
    }

    return UserData(
      userId: json['user_id'] as int?,
      name: json['name'] as String?,
      email: json['email'] as String,
      phone: json['phone'] as int?,
      password: passwordValue,
      addressline1: json['addressline1'] as String?,
      addressline2: json['addressline2'] as String?,
      city: json['city'] as String?,
      district: json['district'] as String?,
      state: json['state'] as String?,
      country: json['country'] as String?,
      pincode: json['pincode'] as String?,
      status: (json['status'] as bool?) ?? true,
      isSubscribed: (json['is_subscribed'] as bool?) ?? false,
      createdDate: DateTime.parse(json['createdDate'] as String),
      modified_date: json['modifiedDate'] != null
          ? DateTime.parse(json['modifiedDate'] as String)
          : null,
    );
  }

  UserData copyWith({
    int? userId,
    String? name,
    String? email,
    int? phone,
    int? password,
    String? addressline1,
    String? addressline2,
    String? city,
    String? district,
    String? state,
    String? country,
    String? pincode,
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
      password: password ?? this.password,
      addressline1: addressline1 ?? this.addressline1,
      addressline2: addressline2 ?? this.addressline2,
      city: city ?? this.city,
      district: district ?? this.district,
      state: state ?? this.state,
      country: country ?? this.country,
      pincode: pincode ?? this.pincode,
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
      error: (json['error'] as bool?) ?? false,
      message: (json['message'] as String?) ?? 'Unknown error',
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
