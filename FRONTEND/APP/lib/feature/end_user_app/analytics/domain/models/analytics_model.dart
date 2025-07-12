import 'package:equatable/equatable.dart';

class AnalyticsResponse extends Equatable {
  final bool error;
  final String message;
  final AnalyticsData? data;

  const AnalyticsResponse({
    required this.error,
    required this.message,
    this.data,
  });

  factory AnalyticsResponse.fromJson(Map<String, dynamic> json) {
    return AnalyticsResponse(
      error: json['error'] as bool? ?? true,
      message: json['message'] as String? ?? 'Unknown error',
      data: json['data'] != null
          ? AnalyticsData.fromJson(json['data'] as Map<String, dynamic>)
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

class AnalyticsData extends Equatable {
  final List<DailyData> daily;
  final List<WeeklyData> weekly;
  final List<MonthlyData> monthly;
  final int totalWaterConsumed;
  final int plasticBottlesSaved;
  final int carbonFootprintSavedKg;

  const AnalyticsData({
    required this.daily,
    required this.weekly,
    required this.monthly,
    required this.totalWaterConsumed,
    required this.plasticBottlesSaved,
    required this.carbonFootprintSavedKg,
  });

  factory AnalyticsData.fromJson(Map<String, dynamic> json) {
    return AnalyticsData(
      daily: (json['daily'] as List<dynamic>)
          .map((e) => DailyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      weekly: (json['weekly'] as List<dynamic>)
          .map((e) => WeeklyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      monthly: (json['monthly'] as List<dynamic>)
          .map((e) => MonthlyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalWaterConsumed: json['totalWaterConsumed'] as int? ?? 0,
      plasticBottlesSaved: json['plasticBottlesSaved'] as int? ?? 0,
      carbonFootprintSavedKg: json['carbonFootprintSavedKg'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'daily': daily.map((e) => e.toJson()).toList(),
      'weekly': weekly.map((e) => e.toJson()).toList(),
      'monthly': monthly.map((e) => e.toJson()).toList(),
      'totalWaterConsumed': totalWaterConsumed,
      'plasticBottlesSaved': plasticBottlesSaved,
      'carbonFootprintSavedKg': carbonFootprintSavedKg,
    };
  }

  @override
  List<Object?> get props => [
        daily,
        weekly,
        monthly,
        totalWaterConsumed,
        plasticBottlesSaved,
        carbonFootprintSavedKg,
      ];
}

class DailyData extends Equatable {
  final String date;
  final int total;

  const DailyData({required this.date, required this.total});

  factory DailyData.fromJson(Map<String, dynamic> json) {
    return DailyData(
      date: json['date'] as String? ?? '',
      total: json['total'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'total': total,
    };
  }

  @override
  List<Object?> get props => [date, total];
}

class WeeklyData extends Equatable {
  final String week;
  final int total;

  const WeeklyData({required this.week, required this.total});

  factory WeeklyData.fromJson(Map<String, dynamic> json) {
    return WeeklyData(
      week: json['week'] as String? ?? '',
      total: json['total'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'week': week,
      'total': total,
    };
  }

  @override
  List<Object?> get props => [week, total];
}

class MonthlyData extends Equatable {
  final String month;
  final int total;

  const MonthlyData({required this.month, required this.total});

  factory MonthlyData.fromJson(Map<String, dynamic> json) {
    return MonthlyData(
      month: json['month'] as String? ?? '',
      total: json['total'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'month': month,
      'total': total,
    };
  }

  @override
  List<Object?> get props => [month, total];
}
