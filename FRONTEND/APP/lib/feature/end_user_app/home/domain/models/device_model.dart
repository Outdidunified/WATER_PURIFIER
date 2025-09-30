import 'package:equatable/equatable.dart';

class DeviceResponse extends Equatable {
  final bool error;
  final String message;
  final DeviceData? data;

  const DeviceResponse({
    required this.error,
    required this.message,
    this.data,
  });

  factory DeviceResponse.fromJson(Map<String, dynamic> json) {
    return DeviceResponse(
      error: json['error'] as bool? ?? true,
      message: json['message'] as String? ?? 'Unknown error',
      data: json['data'] != null
          ? DeviceData.fromJson(json['data'] as Map<String, dynamic>)
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

class DeviceData extends Equatable {
  final String id;
  final String deviceId;
  final String errorCode;
  final String? isAck;
  final String? isAlert;
  final String planType;
  final String powerStatus;
  final double pressure;
  final String? status;
  final String tankLevel;
  final int tdsIn;
  final int tdsOut;
  final double temperature;
  final String timestamp;
  final String topicType;
  final int totalWaterLimit;
  final double totalWaterUsed;
  final String valveStatus;

  // For backward compatibility
  bool get bluetooth => status != "OFFLINE";
  bool get wifi => status != "OFFLINE";
  double get litresDispensed => totalWaterUsed;
  int get tdsLevel => tdsOut;
  double get tankLevelValue => tankLevel == "FULL"
      ? 100.0
      : tankLevel == "MEDIUM"
          ? 50.0
          : 20.0;
  double get flowRate => pressure;
  String get filterStatus => errorCode == "NoError" ? "Good" : "Check";
  bool get uvStatus => errorCode == "NoError";
  String get faultedReason => errorCode == "NoError" ? "None" : errorCode;
  double get waterConsumed => totalWaterUsed;

  const DeviceData({
    required this.id,
    required this.deviceId,
    required this.errorCode,
    this.isAck,
    this.isAlert,
    required this.planType,
    required this.powerStatus,
    required this.pressure,
    required this.status,
    required this.tankLevel,
    required this.tdsIn,
    required this.tdsOut,
    required this.temperature,
    required this.timestamp,
    required this.topicType,
    required this.totalWaterLimit,
    required this.totalWaterUsed,
    required this.valveStatus,
  });

  factory DeviceData.fromJson(Map<String, dynamic> json) {
    return DeviceData(
      id: json['_id'] as String? ?? '',
      deviceId: json['deviceId'] as String? ?? '',
      errorCode: json['errorCode'] as String? ?? 'Unknown',
      isAck: json['is_ack'] as String?,
      isAlert: json['is_alert'] as String?,
      planType: json['planType'] as String? ?? 'BASIC',
      powerStatus: json['powerStatus'] as String? ?? 'OFF',
      pressure: (json['pressure'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'OFFLINE',
      tankLevel: json['tankLevel'] as String? ?? 'EMPTY',
      tdsIn: json['tdsIn'] as int? ?? 0,
      tdsOut: json['tdsOut'] as int? ?? 0,
      temperature: (json['temperature'] as num?)?.toDouble() ?? 0.0,
      timestamp: json['timestamp'] as String? ?? '',
      topicType: json['topicType'] as String? ?? '',
      totalWaterLimit: json['totalWaterLimit'] as int? ?? 0,
      totalWaterUsed: (json['totalWaterUsed'] as num?)?.toDouble() ?? 0.0,
      valveStatus: json['valveStatus'] as String? ?? 'CLOSED',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'deviceId': deviceId,
      'errorCode': errorCode,
      'is_ack': isAck,
      'is_alert': isAlert,
      'planType': planType,
      'powerStatus': powerStatus,
      'pressure': pressure,
      'status': status,
      'tankLevel': tankLevel,
      'tdsIn': tdsIn,
      'tdsOut': tdsOut,
      'temperature': temperature,
      'timestamp': timestamp,
      'topicType': topicType,
      'totalWaterLimit': totalWaterLimit,
      'totalWaterUsed': totalWaterUsed,
      'valveStatus': valveStatus,
    };
  }

  @override
  List<Object?> get props => [
        id,
        deviceId,
        errorCode,
        isAck,
        isAlert,
        planType,
        powerStatus,
        pressure,
        status,
        tankLevel,
        tdsIn,
        tdsOut,
        temperature,
        timestamp,
        topicType,
        totalWaterLimit,
        totalWaterUsed,
        valveStatus,
      ];
}
