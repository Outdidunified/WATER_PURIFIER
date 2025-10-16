import 'package:equatable/equatable.dart';

class TelemetryResponse extends Equatable {
  final String status;
  final String message;
  final TelemetryData? data;
  final String? deviceId;
  final String? timestamp;

  const TelemetryResponse({
    required this.status,
    required this.message,
    this.data,
    this.deviceId,
    this.timestamp,
  });

  factory TelemetryResponse.fromJson(Map<String, dynamic> json) {
    return TelemetryResponse(
      status: json['status'] as String? ?? 'Error',
      message: json['message'] as String? ?? 'Unknown error',
      data: json['data'] != null && json['data'] is Map<String, dynamic>
          ? TelemetryData.fromJson(json['data'] as Map<String, dynamic>)
          : null,
      deviceId: json['deviceId'] as String?,
      timestamp: json['timestamp'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'message': message,
      'data': data?.toJson(),
      'deviceId': deviceId,
      'timestamp': timestamp,
    };
  }

  @override
  List<Object?> get props => [status, message, data, deviceId, timestamp];
}

class TelemetryData extends Equatable {
  final String wpDeviceId;
  final String modelName;
  final String timestamp;
  final double totalWaterUsed;
  final int tdsIn;
  final int tdsOut;
  final double pressure;
  final double temperature;
  final String tankLevel;
  final String status;
  final String errorCode;
  final String valveStatus;
  final String powerStatus;
  final String planType;
  final int totalWaterLimit;
  final String deviceId;
  final String topicType;
  final WaterUsage waterUsage;
  final double voltage;
  final double current;
  final double filterLifeUsed;
  final bool leakDetected;

  const TelemetryData({
    required this.wpDeviceId,
    required this.modelName,
    required this.timestamp,
    required this.totalWaterUsed,
    required this.tdsIn,
    required this.tdsOut,
    required this.pressure,
    required this.temperature,
    required this.tankLevel,
    required this.status,
    required this.errorCode,
    required this.valveStatus,
    required this.powerStatus,
    required this.planType,
    required this.totalWaterLimit,
    required this.deviceId,
    required this.topicType,
    required this.waterUsage,
    required this.voltage,
    required this.current,
    required this.filterLifeUsed,
    required this.leakDetected,
  });

  factory TelemetryData.fromJson(Map<String, dynamic> json) {
    return TelemetryData(
      wpDeviceId: json['wp_device_id'] as String? ?? '',
      modelName: json['modelName'] as String? ?? '',
      timestamp: json['timestamp'] as String? ?? '',
      totalWaterUsed: (json['totalWaterUsed'] as num?)?.toDouble() ?? 0.0,
      tdsIn: (json['tdsIn'] as num?)?.toInt() ?? 0,
      tdsOut: (json['tdsOut'] as num?)?.toInt() ?? 0,
      pressure: (json['pressure'] as num?)?.toDouble() ?? 0.0,
      temperature: (json['temperature'] as num?)?.toDouble() ?? 0.0,
      tankLevel: json['tankLevel'] as String? ?? '',
      status: json['status'] as String? ?? '',
      errorCode: json['errorCode'] as String? ?? '',
      valveStatus: json['valveStatus'] as String? ?? '',
      powerStatus: json['powerStatus'] as String? ?? '',
      planType: json['planType'] as String? ?? '',
      totalWaterLimit: (json['totalWaterLimit'] as num?)?.toInt() ?? 0,
      deviceId: json['deviceId'] as String? ?? '',
      topicType: json['topicType'] as String? ?? '',
      waterUsage: json['waterUsage'] != null && json['waterUsage'] is Map<String, dynamic>
          ? WaterUsage.fromJson(json['waterUsage'] as Map<String, dynamic>)
          : const WaterUsage(
        daily: WaterUsagePeriod(records: [], count: 0, totalWaterUsed: 0.0, timeline: ''),
        weekly: WaterUsagePeriod(records: [], count: 0, totalWaterUsed: 0.0, timeline: ''),
        monthly: WaterUsagePeriod(records: [], count: 0, totalWaterUsed: 0.0, timeline: ''),
        yearly: WaterUsagePeriod(records: [], count: 0, totalWaterUsed: 0.0, timeline: ''),
      ),
      voltage: (json['voltage'] as num?)?.toDouble() ?? 0.0,
      current: (json['current'] as num?)?.toDouble() ?? 0.0,
      filterLifeUsed: (json['filterLifeUsed'] as num?)?.toDouble() ?? 0.0,
      leakDetected: json['leakDetected'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'wp_device_id': wpDeviceId,
      'modelName': modelName,
      'timestamp': timestamp,
      'totalWaterUsed': totalWaterUsed,
      'tdsIn': tdsIn,
      'tdsOut': tdsOut,
      'pressure': pressure,
      'temperature': temperature,
      'tankLevel': tankLevel,
      'status': status,
      'errorCode': errorCode,
      'valveStatus': valveStatus,
      'powerStatus': powerStatus,
      'planType': planType,
      'totalWaterLimit': totalWaterLimit,
      'deviceId': deviceId,
      'topicType': topicType,
      'waterUsage': waterUsage.toJson(),
      'voltage': voltage,
      'current': current,
      'filterLifeUsed': filterLifeUsed,
      'leakDetected': leakDetected,
    };
  }

  @override
  List<Object?> get props => [
    wpDeviceId,
    modelName,
    timestamp,
    totalWaterUsed,
    tdsIn,
    tdsOut,
    pressure,
    temperature,
    tankLevel,
    status,
    errorCode,
    valveStatus,
    powerStatus,
    planType,
    totalWaterLimit,
    deviceId,
    topicType,
    waterUsage,
    voltage,
    current,
    filterLifeUsed,
    leakDetected,
  ];
}

class WaterUsage extends Equatable {
  final WaterUsagePeriod daily;
  final WaterUsagePeriod weekly;
  final WaterUsagePeriod monthly;
  final WaterUsagePeriod yearly;

  const WaterUsage({
    required this.daily,
    required this.weekly,
    required this.monthly,
    required this.yearly,
  });

  factory WaterUsage.fromJson(Map<String, dynamic> json) {
    return WaterUsage(
      daily: json['daily'] != null && json['daily'] is Map<String, dynamic>
          ? WaterUsagePeriod.fromJson(json['daily'] as Map<String, dynamic>)
          : const WaterUsagePeriod(records: [], count: 0, totalWaterUsed: 0.0, timeline: ''),
      weekly: json['weekly'] != null && json['weekly'] is Map<String, dynamic>
          ? WaterUsagePeriod.fromJson(json['weekly'] as Map<String, dynamic>)
          : const WaterUsagePeriod(records: [], count: 0, totalWaterUsed: 0.0, timeline: ''),
      monthly: json['monthly'] != null && json['monthly'] is Map<String, dynamic>
          ? WaterUsagePeriod.fromJson(json['monthly'] as Map<String, dynamic>)
          : const WaterUsagePeriod(records: [], count: 0, totalWaterUsed: 0.0, timeline: ''),
      yearly: json['yearly'] != null && json['yearly'] is Map<String, dynamic>
          ? WaterUsagePeriod.fromJson(json['yearly'] as Map<String, dynamic>)
          : const WaterUsagePeriod(records: [], count: 0, totalWaterUsed: 0.0, timeline: ''),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'daily': daily.toJson(),
      'weekly': weekly.toJson(),
      'monthly': monthly.toJson(),
      'yearly': yearly.toJson(),
    };
  }

  @override
  List<Object?> get props => [daily, weekly, monthly, yearly];
}

class WaterUsagePeriod extends Equatable {
  final List<WaterUsageRecord> records;
  final int count;
  final double totalWaterUsed;
  final String timeline;

  const WaterUsagePeriod({
    required this.records,
    required this.count,
    required this.totalWaterUsed,
    required this.timeline,
  });

  factory WaterUsagePeriod.fromJson(Map<String, dynamic> json) {
    final recordsJson = json['records'];
    List<WaterUsageRecord> records = [];
    if (recordsJson is List<dynamic>) {
      records = recordsJson.where((e) => e is Map<String, dynamic>).map((e) => WaterUsageRecord.fromJson(e as Map<String, dynamic>)).toList();
    } else if (recordsJson is Map<String, dynamic>) {
      records = [WaterUsageRecord.fromJson(recordsJson)];
    } else if (recordsJson is Map<String, dynamic>) {
      records = [WaterUsageRecord.fromJson(recordsJson)];
    }
    return WaterUsagePeriod(
      records: records,
      count: (json['count'] as num?)?.toInt() ?? 0,
      totalWaterUsed: (json['totalWaterUsed'] as num?)?.toDouble() ?? 0.0,
      timeline: json['timeline'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'records': records.map((e) => e.toJson()).toList(),
      'count': count,
      'totalWaterUsed': totalWaterUsed,
      'timeline': timeline,
    };
  }

  @override
  List<Object?> get props => [records, count, totalWaterUsed, timeline];
}

class WaterUsageRecord extends Equatable {
  final String id;
  final String date;
  final String wpDeviceId;
  final int maxPressure;
  final int maxTDSOut;
  final int minPressure;
  final int minTDSOut;
  final String modelName;
  final double totalWaterUsed;
  final String updatedAt;

  const WaterUsageRecord({
    required this.id,
    required this.date,
    required this.wpDeviceId,
    required this.maxPressure,
    required this.maxTDSOut,
    required this.minPressure,
    required this.minTDSOut,
    required this.modelName,
    required this.totalWaterUsed,
    required this.updatedAt,
  });

  factory WaterUsageRecord.fromJson(Map<String, dynamic> json) {
    return WaterUsageRecord(
      id: json['_id'] as String? ?? '',
      date: json['date'] as String? ?? '',
      wpDeviceId: json['wp_device_id'] as String? ?? '',
      maxPressure: (json['maxPressure'] as num?)?.toInt() ?? 0,
      maxTDSOut: (json['maxTDSOut'] as num?)?.toInt() ?? 0,
      minPressure: (json['minPressure'] as num?)?.toInt() ?? 0,
      minTDSOut: (json['minTDSOut'] as num?)?.toInt() ?? 0,
      modelName: json['modelName'] as String? ?? '',
      totalWaterUsed: (json['totalWaterUsed'] as num?)?.toDouble() ?? 0.0,
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'date': date,
      'wp_device_id': wpDeviceId,
      'maxPressure': maxPressure,
      'maxTDSOut': maxTDSOut,
      'minPressure': minPressure,
      'minTDSOut': minTDSOut,
      'modelName': modelName,
      'totalWaterUsed': totalWaterUsed,
      'updatedAt': updatedAt,
    };
  }

  @override
  List<Object?> get props => [
    id,
    date,
    wpDeviceId,
    maxPressure,
    maxTDSOut,
    minPressure,
    minTDSOut,
    modelName,
    totalWaterUsed,
    updatedAt
  ];
}
