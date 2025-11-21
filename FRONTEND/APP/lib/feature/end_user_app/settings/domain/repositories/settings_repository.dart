import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart'
as home_models;
import 'package:ionhive_water_purifier/feature/end_user_app/settings/data/api.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/domain/models/payment_history_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/domain/models/settings_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/domain/models/service_request_model.dart';
import 'package:ionhive_water_purifier/utils/widgets/snackbar/custom_snackbar.dart';

class RepositoryResponse<T> {
  final bool error;
  final String? message;
  final T? data;

  RepositoryResponse({required this.error, this.message, this.data});
}



class SettingsRepository {
  final SettingsApi _api = SettingsApi();

  Future<RepositoryResponse<UserDetailsModel>> FetchUserDetails() async {
    try {
      final json = await _api.FetchUserDetails();
      final userDetails = UserDetailsModel.fromJson(json);
      return RepositoryResponse<UserDetailsModel>(
        error: userDetails.error,
        message: userDetails.message,
        data: userDetails.error ? null : userDetails,
      );
    } catch (e) {
      return RepositoryResponse<UserDetailsModel>(
        error: true,
        message: 'Note: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<List<PaymentHistory>>> getPaymentHistory() async {
    try {
      final json = await _api.fetchPaymentHistory();
      final bool success = json['success'] as bool? ?? false;
      final String? message = json['message'] as String?;
      final List<dynamic> paymentData = json['data'] ?? [];

      if (success) {
        final paymentHistoryList =
        paymentData.map((item) => PaymentHistory.fromJson(item)).toList();
        // Sort by createdAt in descending order
        paymentHistoryList.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        return RepositoryResponse<List<PaymentHistory>>(
          error: false,
          message: message,
          data: paymentHistoryList,
        );
      } else {
        return RepositoryResponse<List<PaymentHistory>>(
          error: true,
          message: message ?? 'Note: issue in fetch payment history',
          data: null,
        );
      }
    } catch (e) {
      CustomSnackbar.showError(message: e.toString());

      return RepositoryResponse<List<PaymentHistory>>(
        error: true,
        message: 'Note: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<Map<String, dynamic>>> updateUserDetails({
    required int? userId,
    required String email,
    required String name,
    required int phone,
    required String addressline1,
    required String addressline2,
    required String city,
    required String district,
    required String state,
    required String country,
    required String pincode,
    required String password,
  }) async {
    try {
      final json = await _api.updateUserDetails(
        userId: userId,
        email: email,
        name: name,
        phone: phone,
        addressline1: addressline1,
        addressline2: addressline2,
        city: city,
        district: district,
        state: state,
        country: country,
        pincode: pincode,
        password: password,
      );

      final bool error = json['error'] as bool? ?? true;
      final String? message = json['message'] as String?;
      return RepositoryResponse<Map<String, dynamic>>(
        error: error,
        message: message ??
            (error
                ? 'Failed to update user details'
                : 'User details updated successfully'),
        data: json['data'] as Map<String, dynamic>?,
      );
    } catch (e) {
      return RepositoryResponse<Map<String, dynamic>>(
        error: true,
        message: 'Note: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<void>> updateNotificationSettings({
    required int userId,
    required bool pushEnabled,
    required bool whatsappEnabled,
    required bool smsEnabled,
  }) async {
    try {
      final json = await _api.updateNotificationSettings(
        userId: userId,
        pushEnabled: pushEnabled,
        whatsappEnabled: whatsappEnabled,
        smsEnabled: smsEnabled,
      );
      final bool error = json['error'] as bool? ?? true;
      final String? message = json['message'] as String?;
      return RepositoryResponse<void>(
        error: error,
        message: message ??
            (error
                ? 'Failed to update notification settings'
                : 'Notification settings updated successfully'),
        data: null,
      );
    } catch (e) {
      return RepositoryResponse<void>(
        error: true,
        message: 'Note: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<ServiceRequestData>> createServiceRequest({
    required int userId,
    required String userEmail,
    required String taskDescription,
    String? wpDeviceId,
    String? modelName,
  }) async {
    try {
      final response = await _api.createServiceRequest(
        userId: userId,
        email: userEmail,
        task_description: taskDescription,
        wpDeviceId: wpDeviceId,
        modelName: modelName,
      );

      final serviceRequestResponse = ServiceRequestResponse.fromJson(response);

      return RepositoryResponse<ServiceRequestData>(
        error: serviceRequestResponse.error,
        message: serviceRequestResponse.message,
        data: serviceRequestResponse.data,
      );
    } catch (e) {
      return RepositoryResponse<ServiceRequestData>(
        error: true,
        message: 'Note: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<void>> saveMessage({
    required int userId,
    required Map<String, dynamic> message,
  }) async {
    try {
      final response = await _api.saveMessage(
        userId: userId,
        message: message,
      );

      final bool error = response['error'] as bool? ?? true;
      final String? responseMessage = response['message'] as String?;

      return RepositoryResponse<void>(
        error: error,
        message: responseMessage ??
            (error ? 'Failed to save message' : 'Message saved successfully'),
        data: null,
      );
    } catch (e) {
      return RepositoryResponse<void>(
        error: true,
        message: 'Note: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<List<home_models.Order>>>
  fetchActiveSubscriptions() async {
    try {
      final json = await _api.fetchActiveSubscriptions();
      final bool error = json['error'] as bool? ?? true;
      final String message = json['message'] as String? ?? '';
      final List<dynamic> data = json['data'] as List<dynamic>? ?? [];

      return RepositoryResponse<List<home_models.Order>>(
        error: error,
        message: message,
        data: error ? null : data.map((item) => home_models.Order.fromJson(item as Map<String, dynamic>)).toList(),
      );
    } catch (e) {
      return RepositoryResponse<List<home_models.Order>>(
        error: true,
        message: 'Note: ${e.toString()}',
        data: null,
      );
    }
  }
}
