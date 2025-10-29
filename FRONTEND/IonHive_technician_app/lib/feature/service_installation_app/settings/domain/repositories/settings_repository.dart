// feature/service_installation_app/settings/data/settings_repository.dart
import 'package:ionhive_technician_app/feature/service_installation_app/settings/data/api.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/domain/models/settings_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/domain/models/leave_request_model.dart';

class RepositoryResponse<T> {
  final bool error;
  final String? message;
  final T? data;

  RepositoryResponse({required this.error, this.message, this.data});
}

class SettingsRepository {
  final SettingsApi _api = SettingsApi();

  Future<RepositoryResponse<TechnicianDetailsModel>> fetchUserDetails(int userId) async {
    try {
      final json = await _api.fetchUserDetails();
      final responseData = json['data'] as Map<String, dynamic>? ?? {};
      final bool error = json['error'] as bool? ?? true;
      final String? message = json['message'] as String?;

      if (!error && responseData.isNotEmpty) {
        final userDetails = TechnicianDetailsModel.fromJson(responseData);
        return RepositoryResponse<TechnicianDetailsModel>(
          error: false,
          message: message ?? 'User details fetched successfully',
          data: userDetails,
        );
      } else {
        return RepositoryResponse<TechnicianDetailsModel>(
          error: true,
          message: message ?? 'Failed to fetch user details',
          data: null,
        );
      }
    } catch (e) {
      return RepositoryResponse<TechnicianDetailsModel>(
        error: true,
        message: 'Error: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<void>> updateUserDetails({
    required int userId,
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

      return RepositoryResponse<void>(
        error: error,
        message: message ?? (error ? 'Failed to update user details' : 'User details updated successfully'),
        data: null,
      );
    } catch (e) {
      return RepositoryResponse<void>(
        error: true,
        message: 'Error: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<void>> requestLeave({
    required String technicianId,
    required String email,
    required String fromDate,
    required String toDate,
    required int numberOfDays,
    required String reason,
  }) async {
    try {
      final json = await _api.requestLeave(
        technicianId: technicianId,
        email: email,
        fromDate: fromDate,
        toDate: toDate,
        numberOfDays: numberOfDays,
        reason: reason,
      );
      final bool error = json['error'] as bool? ?? true;
      final String? message = json['message'] as String?;

      return RepositoryResponse<void>(
        error: error,
        message: message ?? (error ? 'Failed to request leave' : 'Leave request submitted successfully'),
        data: null,
      );
    } catch (e) {
      return RepositoryResponse<void>(
        error: true,
        message: 'Error: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<List<LeaveRequest>>> getTechnicianLeaveRequests({
    required String technicianId,
    required String email,
  }) async {
    try {
      final json = await _api.getTechnicianLeaveRequests(
        technicianId: technicianId,
        email: email,
      );
      final bool error = json['error'] as bool? ?? true;
      final String? message = json['message'] as String?;
      final responseData = json['data'] as List<dynamic>? ?? [];

      if (!error && responseData.isNotEmpty) {
        final leaveRequests = (responseData)
            .map((item) => LeaveRequest.fromJson(item as Map<String, dynamic>))
            .toList();
        return RepositoryResponse<List<LeaveRequest>>(
          error: false,
          message: message ?? 'Leave requests fetched successfully',
          data: leaveRequests,
        );
      } else {
        return RepositoryResponse<List<LeaveRequest>>(
          error: true,
          message: message ?? 'No leave requests found',
          data: [],
        );
      }
    } catch (e) {
      return RepositoryResponse<List<LeaveRequest>>(
        error: true,
        message: 'Error: ${e.toString()}',
        data: [],
      );
    }
  }
}
